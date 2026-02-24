import 'reflect-metadata';
import GetWindowStateResult = overwolf.windows.GetWindowStateResult
import WindowState = overwolf.windows.enums.WindowStateEx;
import { apiState, kWindowNames } from "../consts";
import { OwAd } from "@overwolf/types/owads";
import { StorePackagesServiceBase, StorePackagesToken } from "./services/tebex/store-packages-service";
import { SubscriptionStatus, SubscriptionStatusServiceBase, SubscriptionStatusToken } from "./services/tebex/subscription-status-service";
import { DeeplinkServiceBase, DeeplinkToken } from "./services/tebex/deeplink-service";
import { AccountServiceBase, AccountToken } from "./services/tebex/account-service";
import { CheckoutServiceBase, CheckoutToken } from "./services/tebex/checkout-service";
import { container, inject, injectable } from 'tsyringe';
import { RenderListServiceBase, RenderListToken } from "./services/tebex/render-list-service";
import { SubscriptionPageHandler } from './subscription/SubscriptionPageHandler';
import { SessionUtils } from '../escape-from-tarkov/utils/SessionUtils';
import { AppConfigUtils } from '../escape-from-tarkov/utils/AppConfigUtils';
import { SubscriptionBootstrapper } from './subscription/SubscriptionBootstrapper';
import { BackgroundBridgeRegistry } from './bridge/BackgroundBridgeRegistry';
import { UserStatusBridge } from './bridge/UserStatusBridge';
import { QuestDataBridge } from './bridge/QuestDataBridge';
import { HideoutDataBridge } from './bridge/HideoutDataBridge';
import { ItemsDataBridge } from './bridge/ItemsDataBridge';
import { ProgressionBridge } from './bridge/ProgressionBridge';
import { AppConfigBridge } from './bridge/AppConfigBridge';
import { HotkeysBridge } from './bridge/HotkeysBridge';
import { SubscriptionPackagesBridge } from './bridge/SubscriptionPackagesBridge';
import { WindowPositionsBridge } from './bridge/WindowPositionsBridge';
import { FirstTimeExperienceBridge } from './bridge/FirstTimeExperienceBridge';
import { OnlineBridge } from './bridge/OnlineBridge';
import { WindowPositionService } from './services/common/WindowPositionService';
import { FirstTimeExperienceService } from './services/common/FirstTimeExperienceService';
import { PlayerProgressionService } from './services/app-data/PlayerProgressionService';
import { AppConfigService } from './services/app-data/AppConfigService';
import { WindowManager } from './window/WindowManager';
import { GameEventsService } from './services/common/GameEventsService';
import { GameInfoService } from './services/common/GameRunningService';
import { OnlineService } from './services/common/OnlineService';
import { HotkeysService } from './services/common/HotkeysService';

container.registerSingleton(CheckoutToken, CheckoutServiceBase);
container.registerSingleton(StorePackagesToken, StorePackagesServiceBase);
container.registerSingleton(
  SubscriptionStatusToken,
  SubscriptionStatusServiceBase,
);
container.register(RenderListToken, RenderListServiceBase);
container.registerSingleton(DeeplinkToken, DeeplinkServiceBase);
container.registerSingleton(AccountToken, AccountServiceBase);

@injectable()
export class Background {

  private static _instance:Background;

  private adInstance = null;
  private adLargeInstance = null;

  private static inGameBody:HTMLElement;
  private readonly subscriptionBootstrapper: SubscriptionBootstrapper;
  private readonly backgroundBridge: BackgroundBridgeRegistry;
  private windowManager: WindowManager;
  private readonly onlineService: OnlineService;
  private readonly playerProgressionService: PlayerProgressionService;
  private readonly appConfigService: AppConfigService;
  private readonly hotkeysService: HotkeysService;
  private readonly windowPositionService: WindowPositionService;
  private readonly firstTimeExperienceService: FirstTimeExperienceService;

