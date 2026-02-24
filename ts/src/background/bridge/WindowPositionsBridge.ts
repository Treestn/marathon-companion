import { BridgeModule } from "./BackgroundBridgeRegistry";
import { WindowPositionService } from "../services/common/WindowPositionService";

export class WindowPositionsBridge implements BridgeModule {
  constructor(private readonly windowPositionService: WindowPositionService) {}

  public getApi() {
    return {
      setWindowPosition: (windowName: string, left: number, top: number) =>
        this.windowPositionService.setWindowPosition(windowName, left, top),
      applyWindowPosition: (windowName: string) =>
        this.windowPositionService.applyWindowPosition(windowName),
    };
  }
}
