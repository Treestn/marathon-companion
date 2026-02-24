import { QuestsObject, Quest } from "../../model/IQuestsElements";
import { StorageHelper } from "../../escape-from-tarkov/service/helper/StorageHelper";

const QUESTS_STORAGE_KEY = "QuestsObjects";

export class QuestDataStore {
  static getStoredQuests(): QuestsObject | null {
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    const bridged = bridge?.getQuestData?.();
    if (bridged?.tasks?.length) {
      return bridged as QuestsObject;
    }
    const stored = StorageHelper.getStoredData(QUESTS_STORAGE_KEY);
    if (!stored || stored === "undefined") {
      return null;
    }
    try {
      return JSON.parse(stored) as QuestsObject;
    } catch (error) {
      console.warn("[QuestDataStore] Failed to parse stored quests data", error);
      return null;
    }
  }

  static getStoredQuestList(): Quest[] {
    return this.getStoredQuests()?.tasks ?? [];
  }

  static getQuestById(id: string): Quest | null {
    const tasks = this.getStoredQuestList();
    for (const quest of tasks) {
      if (quest.id === id || quest.oldQuestId === id) {
        return quest;
      }
    }
    return null;
  }

  static getQuestUnlocksFromId(id: string): Quest[] {
    const completedQuest = this.getQuestById(id);
    if (!completedQuest) {
      return [];
    }
    const tasks = this.getStoredQuestList();
    return tasks.filter((quest) =>
      quest.taskRequirements?.some(
        (requirement) =>
          requirement.task &&
          (requirement.task.id === completedQuest.id ||
            requirement.task.id === completedQuest.oldQuestId),
      ),
    );
  }

  static getObjectiveIdFromIconId(questId: string, iconId: string | number): string | null {
    const quest = this.getQuestById(questId);
    if (!quest?.objectives) {
      return null;
    }
    const iconIdString = String(iconId);
    for (const objective of quest.objectives) {
      if (!objective.questImages) {
        continue;
      }
      for (const image of objective.questImages) {
        if (String(image.id) === iconIdString) {
          return objective.id;
        }
      }
    }
    return null;
  }
}
