import { useMemo, useState } from "react";
import { Quest } from "../../../../model/quest/IQuestsElements";
import { I18nHelper } from "../../../../locale/I18nHelper";

export type QuestSearchState = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchResults: Quest[];
};

export const useQuestSearch = (quests: Quest[]): QuestSearchState => {
  const [searchTerm, setSearchTerm] = useState("");

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return [];
    }
    return quests.filter((quest) => {
      const title =
        quest.locales?.[I18nHelper.currentLocale()] ??
        quest.name ??
        "";
      return title.toLowerCase().includes(term);
    });
  }, [quests, searchTerm]);

  return { searchTerm, setSearchTerm, searchResults };
};
