import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { QuestFilters } from "../../components/quests/filters/QuestFilters";
import { QuestHeader } from "../../components/quests/QuestHeader";
import { QuestBody } from "../../components/quests/QuestBody";
import { QuestEditBody, type EditRewardItem, type EditTaskRequirement, type UpsertObjectiveMetaPayload } from "../../components/quests/QuestEditBody";
import { ProgressionStateService } from "../../services/ProgressionStateService";
import { ItemsElementUtils } from "../../../escape-from-tarkov/utils/ItemsElementUtils";
import { useQuestFilters } from "./hooks/useQuestFilters";
import { useQuestList } from "./hooks/useQuestList";
import { useQuestSearch } from "./hooks/useQuestSearch";
import { filterQuests } from "./utils/questFiltering";
import { orderQuests } from "./utils/questOrdering";
import "./desktop-quests.css";
import './quests.css';
import { NavigationTarget } from "../../services/NavigationEvents";
import { useOptionalEditModeContext } from "../../context/EditModeContext";
import { useOptionalQuestSubmissionContext, type QuestEditEntry } from "../../context/QuestSubmissionContext";
import { I18nHelper } from "../../../locale/I18nHelper";
import { MapAdapter } from "../../../adapter/MapAdapter";
import type { Quest } from "../../../model/quest/IQuestsElements";
import { QuestObjective } from "../../../model/quest/IQuestsElements";
import type { ProgressionUpdateOp } from "../../services/ProgressionUpdatesService";

// ---------------------------------------------------------------------------
// QuestCard — extracted + memoized so only the changed card re-renders
// ---------------------------------------------------------------------------

type QuestCardProps = {
  /** The effective quest (edits already applied if they exist). */
  quest: Quest;
  isOpen: boolean;
  isEditMode: boolean;
  isRemoved: boolean;
  isCompleted: boolean;
  toggleQuest: (questId: string) => void;
  sendProgressionUpdate: (payload: ProgressionUpdateOp) => void;
  upsertQuest: (quest: Quest) => void;
  addRemovedQuest: (questId: string) => void;
  cancelRemovedQuest: (questId: string) => void;
};

