import { Quest } from "../../../../model/quest/IQuestsElements";
import { ProgressionStateService } from "../../../services/ProgressionStateService";

const sortQuestList = (
  list: Quest[],
  sortByTrader: boolean,
): Quest[] => {
  return list.sort((a, b) => {
    if (sortByTrader) {
      return a.trader.name.localeCompare(b.trader.name);
    }
    return 0;
  });
};

export const orderQuests = (
  list: Quest[],
  sortByTrader: boolean,
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

  const sortedActive = sortQuestList(orderedActive, sortByTrader);
  const sortedOther = sortQuestList(orderedOther, sortByTrader);
  return [...sortedActive, ...sortedOther];
};
