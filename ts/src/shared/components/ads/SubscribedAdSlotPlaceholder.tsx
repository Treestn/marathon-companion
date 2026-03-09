import React, { useEffect, useMemo, useState } from 'react';
import { Quest } from '../../../model/quest/IQuestsElements';
import { FACTIONS_DATA } from '../../../model/faction/IFactionsElements';
import { I18nHelper } from '../../../locale/I18nHelper';
import { QuestDataStore } from '../../services/QuestDataStore';
import { ProgressionStateService } from '../../services/ProgressionStateService';
import { ProgressionUpdatesService } from '../../services/ProgressionUpdatesService';
import { TraderMapper } from '../../../adapter/TraderMapper';
import { MapAdapter } from '../../../adapter/MapAdapter';
import { dispatchDesktopNavigation } from '../../services/NavigationEvents';
import './ads.css';
import '../../pages/quests/quests.css';
import '../quests/filters/quest-filters.css';
import { QuestFilterSelect } from '../quests/filters/QuestFilterSelect';

type SubscribedSidePanel = {
  className?: string;
  allowQuestNavigation?: boolean;
};

type ActiveObjective = {
  id: string;
  description: string;
  maps: string[];
};

const getQuestTitle = (quest: Quest): string =>
  quest.locales?.[I18nHelper.currentLocale()] ?? quest.name ?? 'Quest';

const getActiveObjective = (quest: Quest): ActiveObjective | null => {
  for (const objective of quest.objectives ?? []) {
    const isCompleted = ProgressionStateService.isQuestObjectiveCompleted(
      quest.id,
      objective.id,
    );
    if (isCompleted) {
      continue;
    }
    const description =
      objective.locales?.[I18nHelper.currentLocale()] ??
      objective.description ??
      '';
    const maps = (objective.maps || [])
      .map((map) => map?.name)
      .filter((mapName): mapName is string => typeof mapName === 'string' && mapName.length > 0);
    return {
      id: objective.id,
      description,
      maps,
    };
  }
  return null;
};

export const SubscribedSidePanel: React.FC<SubscribedSidePanel> = ({
  className,
  allowQuestNavigation = true,
}) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [openQuestIds, setOpenQuestIds] = useState<Set<string>>(new Set());
  const [questOrderBy, setQuestOrderBy] = useState<string[]>(['name']);

  const refreshQuests = () => {
    const storedQuests = QuestDataStore.getStoredQuestList();
    setQuests(storedQuests.filter((quest) => ProgressionStateService.isQuestActive(quest.id)));
  };

  useEffect(() => {
    refreshQuests();
    const unsubscribe = ProgressionUpdatesService.subscribe(() => {
      refreshQuests();
    });
    return () => unsubscribe();
  }, []);

  const questObjectives = useMemo(() => {
    const map = new Map<string, ActiveObjective | null>();
    quests.forEach((quest) => {
      map.set(quest.id, getActiveObjective(quest));
    });
    return map;
  }, [quests]);

  const orderedQuests = useMemo(() => {
    const list = [...quests];
    const orderByTrader = questOrderBy.includes('trader');
    const orderByName = questOrderBy.includes('name');
    if (orderByTrader) {
      list.sort((a, b) => {
        const traderA = a.trader?.name ?? '';
        const traderB = b.trader?.name ?? '';
        return traderA.localeCompare(traderB) || getQuestTitle(a).localeCompare(getQuestTitle(b));
      });
      return list;
    }
    if (orderByName) {
      list.sort((a, b) => getQuestTitle(a).localeCompare(getQuestTitle(b)));
    }
    return list;
  }, [quests, questOrderBy]);

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

  return (
    <div className={`${className ?? ''} subscribed-ad-slot`}>
      <section className="subscribed-slot-section">
        <div className="subscribed-slot-section-header">
          <div className="subscribed-slot-section-title">Active Quests</div>
          <QuestFilterSelect
            id="active-quests-filter"
            label="Filter"
            value={questOrderBy}
            options={[
              { value: 'name', label: 'Order by name' },
              { value: 'trader', label: 'Order by Faction' },
            ]}
            onChange={setQuestOrderBy}
            iconSrc="../../img/icons/filter_list.svg"
          />
        </div>
        {quests.length === 0 ? (
          <div className="subscribed-slot-empty">No active quests.</div>
        ) : (
          <div className="subscribed-quests-list scroll-div">
            {orderedQuests.map((quest) => {
              const objective = questObjectives.get(quest.id);
              const isOpen = openQuestIds.has(quest.id);
              const traderId = quest.trader?.id ?? '';
              const traderImageSrc = TraderMapper.getImageFromTraderId(traderId);
              const traderAlt = quest.trader?.name ?? 'Trader';
              const questFactionColor =
                FACTIONS_DATA.find((faction) => faction.factionId === traderId)?.colorSurface ??
                'var(--accent)';
              return (
                <div
                  key={quest.id}
                  className="quest-card subscribed-quest-card"
                  style={{ '--quest-faction-color': questFactionColor } as React.CSSProperties}
                >
                  <button
                    type="button"
                    className={`subscribed-quest-header${isOpen ? ' subscribed-quest-header-open' : ''}`}
                    onClick={(event) => {
                      const target = event.target as HTMLElement | null;
                      const isTitleClick = target?.closest('.subscribed-quest-title');
                      if (isTitleClick && allowQuestNavigation) {
                        dispatchDesktopNavigation({ pageId: 'quests', questId: quest.id });
                        return;
                      }
                      toggleQuest(quest.id);
                    }}
                  >
                    <span
                      className="quest-trader-image quest-trader-image-active subscribed-quest-trader-image"
                      role="img"
                      aria-label={traderAlt}
                      style={
                        {
                          '--quest-faction-color': questFactionColor,
                          '--quest-trader-icon-mask': `url("${traderImageSrc}")`,
                        } as React.CSSProperties
                      }
                    />
                    <span
                      className={`quest-title subscribed-quest-title${
                        allowQuestNavigation ? ' is-clickable' : ''
                      }`}
                    >
                      {getQuestTitle(quest)}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="quest-body subscribed-quest-body">
                      <div className="quest-section-title">Active Objective</div>
                      {objective ? (
                        <div className="quest-objectives">
                          <div className="quest-objective-row">
                            <div className="quest-objective-description-bullet-point">•</div>
                            <div>
                              <div className="quest-objective-description-text">
                                {objective.description}
                              </div>
                              {objective.maps.length > 0 && (
                                <div className="quest-objective-description-maps">
                                  <img
                                    className="quest-objective-map-icon"
                                    src="../../img/pages/map.png"
                                    alt="Map"
                                  />
                                  <span className="quest-objective-map">
                                    {objective.maps
                                      .map((map) =>
                                        MapAdapter.getLocalizedMap(MapAdapter.getIdFromMap(map)),
                                      )
                                      .join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="subscribed-slot-empty">All objectives complete.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
