// Backend API response types for user profile
export interface ProfileResponse {
  id: string; // UUID - not displayed in UI
  username: string;
  ingameName: string;
  gameId: string; // UUID - not displayed in UI
  createdAt: string; // ISO 8601 Instant
  rating?: number; // BigDecimal - trading score/rating
  ratingCount?: number;
}

export interface TradingProfileResponse {
  id: string; // UUID
  username: string;
  ingameName: string;
  gameId: string; // UUID
  createdAt: string; // ISO 8601 Instant
  rating: number; // BigDecimal - trading score/rating
  ratingCount: number;
}

