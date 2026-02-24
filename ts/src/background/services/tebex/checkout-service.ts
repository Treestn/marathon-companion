import { inject, injectable } from 'tsyringe';

import { AccountServiceBase, AccountToken } from './account-service';
import {
  SubscriptionStatus,
  SubscriptionStatusServiceBase,
} from './subscription-status-service';
import OverwolfCheckoutRequest from './utils/overwolf-checkout-request';
import endpoints from './config/endpoints';
import { ExternalLinkController } from '../../../warning/ExternalLinkController';

export type PackageParameters = {
  packageId: number;
  extra?: {
    discordId?: string;
  };
};

export const CheckoutToken = 'CheckoutBase';

@injectable()
export class CheckoutServiceBase {
  private subscriptionStatusService?: SubscriptionStatusServiceBase;

  public init(subscriptionStatusService: SubscriptionStatusServiceBase) {
    this.subscriptionStatusService = subscriptionStatusService;
  }

  public RequestCheckout(packageParams: PackageParameters) {
    if (!this.accountService.GetCurrentUser().uuid)
      overwolf.profile.openLoginDialog();
    else {
      if (this.ValidateCheckoutRequest(packageParams))
        this.Checkout(packageParams.packageId);
    }
  }

  private Checkout(packageId: number) {
    const url = OverwolfCheckoutRequest(
      endpoints.checkout,
      {
        userId: this.accountService.GetCurrentUser().uuid,
        discordId: '',
      },
      `/${packageId}`,
    );
    if (overwolf?.utils?.openUrlInDefaultBrowser) {
      overwolf.utils.openUrlInDefaultBrowser(url);
    } else {
      window.open(url, '_blank');
    }
    // ExternalLinkController.openExternalLink(OverwolfCheckoutRequest(
    //   endpoints.checkout,
    //   {
    //     userId: this.accountService.GetCurrentUser().uuid,
    //     discordId: '',
    //   },
    //   `/${packageId}`,
    // ));
  }

  constructor(
    @inject(AccountToken)
    private readonly accountService: AccountServiceBase,
  ) {}

  /**
   * Validates that a requested checkout request is valid.
   *
   * **Important! Make sure this validates ALL constraints you have set up
   * for your packages!**
   *
   * @param {PackageParameters} packageParams - The package to be purchased
   * @returns {boolean} Whether or not the request is valid
   */
  private ValidateCheckoutRequest(packageParams: PackageParameters): boolean {
    if(this.subscriptionStatusService.GetCurrentStatus() === undefined) {
      return true;
    }
    return !(this.subscriptionStatusService
      ?.GetCurrentStatus()
      .packageId === packageParams.packageId)
  }
}
