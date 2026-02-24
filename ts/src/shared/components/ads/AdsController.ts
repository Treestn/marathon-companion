import type { OwAd } from '@overwolf/types/owads';
import { IAdsController } from './IAdsController';

export type AdsControllerConfig = {
  containerId: string;
  size: { width: number; height: number };
  instanceKey?: string;
  highImpact?: boolean;
};

type OwAdCtor = new (
  container: HTMLElement,
  options: { size: { width: number; height: number }, enableHighImpact?: boolean }
) => OwAd;

export class AdsController implements IAdsController {
  private readonly adInstances = new Map<string, OwAd>();
  private readonly configs: AdsControllerConfig[];
  private sdkWaitTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: AdsControllerConfig | AdsControllerConfig[]) {
    this.configs = Array.isArray(config) ? config : [config];
  }

  private getOwAdCtor(): OwAdCtor | null {
    return (globalThis as unknown as { OwAd?: OwAdCtor }).OwAd ?? null;
  }

  private getContainer(containerId: string): HTMLElement | null {
    return document.getElementById(containerId);
  }

  private cancelWait() {
    if (this.sdkWaitTimer !== null) {
      clearInterval(this.sdkWaitTimer);
      this.sdkWaitTimer = null;
    }
  }

  private waitAndStart(maxWait = 10000) {
    this.cancelWait();
    const startTime = Date.now();
    console.log("[AdsController] Waiting for OwAd SDK and ad containers...");
    this.sdkWaitTimer = setInterval(() => {
      const OwAdCtor = this.getOwAdCtor();
      const allContainersReady = this.configs.every(
        (config) => this.getContainer(config.containerId) !== null
      );
      if (OwAdCtor && allContainersReady) {
        this.cancelWait();
        console.log("[AdsController] OwAd SDK and containers ready, initializing ads");
        this.initializeAds(OwAdCtor);
      } else if (Date.now() - startTime > maxWait) {
        this.cancelWait();
        if (!OwAdCtor) {
          console.warn("[AdsController] OwAd SDK not available after " + maxWait + "ms timeout");
        }
        if (!allContainersReady) {
          console.warn("[AdsController] Ad containers not found after " + maxWait + "ms timeout");
        }
      }
    }, 200);
  }

  public start() {
    const OwAdCtor = this.getOwAdCtor();
    const allContainersReady = this.configs.every(
      (config) => this.getContainer(config.containerId) !== null
    );
    if (!OwAdCtor || !allContainersReady) {
      this.waitAndStart();
      return;
    }
    this.initializeAds(OwAdCtor);
  }

  private initializeAds(OwAdCtor: OwAdCtor) {
    this.configs.forEach((config) => {
      const container = this.getContainer(config.containerId);
      if (!container) {
        console.warn('[AdsController] Ad container not found:', config.containerId);
        return;
      }
      const key = config.instanceKey ?? config.containerId;
      const existing = this.adInstances.get(key);
      if (existing) {
        existing.play();
        return;
      }
      const instance = new OwAdCtor(container, { size: config.size, enableHighImpact: config.highImpact });
      this.adInstances.set(key, instance);
      if (config.instanceKey) {
        (globalThis as unknown as Record<string, OwAd>)[config.instanceKey] = instance;
      }
    });
  }

  public stop() {
    this.cancelWait();
    this.adInstances.forEach((instance) => instance.pause());
  }

  public destroy() {
    this.cancelWait();
    this.adInstances.forEach((instance) => instance.removeAd());
    this.adInstances.clear();
    this.configs.forEach((config) => {
      const container = this.getContainer(config.containerId);
      if (container) {
        container.innerHTML = '';
      }
    });
  }
}
