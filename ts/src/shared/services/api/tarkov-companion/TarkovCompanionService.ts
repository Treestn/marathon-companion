import { SubmissionRequest } from "../../../../model/SubmissionRequest";
import type {
  SubmissionPayload,
  SubmissionV2Request,
} from "../../../submission/SubmissionPayload";
import endpoints from "./endpoint";
import TarkovCompanionRequest from "./TarkovCompanionRequest";

interface LoginResponse {
  accessToken: string;
  expiresInSeconds: number;
  hasProfile: boolean;
}

export class TarkovCompanionService {
  private static externalBearerToken: string | null = null;

  public static setExternalBearerToken(token: string | null): void {
    TarkovCompanionService.externalBearerToken = token;
  }

  public static async checkHealth(): Promise<Response> {
    return fetch(TarkovCompanionRequest(endpoints.health), {
      method: "GET",
      mode: "cors",
    });
  }

  public static async getConfig(
    uri: string,
    searchParams?: { [key: string]: string | undefined },
  ): Promise<Response> {
    return fetch(TarkovCompanionRequest(uri, searchParams), {
      method: "GET",
      mode: "cors",
    });
  }

  public static async postSubmission(data: SubmissionRequest): Promise<Response> {
    const { overwolfToken } = await this.getOverwolfUserInfo();
    return fetch(endpoints.newSubmission, {
      method: "POST",
      mode: "cors",
      headers: this.mergeHeaders(
        { "Content-Type": "application/json" },
        { Authorization: `Bearer ${overwolfToken}` },
      ),
      body: JSON.stringify(data),
    });
  }

  public static async postSubmissionV2(data: SubmissionPayload): Promise<Response> {
    const { overwolfId, overwolfName, overwolfToken } = await this.getOverwolfUserInfo();
    const request: SubmissionV2Request = {
      overwolfId,
      overwolfName,
      game: "marathon",
      submission: data,
    };
    return fetch(endpoints.newSubmission, {
      method: "POST",
      mode: "cors",
      headers: this.mergeHeaders(
        { "Content-Type": "application/json" },
        { Authorization: `Bearer ${overwolfToken}` },
      ),
      body: JSON.stringify(request),
    });
  }

  public static async uploadImage(
    blob: Blob,
    imageId: string,
    submissionId: string,
  ): Promise<Response> {
    const formData = new FormData();
    formData.append("screenshot", blob, `${imageId}.png`);
    const { overwolfId, overwolfToken } = await this.getOverwolfUserInfo();
    return fetch(
      `${endpoints.submissionHostname}/v2/${endpoints.RESOURCE_GAME}/submission/${submissionId}/upload/image/noCrop`,
      {
        method: "POST",
        headers: this.mergeHeaders(
          { Authorization: `Bearer ${overwolfToken}` },
          {
            "X-OW-UserId": overwolfId,
            "X-OW-SubmissionId": submissionId,
          },
        ),
        body: formData,
      },
    );
  }

