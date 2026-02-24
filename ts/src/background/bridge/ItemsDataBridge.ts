import { BridgeModule } from "./BackgroundBridgeRegistry";
import { AppDataLoader } from "../services/app-data/AppDataLoader";
import { ItemsElementUtils } from "../../escape-from-tarkov/utils/ItemsElementUtils";

export class ItemsDataBridge implements BridgeModule {
  private readyPromise: Promise<void> | null = null;

  public getApi() {
    return {
      waitForItemsData: () => this.waitForItemsData(),
      getItemsData: () => ItemsElementUtils.getData(),
    };
  }

  private async waitForItemsData(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = AppDataLoader.loadItems().then(() => {});
    }
    await this.readyPromise;
  }
}