  public constructor(
      @inject(StorePackagesToken)
      private readonly storePackages: StorePackagesServiceBase,
      @inject(SubscriptionStatusToken)
      private readonly subscriptionStatus: SubscriptionStatusServiceBase,
      @inject(DeeplinkToken)
      private readonly deeplink: DeeplinkServiceBase,
      @inject(AccountToken)
      private readonly account: AccountServiceBase,
      @inject(CheckoutToken)
      private readonly checkout: CheckoutServiceBase,
    )
    {
      this.appConfigService = new AppConfigService();
      this.playerProgressionService = new PlayerProgressionService();
      this.hotkeysService = new HotkeysService();
      this.windowPositionService = new WindowPositionService();
      this.firstTimeExperienceService = new FirstTimeExperienceService();
      this.subscriptionBootstrapper = new SubscriptionBootstrapper(
        this.account,
        this.checkout,
        this.subscriptionStatus,
      );

      this.onlineService = new OnlineService();

      this.backgroundBridge = new BackgroundBridgeRegistry([
        new UserStatusBridge({
          accountService: this.account,
          getSubscriptionStatus: () => this.getSubscriptionStatus(),
          refreshSubscriptionStatus: () => this.refreshSubscriptionStatus(),
          waitForSubscriptionStatus: () => this.subscriptionBootstrapper.waitForInitialStatus(),
          subscriptionStatusService: this.subscriptionStatus,
        }),
        new QuestDataBridge(),
        new HideoutDataBridge(),
        new ItemsDataBridge(),
        new SubscriptionPackagesBridge(this.storePackages, this.checkout),
        new AppConfigBridge(this.appConfigService),
        new HotkeysBridge(this.hotkeysService),
        new ProgressionBridge(this.playerProgressionService),
        new WindowPositionsBridge(this.windowPositionService),
        new FirstTimeExperienceBridge(this.firstTimeExperienceService),
        new OnlineBridge(this.onlineService),
      ]);
      SessionUtils.setUtilityApiState(apiState.up)
  }

  public static instance() {
    if(!Background._instance) {
      Background._instance = container.resolve(Background);
    }
    return Background._instance
  }

  public async init() {
    const gameInfoService = new GameInfoService();
    await gameInfoService.init();
    this.windowManager = new WindowManager(
      gameInfoService,
      new GameEventsService(),
      this.windowPositionService,
    );

    await this.onlineService.init();

    await this.appConfigService.init();
    this.windowPositionService.init();
    this.firstTimeExperienceService.init();
    this.hotkeysService.init();

    const bridgeApi = this.backgroundBridge.register();

    // Always register listeners and open the window regardless of online state
    await this.windowManager.registerListeners();
    this.windowManager.open();

    if (this.onlineService.isOnline()) {
      await this.loadOnlineServices(bridgeApi);
    } else {
      console.warn("[Background] App started offline, waiting for connectivity");
      this.onlineService.on("changed", async (isOnline) => {
        if (!isOnline) {
          return;
        }
        console.log("[Background] Connectivity restored, loading services");
        await this.loadOnlineServices(bridgeApi);
      });
    }
  }

  private async loadOnlineServices(bridgeApi: ReturnType<BackgroundBridgeRegistry["register"]>): Promise<void> {
    this.initTebexStore();
    await this.subscriptionBootstrapper.initOnLoad();
    try {
      await bridgeApi.waitForUserStatus?.();
    } catch (error) {
      console.warn("[Background] Failed to warm user status", error);
    }

    try {
    await this.playerProgressionService.init();
    } catch (error) {
      console.warn("[Background] Failed to load app data", error);
    }
  }

  public getSubscriptionStatus():SubscriptionStatus {
    return this.subscriptionBootstrapper.getStatus();
  }

  public refreshSubscriptionStatus(): Promise<boolean> {
    return this.subscriptionBootstrapper.refreshStatus();
  }

  private async initTebexStore() {
    await this.storePackages.RefreshPackages();

    SubscriptionPageHandler.init(this.storePackages, this.checkout, this.subscriptionStatus, this.account)

    this.account.init(this.subscriptionStatus);
    this.checkout.init(this.subscriptionStatus);
  }

  static setOpacity(opacity?:number) {
    if(this.inGameBody) {
      if(!opacity) {
        opacity = AppConfigUtils.getAppConfig().userSettings.getInGameWindowOpacity();
      }
      if(opacity) {
        this.inGameBody.style.opacity = String(opacity)
      } else {
        this.inGameBody.style.opacity = "1"
      }
    }
  }

