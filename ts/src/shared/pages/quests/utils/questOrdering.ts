import { Quest } from "../../../../model/quest/IQuestsElements";
import { ProgressionStateService } from "../../../services/ProgressionStateService";

const sortQuestList = (
  list: Quest[],
  sortByTrader: boolean,
  sortByQuest: boolean,
): Quest[] => {
  return list.sort((a, b) => {
    if (sortByTrader && sortByQuest) {
      const traderCompare = a.trader.name.localeCompare(b.trader.name);
      if (traderCompare !== 0) {
        return traderCompare;
      }
      return a.name.localeCompare(b.name);
    }
    if (sortByTrader) {
      return a.trader.name.localeCompare(b.trader.name);
    }
    if (sortByQuest) {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });
};

export const orderQuests = (
  list: Quest[],
  sortByTrader: boolean,
  sortByQuest: boolean,
): Quest[] => {
  const orderedActive: Quest[] = [];
  const orderedOther: Quest[] = [];

  list.forEach((quest) => {
    if (
      ProgressionStateService.isQuestActive(quest.id) ||
      ProgressionStateService.isQuestManuallyActivated(quest.id)
    ) {
      orderedActive.push(quest);
    } else {
      orderedOther.push(quest);
    }
  });

  const sortedActive = sortQuestList(orderedActive, sortByTrader, sortByQuest);
  const sortedOther = sortQuestList(orderedOther, sortByTrader, sortByQuest);
  return [...sortedActive, ...sortedOther];
};
