import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { QuestFilters } from "../../components/quests/filters/QuestFilters";
import { QuestHeader } from "../../components/quests/QuestHeader";
import { QuestBody } from "../../components/quests/QuestBody";
import {
  QuestEditBody,
  type EditRewardItem,
  type EditTaskRequirement,
  type EditTraderStandingReward,
  type UpsertObjectiveMetaPayload,
} from "../../components/quests/QuestEditBody";
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
import { QuestImpl, type Quest } from "../../../model/quest/IQuestsElements";
import { QuestObjective } from "../../../model/quest/IQuestsElements";
import type { ProgressionUpdateOp } from "../../services/ProgressionUpdatesService";
import { QuestType } from "../../../escape-from-tarkov/constant/QuestConst";
import { TraderList } from "../../../escape-from-tarkov/constant/TraderConst";
import { PageHeader } from "../../components/PageHeader";

// ---------------------------------------------------------------------------
// QuestCard — extracted + memoized so only the changed card re-renders
// ---------------------------------------------------------------------------

type QuestCardProps = {
  /** The effective quest (edits already applied if they exist). */
  quest: Quest;
  leadsToRequirements: EditTaskRequirement[];
  linkQuestOptions: Quest[];
  isOpen: boolean;
  isEditMode: boolean;
  isRemoved: boolean;
  isNewQuest: boolean;
  isCompleted: boolean;
  toggleQuest: (questId: string) => void;
  sendProgressionUpdate: (payload: ProgressionUpdateOp) => void;
  upsertQuest: (quest: Quest) => void;
  getQuestById: (questId: string) => Quest | undefined;
  addRemovedQuest: (questId: string) => void;
  removeQuestEntry: (questId: string) => void;
  cancelRemovedQuest: (questId: string) => void;
  onNavigateToQuest: (questId: string) => void;
};

const EMPTY_LEADS_TO_REQUIREMENTS: EditTaskRequirement[] = [];
const EMPTY_LINK_QUEST_OPTIONS: Quest[] = [];

