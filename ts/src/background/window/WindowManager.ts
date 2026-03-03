import { kWindowNames } from "../../consts";
import { AppConfigUtils } from "../../escape-from-tarkov/utils/AppConfigUtils";
import { WindowsService } from "../../WindowsService";
import { GameEventsService } from "../services/common/GameEventsService";
import { GameInfoService } from "../services/common/GameRunningService";
import { WindowPositionService } from "../services/common/WindowPositionService";
import WindowState = overwolf.windows.enums.WindowStateEx;

const GAME_TERMINATED_REASON =
  overwolf?.games?.enums?.GameInfoChangeReason?.GameTerminated ?? "gameTerminated";
const GAME_LAUNCHED_REASON =
  overwolf?.games?.enums?.GameInfoChangeReason?.GameLaunched ?? "gameLaunched";
const GAME_CHANGED_REASON =
  overwolf?.games?.enums?.GameInfoChangeReason?.GameChanged ?? "gameChanged";

export class WindowManager {
  private readonly gameInfoService: GameInfoService;
  private readonly gameEventsService: GameEventsService;
  private readonly windowPositionService: WindowPositionService;
  private readonly refreshSubscriptionStatus?: () => Promise<boolean>;

  constructor(
    gameRunningService: GameInfoService,
    gameEventsService: GameEventsService,
    windowPositionService: WindowPositionService,
    refreshSubscriptionStatus?: () => Promise<boolean>,
  ) {
    this.gameInfoService = gameRunningService;
    this.gameEventsService = gameEventsService;
    this.windowPositionService = windowPositionService;
    this.refreshSubscriptionStatus = refreshSubscriptionStatus;
  }

  public async registerListeners(): Promise<void> {
    overwolf.extensions.onAppLaunchTriggered.addListener(this.appLaunched);
    overwolf.games.onGameLaunched.addListener(this.onGameLaunched);
    overwolf.games.onGameInfoUpdated.addListener(this.onGameInfoUpdated);
  }

  public open() {
    this.appLaunched();
    console.log(GAME_TERMINATED_REASON);
  }

  private readonly onGameLaunched = async (e: overwolf.games.RunningGameInfo) => {
    if(!this.gameInfoService.isSupportedGame(e)) {
      return;
    }
    console.log(`Game Launched: Handling game launched`);
    this.handleGameLaunched();
    if (e?.isRunning) {
      const isRunning = await this.gameInfoService.refresh();
      if (isRunning) {
        this.gameEventsService.setReadyToRegisterEvents(false);
        setTimeout(() => {
          console.log("Registering events enabled");
          this.gameEventsService.setReadyToRegisterEvents(true);
        }, 20000);
      }
    }
  };

  private readonly onGameInfoUpdated = async (e: overwolf.games.GameInfoUpdatedEvent) => {
    console.log(`Game Updated: Handling game updated`);
    console.log(e);
    const reasons = e.reason as string[];
    
    if (e.gameInfo && !this.gameInfoService.isSupportedGame(e.gameInfo)) {
      return;
    }

    if (e?.runningChanged) {
      this.gameInfoService.refresh();
    }

    if (reasons.includes(GAME_TERMINATED_REASON)) {
        await this.handleGameTerminated();
    }

    if (reasons.includes(GAME_CHANGED_REASON)) {
      await this.gameInfoService.refresh();
      console.log(`Game Changed: Game running: ${this.gameInfoService.isGameRunning()}`);
      
      if(!this.gameInfoService.isGameRunning()) {
        console.log(`Game Changed: Game not running, handling game terminated`);
        await this.handleGameTerminated();
        return;
      }
   }

    if (reasons.includes(GAME_LAUNCHED_REASON)) {
      console.log(`Game Updated: Handling game launched`);
      this.handleGameLaunched();
    }
  };

