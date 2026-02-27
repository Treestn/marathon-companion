import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Quest, QuestImage } from '../../../model/quest/IQuestsElements';
import { I18nHelper } from '../../../locale/I18nHelper';
import { ItemsElementUtils } from '../../../escape-from-tarkov/utils/ItemsElementUtils';
import { FullscreenImageViewer } from '../../pages/map/components/FullscreenImageViewer';
import { ObjectiveTypeConst, ObjectiveTypeList } from '../../../escape-from-tarkov/constant/EditQuestConst';
import { MapAdapter } from '../../../adapter/MapAdapter';
import { MapsList } from '../../../escape-from-tarkov/constant/MapsConst';
import { QuestDataStore } from '../../services/QuestDataStore';

// ---------------------------------------------------------------------------
// UI-friendly types used by callbacks (not submission-specific)
// ---------------------------------------------------------------------------

export type EditTaskRequirement = {
  questId: string;
  questName: string;
  status: string;
};

export type EditRewardItem = {
  itemId: string;
  itemName: string;
  count: number;
};

export type UpsertObjectiveMetaPayload = {
  questId: string;
  questName: string;
  objectiveId: string;
  type?: string;
  description?: string;
  maps?: { id: string; name: string }[];
  itemId?: string;
  itemName?: string;
  neededKeys?: { mapId: string; keyIds: string[] }[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_LEVEL = 1;
const MAX_LEVEL = 79;

const UNLOCK_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'complete', label: 'Complete' },
  { value: 'active', label: 'Accept' },
  { value: 'failed', label: 'Fail' },
];

const OBJECTIVE_TYPE_OPTIONS = ObjectiveTypeList.map((ot) => ({
  value: ot.type,
  label: ot.text,
}));

const MAP_OPTIONS = MapsList.map((m) => ({
  id: m.id,
  name: m.name,
}));

/** Objective types that only allow a single map selection */
const SINGLE_MAP_TYPES = new Set([
    ObjectiveTypeConst.MARK.type,
    ObjectiveTypeConst.PLANT_ITEM.type,
    ObjectiveTypeConst.PLANT_QUEST_ITEM.type,
    ObjectiveTypeConst.FIND_QUEST_ITEM.type,
    ObjectiveTypeConst.EXTRACT.type,
  ]);

