import { EventEmitter } from 'events';
import { SubscriptionStatusServiceBase } from './subscription-status-service';

export const AccountToken = 'AccountBase';

export type AccountServiceEvents = {
  updated: [string];
};

export class AccountServiceBase extends EventEmitter<AccountServiceEvents> {
  private currentUser:overwolf.profile.GetCurrentUserResult = null;

  public GetCurrentUser():overwolf.profile.GetCurrentUserResult {
    return this.currentUser;
  }

  public init(subscriptionStatus:SubscriptionStatusServiceBase): void {
    // If the user login state changes, we update the active subscriptions
    overwolf.profile.onLoginStateChanged.addListener(() => {
      // There is a race condition here, it's a known bug, this is a TEMP fix
      setTimeout(() => {
        this.UpdateCurrentUser();
        subscriptionStatus.RefreshStatus()
      }, 5000);
    });

    // Updates the current user
    this.UpdateCurrentUser();
  }

  public UpdateCurrentUser() {
    overwolf.profile.getCurrentUser((result) => {
      if(!result.success) {
        this.currentUser = undefined;
        this.emit('updated', null);
      } else {
        result.success && this.OnUserChanged(result)
        console.log("Current User " + result.displayName);
      }
      console.log("Updated User");
    });
  }

  private OnUserChanged(user: overwolf.profile.GetCurrentUserResult) {
    this.currentUser = user;
    console.log('User changed!', this.currentUser);
    this.emit('updated', this.currentUser.displayName);
  }

  public GenerateToken(): Promise<string> {
    let resolveToken: (token: string) => void;
    let failToken: (error: string) => void;

    const promise = new Promise<string>((resolve, reject) => {
      resolveToken = resolve;
      failToken = reject;
    });

    if (this.currentUser) {
      overwolf.profile.generateUserSessionToken((result) => {
        if (result.success) resolveToken(result.token);
        else failToken(`Unable to generate token! ${result.error}`);
      });
    } else {
      failToken(`Unable to generate token! No Current User`);
    }

    return promise;
  }
}
