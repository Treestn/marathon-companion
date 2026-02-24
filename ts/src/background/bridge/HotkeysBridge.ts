import { BridgeModule } from "./BackgroundBridgeRegistry";
import { HotkeysService } from "../services/common/HotkeysService";

export class HotkeysBridge implements BridgeModule {
  public constructor(private readonly hotkeysService: HotkeysService) {}

  public getApi() {
    return {
      getHotkeyText: (hotkeyName: string) =>
        this.hotkeysService.getHotkeyText(hotkeyName),
      getIsGameRunning: () => this.hotkeysService.getIsGameRunning(),
      assignHotkey: (hotkeyName: string, hotkeyText: string, keyCode: number | null) =>
        this.hotkeysService.assignHotkey(hotkeyName, hotkeyText, keyCode),
    };
  }
}
