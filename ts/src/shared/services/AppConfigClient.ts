import { AppConfig, AppConfigPatch } from "../models/AppConfig";

type AppConfigHandler = (config: AppConfig) => void;

const resolveBridge = () => {
  try {
    const mainWindow = overwolf?.windows?.getMainWindow?.();
    return (mainWindow as any)?.backgroundBridge as {
      getAppConfig?: () => AppConfig;
      updateAppConfig?: (patch: AppConfigPatch) => AppConfig;
      onAppConfigUpdated?: (handler: (config: AppConfig) => void) => () => void;
    } | undefined;
  } catch {
    return undefined;
  }
};

export class AppConfigClient {
  private static readonly handlers = new Set<AppConfigHandler>();
  private static isListening = false;
  private static unsubscribeBridge?: () => void;
  private static retryTimeout?: number;
  private static attempts = 0;
  private static readonly maxAttempts = 50;
  private static readonly retryDelayMs = 100;

  static getConfig(): AppConfig | null {
    const bridge = resolveBridge();
    if (!bridge?.getAppConfig) {
      return null;
    }
    return bridge.getAppConfig();
  }

  static updateConfig(patch: AppConfigPatch): AppConfig | null {
    const bridge = resolveBridge();
    if (!bridge?.updateAppConfig) {
      return null;
    }
    return bridge.updateAppConfig(patch);
  }

  static async waitForConfig(): Promise<AppConfig | null> {
    const existing = this.getConfig();
    if (existing) {
      return existing;
    }
    return new Promise((resolve) => {
      let attempts = 0;
      const tryResolve = () => {
        const config = this.getConfig();
        if (config || attempts >= this.maxAttempts) {
          resolve(config ?? null);
          return;
        }
        attempts += 1;
        globalThis.setTimeout(tryResolve, this.retryDelayMs);
      };
      tryResolve();
    });
  }

  static subscribe(handler: AppConfigHandler): () => void {
    this.handlers.add(handler);
    this.ensureListening();
    return () => {
      this.handlers.delete(handler);
      if (this.handlers.size === 0) {
        this.unsubscribeBridge?.();
        this.unsubscribeBridge = undefined;
        this.isListening = false;
        if (this.retryTimeout) {
          globalThis.clearTimeout(this.retryTimeout);
          this.retryTimeout = undefined;
        }
        this.attempts = 0;
      }
    };
  }

  private static ensureListening() {
    if (this.isListening) {
      return;
    }
    const bridge = resolveBridge();
    if (!bridge?.onAppConfigUpdated) {
      if (this.attempts < this.maxAttempts) {
        this.attempts += 1;
        this.retryTimeout = globalThis.setTimeout(
          () => this.ensureListening(),
          this.retryDelayMs,
        );
      }
      return;
    }

    this.unsubscribeBridge = bridge.onAppConfigUpdated((config: AppConfig) => {
      this.handlers.forEach((handler) => handler(config));
    });
    this.isListening = true;
  }
}
