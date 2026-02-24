import type { OwAd } from "@overwolf/types/owads";
import { IAdsController } from "./IAdsController";

type OwAdCtor = new (
  container: HTMLElement,
  options: { size: { width: number; height: number }; enableHighImpact?: boolean }
) => OwAd;

const SMALL_AD_SIZE = { width: 400, height: 60 };

type HighImpactLayout = {
  adZone: HTMLElement;
  largeWrapper: HTMLElement;
  largeContainer: HTMLElement;
  smallContainer: HTMLElement | null;
  hidden: Array<{ element: HTMLElement; display: string; visibility: string }>;
  largeWrapperStyle: { width: string; height: string };
  largeContainerStyle: { width: string; height: string };
  smallContainerStyle: { display: string; visibility: string };
};

export type HighImpactAdsControllerConfig = {
  smallContainerId: string;
  largeContainerId: string;
  size: { width: number; height: number };
  instanceKey?: string;
};

export class HighImpactAdsController implements IAdsController {
  private readonly adInstances = new Map<string, OwAd>();
  private readonly adReady = new Map<string, boolean>();
  private readonly layouts = new Map<string, HighImpactLayout>();
  private readonly config: HighImpactAdsControllerConfig;
  private sdkWaitTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: HighImpactAdsControllerConfig) {
    this.config = config;
  }

  private getOwAdCtor(): OwAdCtor | null {
    return (globalThis as unknown as { OwAd?: OwAdCtor }).OwAd ?? null;
  }

  private getContainer(containerId: string): HTMLElement | null {
    return document.getElementById(containerId);
  }

  private getInstanceKeys() {
    const baseKey = this.config.instanceKey ?? this.config.largeContainerId;
    return { largeKey: baseKey, smallKey: `${baseKey}__small` };
  }

  private markReadyOnLoad(instance: OwAd, key: string) {
    this.adReady.set(key, false);
    instance.addEventListener("player_loaded", () => {
      this.adReady.set(key, true);
      instance.play();
    });
  }

  private playIfReady(key: string) {
    const instance = this.adInstances.get(key);
    if (instance && this.adReady.get(key)) {
      instance.play();
    }
  }

  private createLargeInstance(
    OwAdCtor: OwAdCtor,
    largeContainer: HTMLElement,
    largeKey: string
  ) {
    const instance = new OwAdCtor(largeContainer, {
      size: this.config.size,
      enableHighImpact: true,
    });
    this.adInstances.set(largeKey, instance);
    this.markReadyOnLoad(instance, largeKey);
    instance.addEventListener("high-impact-ad-loaded", () => {
      this.applyHighImpactLayout(largeKey, largeContainer);
    });
    instance.addEventListener("high-impact-ad-removed", () => {
      this.restoreHighImpactLayout(largeKey);
    });
    if (this.config.instanceKey) {
      (globalThis as unknown as Record<string, OwAd>)[this.config.instanceKey] = instance;
    }
  }

  private createSmallInstance(
    OwAdCtor: OwAdCtor,
    smallContainer: HTMLElement | null,
    smallKey: string
  ) {
    if (!smallContainer) {
      return;
    }
    const instance = new OwAdCtor(smallContainer, {
      size: SMALL_AD_SIZE,
    });
    this.adInstances.set(smallKey, instance);
    this.markReadyOnLoad(instance, smallKey);
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
    console.log("[HighImpactAdsController] Waiting for OwAd SDK and ad containers...");
    this.sdkWaitTimer = setInterval(() => {
      const OwAdCtor = this.getOwAdCtor();
      const largeContainer = this.getContainer(this.config.largeContainerId);
      if (OwAdCtor && largeContainer) {
        this.cancelWait();
        console.log("[HighImpactAdsController] OwAd SDK and containers ready, initializing ads");
        this.initializeAds(OwAdCtor, largeContainer);
      } else if (Date.now() - startTime > maxWait) {
        this.cancelWait();
        if (!OwAdCtor) {
          console.warn("[HighImpactAdsController] OwAd SDK not available after " + maxWait + "ms timeout");
        }
        if (!largeContainer) {
          console.warn("[HighImpactAdsController] Large ad container not found after " + maxWait + "ms timeout");
        }
      }
    }, 200);
  }

  public start() {
    const OwAdCtor = this.getOwAdCtor();
    const largeContainer = this.getContainer(this.config.largeContainerId);
    if (!OwAdCtor || !largeContainer) {
      this.waitAndStart();
      return;
    }
    this.initializeAds(OwAdCtor, largeContainer);
  }

  private initializeAds(OwAdCtor: OwAdCtor, largeContainer: HTMLElement) {
    const smallContainer = this.getContainer(this.config.smallContainerId);
    if (!smallContainer) {
      console.warn("[HighImpactAdsController] Small ad container not found");
    }
    const { largeKey, smallKey } = this.getInstanceKeys();
    if (this.adInstances.has(largeKey)) {
      this.playIfReady(largeKey);
      this.playIfReady(smallKey);
      return;
    }
    this.createLargeInstance(OwAdCtor, largeContainer, largeKey);
    this.createSmallInstance(OwAdCtor, smallContainer, smallKey);
  }

  public stop() {
    this.cancelWait();
    this.adInstances.forEach((instance, key) => {
      if (this.adReady.get(key)) {
        instance.pause();
      }
    });
  }

  public destroy() {
    this.cancelWait();
    this.adInstances.forEach((instance) => instance.removeAd());
    this.adInstances.clear();
    this.adReady.clear();
    this.layouts.forEach((_, key) => this.restoreHighImpactLayout(key));
    this.layouts.clear();
    const container = this.getContainer(this.config.largeContainerId);
    if (container) {
      container.innerHTML = "";
    }
    const smallContainer = this.getContainer(this.config.smallContainerId);
    if (smallContainer) {
      smallContainer.innerHTML = "";
    }
  }

  private applyHighImpactLayout(key: string, container: HTMLElement) {
    if (this.layouts.has(key)) {
      return;
    }
    const largeWrapper = container.parentElement ?? container;
    const adZone = largeWrapper.parentElement ?? largeWrapper;
    const smallContainer = this.getContainer(this.config.smallContainerId);
    const captureStyle = (element: HTMLElement) => ({
      display: element.style.display || "",
      visibility: element.style.visibility || "",
    });
    const smallContainerStyle = {
      display: smallContainer?.style.display || "",
      visibility: smallContainer?.style.visibility || "",
    };
    const hidden: Array<{ element: HTMLElement; display: string; visibility: string }> = [];
    Array.from(adZone.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) {
        return;
      }
      if (child === largeWrapper) {
        return;
      }
      hidden.push({ element: child, ...captureStyle(child) });
      child.style.display = "none";
      child.style.visibility = "hidden";
    });
    if (smallContainer) {
      smallContainer.style.display = "none";
      smallContainer.style.visibility = "hidden";
    }
    const largeWrapperStyle = {
      width: largeWrapper.style.width || "",
      height: largeWrapper.style.height || "",
    };
    const largeContainerStyle = {
      width: container.style.width || "",
      height: container.style.height || "",
    };
    largeWrapper.style.width = "100%";
    largeWrapper.style.height = "100%";
    container.style.width = "100%";
    container.style.height = "100%";
    this.layouts.set(key, {
      adZone,
      largeWrapper,
      largeContainer: container,
      smallContainer,
      hidden,
      largeWrapperStyle,
      largeContainerStyle,
      smallContainerStyle,
    });
  }

  private restoreHighImpactLayout(key: string) {
    const layout = this.layouts.get(key);
    if (!layout) {
      return;
    }
    layout.hidden.forEach(({ element, display, visibility }) => {
      element.style.display = display;
      element.style.visibility = visibility;
    });
    layout.largeWrapper.style.width = layout.largeWrapperStyle.width;
    layout.largeWrapper.style.height = layout.largeWrapperStyle.height;
    layout.largeContainer.style.width = layout.largeContainerStyle.width;
    layout.largeContainer.style.height = layout.largeContainerStyle.height;
    if (layout.smallContainer) {
      layout.smallContainer.style.display = layout.smallContainerStyle.display;
      layout.smallContainer.style.visibility = layout.smallContainerStyle.visibility;
    }
    this.layouts.delete(key);
  }
}
