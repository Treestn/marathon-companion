import { BridgeModule } from "./BackgroundBridgeRegistry";
import { AccountServiceBase } from "../services/tebex/account-service";
import {
  SubscriptionStatus,
  SubscriptionStatusServiceBase,
} from "../services/tebex/subscription-status-service";
import { TarkovCompanionService } from "../../escape-from-tarkov/service/tarkov-companion-api/handler/TarkovCompanionService";

type UserInfo = {
  isLoggedIn: boolean;
  displayName: string | null;
  username: string | null;
  userId: string | null;
};

type UserStatus = {
  user: UserInfo;
  subscription: SubscriptionStatus | null;
  bearerToken: string | null;
  tradingProfileExists: boolean | null;
};

type UserStatusBridgeDeps = {
  accountService: AccountServiceBase;
  getSubscriptionStatus: () => SubscriptionStatus;
  refreshSubscriptionStatus: () => Promise<boolean>;
  waitForSubscriptionStatus: () => Promise<void>;
  subscriptionStatusService: SubscriptionStatusServiceBase;
};

export class UserStatusBridge implements BridgeModule {
  // Temporary kill-switch: disable trading backend auth while backend login is unstable.
  private readonly DISABLE_TARKOV_COMPANION_LOGIN = true;
  private bearerToken: string | null = null;
  private bearerTokenPromise: Promise<void> | null = null;
  private lastUserId: string | null = null;
  private tokenExpirationTime: number | null = null;
  private refreshTimer: number | null = null;
  private readonly REFRESH_BUFFER_SECONDS = 30;
  private tradingProfileExists: boolean | null = null;
  private tradingProfilePromise: Promise<void> | null = null;
  private readonly statusHandlers = new Set<(status: UserStatus) => void>();
  private listenersRegistered = false;

  public constructor(private readonly deps: UserStatusBridgeDeps) {}

  public getApi() {
    this.registerListenersIfNeeded();
    return {
      getUserStatus: () => this.getUserStatus(),
      waitForUserStatus: async () => {
        this.registerListenersIfNeeded();
        await this.deps.waitForSubscriptionStatus();
        await this.ensureTradingProfile();
      },
      onUserStatusChanged: (handler) => this.onUserStatusChanged(handler),
      setTradingProfileExists: (value: boolean) => this.setTradingProfileExists(value),
      refreshTradingProfile: () => this.refreshTradingProfile(),
      getSubscriptionStatus: this.deps.getSubscriptionStatus,
      refreshSubscriptionStatus: this.deps.refreshSubscriptionStatus,
      waitForSubscriptionStatus: this.deps.waitForSubscriptionStatus,
      onSubscriptionStatusChanged: (handler) => {
        this.deps.subscriptionStatusService.on("updated", handler);
        return () => {
          this.deps.subscriptionStatusService.off("updated", handler);
        };
      },
    };
  }

  public registerLegacyAliases(api) {
    (globalThis as any).subscriptionStatusBridge = {
      getStatus: api.getSubscriptionStatus,
      refreshStatus: api.refreshSubscriptionStatus,
    };
  }

  private getUserStatus(): UserStatus {    
    return {
      user: this.getUserInfo(),
      subscription: this.deps.getSubscriptionStatus(),
      bearerToken: this.bearerToken,
      tradingProfileExists: this.tradingProfileExists,
    };
  }

  private getUserInfo(): UserInfo {
    const user = this.deps.accountService?.GetCurrentUser?.();
    if (!user?.success) {
      return {
        isLoggedIn: false,
        displayName: null,
        username: null,
        userId: null,
      };
    }

    return {
      isLoggedIn: true,
      displayName: user.displayName ?? null,
      username: (user as any).username ?? user.displayName ?? null,
      userId: (user as any).userId?.toString?.() ?? (user as any).userId ?? null,
    };
  }