  updateAd(windowName:string) {
    this.getWindowIsOpen(windowName).then(isOpen => {
      if(isOpen) {
        this.createAdListener(windowName);
      } else {
        this.destroyAd();
      }
    })
  }

  async getWindowIsOpen(windowName:string) {
    const state:GetWindowStateResult = await new Promise(resolve => {
      overwolf.windows.getWindowState(windowName, resolve);
    });

    if (state && state.success && state.window_state_ex) {
      const isOpen = (
        state.window_state_ex === WindowState.normal ||
        state.window_state_ex === WindowState.maximized
      );

      console.log(`getWindowIsOpen():`, state.window_state_ex, isOpen);
      
      return isOpen;
    }

    return false;
  }

  private loadAdLib() { 
    return new Promise((result, error) => {
      let script = document.createElement('script');
      script.setAttribute('id', 'owad-script');
      console.log("Script added");
      script.setAttribute('src', 'https://content.overwolf.com/libs/ads/latest/owads.min.js');
      script.async = true
      script.setAttribute("onerror", "onAdsSDKNotLoaded()");
      script.setAttribute("onload", "onAdsSDKReady()");
      document.body.appendChild(script);
    })
  }

  private async createAdListener(windowName:string) {
    if(!document.getElementById("ads-container")) {
      return;
    }
    var OwAdElement = document.getElementById("owad-script");
    if (!OwAdElement) {
      await this.loadAdLib();

      OwAdElement = document.getElementById("owad-script");
      if (!OwAdElement) {
        console.log('Couldn\'t load OwAd');
        return;
      }
    }
    
    if (this.adInstance !== null && this.adInstance !== undefined && windowName !== kWindowNames.questsReminder) {
      console.log("Refreshing ad");
      this.adInstance.refreshAd();
      return;
    } else if (this.adLargeInstance !== null && this.adLargeInstance !== undefined && windowName === kWindowNames.questsReminder) {
      console.log("Refreshing large ad");
      this.adLargeInstance.refreshAd();
      return;
    }

    this.adInstance = window["OwAdInstance"] as OwAd
    this.adLargeInstance = window["OwAdInstanceLarge"] as OwAd
    // console.log(this.adLargeInstance);
    
    // let instanceToUse = windowName === kWindowNames.questsReminder ? this.adLargeInstance : this.adInstance
    if(this.adInstance) {
      console.log("Ad Loader: Adding Listeners");
      this.adInstance.addEventListener('player_loaded', () => console.log('OwAd player_loaded'));
      this.adInstance.addEventListener('display_ad_loaded', () => console.log('OwAd display_ad_loaded'));
      this.adInstance.addEventListener('play', () => console.log('OwAd play'));
      this.adInstance.addEventListener('impression', () => console.log('OwAd impression'));
      this.adInstance.addEventListener('complete', () => console.log('OwAd complete'));
      this.adInstance.addEventListener('ow_internal_rendered', () => console.log('OwAd ow_internal_rendered'));
    
      this.adInstance.addEventListener('error', e => {
        console.log('OwAd instance error: ', e);
      });
    
      console.log('createAd');
    }

  }

  getAdInstance():OwAd {
    return this.adInstance;
  }

  killAdInstance() {
    this.destroyAd()
  }

  adPlay() {
    if(this.adInstance) {
      this.adInstance.play();
    }
  }

  adPause() {
    if(this.adInstance) {
      this.adInstance.pause();
    }
  }

  adShutdown() {
    if(this.adInstance) {
      this.adInstance.shutdown();
    }
  }

  private destroyAd() {
    if (this.adInstance !== null && this.adInstance !== undefined) {
      console.log('destroyAd');
      this.adInstance.removeAd();
      this.adInstance = null
    }
  }
}
if (typeof overwolf !== "undefined" && overwolf.windows?.getCurrentWindow) {
  overwolf.windows.getCurrentWindow((result) => {
    if (result?.success && result.window?.name === kWindowNames.background) {
Background.instance().init();
    }
  });
}