const QuestCard = React.memo<QuestCardProps>(({
  quest,
  isOpen,
  isEditMode,
  isRemoved,
  isCompleted,
  toggleQuest,
  sendProgressionUpdate,
  upsertQuest,
  addRemovedQuest,
  cancelRemovedQuest,
}) => {
  const questName =
    quest.locales?.[I18nHelper.currentLocale()] ?? quest.name ?? "Quest";

  // --- Stable callbacks ---

  const onToggle = useCallback(() => {
    if (!isRemoved) toggleQuest(quest.id);
  }, [isRemoved, toggleQuest, quest.id]);

  const onActiveChange = useCallback(
    (questId: string, nextState: boolean) => {
      sendProgressionUpdate({ type: "quest-active", questId, isActive: nextState });
    },
    [sendProgressionUpdate],
  );

  const onTraderChange = useCallback(
    (traderId: string, traderName: string) => {
      const modified = structuredClone(quest);
      (modified.trader as { id: string; name?: string }).id = traderId;
      (modified.trader as { id: string; name?: string }).name = traderName;
      upsertQuest(modified);
    },
    [quest, upsertQuest],
  );

  const onQuestNameChange = useCallback(
    (name: string) => {
      const modified = structuredClone(quest);
      modified.name = name;
      modified.locales = { ...modified.locales, [I18nHelper.currentLocale()]: name };
      upsertQuest(modified);
    },
    [quest, upsertQuest],
  );

  const onDeleteQuest = useCallback(
    () => addRemovedQuest(quest.id),
    [addRemovedQuest, quest.id],
  );

  const onCancelDelete = useCallback(
    () => cancelRemovedQuest(quest.id),
    [cancelRemovedQuest, quest.id],
  );

  // --- Edit body callbacks ---

  const onLevelChange = useCallback(
    (level: number | null) => {
      const modified = structuredClone(quest);
      modified.minPlayerLevel = level ?? 0;
      upsertQuest(modified);
    },
    [quest, upsertQuest],
  );

  const onTaskRequirementsChange = useCallback(
    (requirements: EditTaskRequirement[]) => {
      const modified = structuredClone(quest);
      modified.taskRequirements = requirements.map((r) => ({
        task: { id: r.questId },
        status: [r.status],
      }));
      upsertQuest(modified);
    },
    [quest, upsertQuest],
  );

  const onObjectiveMetaChange = useCallback(
    (payload: UpsertObjectiveMetaPayload) => {
      const modified = structuredClone(quest);
      const obj = modified.objectives.find((o) => o.id === payload.objectiveId);
      if (!obj) return;

      if (payload.type !== undefined) {
        obj.type = payload.type;
      }
      if (payload.description !== undefined) {
        obj.description = payload.description;
        obj.locales = { ...obj.locales, [I18nHelper.currentLocale()]: payload.description };
      }
      if (payload.maps !== undefined) {
        obj.maps = payload.maps.map((m) => ({
          id: m.id,
          name: m.name,
          __typename: 'Map',
        }));
      }
      if (payload.itemId !== undefined) {
        obj.item = {
          id: payload.itemId,
          name: payload.itemName,
          __typename: 'Item',
        };
      }
      if (payload.neededKeys !== undefined) {
        obj.neededKeys = payload.neededKeys.map((entry) => ({
          map: {
            id: entry.mapId,
            name: MapAdapter.getLocalizedMap(entry.mapId),
            __typename: 'Map',
          },
          keys: entry.keyIds.map((keyId) => ({
            id: keyId,
            name: ItemsElementUtils.getItemName(keyId) ?? keyId,
            __typename: 'Item',
          })),
        }));
      }

      upsertQuest(modified);
    },
    [quest, upsertQuest],
  );

  const onAddObjective = useCallback(
    (_questId: string, _qName: string): string => {
      const newObj = new QuestObjective();
      // Use "new-" prefix to identify user-created objectives
      newObj.id = `new-${newObj.id}`;

      const modified = structuredClone(quest);
      modified.objectives = [...modified.objectives, newObj];
      upsertQuest(modified);
      return newObj.id;
    },
    [quest, upsertQuest],
  );

  const onRemoveObjective = useCallback(
    (_questId: string, _qName: string, objectiveId: string) => {
      const modified = structuredClone(quest);
      modified.objectives = modified.objectives.filter((o) => o.id !== objectiveId);
      upsertQuest(modified);
    },
    [quest, upsertQuest],
  );

  const onReorderObjectives = useCallback(
    (_questId: string, _qName: string, order: string[]) => {
      const modified = structuredClone(quest);
      const sorted = [...modified.objectives].sort((a, b) => {
        const idxA = order.indexOf(a.id);
        const idxB = order.indexOf(b.id);
        const posA = idxA >= 0 ? idxA : Number.MAX_SAFE_INTEGER;
        const posB = idxB >= 0 ? idxB : Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
      modified.objectives = sorted;
      upsertQuest(modified);
    },
    [quest, upsertQuest],
  );

  const onRewardChange = useCallback(
    (rewards: EditRewardItem[]) => {
      const modified = structuredClone(quest);
      if (!modified.finishRewards) {
        modified.finishRewards = { traderStanding: [], items: [], offerUnlock: [], skillLevelReward: [], traderUnlock: [] };
      }
      modified.finishRewards.items = rewards.map((r) => ({
        item: { id: r.itemId, __typename: 'Item' as const },
        count: r.count,
        __typename: 'TaskRewardItem' as const,
      }));
      upsertQuest(modified);
    },
    [quest, upsertQuest],
  );

  const onQuestCompletedChange = useCallback(
    (questId: string, isCompletedNext: boolean) => {
      sendProgressionUpdate({ type: "quest-completed", questId, isCompleted: isCompletedNext });
    },
    [sendProgressionUpdate],
  );

  const onObjectiveChange = useCallback(
    (questId: string, objectiveId: string, isCompletedNext: boolean) => {
      sendProgressionUpdate({
        type: "quest-objective",
        questId,
        objectiveId,
        isCompleted: isCompletedNext,
      });
    },
    [sendProgressionUpdate],
  );

  // Keep body mounted after first open so the closing CSS transition still works,
  // but avoid mounting it for quests that were never opened (saves initial render cost).
  const [wasOpened, setWasOpened] = useState(isOpen);
  useEffect(() => {
    if (isOpen && !wasOpened) setWasOpened(true);
  }, [isOpen, wasOpened]);

  const shouldMountBody = isOpen || wasOpened;

  return (
    <div
      id={`quest-card-${quest.id}`}
      className={`quest-card${isCompleted ? " quest-card-completed" : ""}${
        isRemoved ? " quest-card-removed" : ""
      }`}
    >
      <QuestHeader
        quest={quest}
        isOpen={isOpen && !isRemoved}
        onToggle={onToggle}
        onActiveChange={onActiveChange}
        isEditMode={isEditMode}
        isRemoved={isRemoved}
        onTraderChange={onTraderChange}
        onQuestNameChange={onQuestNameChange}
        onDeleteQuest={onDeleteQuest}
        onCancelDelete={onCancelDelete}
      />
      {!isRemoved && (
        <div className={`quest-body-wrapper${isOpen ? " is-open" : ""}`}>
          {shouldMountBody && (
            isEditMode ? (
              <QuestEditBody
                quest={quest}
                onLevelChange={onLevelChange}
                onTaskRequirementsChange={onTaskRequirementsChange}
                onObjectiveMetaChange={onObjectiveMetaChange}
                onAddObjective={onAddObjective}
                onRemoveObjective={onRemoveObjective}
                onReorderObjectives={onReorderObjectives}
                onRewardChange={onRewardChange}
              />
            ) : (
              <QuestBody
                quest={quest}
                onQuestCompletedChange={onQuestCompletedChange}
                onObjectiveChange={onObjectiveChange}
              />
            )
          )}
        </div>
      )}
    </div>
  );
});

QuestCard.displayName = 'QuestCard';

// ---------------------------------------------------------------------------
// QuestsPage
// ---------------------------------------------------------------------------

type QuestsPageProps = {
  navigationTarget?: NavigationTarget | null;
  onNavigationHandled?: () => void;
};

export const QuestsPage: React.FC<QuestsPageProps> = ({
  navigationTarget,
  onNavigationHandled,
}) => {
  const [orderByTrader, setOrderByTrader] = useState(false);
  const [orderByQuestName, setOrderByQuestName] = useState(false);
  const [openQuestIds, setOpenQuestIds] = useState<Set<string>>(new Set());
  const [forcedQuestId, setForcedQuestId] = useState<string | null>(null);
  const { isEditMode, canEdit, isAvailable, toggleEditMode } = useOptionalEditModeContext();
  const {
    questEdits,
    removedQuestIds,
    upsertQuest,
    addRemovedQuest,
    cancelRemovedQuest,
  } = useOptionalQuestSubmissionContext();
  let editButtonTitle = "Submit changes";
  if (!canEdit) {
    editButtonTitle = "Connect to Overwolf to enable edit mode";
  } else if (isEditMode) {
    editButtonTitle = "Exit edit mode";
  }
  const editButtonLabel = isEditMode ? "Editing Changes" : "Submit Changes";
  const {
    stateOptions,
    typeOptions,
    traderOptions,
    mapOptions,
    defaultStateValues,
    defaultTypeValues,
    defaultTraderValues,
    defaultMapValues,
    stateValue,
    typeValue,
    traderValue,
    mapValue,
    setStateValue,
    setTypeValue,
    setTraderValue,
    setMapValue,
  } = useQuestFilters();
  const { quests, sendProgressionUpdate } = useQuestList();
  const { searchTerm, setSearchTerm, searchResults } = useQuestSearch(quests);

  const filteredQuests = useMemo(() => {
    return filterQuests(quests, {
      stateValue,
      typeValue,
      traderValue,
      mapValue,
    });
  }, [quests, stateValue, typeValue, traderValue, mapValue]);

  const visibleQuests = useMemo(() => {
    const baseList = searchResults.length > 0 ? searchResults : filteredQuests;
    let next = [...baseList];
    if (forcedQuestId) {
      const targetQuest = quests.find((quest) => quest.id === forcedQuestId);
      if (targetQuest && !next.some((quest) => quest.id === forcedQuestId)) {
        next = [targetQuest, ...next];
      }
    }
    return orderQuests(next, orderByTrader, orderByQuestName);
  }, [
    searchResults,
    filteredQuests,
    orderByTrader,
    orderByQuestName,
    forcedQuestId,
    quests,
  ]);
  const deferredVisibleQuests = useDeferredValue(visibleQuests);
  const isFiltering = deferredVisibleQuests !== visibleQuests;

  // O(1) lookup map for quest edits
  const questEditsMap = useMemo(() => {
    const map = new Map<string, QuestEditEntry>();
    for (const entry of questEdits) {
      map.set(entry.quest.id, entry);
    }
    return map;
  }, [questEdits]);

  // Stable set for removed quest lookups
  const removedQuestSet = useMemo(() => new Set(removedQuestIds), [removedQuestIds]);

  const toggleQuest = useCallback((questId: string) => {
    setOpenQuestIds((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) {
        next.delete(questId);
      } else {
        next.add(questId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (navigationTarget?.pageId !== "quests" || !navigationTarget.questId) {
      return;
    }
    const questId = navigationTarget.questId;
    setForcedQuestId(questId);
    setOpenQuestIds((prev) => {
      const next = new Set(prev);
      next.add(questId);
      return next;
    });
  }, [navigationTarget]);

  useEffect(() => {
    if (!forcedQuestId || isFiltering) {
      return;
    }
    let attempts = 0;
    const maxAttempts = 10;
    const tryScroll = () => {
      const element = document.getElementById(`quest-card-${forcedQuestId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        onNavigationHandled?.();
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        globalThis.requestAnimationFrame(tryScroll);
      }
    };
    const handle = globalThis.requestAnimationFrame(tryScroll);
    return () => globalThis.cancelAnimationFrame(handle);
  }, [forcedQuestId, onNavigationHandled, isFiltering, deferredVisibleQuests]);

  /** Get the effective quest: if an edit exists, use the edited version. */
  const getEffectiveQuest = useCallback(
    (original: Quest): Quest => {
      if (!isEditMode) return original;
      return questEditsMap.get(original.id)?.quest ?? original;
    },
    [isEditMode, questEditsMap],
  );

  return (
    <div className="desktop-quests-container">
        <section className="desktop-quests">
            <header className="desktop-quests-header">
                <div className="desktop-quests-header-left">
                    <div className="desktop-quests-title">
                        <img
                            className="desktop-quests-title-logo"
                            src="../img/side-nav-quest-icon.png"
                            alt=""
                        />
                        <span className="desktop-quests-title-text">Quests</span>
                    </div>
                </div>
                <div className="desktop-quests-header-right">
                    <input
                        className="desktop-quests-search"
                        type="search"
                        placeholder="Search quests..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        onInput={(event) => setSearchTerm((event.target as HTMLInputElement).value)}
                    />
                    {isAvailable && canEdit && (
                        <button
                            type="button"
                            className={`desktop-quests-order-button desktop-quests-edit-toggle${
                              isEditMode ? " is-active" : ""
                            }`}
                            onClick={toggleEditMode}
                            title={editButtonTitle}
                        >
                            {editButtonLabel}
                        </button>
                    )}
                </div>
            </header>
            <div className="desktop-quests-filters">
                <QuestFilters
                stateOptions={stateOptions}
                typeOptions={typeOptions}
                traderOptions={traderOptions}
                mapOptions={mapOptions}
                initialStateValues={defaultStateValues}
                initialTypeValues={defaultTypeValues}
                initialTraderValues={defaultTraderValues}
                initialMapValues={defaultMapValues}
                stateValue={stateValue}
                typeValue={typeValue}
                traderValue={traderValue}
                mapValue={mapValue}
                onStateChange={setStateValue}
                onTypeChange={setTypeValue}
                onTraderChange={setTraderValue}
                onMapChange={setMapValue}
                />
                <div className="desktop-quests-order">
                <button
                    type="button"
                    className={`desktop-quests-order-button${
                    orderByTrader ? " is-active" : ""
                    }`}
                    onClick={() => setOrderByTrader((prev) => !prev)}
                >
                    Order By Trader
                </button>
                <button
                    type="button"
                    className={`desktop-quests-order-button${
                    orderByQuestName ? " is-active" : ""
                    }`}
                    onClick={() => setOrderByQuestName((prev) => !prev)}
                >
                    Order By Quest Name
                </button>
                </div>
            </div>

            <div className="quests-content">
              {isFiltering && (
                <div className="quests-loading-overlay">
                  <div className="quests-loading-spinner" aria-hidden="true" />
                  <div className="quests-loading-text">Loading quests...</div>
                </div>
              )}
              {deferredVisibleQuests.length === 0 ? (
                  <div className="active-quests-empty">No quests match the current filters.</div>
              ) : (
                  <div className="active-quests-page scroll-div">
                  {deferredVisibleQuests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={getEffectiveQuest(quest)}
                      isOpen={openQuestIds.has(quest.id)}
                      isEditMode={isEditMode}
                      isRemoved={isEditMode && removedQuestSet.has(quest.id)}
                      isCompleted={ProgressionStateService.isQuestCompleted(quest.id)}
                      toggleQuest={toggleQuest}
                      sendProgressionUpdate={sendProgressionUpdate}
                      upsertQuest={upsertQuest}
                      addRemovedQuest={addRemovedQuest}
                      cancelRemovedQuest={cancelRemovedQuest}
                    />
                  ))}
                  </div>
              )}
            </div>
        </section>
    </div>
  );
};
