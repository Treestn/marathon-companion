import { AppConfigUtils } from "../../../escape-from-tarkov/utils/AppConfigUtils";
import { ItemsModel } from "../../../model/items/IItemsElements";
import { QuestsObject } from "../../../model/quest/IQuestsElements";
import endpoints from "../../../escape-from-tarkov/service/tarkov-companion-api/config/endpoint";
import { TarkovCompanionService } from "../../../escape-from-tarkov/service/tarkov-companion-api/handler/TarkovCompanionService";
import { HideoutUtils } from "../../../escape-from-tarkov/page/hideout/utils/HideoutUtils";
import { ItemsElementUtils } from "../../../escape-from-tarkov/utils/ItemsElementUtils";
import { QuestsUtils } from "../../../escape-from-tarkov/page/quests/utils/QuestsUtils";
import { PopupHelper } from "../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../escape-from-tarkov/constant/AppPopupMessages";
import { PlayerProgressionUtils } from "../../../escape-from-tarkov/utils/PlayerProgressionUtils";
import { HideoutObject } from "../../../model/hideout/HideoutObject";

const safeParse = <T>(value?: string | null): T | null => {
  if (!value || value === "undefined") {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export class AppDataLoader {
  private static loadAllPromise: Promise<void> | null = null;

  public static async loadAll(): Promise<void> {
    if (!this.loadAllPromise) {
      this.loadAllPromise = Promise.all([
        this.loadQuests(),
        this.loadItems(),
      ]).then(() => {
        PlayerProgressionUtils.resolveItemsState();
        PlayerProgressionUtils.resolve();
        QuestsUtils.refreshActiveQuests();
      }).catch((error) => {
        // Reset so a subsequent call can retry instead of returning
        // the cached rejected promise.
        this.loadAllPromise = null;
        throw error;
      });
    }
    await this.loadAllPromise;
  }

  public static async loadQuests(): Promise<QuestsObject | null> {
    const stored = safeParse<QuestsObject>(QuestsUtils.getStoredData());
    const version = stored?.version ?? "0.0.0";

    let fetched: QuestsObject | null = null;
    try {
      const response = await TarkovCompanionService.getConfig(
        endpoints.quest_config(version),
      );
      if (response?.ok) {
        const text = await response.text();
        if (text) {
          fetched = JSON.parse(text);
        }
      }
    } catch (error) {
      console.warn("[AppDataLoader] Failed to fetch quests config, using stored data:", error);
    }
    
    if (fetched) {
      QuestsUtils.save(fetched);
      QuestsUtils.setQuestsObject(fetched);
      fetched.tasks.forEach(quest => {
        PlayerProgressionUtils.resolveQuest(quest, stored);
      })
      return fetched;
    }

    if (stored) {
      QuestsUtils.setQuestsObject(stored);
      return stored;
    }

    PopupHelper.addFatalPopup(
      AppPopupMessagesConst.FATAL_ERROR_NO_CONFIG,
      "Quests config is missing",
    );
    return null;
  }

  public static async loadHideout(): Promise<HideoutObject | null> {
    const stored = safeParse<HideoutObject>(HideoutUtils.getStoredData());
    if (!stored) {
      return null;
    }
    HideoutUtils.save(stored);
    HideoutUtils.setHideoutObject(stored);
    return stored;
  }

  public static async loadItems(): Promise<ItemsModel | null> {
    const stored = safeParse<ItemsModel>(ItemsElementUtils.getStoredData());
    const version = stored?.version ?? "0.0.0";
    const locale = AppConfigUtils.getAppConfig().userSettings.getLocalePreference();

    let fetched: ItemsModel | null = null;
    try {
      const response = await TarkovCompanionService.getConfig(
        endpoints.items_v2_config(locale, version),
      );
      if (response?.ok) {
        const text = await response.text();
        if (text) {
          fetched = JSON.parse(text);
        }
      }
    } catch (error) {
      console.warn("[AppDataLoader] Failed to fetch items config, using stored data:", error);
    }

    if (fetched) {
      ItemsElementUtils.setItemsMap(fetched);
      ItemsElementUtils.save();
      return fetched;
    }

    if (stored) {
      ItemsElementUtils.setItemsMap(stored);
      return stored;
    }

    PopupHelper.addFatalPopup(
      AppPopupMessagesConst.FATAL_ERROR_NO_CONFIG,
      "Items config is missing",
    );
    return null;
  }
}
