import { BridgeModule } from "./BackgroundBridgeRegistry";
import { AppDataLoader } from "../services/app-data/AppDataLoader";
import { HideoutUtils } from "../../escape-from-tarkov/page/hideout/utils/HideoutUtils";

export class HideoutDataBridge implements BridgeModule {
  private readyPromise: Promise<void> | null = null;

  public getApi() {
    return {
      waitForHideoutData: () => this.waitForHideoutData(),
      getHideoutData: () => HideoutUtils.getData(),
    };
  }

  private async waitForHideoutData(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = AppDataLoader.loadHideout().then(() => {});
    }
    await this.readyPromise;
  }
}
