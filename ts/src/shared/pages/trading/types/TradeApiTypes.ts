import { TradingProfileResponse } from './ProfileApiTypes';

// Backend API response types
export enum TradeType {
  SELL = 'SELL',
  BUY = 'BUY',
  TRADE = 'TRADE'
}

export enum TradeStatus {
  OPEN = 'OPEN',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface TradeItemResponse {
  id: string;
  count: number;
}

export interface TradeResponse {
  id: string; // UUID
  gameId: string; // UUID
  ownerProfileId: string; // UUID
  acceptedByProfileId: string | null; // UUID or null
  type: TradeType;
  status: TradeStatus;
  offeredItems: TradeItemResponse[];
  requestedItems: TradeItemResponse[];
  createdAt: string; // ISO 8601 Instant
  updatedAt: string; // ISO 8601 Instant
}

export interface TradeProfileResponse {
  trade: TradeResponse;
  counterparty: TradingProfileResponse;
}

