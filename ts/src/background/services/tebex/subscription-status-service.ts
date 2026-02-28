import { inject, injectable } from 'tsyringe';
import { RenderListServiceBase, RenderListToken } from './render-list-service';
import {
  StorePackage,
  StorePackagesServiceBase,
  StorePackagesToken,
} from './store-packages-service';
import { EventEmitter } from 'events';
import { AccountServiceBase, AccountToken } from './account-service';
import OverwolfCheckoutRequest from './utils/overwolf-checkout-request';
import endpoints from './config/endpoints';
import { log } from 'console';

export type SubscriptionStatus = {
  userId: string;
  recurringPaymentId: string;
  packageId: number;
  state:string;
};

export const SubscriptionStatusToken = 'SubscriptionStatusBase';

export type SubscriptionsStatusEvents = {
  updated: [SubscriptionStatus];
};

@injectable()
// eslint-disable-next-line prettier/prettier
export class SubscriptionStatusServiceBase extends EventEmitter<
  SubscriptionsStatusEvents
> {
  private readonly listView;
  private currentStatus: SubscriptionStatus;

  public GetCurrentStatus() {
    return this.currentStatus;
  }

  public async RefreshStatus(): Promise<boolean> {
    const currentUser = this.accountService?.GetCurrentUser?.();
    if(!currentUser) {
      return this.HandleNewStatus(null);
    }
    return this.accountService.GenerateToken().then(
      async (token: string) => {
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);
        
        return fetch(OverwolfCheckoutRequest(endpoints.subscriptions), {
          headers,
        }).then((result) => {          
          if (result.status !== 200){
            console.error(result.json());
            throw new Error(
              `Request failed! ${result.status} ${result.statusText}`,
            );
          }

          return result.json().then(
            (newStatus) => {
              console.log(newStatus);
              return this.HandleNewStatus(newStatus);
            },
            (reason) => {
              throw new Error(`Request failed! ${reason}`);
            },
          );
        });
      },
      (reason: string) => {
        console.log(`Unable to generate token: ${reason}`);
        return this.HandleNewStatus(null);
      },
    );
  }

  private HandleNewStatus(newStatus: SubscriptionStatus[]) {
    let activeStatus: SubscriptionStatus | undefined;

    if (newStatus && newStatus.length > 0) {
      activeStatus = newStatus.find(
        (status) =>
          status.state === 'ACTIVE' || status.state === 'PENDING_CANCELLATION',
      );
      if (activeStatus) {
        console.log(
          `Subscription state: ${activeStatus.state} for package id: ${activeStatus.packageId}`,
        );
      }
    }

    if (!activeStatus) {
      const wasSet = !!this.currentStatus;
      this.currentStatus = undefined;
      if (wasSet) {
        console.log('Subscription Status:', this.currentStatus);
        this.emit('updated', {
          userId: null,
          recurringPaymentId: null,
          packageId: null,
          state: "",
        });
        this.Rerender();
      }
      return wasSet;
    }

    const hasChanged =
      !this.currentStatus ||
      this.currentStatus.state !== activeStatus.state ||
      this.currentStatus.packageId !== activeStatus.packageId ||
      this.currentStatus.recurringPaymentId !== activeStatus.recurringPaymentId ||
      this.currentStatus.userId !== activeStatus.userId;

    if (hasChanged) {
      this.currentStatus = activeStatus;
      console.log('Subscription Status:', this.currentStatus);
      this.emit('updated', activeStatus);
      this.Rerender();
    }

    return hasChanged;
  }

  public constructor(
    @inject(RenderListToken)
    renderListService: RenderListServiceBase,
    @inject(StorePackagesToken)
    private readonly storePackagesService: StorePackagesServiceBase,
    @inject(AccountToken)
    private readonly accountService: AccountServiceBase,
  ) {
    super();
    this.listView = renderListService.CreateRenderer<
      SubscriptionStatus,
      StorePackage[]
    >((status, packages) => {
      const container = document.createElement('li');
      container.classList.add('horizontal', 'item');

      container.appendChild(
        renderListService.CreateText(
          `Active plan: ${
            packages?.find((pack) => pack.id === status.packageId)?.name ??
            'Unknown plan'
          }`,
        ),
      );

      return container;
    }, document.getElementById('plans'));
  }

  public Rerender = () =>
    this.listView.RefreshList(
      this.currentStatus,
      this.storePackagesService.GetCurrentPackages(),
    );
}
