import { AccountServiceBase } from "../services/tebex/account-service";
import { CheckoutServiceBase } from "../services/tebex/checkout-service";
import {
  SubscriptionStatus,
  SubscriptionStatusServiceBase,
} from "../services/tebex/subscription-status-service";

export class SubscriptionBootstrapper {
  private initialRefreshPromise: Promise<void> | null = null;

  public constructor(
    private readonly account: AccountServiceBase,
    private readonly checkout: CheckoutServiceBase,
    private readonly subscriptionStatus: SubscriptionStatusServiceBase,
  ) {}

  public getStatus(): SubscriptionStatus {
    return this.subscriptionStatus.GetCurrentStatus();
  }

  public refreshStatus(): Promise<boolean> {
    return this.subscriptionStatus.RefreshStatus();
  }

  public async initOnLoad(): Promise<void> {
    this.account.on('updated', () => {
      this.subscriptionStatus.RefreshStatus();
    });
    this.account.init(this.subscriptionStatus);
    this.checkout.init(this.subscriptionStatus);
    if (!this.initialRefreshPromise) {
      this.initialRefreshPromise = this.refreshInitialStatus();
    }
    await this.initialRefreshPromise;
  }

  public waitForInitialStatus(): Promise<void> {
    return this.initialRefreshPromise ?? Promise.resolve();
  }

  private async refreshInitialStatus(): Promise<void> {
    try {
      await this.subscriptionStatus.RefreshStatus();
    } catch (error) {
      console.warn("Subscription status refresh failed on load", error);
    }
  }
}
