import { BridgeModule } from "./BackgroundBridgeRegistry";
import { AppDataLoader } from "../services/app-data/AppDataLoader";
import { QuestsUtils } from "../../escape-from-tarkov/page/quests/utils/QuestsUtils";

export class QuestDataBridge implements BridgeModule {
  private readyPromise: Promise<void> | null = null;

  public getApi() {
    return {
      waitForQuestData: () => this.waitForQuestData(),
      getQuestData: () => QuestsUtils.getData(),
    };
  }

  private async waitForQuestData(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = AppDataLoader.loadQuests().then(() => {});
    }
    await this.readyPromise;
  }
}
