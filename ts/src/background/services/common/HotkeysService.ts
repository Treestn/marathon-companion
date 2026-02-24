import { OWGames, OWHotkeys } from "@overwolf/overwolf-api-ts/dist";
import WindowState = overwolf.windows.enums.WindowStateEx;
import { kHotkeys, kWindowNames } from "../../../consts";
import { WindowsService } from "../../../WindowsService";

export class HotkeysService {
  private isRegistered = false;

  public init(): void {
    if (this.isRegistered) {
      return;
    }
    this.isRegistered = true;
    OWHotkeys.onHotkeyDown(kHotkeys.toggle, () => {
      this.toggleWindow(kWindowNames.inGame);
    });
    // OWHotkeys.onHotkeyDown(kHotkeys.switchScreenToggle, () => {
    //   this.moveInGameToSecondMonitor();
    // });
    OWHotkeys.onHotkeyDown(kHotkeys.secondScreenToggle, () => {
      this.toggleWindow(kWindowNames.secondScreen);
      this.toggleSecondScreenWindow();
    });
  }

  public async getHotkeyText(hotkeyName: string): Promise<string> {
    const gameClassId = await this.getCurrentGameClassId();
    if (gameClassId) {
      return OWHotkeys.getHotkeyText(hotkeyName, gameClassId);
    }
    return OWHotkeys.getHotkeyText(hotkeyName);
  }

  public async assignHotkey(
    hotkeyName: string,
    hotkeyText: string,
    keyCode: number | null,
  ): Promise<overwolf.Result> {
    if (keyCode === null) {
      return { success: false, error: "Press a hotkey to assign." };
    }
    const gameClassId = await this.getCurrentGameClassId();
    const modifiers = {
      shift: hotkeyText.includes("Shift"),
      ctrl: hotkeyText.includes("Ctrl"),
      alt: hotkeyText.includes("Alt"),
    };
    const hotkey = {
      name: hotkeyName,
      binding: hotkeyText.split(" ").join(""),
      gameid: gameClassId ?? null,
      virtualKey: keyCode,
      modifiers,
    };
    return new Promise((resolve) => {
      overwolf.settings.hotkeys.assign(hotkey, (result) => resolve(result));
    });
  }

  public async getIsGameRunning(): Promise<boolean> {
    const info = await OWGames.getRunningGameInfo();
    return Boolean(info && info.isRunning && info.classId);
  }

  private async toggleWindow(windowName: string): Promise<void> {
    const state = await WindowsService.getWindowState(windowName);
    if (state === WindowState.closed || state === WindowState.minimized) {
        console.log(`Window ${windowName} is closed or minimized, restoring`);
      await WindowsService.restore(windowName);
      return;
    }
    await WindowsService.minimize(windowName);
  }

  private async moveInGameToSecondMonitor(): Promise<void> {
    await WindowsService.setToSecondMonitor(kWindowNames.inGame);
  }

  private async toggleSecondScreenWindow(): Promise<void> {
    const state = await WindowsService.getWindowState(kWindowNames.secondScreen);
    if (state === WindowState.closed || state === WindowState.minimized) {
      await WindowsService.restore(kWindowNames.secondScreen);
      return;
    }
    await WindowsService.minimize(kWindowNames.secondScreen);
  }

  private async getCurrentGameClassId(): Promise<number | null> {
    const info = await OWGames.getRunningGameInfo();
    return info && info.isRunning && info.classId ? info.classId : null;
  }
}
