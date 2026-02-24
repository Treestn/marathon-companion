import React, { useEffect, useState } from 'react';
import { Quest } from '../../../model/quest/IQuestsElements';
import { QuestHeader } from '../../components/quests/QuestHeader';
import { QuestBody } from '../../components/quests/QuestBody';
import { ProgressionStateService } from '../../services/ProgressionStateService';
import { QuestDataStore } from '../../services/QuestDataStore';
import './quests.css';

export const ActiveQuestsPage: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [openQuestIds, setOpenQuestIds] = useState<Set<string>>(new Set());
  const getBridge = () => (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
  const refreshQuestList = async () => {
    const storedQuests = QuestDataStore.getStoredQuestList();
    setQuests(storedQuests.filter((quest) => ProgressionStateService.isQuestActive(quest.id)));
  };

  useEffect(() => {
    const loadQuests = async () => {
      await refreshQuestList();
    };

    loadQuests();
  }, []);

  useEffect(() => {
    const handler = async (event: Event) => {
      const detail = (event as CustomEvent).detail;
      await refreshQuestList();
      if (detail?.type !== 'completed') {
        return;
      }
      const questId = detail.questId as string | undefined;
      if (questId && ProgressionStateService.isQuestCompleted(questId)) {
        setOpenQuestIds((prev) => {
          if (!prev.has(questId)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(questId);
          return next;
        });
      }
    };
    globalThis.addEventListener('quest-progress-updated', handler);
    return () => globalThis.removeEventListener('quest-progress-updated', handler);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let retryTimeout: number | undefined;
    let attempts = 0;
    const maxAttempts = 50;
    const retryDelayMs = 100;

    const applyUpdate = async () => {
      await refreshQuestList();
    };

    const trySubscribe = () => {
      const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
      if (!bridge?.onProgressionUpdated) {
        if (attempts < maxAttempts) {
          attempts += 1;
          retryTimeout = globalThis.setTimeout(trySubscribe, retryDelayMs);
        }
        return;
      }

      unsubscribe = bridge.onProgressionUpdated((op) => {
        applyUpdate();
        if (typeof globalThis.dispatchEvent !== 'function') {
          return;
        }
        let detail: { type: string; questId: string; objectiveId?: string } | null = null;
        if (op?.type === 'quest-active') {
          detail = { type: 'active-state', questId: op.questId };
        } else if (op?.type === 'quest-completed') {
          detail = { type: 'completed', questId: op.questId };
        } else if (op?.type === 'quest-objective') {
          detail = {
            type: 'objective',
            questId: op.questId,
            objectiveId: op.objectiveId,
          };
        }
        if (detail) {
          globalThis.dispatchEvent(new CustomEvent('quest-progress-updated', { detail }));
        }
      });
    };

    trySubscribe();

    return () => {
      if (retryTimeout) {
        globalThis.clearTimeout(retryTimeout);
      }
      unsubscribe?.();
    };
  }, []);

  const toggleQuest = (questId: string) => {
    setOpenQuestIds((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) {
        next.delete(questId);
      } else {
        next.add(questId);
      }
      return next;
    });
  };

  const sendProgressionUpdate = (update) => {
    const bridge = getBridge();
    bridge?.updateProgression?.(update);
  };

  if (quests.length === 0) {
    return <div className="active-quests-empty">No active quests.</div>;
  }

  return (
    <div className="active-quests-page scroll-div">
      {quests.map((quest) => {
        const isOpen = openQuestIds.has(quest.id);
        const isCompleted = ProgressionStateService.isQuestCompleted(quest.id);
        return (
          <div
            key={quest.id}
            className={`quest-card${isCompleted ? ' quest-card-completed' : ''}`}
          >
            <QuestHeader
              quest={quest}
              isOpen={isOpen}
              onToggle={() => toggleQuest(quest.id)}
              onActiveChange={(questId, nextState) => {
                  sendProgressionUpdate({
                    type: 'quest-active',
                    questId,
                    isActive: nextState,
                  });
              }}
            />
            <div className={`quest-body-wrapper${isOpen ? ' is-open' : ''}`}>
              <QuestBody
                quest={quest}
                onQuestCompletedChange={(questId, isCompleted) => {
                  sendProgressionUpdate({
                    type: 'quest-completed',
                    questId,
                    isCompleted,
                  });
                }}
                onObjectiveChange={(questId, objectiveId, isCompleted) => {
                  sendProgressionUpdate({
                    type: 'quest-objective',
                    questId,
                    objectiveId,
                    isCompleted,
                  });
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