const QuestCard = React.memo<QuestCardProps>(({
  quest,
  leadsToRequirements,
  linkQuestOptions,
  isOpen,
  isEditMode,
  isRemoved,
  isNewQuest,
  isCompleted,
  toggleQuest,
  sendProgressionUpdate,
  upsertQuest,
  getQuestById,
  addRemovedQuest,
  removeQuestEntry,
  cancelRemovedQuest,
  onNavigateToQuest,
}) => {
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
    () => {
      if (isNewQuest) {
        removeQuestEntry(quest.id);
        return;
      }
      addRemovedQuest(quest.id);
    },
    [addRemovedQuest, isNewQuest, quest.id, removeQuestEntry],
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

  const onQuestTypeChange = useCallback(
    (questType: string) => {
      const modified = structuredClone(quest);
      modified.questType = questType;
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

  const onTraderStandingRewardChange = useCallback(
    (rewards: EditTraderStandingReward[]) => {
      const modified = structuredClone(quest);
      if (!modified.finishRewards) {
        modified.finishRewards = { traderStanding: [], items: [], offerUnlock: [], skillLevelReward: [], traderUnlock: [] };
      }
      modified.finishRewards.traderStanding = rewards.map((reward) => ({
        trader: { id: reward.traderId, name: reward.traderName, __typename: 'Trader' as const },
        standing: reward.standing,
        __typename: 'TaskRewardTraderStanding' as const,
      }));
      upsertQuest(modified);
    },
    [quest, upsertQuest],
  );

  const onAddLeadsToRequirement = useCallback(
    (targetQuestId: string, status: string) => {
      if (!targetQuestId || targetQuestId === quest.id) return;
      const targetQuest = getQuestById(targetQuestId);
      if (!targetQuest) return;

      const modifiedTarget = structuredClone(targetQuest);
      const nextTaskRequirements = [...(modifiedTarget.taskRequirements ?? [])];
      const alreadyLinked = nextTaskRequirements.some((req) => {
        const reqStatus = req.status?.[0] ?? "complete";
        return req.task.id === quest.id && reqStatus === status;
      });
      if (alreadyLinked) return;

      nextTaskRequirements.push({
        task: { id: quest.id },
        status: [status],
      });
      modifiedTarget.taskRequirements = nextTaskRequirements;
      upsertQuest(modifiedTarget);
    },
    [getQuestById, quest.id, upsertQuest],
  );

  const onRemoveLeadsToRequirement = useCallback(
    (targetQuestId: string, status: string) => {
      const targetQuest = getQuestById(targetQuestId);
      if (!targetQuest) return;

      const modifiedTarget = structuredClone(targetQuest);
      modifiedTarget.taskRequirements = (modifiedTarget.taskRequirements ?? []).filter((req) => {
        const reqStatus = req.status?.[0] ?? "complete";
        return !(req.task.id === quest.id && reqStatus === status);
      });
      upsertQuest(modifiedTarget);
    },
    [getQuestById, quest.id, upsertQuest],
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
                onQuestTypeChange={onQuestTypeChange}
                onTaskRequirementsChange={onTaskRequirementsChange}
                leadsToRequirements={leadsToRequirements}
                linkQuestOptions={linkQuestOptions}
                onAddLeadsToRequirement={onAddLeadsToRequirement}
                onRemoveLeadsToRequirement={onRemoveLeadsToRequirement}
                onObjectiveMetaChange={onObjectiveMetaChange}
                onAddObjective={onAddObjective}
                onRemoveObjective={onRemoveObjective}
                onReorderObjectives={onReorderObjectives}
                onRewardChange={onRewardChange}
                onTraderStandingRewardChange={onTraderStandingRewardChange}
                onNavigateToQuest={onNavigateToQuest}
              />
            ) : (
              <QuestBody
                quest={quest}
                onQuestCompletedChange={onQuestCompletedChange}
                onObjectiveChange={onObjectiveChange}
                onNavigateToQuest={onNavigateToQuest}
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
  const [openQuestIds, setOpenQuestIds] = useState<Set<string>>(new Set());
  const [forcedQuestId, setForcedQuestId] = useState<string | null>(null);
  const [progressionVersion, setProgressionVersion] = useState(0);
  const [isProgressionStylingUpdate, setIsProgressionStylingUpdate] = useState(false);
  const { isEditMode, canEdit, isAvailable, toggleEditMode } = useOptionalEditModeContext();
  const {
    questEdits,
    removedQuestIds,
    upsertQuest,
    removeQuestEntry,
    addRemovedQuest,
    cancelRemovedQuest,
    clearQuestEdits,
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
  const { quests, refreshQuestList, sendProgressionUpdate } = useQuestList();

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.questId) {
        return;
      }
      if (
        detail.type === "objective" ||
        detail.type === "active-state" ||
        detail.type === "completed"
      ) {
        return;
      }
      setProgressionVersion((prev) => prev + 1);
      setIsProgressionStylingUpdate(true);
    };
    globalThis.addEventListener("quest-progress-updated", handler);
    return () => globalThis.removeEventListener("quest-progress-updated", handler);
  }, []);

  useEffect(() => {
    if (!isProgressionStylingUpdate) {
      return;
    }
    const handle = globalThis.requestAnimationFrame(() => {
      setIsProgressionStylingUpdate(false);
    });
    return () => globalThis.cancelAnimationFrame(handle);
  }, [isProgressionStylingUpdate]);

  const editableQuests = useMemo(() => {
    if (!isEditMode) {
      return quests;
    }

    const editedById = new Map<string, QuestEditEntry>();
    for (const entry of questEdits) {
      editedById.set(entry.quest.id, entry);
    }

    const merged = quests.map((quest) => editedById.get(quest.id)?.quest ?? quest);

    const newQuests = questEdits
      .filter((entry) => entry.isNew && !merged.some((q) => q.id === entry.quest.id))
      .map((entry) => entry.quest);

    return [...merged, ...newQuests];
  }, [isEditMode, questEdits, quests]);

  const { searchTerm, setSearchTerm, searchResults } = useQuestSearch(editableQuests);

  const filteredQuests = useMemo(() => {
    return filterQuests(editableQuests, {
      stateValue,
      typeValue,
      traderValue,
      mapValue,
    });
  }, [editableQuests, stateValue, typeValue, traderValue, mapValue, progressionVersion]);

  const visibleQuests = useMemo(() => {
    const baseList = searchResults.length > 0 ? searchResults : filteredQuests;
    let next = [...baseList];
    if (forcedQuestId) {
      const targetQuest = editableQuests.find((quest) => quest.id === forcedQuestId);
      if (targetQuest && !next.some((quest) => quest.id === forcedQuestId)) {
        next = [targetQuest, ...next];
      }
    }
    return orderQuests(next, true);
  }, [
    searchResults,
    filteredQuests,
    forcedQuestId,
    editableQuests,
    progressionVersion,
  ]);
  const deferredVisibleQuests = useDeferredValue(visibleQuests);
  // In edit mode, render the current list immediately so field edits do not
  // show the global loading overlay and feel like a full-page refresh.
  // Progression updates (active/completed/objectives) should apply styling
  // immediately without showing a page-level "loading" transition.
  const renderedVisibleQuests =
    isEditMode || isProgressionStylingUpdate ? visibleQuests : deferredVisibleQuests;
  const isFiltering =
    !isEditMode && !isProgressionStylingUpdate && deferredVisibleQuests !== visibleQuests;
  const editableQuestsMap = useMemo(() => {
    const map = new Map<string, Quest>();
    for (const quest of editableQuests) {
      map.set(quest.id, quest);
    }
    return map;
  }, [editableQuests]);
  const editableQuestsMapRef = useRef(editableQuestsMap);
  useEffect(() => {
    editableQuestsMapRef.current = editableQuestsMap;
  }, [editableQuestsMap]);

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

  // Clear pending quest edits when edit mode is turned off.
  const prevEditModeRef = useRef(isEditMode);
  useEffect(() => {
    if (prevEditModeRef.current && !isEditMode) {
      clearQuestEdits();
    }
    prevEditModeRef.current = isEditMode;
  }, [isEditMode, clearQuestEdits]);

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
        setForcedQuestId(null);
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
  }, [forcedQuestId, onNavigationHandled, isFiltering, renderedVisibleQuests]);

  const handleAddQuest = useCallback(() => {
    const newQuest = new QuestImpl();
    const localizedDefaultName = "New Quest";
    const defaultTrader = TraderList[0];

    newQuest.name = localizedDefaultName;
    newQuest.locales = {
      [I18nHelper.currentLocale()]: localizedDefaultName,
    };
    newQuest.normalizedName = localizedDefaultName.toLowerCase();
    newQuest.questType = QuestType.PRIORITY;
    newQuest.active = false;
    newQuest.completed = false;
    newQuest.trader = {
      id: defaultTrader.id,
      name: defaultTrader.name,
      normalizedName: defaultTrader.normalizedName,
    };
    newQuest.factionName = "Any";
    newQuest.objectives = [];

    upsertQuest(newQuest, true);
    setOpenQuestIds((prev) => {
      const next = new Set(prev);
      next.add(newQuest.id);
      return next;
    });
    setForcedQuestId(newQuest.id);
  }, [upsertQuest]);

  const isNewQuest = useCallback(
    (questId: string): boolean => {
      return questEditsMap.get(questId)?.isNew ?? false;
    },
    [questEditsMap],
  );

  const getQuestById = useCallback(
    (questId: string): Quest | undefined => editableQuestsMapRef.current.get(questId),
    [],
  );

  const getLeadsToRequirements = useCallback(
    (sourceQuestId: string): EditTaskRequirement[] => {
      const list: EditTaskRequirement[] = [];
      for (const targetQuest of editableQuests) {
        if (targetQuest.id === sourceQuestId) continue;
        for (const requirement of targetQuest.taskRequirements ?? []) {
          if (requirement.task.id !== sourceQuestId) continue;
          const status = requirement.status?.[0] ?? "complete";
          const targetName =
            targetQuest.locales?.[I18nHelper.currentLocale()] ??
            targetQuest.name ??
            targetQuest.id;
          list.push({
            questId: targetQuest.id,
            questName: targetName,
            status,
          });
        }
      }
      return list;
    },
    [editableQuests],
  );

  const handleNavigateToQuest = useCallback(
    (questId: string) => {
      if (!questId) return;
      setSearchTerm('');
      setStateValue([]);
      setTypeValue([]);
      setTraderValue([]);
      setMapValue([]);
      setForcedQuestId(questId);
      setOpenQuestIds((prev) => {
        const next = new Set(prev);
        next.add(questId);
        return next;
      });
    },
    [
      setMapValue,
      setSearchTerm,
      setStateValue,
      setTraderValue,
      setTypeValue,
    ],
  );

  const handleClearFilters = useCallback(() => {
    setStateValue([]);
    setTypeValue([]);
    setTraderValue([]);
    setMapValue([]);
  }, [setMapValue, setStateValue, setTraderValue, setTypeValue]);

  const handleRefreshPage = useCallback(() => {
    refreshQuestList();
    setProgressionVersion((prev) => prev + 1);
  }, [refreshQuestList]);

  return (
    <div className="desktop-quests-container">
        <section className="desktop-quests">
            <PageHeader
              className="desktop-quests-header"
              title="Contracts"
              iconSrc="../img/pages/contract.png"
              actions={
                <div className="desktop-quests-header-right">
                  <input
                    className="desktop-quests-search"
                    type="search"
                    placeholder="Search quests..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    onInput={(event) => setSearchTerm((event.target as HTMLInputElement).value)}
                  />
                  <button
                    type="button"
                    className="desktop-quests-order-button desktop-quests-clear-filters-button"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                  {isAvailable && canEdit && isEditMode && (
                    <button
                      type="button"
                      className="desktop-quests-order-button desktop-quests-edit-toggle"
                      onClick={handleAddQuest}
                      title="Add a new quest"
                    >
                      Add Quest
                    </button>
                  )}
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
              }
            />
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
                <button
                  type="button"
                  className="desktop-quests-order-button desktop-quests-refresh-button"
                  onClick={handleRefreshPage}
                  title="Refresh quests"
                  aria-label="Refresh quests"
                >
                  <img
                    className="desktop-quests-refresh-icon"
                    src="/img/icons/replay.svg"
                    alt=""
                  />
                </button>
            </div>

            <div className="quests-content">
              {isFiltering && (
                <div className="quests-loading-overlay">
                  <div className="quests-loading-spinner" aria-hidden="true" />
                  <div className="quests-loading-text">Loading quests...</div>
                </div>
              )}
              {renderedVisibleQuests.length === 0 ? (
                  <div className="active-quests-empty">No quests match the current filters.</div>
              ) : (
                  <div className="active-quests-page scroll-div">
                  {renderedVisibleQuests.map((quest) => (
                    (() => {
                      const isOpen = openQuestIds.has(quest.id);
                      const isCardEditMode = isEditMode;
                      const leadsToRequirements = isCardEditMode && isOpen
                        ? getLeadsToRequirements(quest.id)
                        : EMPTY_LEADS_TO_REQUIREMENTS;
                      const linkQuestOptions = isCardEditMode && isOpen
                        ? editableQuests
                        : EMPTY_LINK_QUEST_OPTIONS;
                      return (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      leadsToRequirements={leadsToRequirements}
                      linkQuestOptions={linkQuestOptions}
                      isOpen={isOpen}
                      isEditMode={isCardEditMode}
                      isRemoved={isEditMode && removedQuestSet.has(quest.id)}
                      isNewQuest={isEditMode && isNewQuest(quest.id)}
                      isCompleted={ProgressionStateService.isQuestCompleted(quest.id)}
                      toggleQuest={toggleQuest}
                      sendProgressionUpdate={sendProgressionUpdate}
                      upsertQuest={upsertQuest}
                      getQuestById={getQuestById}
                      addRemovedQuest={addRemovedQuest}
                      removeQuestEntry={removeQuestEntry}
                      cancelRemovedQuest={cancelRemovedQuest}
                      onNavigateToQuest={handleNavigateToQuest}
                    />
                      );
                    })()
                  ))}
                  </div>
              )}
            </div>
        </section>
    </div>
  );
};
