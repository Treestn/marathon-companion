import { PlayerProgressionUtils } from "../../escape-from-tarkov/utils/PlayerProgressionUtils";
import { QuestDataStore } from "./QuestDataStore";

export class ProgressionStateService {
  private static readonly getBridge = () =>
    (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;

  static isQuestCompleted(questId: string): boolean {
    const bridge = this.getBridge();
    if (bridge?.isQuestCompleted) {
      return bridge.isQuestCompleted(questId);
    }
    return PlayerProgressionUtils.isQuestCompleted(questId);
  }

  static isQuestActive(questId: string): boolean {
    const bridge = this.getBridge();
    if (bridge?.isQuestActive) {
      return bridge.isQuestActive(questId);
    }
    return PlayerProgressionUtils.isQuestActive(questId);
  }

  static isQuestObjectiveCompleted(questId: string, objectiveId: string): boolean {
    const bridge = this.getBridge();
    if (bridge?.isQuestObjectiveCompleted) {
      return bridge.isQuestObjectiveCompleted(questId, objectiveId);
    }
    const quest = QuestDataStore.getQuestById(questId);
    if (!quest) {
      return false;
    }
    return PlayerProgressionUtils.isQuestObjectiveCompleted(quest, objectiveId);
  }

  static isQuestFailed(questId: string): boolean {
    const bridge = this.getBridge();
    if (bridge?.isQuestFailed) {
      return bridge.isQuestFailed(questId);
    }
    return PlayerProgressionUtils.isQuestFailed(questId);
  }

  static isQuestTracked(questId: string): boolean {
    const bridge = this.getBridge();
    if (bridge?.isQuestTracked) {
      return bridge.isQuestTracked(questId);
    }
    return PlayerProgressionUtils.isQuestTracked(questId);
  }

  static isQuestManuallyActivated(questId: string): boolean {
    const bridge = this.getBridge();
    if (bridge?.isQuestManuallyActivated) {
      return bridge.isQuestManuallyActivated(questId);
    }
    return PlayerProgressionUtils.isQuestManuallyActivated(questId);
  }

  static isQuestObjectiveCompletedByIconId(
    questId: string,
    iconId: string | number,
  ): boolean {
    const objectiveId = QuestDataStore.getObjectiveIdFromIconId(questId, iconId);
    if (!objectiveId) {
      return false;
    }
    return this.isQuestObjectiveCompleted(questId, objectiveId);
  }
}
