import { SubscriptionStatus } from "../services/tebex/subscription-status-service";
import { ProgressionUpdateOp } from "../services/app-data/PlayerProgressionService";
import { AppConfig, AppConfigPatch } from "../../shared/models/AppConfig";

export type AuthToken = string | null;

export type BackgroundBridgeApi = {
  getUserStatus: () => {
    user: unknown;
    subscription: SubscriptionStatus | null;
    bearerToken: string | null;
    tradingProfileExists: boolean | null;
  };
  waitForUserStatus: () => Promise<void>;
  onUserStatusChanged: (
    handler: (status: {
      user: unknown;
      subscription: SubscriptionStatus | null;
      bearerToken: string | null;
      tradingProfileExists: boolean | null;
    }) => void,
  ) => () => void;
  setTradingProfileExists: (value: boolean) => void;
  refreshTradingProfile: () => Promise<void>;
  getSubscriptionStatus: () => SubscriptionStatus;
  refreshSubscriptionStatus: () => Promise<boolean>;
  waitForSubscriptionStatus: () => Promise<void>;
  onSubscriptionStatusChanged: (
    handler: (status: SubscriptionStatus) => void,
  ) => () => void;
  getHotkeyText: (hotkeyName: string) => Promise<string>;
  getIsGameRunning: () => Promise<boolean>;
  assignHotkey: (hotkeyName: string, hotkeyText: string, keyCode: number | null) => Promise<overwolf.Result>;
  waitForAppConfig: () => Promise<void>;
  getAppConfig: () => AppConfig;
  updateAppConfig: (patch: AppConfigPatch) => AppConfig;
  onAppConfigUpdated: (handler: (config: AppConfig) => void) => () => void;
  waitForQuestData: () => Promise<void>;
  getQuestData: () => unknown;
  waitForHideoutData: () => Promise<void>;
  getHideoutData: () => unknown;
  waitForItemsData: () => Promise<void>;
  getItemsData: () => unknown;
  waitForSubscriptionPackages: () => Promise<void>;
  getSubscriptionPackages: () => unknown;
  requestSubscriptionCheckout: (packageId: number) => void;
  openSubscriptionManage: () => void;
  updateProgression: (op: ProgressionUpdateOp) => Promise<void>;
  onProgressionUpdated: (handler: (op: ProgressionUpdateOp) => void) => () => void;
  isQuestActive: (questId: string) => boolean;
  isQuestCompleted: (questId: string) => boolean;
  isQuestObjectiveCompleted: (questId: string, objectiveId: string) => boolean;
  isQuestFailed: (questId: string) => boolean;
  isQuestTracked: (questId: string) => boolean;
  isQuestManuallyActivated: (questId: string) => boolean;
  getItemCurrentQuantity: (itemId: string) => number;
  getAllItemQuantities: () => Record<string, number>;
  increaseItemQuantity: (itemId: string, quantity: number) => void;
  decreaseItemQuantity: (itemId: string, quantity: number) => void;
  getHideoutStationState: (stationId: string) => unknown;
  getHideoutStationLevelState: (stationId: string, levelId: string) => unknown;
  resetHideoutStation: (stationId: string) => void;
  getItemRequiredCounts: (options: { includeQuests: boolean; includeHideout: boolean }) => Record<string, number>;
  getTrackedItemRequiredCounts: (options: { includeQuests: boolean; includeHideout: boolean }) => Record<string, number>;
  getTrackedItemIds: (options: { includeQuests: boolean; includeHideout: boolean }) => string[];
  getItemRequirementDetails: (
    itemId: string,
    options: { includeQuests: boolean; includeHideout: boolean },
  ) => Array<{
    kind: "quest" | "hideout";
    id: string;
    name: string;
    amount: number;
    state: "active" | "inactive" | "completed";
    traderId?: string;
    level?: number;
  }>;
  getAuthToken: () => AuthToken;
  onAuthTokenChanged: (handler: (token: AuthToken) => void) => () => void;
  setWindowPosition: (windowName: string, left: number, top: number) => void;
  applyWindowPosition: (windowName: string) => Promise<boolean>;
  getFirstTimeExperienceActive: () => boolean;
  setFirstTimeExperienceActive: (value: boolean) => void;
  onFirstTimeExperienceUpdated: (handler: (value: boolean) => void) => () => void;
  getIsOnline: () => boolean;
  onOnlineStatusChanged: (handler: (isOnline: boolean) => void) => () => void;
};

export type BridgeModule = {
  getApi: () => Partial<BackgroundBridgeApi>;
  registerLegacyAliases?: (api: BackgroundBridgeApi) => void;
};

export class BackgroundBridgeRegistry {
  private registered = false;

  public constructor(private readonly modules: BridgeModule[]) {}

  public register(): BackgroundBridgeApi {
    if (this.registered && (globalThis as any).backgroundBridge) {
      return (globalThis as any).backgroundBridge as BackgroundBridgeApi;
    }
    this.registered = true;

    const api = this.modules.reduce<Partial<BackgroundBridgeApi>>(
      (acc, module) => ({
        ...acc,
        ...module.getApi(),
      }),
      {},
    ) as BackgroundBridgeApi;

    this.modules.forEach((module) => {
      module.registerLegacyAliases?.(api);
    });

    (globalThis as any).backgroundBridge = api;
    return api;
  }
}