  public static async fetchTrades(): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.trades);
  }

  public static async fetchMyActiveTrades(): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.myActiveTrades);
  }

  public static async fetchMyActiveTradesCount(): Promise<number> {
    try {
      const response = await this.fetchWithExternalAuth(endpoints.myActiveTradesCount);
      if (!response.ok) {
        console.error("Failed to fetch active trades count:", response.status, response.statusText);
        return 0;
      }
      const count = await response.json();
      return typeof count === "number" ? count : Number.parseInt(count, 10) || 0;
    } catch (error) {
      console.warn("Error fetching active trades count:", error);
      return 0;
    }
  }

  public static async fetchMyTradeHistory(): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.myTradeHistory);
  }

  public static async fetchUserProfile(): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.userProfile);
  }

  public static async checkProfileExists(bearerToken: string): Promise<boolean> {
    try {
      const response = await fetch(endpoints.profileExists, {
        method: "GET",
        mode: "cors",
        headers: this.mergeHeaders(
          { "Content-Type": "application/json" },
          { Authorization: bearerToken },
        ),
      });

      if (!response.ok) {
        console.error("Failed to check profile existence:", response.status, response.statusText);
        return false;
      }

      const exists = await response.json();
      return Boolean(exists);
    } catch (error) {
      console.error("Error checking profile existence:", error);
      return false;
    }
  }

  public static async createProfile(username: string, ingameName: string): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.createProfile, {
      method: "POST",
      body: JSON.stringify({ username, ingameName }),
    });
  }

  public static async createTrade(
    offeredItems: Array<{ id: string; count: number }>,
    requestedItems: Array<{ id: string; count: number }>,
  ): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.createTrade, {
      method: "POST",
      body: JSON.stringify({ offeredItems, requestedItems }),
    });
  }

  public static async deleteTrade(tradeId: string): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.deleteTrade(tradeId), { method: "DELETE" });
  }

  public static async acceptTrade(tradeId: string): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.acceptTrade(tradeId), { method: "POST" });
  }

  public static async cancelTrade(tradeId: string): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.cancelTrade(tradeId), { method: "POST" });
  }

  public static async completeTrade(tradeId: string): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.completeTrade(tradeId), { method: "POST" });
  }

  public static async rateTrade(tradeId: string, score: number): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.rateTrade(tradeId), {
      method: "POST",
      body: JSON.stringify({ score }),
    });
  }

  public static async fetchPendingRatings(): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.pendingRatings);
  }

  public static async fetchUserProfileById(profileId: string): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.getUserProfile(profileId));
  }

  public static async fetchTradeCounterparty(tradeId: string): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.getTradeCounterparty(tradeId));
  }

  public static async deleteProfile(): Promise<Response> {
    return this.fetchWithExternalAuth(endpoints.userProfile, { method: "DELETE" });
  }

  public static async requestLogin(): Promise<LoginResponse | null> {
    try {
      const userInfo = await this.getOverwolfUserInfo().catch((error) => {
        console.warn("Error getting overwolf user info:", error);
        return null;
      });
      if (!userInfo?.overwolfId || !userInfo.overwolfToken) {
        return null;
      }

      const response = await fetch(endpoints.login, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          overwolfToken: userInfo.overwolfToken,
          overwolfId: userInfo.overwolfId,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login failed: ${response.status} ${errorText}`);
      }

      const loginData: LoginResponse = await response.json();
      return loginData;
    } catch (error) {
      console.warn("Login error:", error);
      throw error;
    }
  }

  private static fetchWithExternalAuth(url: string, init: RequestInit = {}): Promise<Response> {
    return fetch(url, {
      method: init.method ?? "GET",
      mode: "cors",
      headers: this.mergeHeaders(
        { "Content-Type": "application/json" },
        { Authorization: TarkovCompanionService.externalBearerToken ?? "" },
        init.headers,
      ),
      body: init.body,
    });
  }

  private static mergeHeaders(...headersList: Array<HeadersInit | undefined>): Headers {
    const merged = new Headers();
    headersList.forEach((headers) => {
      if (!headers) return;
      new Headers(headers).forEach((value, key) => {
        merged.set(key, value);
      });
    });
    return merged;
  }

  private static async getOverwolfUserInfo(): Promise<{
    overwolfId: string;
    overwolfName: string;
    overwolfToken: string;
  }> {
    return new Promise((resolve, reject) => {
      overwolf.profile.getCurrentUser((userResult) => {
        if (!userResult.success || !userResult.uuid) {
          reject(new Error("Could not get current user"));
          return;
        }

        const overwolfId = userResult.uuid;
        const overwolfName = userResult.displayName ?? userResult.username ?? userResult.uuid;

        overwolf.profile.generateUserSessionToken((tokenResult) => {
          if (!tokenResult.success) {
            reject(new Error("Could not generate overwolf session token"));
            return;
          }

          resolve({
            overwolfId,
            overwolfName,
            overwolfToken: tokenResult.token,
          });
        });
      });
    });
  }
}
