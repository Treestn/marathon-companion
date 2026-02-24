import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SubscriptionStatus = {
  state?: string;
  packageId?: number;
  recurringPaymentId?: string;
  userId?: string;
} | null;

type UserInfo = {
  isLoggedIn: boolean;
  displayName: string | null;
  username: string | null;
  userId: string | null;
};

export type UserStatus = {
  user: UserInfo;
  subscription: SubscriptionStatus;
  bearerToken: string | null;
  tradingProfileExists: boolean | null;
};

type UserStatusContextValue = {
  status: UserStatus | null;
  subscriptionLabel: string;
  isLoading: boolean;
};

type UserStatusBridge = {
  getUserStatus: () => UserStatus;
  waitForUserStatus?: () => Promise<void>;
  onUserStatusChanged?: (handler: (status: UserStatus) => void) => () => void;
};

const UserStatusContext = createContext<UserStatusContextValue | undefined>(undefined);

const formatSubscriptionLabel = (status: UserStatus | null) => {
  const state = status?.subscription?.state;
  if (state === 'ACTIVE') return 'Subscription: active';
  if (state === 'PENDING_CANCELLATION') return 'Subscription: canceling';
  if (state) return `Subscription: ${state.toLowerCase()}`;
  return 'Subscription: none';
};

export const UserStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionLabel, setSubscriptionLabel] = useState('Subscription: loading...');

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;
    let retryTimeout: number | undefined;
    let attempts = 0;
    const maxAttempts = 50;
    const retryDelayMs = 100;

    const resolveBridge = () => {
      try {
        const mainWindow = overwolf?.windows?.getMainWindow?.();
        return (mainWindow as any)?.backgroundBridge as UserStatusBridge | undefined;
      } catch {
        return undefined;
      }
    };

    const loadStatus = async () => {
      const bridge =
        resolveBridge() ?? ((globalThis as any).backgroundBridge as UserStatusBridge | undefined);
      if (!bridge?.getUserStatus) {
        if (attempts < maxAttempts) {
          attempts += 1;
          retryTimeout = globalThis.setTimeout(loadStatus, retryDelayMs);
          return;
        }
        if (isMounted) {
          setIsLoading(false);
          setSubscriptionLabel('Subscription: unavailable');
        }
        return;
      }

      if (bridge.waitForUserStatus) {
        await bridge.waitForUserStatus();
      }

      if (isMounted) {
        const currentStatus = bridge.getUserStatus();
        setStatus(currentStatus);
        setSubscriptionLabel(formatSubscriptionLabel(currentStatus));
        setIsLoading(false);
      }

      if (bridge.onUserStatusChanged) {
        unsubscribe = bridge.onUserStatusChanged((nextStatus) => {
          if (!isMounted) return;
          setStatus(nextStatus);
          setSubscriptionLabel(formatSubscriptionLabel(nextStatus));
        });
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
      if (retryTimeout) {
        globalThis.clearTimeout(retryTimeout);
      }
      unsubscribe?.();
    };
  }, []);

  const value = useMemo(
    () => ({ status, subscriptionLabel, isLoading }),
    [status, subscriptionLabel, isLoading],
  );

  return <UserStatusContext.Provider value={value}>{children}</UserStatusContext.Provider>;
};

export const useUserStatusContext = () => {
  const ctx = useContext(UserStatusContext);
  if (!ctx) {
    throw new Error('useUserStatusContext must be used within UserStatusProvider');
  }
  return ctx;
};