  private async handleGameTerminated() {
    if (
        AppConfigUtils.getAppConfig().userSettings.getMinimizeOnGameClose() &&
        AppConfigUtils.getAppConfig().userSettings.getMinimizeOnGameClose() ==="true"
      ) {
        console.log(`Closing all windows`);
        for (const windowName of Object.values(kWindowNames)) {
          if (windowName === kWindowNames.background || windowName === kWindowNames.desktop) {
            continue;
          }
          await WindowsService.close(windowName);
        }
        console.log(`Opening desktop window`);
        await WindowsService.restore(kWindowNames.desktop);
    } else {
      console.log(`Game terminated: Not minimizing opening Desktop`);
      await WindowsService.close(kWindowNames.inGame);
      await WindowsService.close(kWindowNames.secondScreen);
      await WindowsService.restore(kWindowNames.desktop);
      await this.windowPositionService.applyWindowPosition(kWindowNames.desktop);
      await WindowsService.bringToFront(kWindowNames.desktop, true);
    }
  }

  private async handleGameLaunched() {
    if (AppConfigUtils.getAppConfig().userSettings.isDesktopOnly()) {
        console.log(`Game launched: Restoring desktop`);
        await WindowsService.close(kWindowNames.inGame);
        await WindowsService.close(kWindowNames.secondScreen);
        await WindowsService.restore(kWindowNames.desktop);
         await this.windowPositionService.applyWindowPosition(kWindowNames.desktop);
    } else {
        console.log(`Game launched: Restoring InGame`);
        await WindowsService.close(kWindowNames.desktop);
        await WindowsService.restore(kWindowNames.inGame);
        await this.windowPositionService.applyWindowPosition(kWindowNames.inGame);
        if(
          AppConfigUtils.getAppConfig().userSettings.isSecondScreenEnabled() &&
          (await WindowsService.getMonitorsList()).length > 1
        ) {
            console.log(`Game launched: Restoring Second Screen`);
            await WindowsService.restore(kWindowNames.secondScreen);
            const applied = await this.windowPositionService.applyWindowPosition(
              kWindowNames.secondScreen,
            );
            if (!applied) {
              await WindowsService.setToSecondMonitor(kWindowNames.secondScreen);
            }
            await WindowsService.bringToFront(kWindowNames.secondScreen, false);
        } else {
            await WindowsService.close(kWindowNames.secondScreen);
        }
    }
  }

  private readonly appLaunched = async (e?: overwolf.extensions.AppLaunchTriggeredEvent) => {    
    if (this.refreshSubscriptionStatus) {
      try {
        await this.refreshSubscriptionStatus();
      } catch (error) {
        console.warn("App launched: failed to refresh subscription status", error);
      }
    }

    if(this.gameInfoService.isGameRunning() && !AppConfigUtils.getAppConfig().userSettings.isDesktopOnly()) {
      console.log(`App launched: Game running, restoring in-game`);
      await WindowsService.close(kWindowNames.desktop);
      await WindowsService.restore(kWindowNames.inGame);
      await this.windowPositionService.applyWindowPosition(kWindowNames.inGame);
      if(
        AppConfigUtils.getAppConfig().userSettings.isSecondScreenEnabled() &&
        (await WindowsService.getMonitorsList()).length > 1
      ) {
          console.log(`App launched: Restoring Second Screen`);
          await WindowsService.restore(kWindowNames.secondScreen);
          await WindowsService.bringToFront(kWindowNames.secondScreen, false);
           const applied = await this.windowPositionService.applyWindowPosition(
             kWindowNames.secondScreen,
           );
           if (!applied) {
             await WindowsService.setToSecondMonitor(kWindowNames.secondScreen);
             await WindowsService.bringToFront(kWindowNames.secondScreen, false);
           }
      } else {
          await WindowsService.close(kWindowNames.secondScreen);
      }
    } else {
      console.log(`App launched: Game not running, restoring desktop`);
      await WindowsService.close(kWindowNames.inGame);
      await WindowsService.close(kWindowNames.secondScreen);
      await WindowsService.restore(kWindowNames.desktop);
      await this.windowPositionService.applyWindowPosition(kWindowNames.desktop);
      await WindowsService.bringToFront(kWindowNames.desktop, true);
    }
  };

}
