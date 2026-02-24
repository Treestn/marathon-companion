import React, { useEffect, useMemo, useState } from 'react';
import { Quest, QuestImage } from '../../../model/quest/IQuestsElements';
import { I18nHelper } from '../../../locale/I18nHelper';
import { ItemsElementUtils } from '../../../escape-from-tarkov/utils/ItemsElementUtils';
import { FullscreenImageViewer } from '../../pages/map/components/FullscreenImageViewer';
import { ItemRarityImage } from '../items/ItemRarityImage';
import { ObjectiveTypeConst } from '../../../escape-from-tarkov/constant/EditQuestConst';
import { GiveItemControl } from '../items/GiveItemControl';
import { MapAdapter } from '../../../adapter/MapAdapter';
import { QuestDataStore } from '../../services/QuestDataStore';
import { ProgressionStateService } from '../../services/ProgressionStateService';
import { dispatchDesktopNavigation } from '../../services/NavigationEvents';

type QuestBodyProps = {
  quest: Quest;
  onQuestCompletedChange?: (questId: string, isCompleted: boolean) => void;
  onObjectiveChange?: (questId: string, objectiveId: string, isCompleted: boolean) => void;
};

export const QuestBody: React.FC<QuestBodyProps> = ({
  quest,
  onQuestCompletedChange,
  onObjectiveChange,
}) => {
  const [rewardItems, setRewardItems] = useState<Record<string, { name: string; image?: string }>>({});
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [viewerTitle, setViewerTitle] = useState<string>('Quest images');
  const [objectiveVersion, setObjectiveVersion] = useState(0);
  const [isQuestCompleted, setIsQuestCompleted] = useState(
    ProgressionStateService.isQuestCompleted(quest.id)
  );
  const isQuestActive = ProgressionStateService.isQuestActive(quest.id);

  const requirements = useMemo(() => {
    const list: string[] = [];
    if (quest.minPlayerLevel) {
      list.push(`Level ${quest.minPlayerLevel}`);
    }
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

  const unlockedBy = useMemo(() => {
    if (!quest.taskRequirements || quest.taskRequirements.length === 0) {
      return [];
    }
    return quest.taskRequirements
      .map((req) => QuestDataStore.getQuestById(req.task.id))
      .filter(Boolean);
  }, [quest.taskRequirements]);

  const leadsTo = useMemo(() => {
    return QuestDataStore.getQuestUnlocksFromId(quest.id.toString()) || [];
  }, [quest.id]);

  const objectives = useMemo(() => {
    return quest.objectives.map((objective) => {
      const description =
        objective.locales?.[I18nHelper.currentLocale()] ??
        objective.description ??
        '';
      const maps = (objective.maps || []).map((map) => map?.name).filter(Boolean);
      const mapId = (() => {
        for (const map of objective.maps || []) {
          const candidate = map?.id ?? MapAdapter.getIdFromMap(map?.name ?? '');
          if (candidate) {
            return candidate;
          }
        }
        return null;
      })();
      const images: string[] = [];
      objective.questImages?.forEach((img: QuestImage) => {
        if (img.paths && img.paths.length > 0) {
          images.push(...img.paths);
        }
      });
      const questImageIds = (objective.questImages || [])
        .map((img) => img.id)
        .filter(Boolean);
      const isGiveItem =
        (objective.type === ObjectiveTypeConst.GIVE_ITEM.type 
        || objective.type === ObjectiveTypeConst.FIND_ITEM.type)
        && objective.item?.id;
      const neededKeys = (objective.neededKeys ?? [])
        .filter((entry) => entry?.map?.id)
        .map((entry) => ({
          mapId: entry.map.id,
          mapName: MapAdapter.getLocalizedMap(entry.map.id) || entry.map.name || entry.map.id,
          keys: (entry.keys ?? [])
            .map((key) => key?.id)
            .filter((keyId): keyId is string => Boolean(keyId))
            .map((keyId) => ItemsElementUtils.getItemName(keyId) ?? keyId),
        }))
        .filter((entry) => entry.keys.length > 0);
      return {
        id: objective.id,
        description,
        maps,
        mapId,
        images,
        questImageIds,
        isGiveItem,
        itemId: objective.item?.id ?? '',
        count: objective.count ?? 1,
        neededKeys,
      };
    });
  }, [quest.objectives, objectiveVersion]);

  useEffect(() => {
    let cancelled = false;
    const loadRewards = async () => {
      const items = quest.finishRewards?.items ?? [];
      const next: Record<string, { name: string; image?: string }> = {};
      for (const item of items) {
        const itemId = item.item?.id;
        if (!itemId) {
          continue;
        }
        try {
          const info = await ItemsElementUtils.getItemInformation(itemId);
          next[itemId] = {
            name: info?.name ?? itemId,
            image: info?.baseImageLink ?? undefined,
          };
        } catch (error) {
          console.warn('[QuestBody] Failed to load reward item info', error);
          next[itemId] = { name: itemId };
        }
      }
      if (!cancelled) {
        setRewardItems(next);
      }
    };
    loadRewards();
    return () => {
      cancelled = true;
    };
  }, [quest.finishRewards]);

  useEffect(() => {
    const handler = async (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || detail.questId !== quest.id) {
        return;
      }
      setObjectiveVersion((prev) => prev + 1);
    };
    globalThis.addEventListener('quest-progress-updated', handler);
    return () => globalThis.removeEventListener('quest-progress-updated', handler);
  }, [quest.id]);

  useEffect(() => {
    setIsQuestCompleted(ProgressionStateService.isQuestCompleted(quest.id));
  }, [quest.id, objectiveVersion]);

  const openViewer = (images: string[], title: string) => {
    if (!images.length) {
      return;
    }
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

  return (
    <div className="quest-body">
      <div className="quest-summary-grid">
        <div className="quest-summary-box">
          <div className="quest-summary-label">Trader</div>
          <div className="quest-summary-value">
            {quest.trader?.name ?? 'Unknown'}
          </div>
        </div>
        <div className="quest-summary-box">
          <div className="quest-summary-label">Requirements</div>
          <div className="quest-summary-value">
            {requirements.length ? requirements.join(', ') : 'None'}
          </div>
        </div>
        <div className="quest-summary-box">
          <div className="quest-summary-label">Unlocked by</div>
          <div className="quest-summary-value">
            {unlockedBy.length
              ? unlockedBy
                  .map((q) => q.locales?.[I18nHelper.currentLocale()] ?? q.name)
                  .join(', ')
              : 'None'}
          </div>
        </div>
        <div className="quest-summary-box">
          <div className="quest-summary-label">Leads to</div>
          <div className="quest-summary-value">
            {leadsTo.length
              ? leadsTo
                  .map((q) => q.locales?.[I18nHelper.currentLocale()] ?? q.name)
                  .join(', ')
              : 'None'}
          </div>
        </div>
      </div>

      <div className="quest-divider" />

      <div className="quest-section-title">Tasks:</div>
      <div className="quest-objectives">
        {objectives.map((objective) => {
          const isCompleted = ProgressionStateService.isQuestObjectiveCompleted(
            quest.id,
            objective.id,
          );
          const toggleCompleted = () => {
            if (onObjectiveChange) {
              onObjectiveChange(quest.id, objective.id, !isCompleted);
              return;
            }
            const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
            bridge?.updateProgression?.({
              type: 'quest-objective',
              questId: quest.id,
              objectiveId: objective.id,
              isCompleted: !isCompleted,
            });
          };
          const tooltipText = isCompleted
            ? 'Click to re-active objective'
            : 'Click to complete objective';
          const canFocusIcon =
            isQuestActive &&
            !isCompleted &&
            objective.questImageIds.length > 0 &&
            Boolean(objective.mapId);
          return (
          <div
            key={objective.id}
            className={`quest-objective-row${isCompleted ? ' is-completed' : ''}`}
            title={tooltipText}
          >
            <button
              type="button"
              className="quest-objective-toggle"
              aria-pressed={isCompleted}
              aria-label={tooltipText}
              onClick={toggleCompleted}
            >
              <div className="quest-objective-description-bullet-point">
                • 
              </div>
              <div>
                <div className="quest-objective-description-text">
                  {objective.description}
                </div>
                {objective.maps.length > 0 && (
                  <div className="quest-objective-description-maps">
                    <img
                      className="quest-objective-map-icon"
                      src="../../img/maps-icon.png"
                      alt="Map"
                    />
                    <span className="quest-objective-map">
                      {objective.maps
                        .map((map) =>
                          MapAdapter.getLocalizedMap(MapAdapter.getIdFromMap(map))
                        )
                        .join(', ')}
                    </span>
                  </div>
                )}
                {objective.neededKeys.length > 0 && (
                  <div className="quest-objective-description-maps">
                    <span className="quest-objective-map">
                      Keys: {objective.neededKeys
                        .map((entry) => `${entry.mapName} (${entry.keys.join(', ')})`)
                        .join(' | ')}
                    </span>
                  </div>
                )}
              </div>
            </button>
            <div className="quest-objective-action">
              {objective.isGiveItem && objective.itemId ? (
                <GiveItemControl
                  itemId={objective.itemId}
                  count={objective.count}
                  questId={quest.id}
                  objectiveId={objective.id}
                  isCompleted={isCompleted}
                />
              ) : (
                <>
                  {objective.images.length > 0 && (
                  <button
                    type="button"
                    className="quest-objective-image-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openViewer(objective.images, 'Quest images');
                    }}
                  >
                    Images
                  </button>
                  )}
                  {canFocusIcon && (
                    <button
                      type="button"
                      className="quest-objective-target-button"
                      aria-label="Show on map"
                      title="Show on map"
                      onClick={(event) => {
                        event.stopPropagation();
                        const iconId = Number(objective.questImageIds[0]);
                        if (!objective.mapId || Number.isNaN(iconId)) {
                          return;
                        }
                        dispatchDesktopNavigation({ pageId: 'interactive-map' });
                        if (typeof globalThis.dispatchEvent === 'function') {
                          globalThis.dispatchEvent(
                            new CustomEvent('second-screen:navigate', {
                              detail: { pageId: 'maps' },
                            })
                          );
                        }
                        if (typeof globalThis.dispatchEvent === 'function') {
                          globalThis.dispatchEvent(
                            new CustomEvent('map-focus-icon', {
                              detail: {
                                mapId: objective.mapId,
                                iconId,
                              },
                            })
                          );
                        }
                      }}
                    >
                      <img
                        src="../../img/icons/target.png"
                        alt=""
                        className="quest-objective-target-icon"
                      />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )})}
      </div>

      <div className="quest-divider" />

      <div className="quest-section-title">Rewards:</div>
      <div className="quest-rewards">
        {(quest.finishRewards?.items ?? []).map((reward) => {
          const itemId = reward.item?.id ?? '';
          const info = rewardItems[itemId];
          return (
            <div key={`${quest.id}-${itemId}`} className="quest-reward-row">
              <div className="quest-reward-image-wrapper">
                {itemId ? (
                  <ItemRarityImage itemId={itemId} size={40} />
                ) : (
                  <div className="quest-reward-image-placeholder" />
                )}
              </div>
              <div className="quest-reward-details">
                <div className="quest-reward-name">{info?.name ?? itemId}</div>
                <div className="quest-reward-count">x{reward.count ?? 1}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="quest-complete-action">
        {isQuestCompleted && (
          <div className="quest-complete-note">
            Quest completed. Click to unmark.
          </div>
        )}
        <button
          type="button"
          className={`quest-complete-button${isQuestCompleted ? ' button-is-completed' : ''}`}
          onClick={() => {
            const nextState = !isQuestCompleted;
            if (onQuestCompletedChange) {
              onQuestCompletedChange(quest.id, nextState);
            } else {
              const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
              bridge?.updateProgression?.({
                type: 'quest-completed',
                questId: quest.id,
                isCompleted: nextState,
              });
            }
            setIsQuestCompleted(nextState);
          }}
        >
          {isQuestCompleted ? 'Completed' : 'Mark as Completed'}
        </button>
      </div>

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
};
