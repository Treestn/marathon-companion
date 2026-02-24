import endpoints from '../api/tarkov-companion/endpoint';

export class TradingService {
  private static bearerToken: string | null = null;

  public static setBearerToken(token: string | null): void {
    TradingService.bearerToken = token;
  }

  public static hasBearerToken(): boolean {
    return Boolean(TradingService.bearerToken);
  }

  private static getBearerToken(): string {
    if (!TradingService.bearerToken) {
      throw new Error('Trading bearer token not available');
    }
    return TradingService.bearerToken;
  }

  private static getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: TradingService.getBearerToken(),
    };
  }

  public static async fetchTrades(): Promise<Response> {
    return fetch(endpoints.trades, {
      method: 'GET',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async fetchMyActiveTrades(): Promise<Response> {
    return fetch(endpoints.myActiveTrades, {
      method: 'GET',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async fetchMyActiveTradesCount(): Promise<number> {
    try {
      const response = await fetch(endpoints.myActiveTradesCount, {
        method: 'GET',
        mode: 'cors',
        headers: TradingService.getAuthHeaders(),
      });

      if (!response.ok) {
        console.error(
          'Failed to fetch active trades count:',
          response.status,
          response.statusText,
        );
        return 0;
      }

      const count = await response.json();
      return typeof count === 'number' ? count : Number.parseInt(count, 10) || 0;
    } catch (error) {
      console.warn('Error fetching active trades count:', error);
      return 0;
    }
  }

  public static async fetchMyTradeHistory(): Promise<Response> {
    return fetch(endpoints.myTradeHistory, {
      method: 'GET',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async fetchUserProfile(): Promise<Response> {
    return fetch(endpoints.userProfile, {
      method: 'GET',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async fetchUserProfileById(profileId: string): Promise<Response> {
    return fetch(endpoints.getUserProfile(profileId), {
      method: 'GET',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async fetchTradeCounterparty(tradeId: string): Promise<Response> {
    return fetch(endpoints.getTradeCounterparty(tradeId), {
      method: 'GET',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async fetchPendingRatings(): Promise<Response> {
    return fetch(endpoints.pendingRatings, {
      method: 'GET',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async createProfile(username: string, ingameName: string): Promise<Response> {
    return fetch(endpoints.createProfile, {
      method: 'POST',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
      body: JSON.stringify({ username, ingameName }),
    });
  }

  public static async createTrade(
    offeredItems: Array<{ id: string; count: number }>,
    requestedItems: Array<{ id: string; count: number }>,
  ): Promise<Response> {
    return fetch(endpoints.createTrade, {
      method: 'POST',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
      body: JSON.stringify({ offeredItems, requestedItems }),
    });
  }

  public static async deleteTrade(tradeId: string): Promise<Response> {
    return fetch(endpoints.deleteTrade(tradeId), {
      method: 'DELETE',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async acceptTrade(tradeId: string): Promise<Response> {
    return fetch(endpoints.acceptTrade(tradeId), {
      method: 'POST',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async cancelTrade(tradeId: string): Promise<Response> {
    return fetch(endpoints.cancelTrade(tradeId), {
      method: 'POST',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async completeTrade(tradeId: string): Promise<Response> {
    return fetch(endpoints.completeTrade(tradeId), {
      method: 'POST',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }

  public static async rateTrade(tradeId: string, score: number): Promise<Response> {
    return fetch(endpoints.rateTrade(tradeId), {
      method: 'POST',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
      body: JSON.stringify({ score }),
    });
  }

  public static async deleteProfile(): Promise<Response> {
    return fetch(endpoints.userProfile, {
      method: 'DELETE',
      mode: 'cors',
      headers: TradingService.getAuthHeaders(),
    });
  }
}
