import React, { useEffect, useMemo, useState } from "react";
import {
  HideoutObject,
  HideoutStations,
  HideoutLevels,
  ItemRequirements,
} from "../../../model/hideout/HideoutObject";
import { I18nHelper } from "../../../locale/I18nHelper";
import { HideoutSection } from "./components/HideoutSection";
import { progressionTypes } from "../../../consts";
import { HideoutItemControl } from "./components/HideoutItemControl";
import "./hideout.css";
import { NavigationTarget } from "../../services/NavigationEvents";
import { AppConfigClient } from "../../services/AppConfigClient";

type StationProgress = {
  level: HideoutLevels | null;
  statusLabel: string;
};

type HideoutPageProps = {
  navigationTarget?: NavigationTarget | null;
  onNavigationHandled?: () => void;
};

export const HideoutPage: React.FC<HideoutPageProps> = ({
  navigationTarget,
  onNavigationHandled,
}) => {
  const [hideoutData, setHideoutData] = useState<HideoutObject | null>(null);
  const [stationProgress, setStationProgress] = useState<Record<string, StationProgress>>({});
  const [selectedLevels, setSelectedLevels] = useState<Record<string, string>>({});
  const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      await bridge?.waitForHideoutData?.();
      const data = bridge?.getHideoutData?.() as HideoutObject | undefined;
      if (!isMounted) {
        return;
      }
      setHideoutData(data ?? null);
      if (data?.hideoutStations) {
        const progress: Record<string, StationProgress> = {};
        data.hideoutStations.forEach((station) => {
          progress[station.id] = resolveStationProgress(station, bridge);
        });
        setStationProgress(progress);
        setSelectedLevels((prev) =>
          getDefaultSelectedLevels(data.hideoutStations, progress, prev),
        );
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const stations = useMemo(() => {
    return hideoutData?.hideoutStations ?? [];
  }, [hideoutData]);

  useEffect(() => {
    if (navigationTarget?.pageId !== "hideout" || stations.length === 0) {
      return;
    }
    const targetStation =
      (navigationTarget.stationId
        ? stations.find((station) => station.id === navigationTarget.stationId)
        : stations.find((station) =>
            station.levels?.some((level) => level.id === navigationTarget.levelId),
          )) ?? null;

    if (!targetStation) {
      return;
    }

    const targetLevelId =
      navigationTarget.levelId &&
      targetStation.levels?.some((level) => level.id === navigationTarget.levelId)
        ? navigationTarget.levelId
        : targetStation.levels[0]?.id;

    if (targetLevelId) {
      setSelectedLevels((prev) => ({
        ...prev,
        [targetStation.id]: targetLevelId,
      }));
    }

    const handle = globalThis.requestAnimationFrame(() => {
      const element = document.getElementById(`hideout-station-${targetStation.id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      onNavigationHandled?.();
    });
    return () => globalThis.cancelAnimationFrame(handle);
  }, [navigationTarget, onNavigationHandled, stations]);

  const handleResetStation = (stationId: string) => {
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    if (bridge?.updateProgression) {
      bridge.updateProgression({ type: "hideout-reset-station", stationId });
    } else {
      bridge?.resetHideoutStation?.(stationId);
    }
    const station = stations.find((item) => item.id === stationId);
    if (station) {
      setSelectedLevels((prev) => ({
        ...prev,
        [stationId]: station.levels[0]?.id ?? "",
      }));
      setStationProgress((prev) => ({
        ...prev,
        [stationId]: resolveStationProgress(station, bridge),
      }));
    }
  };

  return (
    <div className="hideout-container">
      <section className="hideout-page">
        <header className="hideout-header">
          <div className="hideout-title">
            <img
              className="hideout-title-logo"
              src="../img/hideout.png"
              alt=""
            />
            <span className="hideout-title-text">Raider Den</span>
          </div>
        </header>
        <div className="hideout-station-list scroll-div">
          {stations.map((station) => {
            const progress = stationProgress[station.id];
            const title =
              station.locales?.[I18nHelper.currentLocale()] ?? station.name ?? "Hideout";
            let levelLabel = "Level 0";
            if (progress?.level) {
              levelLabel = `Level ${progress.level.level}`;
            }
            const selectedLevel = resolveSelectedLevel(station, selectedLevels[station.id]);
            const requirements = getRequiredItems(station, selectedLevel);
            const levelState = getLevelState(station, selectedLevel, bridge);
            const statusLabelForLevel = resolveLevelStatusFromState(levelState);
            const statusClass = getStatusClass(levelState);
            const isTracking = Boolean(levelState?.active);
            const isCompleted = Boolean(levelState?.completed);
            const trackLabel = isTracking ? "Untrack" : "Track";
            return (
              <article
                key={station.id}
                id={`hideout-station-${station.id}`}
                className="hideout-station-card"
              >
                <header className="hideout-station-header">
                  <div className="hideout-station-info">
                    <img
                      className="hideout-station-image"
                      src={station.imageLink}
                      alt={title}
                    />
                    <div className="hideout-station-name">{title}</div>
                  </div>
                  <div className="hideout-station-actions">
                    <div className="hideout-station-level">
                      <div className="hideout-station-level-label">
                        <button
                          type="button"
                          className="hideout-station-level-button"
                          onClick={() =>
                            setSelectedLevels((prev) => ({
                              ...prev,
                              [station.id]: getAdjacentLevelId(station, selectedLevel, -1),
                            }))
                          }
                          aria-label="Previous level"
                        >
                          ◀
                        </button>
                        <div className="hideout-station-level-label-container">
                          <span className="hideout-station-level-text">
                            {selectedLevel ? `Level ${selectedLevel.level}` : levelLabel}
                          </span>
                           <div className={`hideout-station-level-status ${statusClass}`}>
                            {statusLabelForLevel}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="hideout-station-level-button"
                          onClick={() =>
                            setSelectedLevels((prev) => ({
                              ...prev,
                              [station.id]: getAdjacentLevelId(station, selectedLevel, 1),
                            }))
                          }
                          aria-label="Next level"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="hideout-station-reset"
                      onClick={() => handleResetStation(station.id)}
                      title="Reset Progress"
                      aria-label="Reset Progress"
                    >
                      <img
                        className="hideout-reset-icon"
                        src="../img/icons/replay.svg"
                        alt=""
                      />
                    </button>
                  </div>
                </header>
                <HideoutSection
                  title="Required Items"
                  actions={
                    <>
                      <button
                        type="button"
                        className="hideout-section-track-button"
                        disabled={isCompleted}
                        onClick={() => {
                          if (!selectedLevel) {
                            return;
                          }
                          bridge?.updateProgression?.({
                            type: "hideout-level-track",
                            stationId: station.id,
                            levelId: selectedLevel.id,
                            isActive: !isTracking,
                          });
                          setStationProgress((prev) => ({
                            ...prev,
                            [station.id]: resolveStationProgress(station, bridge),
                          }));
                        }}
                      >
                        {trackLabel}
                      </button>
                      <button
                        type="button"
                        className="hideout-section-upgrade-button"
                        disabled={isCompleted}
                        onClick={() => {
                          if (!selectedLevel) {
                            return;
                          }
                          bridge?.updateProgression?.({
                            type: "hideout-level-complete",
                            stationId: station.id,
                            levelId: selectedLevel.id,
                          });
                          const nextLevelId = getNextLevelId(station, selectedLevel);
                          if (nextLevelId) {
                            setSelectedLevels((prev) => ({
                              ...prev,
                              [station.id]: nextLevelId,
                            }));
                          }
                          setStationProgress((prev) => ({
                            ...prev,
                            [station.id]: resolveStationProgress(station, bridge),
                          }));
                        }}
                      >
                        Upgrade
                      </button>
                    </>
                  }
                >
                  <div className="hideout-required-grid">
                    {requirements.length > 0 ? (
                      requirements.map((requirement) => {
                        const itemId = requirement.item?.id ?? "";
                        return (
                          <HideoutItemControl
                            key={`${station.id}-${itemId}`}
                            itemId={itemId}
                            required={requirement.quantity}
                            isCompleted={Boolean(levelState?.completed)}
                          />
                        );
                      })
                    ) : (
                      <div className="hideout-empty-state">No requirements for this level.</div>
                    )}
                  </div>
                </HideoutSection>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const resolveStationProgress = (
  station: HideoutStations,
  bridge: any,
): StationProgress => {
  let activeLevel: HideoutLevels | null = null;
  let completedLevel: HideoutLevels | null = null;
  station.levels.forEach((level) => {
    const levelState = bridge?.getHideoutStationLevelState?.(station.id, level.id);
    if (levelState?.active) {
      activeLevel = level;
    }
    if (levelState?.completed) {
      completedLevel = level;
    }
  });

  const level = activeLevel ?? completedLevel ?? station.levels[0] ?? null;
  let statusLabel = "Inactive";
  if (activeLevel) {
    statusLabel = "Tracking";
  } else if (completedLevel) {
    statusLabel = "Completed";
  }
  return { level, statusLabel };
};

const resolveDefaultLevelId = (
  station: HideoutStations,
  progress?: StationProgress,
): string | null => {
  if (progress?.level) {
    return progress.level.id;
  }
  if (station.levels.length > 0) {
    return station.levels[0].id;
  }
  return null;
};

const getDefaultSelectedLevels = (
  stations: HideoutStations[],
  progress: Record<string, StationProgress>,
  current: Record<string, string>,
): Record<string, string> => {
  const next = { ...current };
  stations.forEach((station) => {
    if (!next[station.id]) {
      const levelId = resolveDefaultLevelId(station, progress[station.id]);
      if (levelId) {
        next[station.id] = levelId;
      }
    }
  });
  return next;
};

const resolveSelectedLevel = (
  station: HideoutStations,
  levelId?: string,
): HideoutLevels | null => {
  if (!levelId) {
    return station.levels[0] ?? null;
  }
  return station.levels.find((level) => level.id === levelId) ?? station.levels[0] ?? null;
};

const getAdjacentLevelId = (
  station: HideoutStations,
  selectedLevel: HideoutLevels | null,
  direction: number,
): string => {
  if (!station.levels.length) {
    return "";
  }
  const currentIndex = selectedLevel
    ? station.levels.findIndex((level) => level.id === selectedLevel.id)
    : 0;
  const baseIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex =
    (baseIndex + direction + station.levels.length) % station.levels.length;
  return station.levels[nextIndex].id;
};

const resolveLevelStatus = (
  station: HideoutStations,
  level: HideoutLevels | null,
  bridge: any,
): string => {
  if (!level) {
    return "Inactive";
  }
  const levelState = bridge?.getHideoutStationLevelState?.(station.id, level.id);
  if (levelState?.active) {
    return "Tracking";
  }
  if (levelState?.completed) {
    return "Completed";
  }
  return "Inactive";
};

const getLevelState = (
  station: HideoutStations,
  level: HideoutLevels | null,
  bridge: any,
) => {
  if (!level) {
    return null;
  }
  return bridge?.getHideoutStationLevelState?.(station.id, level.id) ?? null;
};

const resolveLevelStatusFromState = (levelState: { active?: boolean; completed?: boolean } | null) => {
  if (levelState?.active) {
    return "Tracking";
  }
  if (levelState?.completed) {
    return "Completed";
  }
  return "Inactive";
};

const getStatusClass = (
  levelState: { active?: boolean; completed?: boolean } | null,
): string => {
  if (levelState?.active) {
    return "is-active";
  }
  if (levelState?.completed) {
    return "is-completed";
  }
  return "is-inactive";
};

const getNextLevelId = (
  station: HideoutStations,
  selectedLevel: HideoutLevels | null,
): string | null => {
  if (!selectedLevel) {
    return station.levels[0]?.id ?? null;
  }
  const index = station.levels.findIndex((level) => level.id === selectedLevel.id);
  if (index === -1) {
    return station.levels[0]?.id ?? null;
  }
  return station.levels[index + 1]?.id ?? null;
};

const getRequiredItems = (
  station: HideoutStations,
  level: HideoutLevels | null | undefined,
): ItemRequirements[] => {
  if (!level) {
    return [];
  }
  const progressionType = AppConfigClient.getConfig()?.userSettings?.progressionType;
  if (progressionType === progressionTypes.pve && level.itemPveRequirements?.length) {
    return level.itemPveRequirements;
  }
  return level.itemRequirements ?? [];
};
