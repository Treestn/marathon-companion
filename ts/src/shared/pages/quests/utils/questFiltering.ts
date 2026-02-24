import { Quest } from "../../../../model/quest/IQuestsElements";
import { QuestState, QuestType } from "../../../../escape-from-tarkov/constant/QuestConst";
import { MapsList } from "../../../../escape-from-tarkov/constant/MapsConst";
import { ProgressionStateService } from "../../../services/ProgressionStateService";
import { AppConfigClient } from "../../../services/AppConfigClient";

export type QuestFilterValues = {
  stateValue: string[];
  typeValue: string[];
  traderValue: string[];
  mapValue: string[];
};

const isProgressionTypeAllowed = (quest: Quest): boolean => {
  const progressionType =
    AppConfigClient.getConfig()?.userSettings?.progressionType;
  return !(
    quest.progressionType &&
    quest.progressionType !== "" &&
    progressionType !== quest.progressionType.toLocaleLowerCase()
  );
};

const isQuestStateAllowed = (quest: Quest, selectedStates: string[]): boolean => {
  if (selectedStates.length === 0) {
    return true;
  }
  const allowCompleted = selectedStates.includes(QuestState.COMPLETED);
  const allowActive = selectedStates.includes(QuestState.ACTIVE);
  const allowBlocked = selectedStates.includes(QuestState.BLOCKED);
  const allowFailed = selectedStates.includes(QuestState.FAILED);
  const allowNoTracking = selectedStates.includes(QuestState.NO_TRACKING);

  const active = ProgressionStateService.isQuestActive(quest.id);
  const manuallyActive = ProgressionStateService.isQuestManuallyActivated(quest.id);
  const completed = ProgressionStateService.isQuestCompleted(quest.id);
  const failed = ProgressionStateService.isQuestFailed(quest.id);
  const tracking = ProgressionStateService.isQuestTracked(quest.id);

  const blockedByNoTracking =
    !allowNoTracking && !tracking && !active && !manuallyActive && allowActive;
  if (blockedByNoTracking) {
    return false;
  }

  if ((!allowFailed && failed) || (!allowCompleted && completed)) {
    return false;
  }

  return (
    (allowNoTracking && !tracking) ||
    (allowFailed && failed) ||
    (allowCompleted && completed) ||
    (allowActive && active) ||
    (allowBlocked && !active)
  );
};

const isQuestTypeAllowed = (quest: Quest, selectedTypes: string[]): boolean => {
  if (selectedTypes.length === 0) {
    return true;
  }
  const questType = quest.questType ?? QuestType.SIDE_QUEST;
  return selectedTypes.includes(questType);
};

const isQuestTraderAllowed = (quest: Quest, selectedTraders: string[]): boolean => {
  if (selectedTraders.length === 0) {
    return true;
  }
  return selectedTraders.includes(quest.trader.id);
};

const isQuestMapAllowed = (quest: Quest, selectedMaps: string[]): boolean => {
  if (selectedMaps.length === 0 || selectedMaps.length === MapsList.length) {
    return true;
  }
  let allowed = false;
  quest.objectives?.forEach((objective) => {
    if (!objective.maps || objective.maps.length === 0) {
      return;
    }
    objective.maps.forEach((map) => {
      if (selectedMaps.includes(map.id)) {
        allowed = true;
      }
    });
  });
  return allowed;
};

export const filterQuests = (
  quests: Quest[],
  filters: QuestFilterValues,
): Quest[] => {
  return quests.filter((quest) => {
    if (!isProgressionTypeAllowed(quest)) {
      return false;
    }
    if (!isQuestTraderAllowed(quest, filters.traderValue)) {
      return false;
    }
    if (!isQuestTypeAllowed(quest, filters.typeValue)) {
      return false;
    }
    if (!isQuestStateAllowed(quest, filters.stateValue)) {
      return false;
    }
    if (!isQuestMapAllowed(quest, filters.mapValue)) {
      return false;
    }
    return true;
  });
};