/** Objective types that require an item selection */
const ITEM_OBJECTIVE_TYPES = new Set([
  ObjectiveTypeConst.PLANT_ITEM.type,
  ObjectiveTypeConst.FIND_ITEM.type,
  ObjectiveTypeConst.GIVE_ITEM.type,
  ObjectiveTypeConst.USE_ITEM.type,
  ObjectiveTypeConst.SELL_ITEM.type,
]);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type QuestEditBodyProps = {
  /** The effective quest — if the user has made edits, this already contains them. */
  quest: Quest;
  onLevelChange?: (level: number | null) => void;
  onTaskRequirementsChange?: (requirements: EditTaskRequirement[]) => void;
  leadsToRequirements?: EditTaskRequirement[];
  linkQuestOptions?: Quest[];
  onAddLeadsToRequirement?: (targetQuestId: string, status: string) => void;
  onRemoveLeadsToRequirement?: (targetQuestId: string, status: string) => void;
  onObjectiveMetaChange?: (payload: UpsertObjectiveMetaPayload) => void;
  onAddObjective?: (questId: string, questName: string) => string;
  onRemoveObjective?: (questId: string, questName: string, objectiveId: string) => void;
  onReorderObjectives?: (questId: string, questName: string, objectiveOrder: string[]) => void;
  onRewardChange?: (rewards: EditRewardItem[]) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QuestEditBody = React.memo<QuestEditBodyProps>(({
  quest,
  onLevelChange,
  onTaskRequirementsChange,
  leadsToRequirements = [],
  linkQuestOptions = [],
  onAddLeadsToRequirement,
  onRemoveLeadsToRequirement,
  onObjectiveMetaChange,
  onAddObjective,
  onRemoveObjective,
  onReorderObjectives,
  onRewardChange,
}) => {
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [viewerTitle, setViewerTitle] = useState<string>('Quest images');

  const questName =
    quest.locales?.[I18nHelper.currentLocale()]
    ?? quest.name
    ?? 'Quest';

  // -------------------------------------------------------------------------
  // Level input state
  // -------------------------------------------------------------------------

  const resolvedLevel = quest.minPlayerLevel ?? null;

  const [levelInput, setLevelInput] = useState<string>(
    resolvedLevel == null ? '' : String(resolvedLevel),
  );
  const [levelError, setLevelError] = useState<string | null>(null);

  useEffect(() => {
    const level = quest.minPlayerLevel ?? null;
    setLevelInput(level == null ? '' : String(level));
    setLevelError(null);
  }, [quest.id, quest.minPlayerLevel]);

  const handleLevelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setLevelInput(raw);

      if (raw.trim() === '') {
        setLevelError(null);
        onLevelChange?.(null);
        return;
      }

      const parsed = Number(raw);
      if (!Number.isInteger(parsed)) {
        setLevelError('Level must be a whole number');
        return;
      }
      if (parsed < MIN_LEVEL || parsed > MAX_LEVEL) {
        setLevelError(`Level must be between ${MIN_LEVEL} and ${MAX_LEVEL}`);
        return;
      }

      setLevelError(null);
      onLevelChange?.(parsed);
    },
    [onLevelChange],
  );

  // -------------------------------------------------------------------------
  // Other requirements (read-only display)
  // -------------------------------------------------------------------------

  const otherRequirements = useMemo(() => {
    const list: string[] = [];
    if (quest.unlockHoursDelay) {
      list.push(`Delay ~${quest.unlockHoursDelay} hours`);
    }
    if (quest.progressionType) {
      list.push(`Type ${quest.progressionType}`);
    }
    if (quest.factionName && quest.factionName !== 'Any') {
      list.push(`Faction ${quest.factionName}`);
    }
    if (quest.gameEdition) {
      list.push(`Edition ${quest.gameEdition}`);
    }
    return list;
  }, [quest]);

  // -------------------------------------------------------------------------
  // Unlocked-by (task requirements)
  // -------------------------------------------------------------------------

  const currentTaskRequirements: EditTaskRequirement[] = useMemo(() => {
    if (!quest.taskRequirements || quest.taskRequirements.length === 0) {
      return [];
    }
    return quest.taskRequirements.map((req) => {
      const questData = QuestDataStore.getQuestById(req.task.id);
      const name = questData
        ? (questData.locales?.[I18nHelper.currentLocale()] ?? questData.name)
        : req.task.id;
      const status = req.status?.[0] ?? 'complete';
      return { questId: req.task.id, questName: name, status };
    });
  }, [quest.taskRequirements]);

  const handleRemoveRequirement = useCallback(
    (index: number) => {
      const next = [...currentTaskRequirements];
      next.splice(index, 1);
      onTaskRequirementsChange?.(next);
    },
    [currentTaskRequirements, onTaskRequirementsChange],
  );

  const [newReqStatus, setNewReqStatus] = useState('complete');
  const [newReqQuestQuery, setNewReqQuestQuery] = useState('');
  const [newReqQuestId, setNewReqQuestId] = useState<string | null>(null);
  const [newReqQuestName, setNewReqQuestName] = useState('');
  const [isQuestDropdownOpen, setIsQuestDropdownOpen] = useState(false);

  const questSearchResults = useMemo(() => {
    if (!newReqQuestQuery.trim()) return [];
    const query = newReqQuestQuery.toLowerCase();
    const allQuests = QuestDataStore.getStoredQuestList();
    return allQuests
      .filter((q) => {
        const name = q.locales?.[I18nHelper.currentLocale()] ?? q.name ?? '';
        return name.toLowerCase().includes(query);
      })
      .slice(0, 20);
  }, [newReqQuestQuery]);

  const handleSelectNewReqQuest = useCallback((q: Quest) => {
    const name = q.locales?.[I18nHelper.currentLocale()] ?? q.name;
    setNewReqQuestId(q.id);
    setNewReqQuestName(name);
    setNewReqQuestQuery(name);
    setIsQuestDropdownOpen(false);
  }, []);

  const handleAddRequirement = useCallback(() => {
    if (!newReqQuestId) return;
    const next = [
      ...currentTaskRequirements,
      { questId: newReqQuestId, questName: newReqQuestName, status: newReqStatus },
    ];
    onTaskRequirementsChange?.(next);
    setNewReqStatus('complete');
    setNewReqQuestQuery('');
    setNewReqQuestId(null);
    setNewReqQuestName('');
  }, [currentTaskRequirements, newReqQuestId, newReqQuestName, newReqStatus, onTaskRequirementsChange]);

  // -------------------------------------------------------------------------
  // Leads-to (cross-quest task requirement editor)
  // -------------------------------------------------------------------------

  const [newLeadStatus, setNewLeadStatus] = useState('complete');
  const [newLeadQuestQuery, setNewLeadQuestQuery] = useState('');
  const [newLeadQuestId, setNewLeadQuestId] = useState<string | null>(null);
  const [newLeadQuestName, setNewLeadQuestName] = useState('');
  const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);

  const leadQuestSearchResults = useMemo(() => {
    const source = linkQuestOptions.length > 0
      ? linkQuestOptions
      : QuestDataStore.getStoredQuestList();
    if (!newLeadQuestQuery.trim()) return [];
    const query = newLeadQuestQuery.toLowerCase();
    return source
      .filter((q) => {
        if (q.id === quest.id) return false;
        const name = q.locales?.[I18nHelper.currentLocale()] ?? q.name ?? '';
        return name.toLowerCase().includes(query);
      })
      .slice(0, 20);
  }, [linkQuestOptions, newLeadQuestQuery, quest.id]);

  const handleSelectNewLeadQuest = useCallback((q: Quest) => {
    const name = q.locales?.[I18nHelper.currentLocale()] ?? q.name;
    setNewLeadQuestId(q.id);
    setNewLeadQuestName(name);
    setNewLeadQuestQuery(name);
    setIsLeadDropdownOpen(false);
  }, []);

  const handleAddLeadRequirement = useCallback(() => {
    if (!newLeadQuestId) return;
    onAddLeadsToRequirement?.(newLeadQuestId, newLeadStatus);
    setNewLeadStatus('complete');
    setNewLeadQuestQuery('');
    setNewLeadQuestId(null);
    setNewLeadQuestName('');
  }, [newLeadQuestId, newLeadStatus, onAddLeadsToRequirement]);

  // -------------------------------------------------------------------------
  // Objectives – editable data (filtered + ordered)
  // -------------------------------------------------------------------------

  const editableObjectives = useMemo(() => {
    return quest.objectives.map((objective) => {
      const description =
        objective.locales?.[I18nHelper.currentLocale()] ?? objective.description ?? '';
      const type = objective.type ?? '';
      const maps: { id: string; name: string }[] = (objective.maps || [])
        .filter((m) => m?.id && m?.name)
        .map((m) => ({ id: m.id, name: m.name }));

      const images: string[] = [];
      objective.questImages?.forEach((img: QuestImage) => {
        if (img.paths && img.paths.length > 0) {
          images.push(...img.paths);
        }
      });

      const itemId = (objective.item as { id?: string })?.id ?? '';
      const itemName = itemId
        ? (ItemsElementUtils.getItemName(itemId) ?? itemId)
        : '';
      const neededKeys = (objective.neededKeys ?? [])
        .filter((entry) => entry?.map?.id)
        .map((entry) => ({
          mapId: entry.map.id,
          keyIds: (entry.keys ?? [])
            .map((key) => key?.id)
            .filter((keyId): keyId is string => Boolean(keyId)),
        }))
        .filter((entry) => entry.keyIds.length > 0);

      // Objectives whose ID starts with "new-" were added during this edit session
      const isNew = objective.id.startsWith('new-');

      return {
        id: objective.id,
        type,
        description,
        maps,
        images,
        isNew,
        itemId,
        itemName,
        neededKeys,
      };
    });
  }, [quest.objectives]);

  const handleObjectiveTypeChange = useCallback(
    (objectiveId: string, newType: string) => {
      // If switching to a single-map type and objective has multiple maps, trim to the first
      const objective = editableObjectives.find((o) => o.id === objectiveId);
      const needsTrim = SINGLE_MAP_TYPES.has(newType) && objective && objective.maps.length > 1;

      // If switching away from an item type, clear the item selection
      const wasItemType = objective ? ITEM_OBJECTIVE_TYPES.has(objective.type) : false;
      const isNowItemType = ITEM_OBJECTIVE_TYPES.has(newType);
      const needsClearItem = wasItemType && !isNowItemType;

      onObjectiveMetaChange?.({
        questId: quest.id,
        questName,
        objectiveId,
        type: newType,
        ...(needsTrim ? { maps: [objective.maps[0]] } : {}),
        ...(needsClearItem ? { itemId: '', itemName: '' } : {}),
      });
    },
    [quest.id, questName, editableObjectives, onObjectiveMetaChange],
  );

  const handleObjectiveDescriptionChange = useCallback(
    (objectiveId: string, newDescription: string) => {
      onObjectiveMetaChange?.({
        questId: quest.id,
        questName,
        objectiveId,
        description: newDescription,
      });
    },
    [quest.id, questName, onObjectiveMetaChange],
  );

  const handleObjectiveMapToggle = useCallback(
    (objectiveId: string, objectiveType: string, currentMaps: { id: string; name: string }[], mapId: string, mapName: string) => {
      const exists = currentMaps.some((m) => m.id === mapId);
      const isSingleMap = SINGLE_MAP_TYPES.has(objectiveType);

      let nextMaps: { id: string; name: string }[];
      if (exists) {
        nextMaps = currentMaps.filter((m) => m.id !== mapId);
      } else if (isSingleMap) {
        // Single-map types: replace any existing selection
        nextMaps = [{ id: mapId, name: mapName }];
      } else {
        nextMaps = [...currentMaps, { id: mapId, name: mapName }];
      }

      onObjectiveMetaChange?.({
        questId: quest.id,
        questName,
        objectiveId,
        maps: nextMaps,
      });
    },
    [quest.id, questName, onObjectiveMetaChange],
  );

  const handleObjectiveItemChange = useCallback(
    (objectiveId: string, itemId: string, itemName: string) => {
      onObjectiveMetaChange?.({
        questId: quest.id,
        questName,
        objectiveId,
        itemId,
        itemName,
      });
    },
    [quest.id, questName, onObjectiveMetaChange],
  );

  const handleObjectiveNeededKeysChange = useCallback(
    (objectiveId: string, neededKeys: { mapId: string; keyIds: string[] }[]) => {
      onObjectiveMetaChange?.({
        questId: quest.id,
        questName,
        objectiveId,
        neededKeys,
      });
    },
    [quest.id, questName, onObjectiveMetaChange],
  );

  const handleDeleteObjective = useCallback(
    (objectiveId: string) => {
      onRemoveObjective?.(quest.id, questName, objectiveId);
    },
    [quest.id, questName, onRemoveObjective],
  );

  const handleMoveObjective = useCallback(
    (objectiveId: string, direction: 'up' | 'down') => {
      const ids = editableObjectives.map((o) => o.id);
      const idx = ids.indexOf(objectiveId);
      if (idx < 0) return;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= ids.length) return;

      // Swap
      const reordered = [...ids];
      reordered[idx] = ids[targetIdx];
      reordered[targetIdx] = ids[idx];

      onReorderObjectives?.(quest.id, questName, reordered);
    },
    [quest.id, questName, editableObjectives, onReorderObjectives],
  );

  const handleAddObjective = useCallback(() => {
    onAddObjective?.(quest.id, questName);
  }, [quest.id, questName, onAddObjective]);

  // -------------------------------------------------------------------------
  // Editable rewards
  // -------------------------------------------------------------------------

  const editableRewards = useMemo<EditRewardItem[]>(() => {
    return (quest.finishRewards?.items ?? []).map((reward) => {
      const itemId = reward.item?.id ?? '';
      const itemName = ItemsElementUtils.getItemName(itemId) ?? itemId;
      return { itemId, itemName, count: reward.count ?? 1 };
    });
  }, [quest.finishRewards]);

  const handleRewardItemChange = useCallback(
    (index: number, itemId: string, itemName: string) => {
      const next = [...editableRewards];
      next[index] = { ...next[index], itemId, itemName };
      onRewardChange?.(next);
    },
    [editableRewards, onRewardChange],
  );

  const handleRewardCountChange = useCallback(
    (index: number, count: number) => {
      const next = [...editableRewards];
      next[index] = { ...next[index], count };
      onRewardChange?.(next);
    },
    [editableRewards, onRewardChange],
  );

  const handleRewardRemove = useCallback(
    (index: number) => {
      const next = editableRewards.filter((_, i) => i !== index);
      onRewardChange?.(next);
    },
    [editableRewards, onRewardChange],
  );

  const handleRewardMove = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const next = [...editableRewards];
      const swapIdx = direction === 'up' ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return;
      [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
      onRewardChange?.(next);
    },
    [editableRewards, onRewardChange],
  );

  const handleRewardAdd = useCallback(() => {
    const next = [...editableRewards, { itemId: '', itemName: '', count: 1 }];
    onRewardChange?.(next);
  }, [editableRewards, onRewardChange]);

  // -------------------------------------------------------------------------
  // Image viewer
  // -------------------------------------------------------------------------

  const openViewer = (images: string[], title: string) => {
    if (!images.length) return;
    setViewerImages(images);
    setViewerIndex(0);
    setViewerTitle(title);
  };

  const viewerContainer =
    typeof document === 'undefined'
      ? null
      : document.getElementById('runner-container') ??
        document.getElementById('main-page-div') ??
        document.body;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="quest-body">
      {/* ---- Summary grid (Requirements + Unlocked by) ---- */}
      <div className="quest-edit-summary-grid">
        {/* Requirements */}
        <div className="quest-summary-box">
          <div className="quest-summary-label">Requirements</div>
          <div className="quest-edit-requirements">
            <div className="quest-edit-level-row">
              <label className="quest-edit-level-label" htmlFor={`level-${quest.id}`}>
                Level
              </label>
              <input
                id={`level-${quest.id}`}
                type="number"
                className={`quest-edit-level-input${levelError ? ' has-error' : ''}`}
                value={levelInput}
                min={MIN_LEVEL}
                max={MAX_LEVEL}
                placeholder="—"
                onChange={handleLevelChange}
              />
            </div>
            {levelError && (
              <div className="quest-edit-level-error">{levelError}</div>
            )}
            {otherRequirements.length > 0 && (
              <div className="quest-edit-other-requirements">
                {otherRequirements.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Unlocked by */}
        <div className="quest-summary-box">
          <div className="quest-summary-label">Unlocked by</div>
          <div className="quest-edit-unlocked-by">
            {currentTaskRequirements.length === 0 && (
              <div className="quest-edit-unlocked-by-empty">None</div>
            )}
            {currentTaskRequirements.map((req, index) => (
              <div key={`${req.questId}-${index}`} className="quest-edit-unlock-row">
                <span className="quest-edit-unlock-status">
                  {UNLOCK_STATUS_OPTIONS.find((o) => o.value === req.status)?.label ?? req.status}
                </span>
                <span className="quest-edit-unlock-quest-name" title={req.questName}>
                  {req.questName}
                </span>
                <button
                  type="button"
                  className="quest-edit-unlock-remove-button"
                  aria-label={`Remove unlock condition: ${req.questName}`}
                  onClick={() => handleRemoveRequirement(index)}
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="quest-edit-unlock-add-row">
              <select
                className="quest-edit-unlock-status-select"
                value={newReqStatus}
                onChange={(e) => setNewReqStatus(e.target.value)}
              >
                {UNLOCK_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="quest-edit-unlock-quest-search">
                <input
                  type="text"
                  className="quest-edit-unlock-quest-input"
                  placeholder="Search quest..."
                  value={newReqQuestQuery}
                  onChange={(e) => {
                    setNewReqQuestQuery(e.target.value);
                    setNewReqQuestId(null);
                    setIsQuestDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (newReqQuestQuery.trim()) setIsQuestDropdownOpen(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setIsQuestDropdownOpen(false), 200);
                  }}
                />
                {isQuestDropdownOpen && questSearchResults.length > 0 && (
                  <div className="quest-edit-unlock-quest-dropdown">
                    {questSearchResults.map((q) => {
                      const name = q.locales?.[I18nHelper.currentLocale()] ?? q.name;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          className="quest-edit-unlock-quest-dropdown-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectNewReqQuest(q)}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="quest-edit-unlock-add-button"
                disabled={!newReqQuestId}
                onClick={handleAddRequirement}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Leads to */}
        <div className="quest-summary-box">
          <div className="quest-summary-label">Leads to</div>
          <div className="quest-edit-unlocked-by">
            {leadsToRequirements.length === 0 && (
              <div className="quest-edit-unlocked-by-empty">None</div>
            )}
            {leadsToRequirements.map((lead, index) => (
              <div key={`${lead.questId}-${lead.status}-${index}`} className="quest-edit-unlock-row">
                <span className="quest-edit-unlock-status">
                  {UNLOCK_STATUS_OPTIONS.find((o) => o.value === lead.status)?.label ?? lead.status}
                </span>
                <span className="quest-edit-unlock-quest-name" title={lead.questName}>
                  {lead.questName}
                </span>
                <button
                  type="button"
                  className="quest-edit-unlock-remove-button"
                  aria-label={`Remove leads-to condition: ${lead.questName}`}
                  onClick={() => onRemoveLeadsToRequirement?.(lead.questId, lead.status)}
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="quest-edit-unlock-add-row">
              <select
                className="quest-edit-unlock-status-select"
                value={newLeadStatus}
                onChange={(e) => setNewLeadStatus(e.target.value)}
              >
                {UNLOCK_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="quest-edit-unlock-quest-search">
                <input
                  type="text"
                  className="quest-edit-unlock-quest-input"
                  placeholder="Search quest..."
                  value={newLeadQuestQuery}
                  onChange={(e) => {
                    setNewLeadQuestQuery(e.target.value);
                    setNewLeadQuestId(null);
                    setIsLeadDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (newLeadQuestQuery.trim()) setIsLeadDropdownOpen(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setIsLeadDropdownOpen(false), 200);
                  }}
                />
                {isLeadDropdownOpen && leadQuestSearchResults.length > 0 && (
                  <div className="quest-edit-unlock-quest-dropdown">
                    {leadQuestSearchResults.map((q) => {
                      const name = q.locales?.[I18nHelper.currentLocale()] ?? q.name;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          className="quest-edit-unlock-quest-dropdown-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectNewLeadQuest(q)}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="quest-edit-unlock-add-button"
                disabled={!newLeadQuestId}
                onClick={handleAddLeadRequirement}
                title={newLeadQuestName ? `Add relation to ${newLeadQuestName}` : 'Select a quest first'}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="quest-divider" />

      {/* ---- Tasks / Objectives (editable) ---- */}
      <div className="quest-section-title">Tasks:</div>
      <div className="quest-edit-objectives">
        {editableObjectives.map((objective, index) => (
          <EditableObjectiveRow
            key={objective.id}
            objective={objective}
            index={index}
            totalCount={editableObjectives.length}
            onTypeChange={handleObjectiveTypeChange}
            onDescriptionChange={handleObjectiveDescriptionChange}
            onMapToggle={handleObjectiveMapToggle}
            onItemChange={handleObjectiveItemChange}
            onNeededKeysChange={handleObjectiveNeededKeysChange}
            onDelete={handleDeleteObjective}
            onMove={handleMoveObjective}
            openViewer={openViewer}
          />
        ))}
        <button
          type="button"
          className="quest-edit-add-objective-button"
          onClick={handleAddObjective}
        >
          + Add Objective
        </button>
      </div>

      <div className="quest-divider" />

      {/* ---- Rewards ---- */}
      <div className="quest-section-title">Rewards:</div>
      <div className="quest-edit-rewards">
        {editableRewards.map((reward, index) => (
          <EditableRewardRow
            key={`reward-${reward.itemId || 'empty'}-${index}`}
            reward={reward}
            index={index}
            totalCount={editableRewards.length}
            onItemChange={handleRewardItemChange}
            onCountChange={handleRewardCountChange}
            onRemove={handleRewardRemove}
            onMove={handleRewardMove}
          />
        ))}
        <button
          type="button"
          className="quest-edit-add-objective-button"
          onClick={handleRewardAdd}
        >
          + Add Reward
        </button>
      </div>


      {/* ---- Fullscreen image viewer ---- */}
      {viewerImages && viewerContainer && (
        <FullscreenImageViewer
          images={viewerImages}
          currentIndex={viewerIndex}
          elementName={viewerTitle}
          container={viewerContainer}
          onClose={() => setViewerImages(null)}
          onPrevious={() =>
            setViewerIndex((prev) => (prev > 0 ? prev - 1 : viewerImages.length - 1))
          }
          onNext={() =>
            setViewerIndex((prev) => (prev < viewerImages.length - 1 ? prev + 1 : 0))
          }
        />
      )}
    </div>
  );
});

QuestEditBody.displayName = 'QuestEditBody';

// ---------------------------------------------------------------------------
// EditableObjectiveRow
// ---------------------------------------------------------------------------

type EditableObjectiveData = {
  id: string;
  type: string;
  description: string;
  maps: { id: string; name: string }[];
  images: string[];
  isNew: boolean;
  itemId: string;
  itemName: string;
  neededKeys: { mapId: string; keyIds: string[] }[];
};

function mapToggleLabel(isSingleMap: boolean, mapCount: number): string {
  if (mapCount === 0) {
    return isSingleMap ? 'Select map...' : 'Select maps...';
  }
  return isSingleMap ? 'Change map...' : 'Add / remove maps...';
}

const EditableObjectiveRow: React.FC<{
  objective: EditableObjectiveData;
  index: number;
  totalCount: number;
  onTypeChange: (objectiveId: string, type: string) => void;
  onDescriptionChange: (objectiveId: string, description: string) => void;
  onMapToggle: (objectiveId: string, objectiveType: string, currentMaps: { id: string; name: string }[], mapId: string, mapName: string) => void;
  onItemChange: (objectiveId: string, itemId: string, itemName: string) => void;
  onNeededKeysChange: (objectiveId: string, neededKeys: { mapId: string; keyIds: string[] }[]) => void;
  onDelete: (objectiveId: string) => void;
  onMove: (objectiveId: string, direction: 'up' | 'down') => void;
  openViewer: (images: string[], title: string) => void;
}> = ({
  objective,
  index,
  totalCount,
  onTypeChange,
  onDescriptionChange,
  onMapToggle,
  onItemChange,
  onNeededKeysChange,
  onDelete,
  onMove,
  openViewer,
}) => {
  const [isMapDropdownOpen, setIsMapDropdownOpen] = useState(false);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // Item search state
  const [itemSearchQuery, setItemSearchQuery] = useState(objective.itemName);
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const itemWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedKeyMapId, setSelectedKeyMapId] = useState('');
  const [keySearchQuery, setKeySearchQuery] = useState('');
  const [isKeyDropdownOpen, setIsKeyDropdownOpen] = useState(false);
  const keyWrapperRef = useRef<HTMLDivElement>(null);

  const isItemType = ITEM_OBJECTIVE_TYPES.has(objective.type);

  // Sync item name when it changes externally (e.g. type switch clears item)
  useEffect(() => {
    setItemSearchQuery(objective.itemName);
  }, [objective.itemName]);

  useEffect(() => {
    const fallbackMapId =
      objective.maps[0]?.id ?? objective.neededKeys[0]?.mapId ?? MAP_OPTIONS[0]?.id ?? '';
    setSelectedKeyMapId((prev) => (prev && prev.length > 0 ? prev : fallbackMapId));
  }, [objective.maps, objective.neededKeys]);

  const filteredItemResults = useMemo(() => {
    if (!isItemType) return [];
    const data = ItemsElementUtils.getAllItems();
    if (!data.length) return [];
    const query = itemSearchQuery.trim().toLowerCase();
    if (!query) return data.slice(0, 30);
    return data.filter((item) => {
      const name = item.name?.toLowerCase() ?? '';
      return name.includes(query);
    }).slice(0, 30);
  }, [isItemType, itemSearchQuery]);

  const keyMapOptions = useMemo(
    () => (objective.maps.length > 0 ? objective.maps : MAP_OPTIONS),
    [objective.maps],
  );

  const filteredKeyResults = useMemo(() => {
    const data = ItemsElementUtils.getAllItems();
    if (!data.length) return [];
    const query = keySearchQuery.trim().toLowerCase();
    return data
      .filter((item) => {
        const id = item.id?.toLowerCase() ?? '';
        const name = item.name?.toLowerCase() ?? '';
        if (!id.includes('key')) return false;
        if (!query) return true;
        return id.includes(query) || name.includes(query);
      })
      .slice(0, 30);
  }, [keySearchQuery]);

  // Close item dropdown on outside click
  useEffect(() => {
    if (!isItemDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (itemWrapperRef.current && !itemWrapperRef.current.contains(e.target as Node)) {
        setIsItemDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isItemDropdownOpen]);

  useEffect(() => {
    if (!isKeyDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (keyWrapperRef.current && !keyWrapperRef.current.contains(e.target as Node)) {
        setIsKeyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isKeyDropdownOpen]);

  const typeLabel = OBJECTIVE_TYPE_OPTIONS.find((o) => o.value === objective.type)?.label ?? objective.type;

  // Close map dropdown on outside click
  useEffect(() => {
    if (!isMapDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (mapWrapperRef.current && !mapWrapperRef.current.contains(e.target as Node)) {
        setIsMapDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMapDropdownOpen]);

  const isSingleMap = SINGLE_MAP_TYPES.has(objective.type);
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  const handleAddNeededKey = (keyId: string) => {
    if (!selectedKeyMapId) return;
    const next = objective.neededKeys.map((entry) => ({
      mapId: entry.mapId,
      keyIds: [...entry.keyIds],
    }));
    const existing = next.find((entry) => entry.mapId === selectedKeyMapId);
    if (existing) {
      if (existing.keyIds.includes(keyId)) return;
      existing.keyIds.push(keyId);
    } else {
      next.push({ mapId: selectedKeyMapId, keyIds: [keyId] });
    }
    onNeededKeysChange(objective.id, next);
    setKeySearchQuery('');
    setIsKeyDropdownOpen(false);
  };

  const handleRemoveNeededKey = (mapId: string, keyId: string) => {
    const next = objective.neededKeys
      .map((entry) =>
        entry.mapId === mapId
          ? { ...entry, keyIds: entry.keyIds.filter((id) => id !== keyId) }
          : entry,
      )
      .filter((entry) => entry.keyIds.length > 0);
    onNeededKeysChange(objective.id, next);
  };

  return (
    <div className="quest-edit-objective-row">
      {/* Row header: arrows + delete */}
      <div className="quest-edit-objective-row-header">
        <div className="quest-edit-objective-arrows">
          <button
            type="button"
            className="quest-edit-objective-arrow-button"
            aria-label="Move up"
            title="Move up"
            disabled={isFirst}
            onClick={() => onMove(objective.id, 'up')}
          >
            ▲
          </button>
          <button
            type="button"
            className="quest-edit-objective-arrow-button"
            aria-label="Move down"
            title="Move down"
            disabled={isLast}
            onClick={() => onMove(objective.id, 'down')}
          >
            ▼
          </button>
        </div>

        <div className="quest-edit-objective-row-content">
          {/* Type selector */}
          <div className="quest-edit-objective-field">
            <label className="quest-edit-objective-field-label" htmlFor={`obj-type-${objective.id}`}>Type</label>
            <select
              id={`obj-type-${objective.id}`}
              className="quest-edit-objective-type-select"
              value={objective.type}
              onChange={(e) => onTypeChange(objective.id, e.target.value)}
            >
              <option value="" disabled>Select type...</option>
              {OBJECTIVE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              {/* Keep current type visible even if not in the standard list */}
              {!OBJECTIVE_TYPE_OPTIONS.some((o) => o.value === objective.type) && objective.type && (
                <option value={objective.type}>{typeLabel}</option>
              )}
            </select>
          </div>

          {/* Description input */}
          <div className="quest-edit-objective-field">
            <label className="quest-edit-objective-field-label" htmlFor={`obj-desc-${objective.id}`}>Description</label>
            <input
              id={`obj-desc-${objective.id}`}
              type="text"
              className="quest-edit-objective-description-input"
              value={objective.description}
              placeholder="Objective description..."
              onChange={(e) => onDescriptionChange(objective.id, e.target.value)}
            />
          </div>

          {/* Item selector (only for item-based objective types) */}
          {isItemType && (
            <div className="quest-edit-objective-field">
              <label className="quest-edit-objective-field-label" htmlFor={`obj-item-${objective.id}`}>Item</label>
              <div className="quest-edit-objective-item-wrapper" ref={itemWrapperRef}>
                <div className="quest-edit-objective-item-input-row">
                  {objective.itemId && (
                    <img
                      src={ItemsElementUtils.getImagePath(objective.itemId)}
                      alt={objective.itemName}
                      className="quest-edit-objective-item-input-image"
                    />
                  )}
                  <input
                    id={`obj-item-${objective.id}`}
                    type="text"
                    className="quest-edit-objective-item-input"
                    value={itemSearchQuery}
                    placeholder="Search items..."
                    onChange={(e) => {
                      setItemSearchQuery(e.target.value);
                      setIsItemDropdownOpen(true);
                    }}
                    onFocus={() => setIsItemDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsItemDropdownOpen(false);
                    }}
                  />
                </div>
                {isItemDropdownOpen && filteredItemResults.length > 0 && (
                  <div className="quest-edit-objective-item-dropdown scroll-div">
                    {filteredItemResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`quest-edit-objective-item-dropdown-item${objective.itemId === item.id ? ' is-selected' : ''}`}
                        onClick={() => {
                          onItemChange(objective.id, item.id, item.name);
                          setItemSearchQuery(item.name);
                          setIsItemDropdownOpen(false);
                        }}
                      >
                        {item.url && (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="quest-edit-objective-item-image"
                          />
                        )}
                        <span className="quest-edit-objective-item-name">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Maps: selected tags + dropdown */}
          <div className="quest-edit-objective-field">
            <label className="quest-edit-objective-field-label" htmlFor={`obj-maps-${objective.id}`}>Maps</label>

            {/* Selected map tags */}
            {objective.maps.length > 0 && (
              <div className="quest-edit-objective-map-tags">
                {objective.maps.map((m) => {
                  const displayName = MapAdapter.getLocalizedMap(m.id) || m.name;
                  return (
                    <span key={m.id} className="quest-edit-objective-map-tag">
                      <span className="quest-edit-objective-map-tag-name">{displayName}</span>
                      <button
                        type="button"
                        className="quest-edit-objective-map-tag-remove"
                        aria-label={`Remove ${displayName}`}
                        onClick={() => onMapToggle(objective.id, objective.type, objective.maps, m.id, m.name)}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Map dropdown */}
            <div className="quest-edit-objective-maps-wrapper" ref={mapWrapperRef}>
              <button
                id={`obj-maps-${objective.id}`}
                type="button"
                className="quest-edit-objective-maps-toggle"
                onClick={() => setIsMapDropdownOpen((prev) => !prev)}
              >
                <span className="quest-edit-objective-maps-value">
                  {mapToggleLabel(isSingleMap, objective.maps.length)}
                </span>
                <span className="quest-edit-objective-maps-chevron">
                  {isMapDropdownOpen ? '▲' : '▼'}
                </span>
              </button>
              {isMapDropdownOpen && (
                <div className="quest-edit-objective-maps-dropdown">
                  {MAP_OPTIONS.map((mapOpt) => {
                    const isSelected = objective.maps.some((m) => m.id === mapOpt.id);
                    return (
                      <button
                        key={mapOpt.id}
                        type="button"
                        className={`quest-edit-objective-maps-dropdown-item${isSelected ? ' is-selected' : ''}`}
                        onClick={() => {
                          onMapToggle(objective.id, objective.type, objective.maps, mapOpt.id, mapOpt.name);
                          if (isSingleMap) {
                            setIsMapDropdownOpen(false);
                          }
                        }}
                      >
                        <span className="quest-edit-objective-map-check">
                          {isSelected ? '✓' : ''}
                        </span>
                        <span>{MapAdapter.getLocalizedMap(mapOpt.id) || mapOpt.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Images viewer (read-only for now) */}
          {objective.images.length > 0 && (
            <div className="quest-edit-objective-images">
              <button
                type="button"
                className="quest-objective-image-button"
                onClick={() => openViewer(objective.images, 'Quest images')}
              >
                Images ({objective.images.length})
              </button>
            </div>
          )}

          <div className="quest-edit-objective-field">
            <label className="quest-edit-objective-field-label">Needed Keys</label>
            {objective.neededKeys.length === 0 && (
              <div className="quest-edit-unlocked-by-empty">None</div>
            )}
            {objective.neededKeys.map((entry) => {
              const mapName = MapAdapter.getLocalizedMap(entry.mapId) || entry.mapId;
              return (
                <div
                  key={`${objective.id}-needed-${entry.mapId}`}
                  className="quest-edit-objective-map-tags"
                >
                  <span className="quest-edit-objective-map-tag-name">{mapName}:</span>
                  {entry.keyIds.map((keyId) => {
                    const keyName = ItemsElementUtils.getItemName(keyId) ?? keyId;
                    return (
                      <span key={`${entry.mapId}-${keyId}`} className="quest-edit-objective-map-tag">
                        <span className="quest-edit-objective-map-tag-name">{keyName}</span>
                        <button
                          type="button"
                          className="quest-edit-objective-map-tag-remove"
                          aria-label={`Remove key ${keyName}`}
                          onClick={() => handleRemoveNeededKey(entry.mapId, keyId)}
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              );
            })}
            <div className="quest-edit-unlock-add-row">
              <select
                className="quest-edit-unlock-status-select"
                value={selectedKeyMapId}
                onChange={(e) => setSelectedKeyMapId(e.target.value)}
              >
                {keyMapOptions.map((mapOpt) => (
                  <option key={`${objective.id}-key-map-${mapOpt.id}`} value={mapOpt.id}>
                    {MapAdapter.getLocalizedMap(mapOpt.id) || mapOpt.name}
                  </option>
                ))}
              </select>
              <div className="quest-edit-unlock-quest-search" ref={keyWrapperRef}>
                <input
                  type="text"
                  className="quest-edit-unlock-quest-input"
                  placeholder="Search key..."
                  value={keySearchQuery}
                  onChange={(e) => {
                    setKeySearchQuery(e.target.value);
                    setIsKeyDropdownOpen(true);
                  }}
                  onFocus={() => setIsKeyDropdownOpen(true)}
                />
                {isKeyDropdownOpen && filteredKeyResults.length > 0 && (
                  <div className="quest-edit-unlock-quest-dropdown">
                    {filteredKeyResults.map((item) => (
                      <button
                        key={`${objective.id}-key-opt-${item.id}`}
                        type="button"
                        className="quest-edit-unlock-quest-dropdown-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAddNeededKey(item.id)}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete button */}
        <button
          type="button"
          className="quest-edit-objective-delete-button"
          aria-label="Delete objective"
          title="Delete objective"
          onClick={() => onDelete(objective.id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// EditableRewardRow
// ---------------------------------------------------------------------------

const EditableRewardRow: React.FC<{
  reward: EditRewardItem;
  index: number;
  totalCount: number;
  onItemChange: (index: number, itemId: string, itemName: string) => void;
  onCountChange: (index: number, count: number) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}> = ({ reward, index, totalCount, onItemChange, onCountChange, onRemove, onMove }) => {
  const [searchQuery, setSearchQuery] = useState(reward.itemName);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync item name when it changes externally
  useEffect(() => {
    setSearchQuery(reward.itemName);
  }, [reward.itemName]);

  const filteredItems = useMemo(() => {
    const data = ItemsElementUtils.getAllItems();
    if (!data.length) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data.slice(0, 30);
    return data.filter((item) => {
      const name = item.name?.toLowerCase() ?? '';
      return name.includes(query);
    }).slice(0, 30);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  const handleCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      onCountChange(index, 0);
      return;
    }
    onCountChange(index, Number.parseInt(raw, 10));
  };

  return (
    <div className="quest-edit-reward-row">
      <div className="quest-edit-objective-arrows">
        <button
          type="button"
          className="quest-edit-objective-arrow-button"
          aria-label="Move up"
          title="Move up"
          disabled={isFirst}
          onClick={() => onMove(index, 'up')}
        >
          ▲
        </button>
        <button
          type="button"
          className="quest-edit-objective-arrow-button"
          aria-label="Move down"
          title="Move down"
          disabled={isLast}
          onClick={() => onMove(index, 'down')}
        >
          ▼
        </button>
      </div>

      <div className="quest-edit-reward-content">
        {/* Item selector */}
        <div className="quest-edit-reward-item-wrapper" ref={wrapperRef}>
          <div className="quest-edit-objective-item-input-row">
            {reward.itemId && (
              <img
                src={ItemsElementUtils.getImagePath(reward.itemId)}
                alt={reward.itemName}
                className="quest-edit-objective-item-input-image"
              />
            )}
            <input
              type="text"
              className="quest-edit-objective-item-input"
              value={searchQuery}
              placeholder="Search items..."
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsDropdownOpen(false);
              }}
            />
          </div>
          {isDropdownOpen && filteredItems.length > 0 && (
            <div className="quest-edit-objective-item-dropdown scroll-div">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`quest-edit-objective-item-dropdown-item${reward.itemId === item.id ? ' is-selected' : ''}`}
                  onClick={() => {
                    onItemChange(index, item.id, item.name);
                    setSearchQuery(item.name);
                    setIsDropdownOpen(false);
                  }}
                >
                  {item.url && (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="quest-edit-objective-item-image"
                    />
                  )}
                  <span className="quest-edit-objective-item-name">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Count input */}
        <div className="quest-edit-reward-count-wrapper">
          <label className="quest-edit-objective-field-label" htmlFor={`reward-count-${index}`}>
            Count
          </label>
          <input
            id={`reward-count-${index}`}
            type="text"
            inputMode="numeric"
            className="quest-edit-reward-count-input"
            value={reward.count === 0 ? '' : String(reward.count)}
            onChange={handleCountInput}
            placeholder="1"
          />
        </div>
      </div>

      {/* Delete button */}
      <button
        type="button"
        className="quest-edit-objective-delete-button"
        aria-label="Remove reward"
        title="Remove reward"
        onClick={() => onRemove(index)}
      >
        ✕
      </button>
    </div>
  );
};
