import { useCallback, useEffect, useState } from "react";
import { Quest } from "../../../../model/quest/IQuestsElements";
import { QuestDataStore } from "../../../services/QuestDataStore";
import {
  ProgressionUpdateOp,
  ProgressionUpdatesService,
} from "../../../services/ProgressionUpdatesService";

type QuestListState = {
  quests: Quest[];
  refreshQuestList: () => void;
  sendProgressionUpdate: (update: ProgressionUpdateOp) => void;
};

export const useQuestList = (): QuestListState => {
  const [quests, setQuests] = useState<Quest[]>([]);

  const refreshQuestList = useCallback(() => {
    setQuests(QuestDataStore.getStoredQuestList());
  }, []);

  useEffect(() => {
    refreshQuestList();
  }, [refreshQuestList]);

  useEffect(() => {
    return ProgressionUpdatesService.subscribe((op) => {
      refreshQuestList();
      if (typeof globalThis.dispatchEvent !== "function") {
        return;
      }
      let detail: { type: string; questId: string; objectiveId?: string } | null = null;
      if (op?.type === "quest-active") {
        detail = { type: "active-state", questId: op.questId };
      } else if (op?.type === "quest-completed") {
        detail = { type: "completed", questId: op.questId };
      } else if (op?.type === "quest-objective") {
        detail = {
          type: "objective",
          questId: op.questId,
          objectiveId: op.objectiveId,
        };
      }
      if (detail) {
        globalThis.dispatchEvent(new CustomEvent("quest-progress-updated", { detail }));
      }
    });
  }, [refreshQuestList]);

  const sendProgressionUpdate = useCallback((update: ProgressionUpdateOp) => {
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    bridge?.updateProgression?.(update);
  }, []);

  return { quests, refreshQuestList, sendProgressionUpdate };
};