  private onUserStatusChanged(handler: (status: UserStatus) => void) {
    this.statusHandlers.add(handler);
    handler(this.getUserStatus());

    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  private registerListenersIfNeeded() {
    if (this.listenersRegistered) {
      return;
    }
    this.listenersRegistered = true;
    this.deps.accountService.on("updated", () => {
      this.ensureTradingProfile().finally(() => this.notifyStatusChanged());
    });
    this.deps.subscriptionStatusService.on("updated", () => {
      this.notifyStatusChanged();
    });
  }

  private notifyStatusChanged() {
    const status = this.getUserStatus();
    this.statusHandlers.forEach((handler) => handler(status));
  }

  private getCurrentUserId(): string | null {
    const user = this.deps.accountService?.GetCurrentUser?.();
    if (!user?.success) {
      return null;
    }

    return (
      (user as any).uuid ??
      (user as any).userId?.toString?.() ??
      (user as any).userId ?? null
    );
  }

  private async ensureBearerToken(userId: string): Promise<void> {
    if (this.DISABLE_TARKOV_COMPANION_LOGIN) {
      this.lastUserId = userId;
      this.clearBearerToken('login disabled');
      return;
    }

    if (this.isBearerTokenValid(userId)) {
      return;
    }

    if (this.bearerTokenPromise) {
      return this.bearerTokenPromise;
    }

    this.lastUserId = userId;
    this.bearerTokenPromise = this.loginForBearerToken()
      .then(({ bearerToken, expiresInSeconds }) => {
        this.bearerToken = bearerToken;
        this.tokenExpirationTime = Date.now() + expiresInSeconds * 1000;
        this.scheduleTokenRefresh(expiresInSeconds);
        this.notifyStatusChanged();
      })
      .catch(() => {
        this.clearBearerToken('loginForBearerToken failed');
        this.notifyStatusChanged();
      })
      .finally(() => {
        this.bearerTokenPromise = null;
      });
    return this.bearerTokenPromise;
  }

  private async ensureTradingProfile(): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.tradingProfileExists = false;
      this.clearBearerToken('no user id in ensureTradingProfile');
      this.lastUserId = null;
      return;
    }

    if (this.DISABLE_TARKOV_COMPANION_LOGIN) {
      this.lastUserId = userId;
      this.tradingProfileExists = false;
      this.clearBearerToken('login disabled in ensureTradingProfile');
      this.notifyStatusChanged();
      return;
    }

    if (this.lastUserId && this.lastUserId !== userId) {
      this.tradingProfileExists = null;
      this.clearBearerToken('user changed in ensureTradingProfile');
    }

    if (this.tradingProfileExists !== null && this.lastUserId === userId) {
      return;
    }

    if (this.tradingProfilePromise) {
      return this.tradingProfilePromise;
    }

    this.tradingProfilePromise = this.ensureBearerToken(userId)
      .then(async () => {
        if (!this.bearerToken) {
          this.tradingProfileExists = false;
          return;
        }
        const exists = await TarkovCompanionService.checkProfileExists(this.bearerToken);
        this.lastUserId = userId;
        this.tradingProfileExists = exists;
        this.notifyStatusChanged();
        if (!exists) {
          // Keep bearer token available for profile creation flows.
          this.notifyStatusChanged();
        }
      })
      .catch(() => {
        this.tradingProfileExists = false;
        this.clearBearerToken('trading profile check failed');
        this.notifyStatusChanged();
      })
      .finally(() => {
        this.tradingProfilePromise = null;
      });

    return this.tradingProfilePromise;
  }

  private setTradingProfileExists(value: boolean) {
    this.tradingProfileExists = value;
    if (!value) {
      // Keep bearer token available for profile creation flows.
      this.notifyStatusChanged();
      return;
    }

    const userId = this.getCurrentUserId();
    if (!userId) {
      this.clearBearerToken('setTradingProfileExists(true) without user');
      this.notifyStatusChanged();
      return;
    }
    this.ensureBearerToken(userId).finally(() => this.notifyStatusChanged());
  }

  private async refreshTradingProfile(): Promise<void> {
    this.tradingProfileExists = null;
    await this.ensureTradingProfile();
    this.notifyStatusChanged();
  }

  private isBearerTokenValid(userId: string): boolean {
    if (!this.bearerToken || this.lastUserId !== userId || !this.tokenExpirationTime) {
      return false;
    }
    const now = Date.now();
    const refreshAt = this.tokenExpirationTime - this.REFRESH_BUFFER_SECONDS * 1000;
    return now < refreshAt;
  }

  private async loginForBearerToken(): Promise<{ bearerToken: string; expiresInSeconds: number }> {
    const loginData = await TarkovCompanionService.requestLogin();
    if (!loginData?.accessToken) {
      throw new Error('Trading login failed');
    }
    return {
      bearerToken: `Bearer ${loginData.accessToken}`,
      expiresInSeconds: loginData.expiresInSeconds,
    };
  }

  private scheduleTokenRefresh(expiresInSeconds: number): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    const refreshDelay = Math.max(0, (expiresInSeconds - this.REFRESH_BUFFER_SECONDS) * 1000);
    if (refreshDelay > 0) {
      this.refreshTimer = globalThis.setTimeout(async () => {
        try {
          if (!this.lastUserId) {
            this.clearBearerToken('token refresh without user');
            return;
          }
          await this.ensureBearerToken(this.lastUserId);
          this.notifyStatusChanged();
        } catch {
          this.clearBearerToken('token refresh failed');
        }
      }, refreshDelay);
    }
  }

  private clearBearerToken(reason: string): void {
    console.log('[UserStatusBridge] clearBearerToken:', reason);
    this.bearerToken = null;
    this.tokenExpirationTime = null;
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
