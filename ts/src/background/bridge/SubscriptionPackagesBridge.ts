import { BridgeModule } from "./BackgroundBridgeRegistry";
import { StorePackagesServiceBase } from "../services/tebex/store-packages-service";
import { CheckoutServiceBase } from "../services/tebex/checkout-service";

export class SubscriptionPackagesBridge implements BridgeModule {
  private readyPromise: Promise<void> | null = null;

  public constructor(
    private readonly storePackages: StorePackagesServiceBase,
    private readonly checkout: CheckoutServiceBase,
  ) {}

  public getApi() {
    return {
      waitForSubscriptionPackages: () => this.waitForPackages(),
      getSubscriptionPackages: () => this.storePackages.GetCurrentPackages(),
      requestSubscriptionCheckout: (packageId: number) =>
        this.checkout.RequestCheckout({ packageId }),
      openSubscriptionManage: () => {
        const url = "https://checkout.tebex.io/payment-history";
        if (overwolf?.utils?.openUrlInDefaultBrowser) {
          overwolf.utils.openUrlInDefaultBrowser(url);
        } else {
          window.open(url, "_blank");
        }
      },
    };
  }

  private async waitForPackages(): Promise<void> {
    if (!this.readyPromise) {
      if (this.storePackages.GetCurrentPackages().length > 0) {
        this.readyPromise = Promise.resolve();
      } else {
        this.readyPromise = this.storePackages.RefreshPackages().then(() => {});
      }
    }
    await this.readyPromise;
  }
}
