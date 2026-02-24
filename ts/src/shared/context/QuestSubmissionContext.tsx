import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Quest } from '../../model/quest/IQuestsElements';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A quest that the user has added or modified.
 * Stores the full Quest object — the backend can replace the existing quest
 * wholesale, exactly like we do with map features.
 */
export type QuestEditEntry = {
  quest: Quest;
  /** True when this is a brand-new quest created by the user. */
  isNew: boolean;
};

export type QuestSubmissionContextValue = {
  questEdits: QuestEditEntry[];
  removedQuestIds: string[];
  /** Store or replace a quest edit.  The caller is responsible for cloning and
   *  applying modifications before calling this. */
  upsertQuest: (quest: Quest, isNew?: boolean) => void;
  /** Remove a quest from the edit list entirely (undo all edits). */
  removeQuestEntry: (questId: string) => void;
  /** Mark an existing quest for deletion. */
  addRemovedQuest: (questId: string) => void;
  /** Cancel a pending quest deletion. */
  cancelRemovedQuest: (questId: string) => void;
  /** Clear all quest edits and removals (e.g. after successful submission). */
  clearQuestEdits: () => void;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const QuestSubmissionContext = createContext<QuestSubmissionContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const QuestSubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [questEdits, setQuestEdits] = useState<QuestEditEntry[]>([]);
  const [removedQuestIds, setRemovedQuestIds] = useState<string[]>([]);

  const upsertQuest = useCallback((quest: Quest, isNew = false) => {
    setQuestEdits((prev) => {
      const idx = prev.findIndex((e) => e.quest.id === quest.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { quest, isNew: prev[idx].isNew };
        return next;
      }
      return [...prev, { quest, isNew }];
    });
  }, []);

  const removeQuestEntry = useCallback((questId: string) => {
    setQuestEdits((prev) => prev.filter((e) => e.quest.id !== questId));
  }, []);

  const addRemovedQuest = useCallback((questId: string) => {
    setRemovedQuestIds((prev) => {
      if (prev.includes(questId)) return prev;
      return [...prev, questId];
    });
  }, []);

  const cancelRemovedQuest = useCallback((questId: string) => {
    setRemovedQuestIds((prev) => prev.filter((id) => id !== questId));
  }, []);

  const clearQuestEdits = useCallback(() => {
    setQuestEdits([]);
    setRemovedQuestIds([]);
  }, []);

  const value = useMemo(
    () => ({
      questEdits,
      removedQuestIds,
      upsertQuest,
      removeQuestEntry,
      addRemovedQuest,
      cancelRemovedQuest,
      clearQuestEdits,
    }),
    [questEdits, removedQuestIds, upsertQuest, removeQuestEntry, addRemovedQuest, cancelRemovedQuest, clearQuestEdits],
  );

  return (
    <QuestSubmissionContext.Provider value={value}>
      {children}
    </QuestSubmissionContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const useQuestSubmissionContext = () => {
  const ctx = useContext(QuestSubmissionContext);
  if (!ctx) {
    throw new Error('useQuestSubmissionContext must be used within QuestSubmissionProvider');
  }
  return ctx;
};

export const useOptionalQuestSubmissionContext = (): QuestSubmissionContextValue => {
  const ctx = useContext(QuestSubmissionContext);
  if (ctx) return ctx;
  return {
    questEdits: [],
    removedQuestIds: [],
    upsertQuest: () => {},
    removeQuestEntry: () => {},
    addRemovedQuest: () => {},
    cancelRemovedQuest: () => {},
    clearQuestEdits: () => {},
  };
};
