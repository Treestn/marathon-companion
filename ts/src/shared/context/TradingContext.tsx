import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useUserStatusContext } from './UserStatusContext';
import { TradingService } from '../services/trading/TradingService';

type TradingContextValue = {
  bearerToken: string | null;
  isSubscribed: boolean;
  isLoggedIn: boolean;
  tradingProfileExists: boolean | null;
  isLoading: boolean;
};

const TradingContext = createContext<TradingContextValue | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, isLoading } = useUserStatusContext();
  const subscriptionState = status?.subscription?.state;
  const isSubscribed =
    subscriptionState === 'ACTIVE' || subscriptionState === 'PENDING_CANCELLATION';
  const isLoggedIn = status?.user?.isLoggedIn ?? false;
  const tradingProfileExists = status?.tradingProfileExists ?? null;
  const bearerToken = status?.bearerToken ?? null;

  useEffect(() => {
    TradingService.setBearerToken(bearerToken);
  }, [bearerToken]);

  const value = useMemo(
    () => ({
      bearerToken,
      isSubscribed,
      isLoggedIn,
      tradingProfileExists,
      isLoading,
    }),
    [bearerToken, isLoading, isLoggedIn, isSubscribed, tradingProfileExists],
  );

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};

export const useTradingContext = () => {
  const ctx = useContext(TradingContext);
  if (!ctx) {
    throw new Error('useTradingContext must be used within TradingProvider');
  }
  return ctx;
};
