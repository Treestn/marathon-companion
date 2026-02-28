import React, { useEffect, useMemo, useState } from "react";
import { CoreItem, ImplantItem, ItemsModel, Runner } from "../../model/items/IItemsElements";
import { QuestFilterSelect } from "../components/quests/filters/QuestFilterSelect";
import "../components/quests/filters/quest-filters.css";
import "./runners/runners.css";
import { RunnerDetailSubPage } from "./runners/RunnerDetailSubPage";

const FALLBACK_RUNNER_ICON = "./img/side-nav-quest-icon.png";

const getRunnerRarityTagClass = (rarity?: string): string => {
  const normalized = (rarity ?? "").trim().toLowerCase();
  if (normalized.includes("legendary")) {
    return "runner-rarity-tag-legendary";
  }
  if (normalized.includes("epic")) {
    return "runner-rarity-tag-epic";
  }
  if (normalized.includes("rare")) {
    return "runner-rarity-tag-rare";
  }
  if (normalized.includes("uncommon")) {
    return "runner-rarity-tag-uncommon";
  }
  if (normalized.includes("common")) {
    return "runner-rarity-tag-common";
  }
  return "runner-rarity-tag-default";
};

const getHeroImageSource = (runner: Runner): string =>
  runner.heroUrl?.trim() || FALLBACK_RUNNER_ICON;

const getPortraitImageSource = (runner: Runner): string =>
  runner.portraitUrl?.trim() || FALLBACK_RUNNER_ICON;

export const RunnersPage: React.FC = () => {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRoles, setActiveRoles] = useState<string[]>([]);
  const [activeRarities, setActiveRarities] = useState<string[]>([]);
  const [activeDifficulties, setActiveDifficulties] = useState<string[]>([]);
  const [selectedRunnerId, setSelectedRunnerId] = useState<string | null>(null);
  const [shields, setShields] = useState<ImplantItem[]>([]);
  const [equipments, setEquipments] = useState<ImplantItem[]>([]);
  const [cores, setCores] = useState<CoreItem[]>([]);
  const [headImplants, setHeadImplants] = useState<ImplantItem[]>([]);
  const [torsoImplants, setTorsoImplants] = useState<ImplantItem[]>([]);
  const [legImplants, setLegImplants] = useState<ImplantItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadRunners = async () => {
      const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
      if (!bridge) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      await bridge.waitForItemsData?.();
      if (!isMounted) {
        return;
      }

      const data = bridge.getItemsData?.() as ItemsModel | undefined;
      setRunners(data?.items?.runners ?? []);
      const allImplants = data?.items?.implants ?? [];
      setCores(data?.items?.cores ?? []);
      const hasSlotKeyword = (implant: ImplantItem, keywords: string[]): boolean => {
        const slotType = (implant.slotType ?? "").trim().toLowerCase();
        return keywords.some((keyword) => slotType.includes(keyword));
      };
      const slotBasedShieldCandidates = allImplants.filter((implant) => {
        return hasSlotKeyword(implant, ["shield"]);
      });
      const shieldCandidates =
        slotBasedShieldCandidates.length > 0
          ? slotBasedShieldCandidates
          : allImplants.filter((implant) =>
              (implant.name ?? "").trim().toLowerCase().includes("shield"),
            );
      const shieldIdSet = new Set(shieldCandidates.map((implant) => implant.id));
      const slotBasedEquipmentCandidates = allImplants.filter((implant) => {
        return hasSlotKeyword(implant, ["equipment"]);
      });
      const equipmentCandidates =
        slotBasedEquipmentCandidates.length > 0
          ? slotBasedEquipmentCandidates
          : allImplants.filter((implant) => !shieldIdSet.has(implant.id));
      const headCandidates = allImplants.filter((implant) =>
        hasSlotKeyword(implant, ["head", "helmet"]),
      );
      const torsoCandidates = allImplants.filter((implant) =>
        hasSlotKeyword(implant, ["torso", "body", "chest"]),
      );
      const legCandidates = allImplants.filter((implant) =>
        hasSlotKeyword(implant, ["legs", "leg", "lower", "boots"]),
      );
      setShields(shieldCandidates);
      setEquipments(equipmentCandidates);
      setHeadImplants(headCandidates);
      setTorsoImplants(torsoCandidates);
      setLegImplants(legCandidates);
      setIsLoading(false);
    };

    loadRunners();
    return () => {
      isMounted = false;
    };
  }, []);

  const roles = useMemo(
    () =>
      Array.from(
        new Set(
          runners
            .map((runner) => runner.role?.trim())
            .filter((role): role is string => Boolean(role)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [runners],
  );

  const rarities = useMemo(
    () =>
      Array.from(
        new Set(
          runners
            .map((runner) => runner.rarity?.trim())
            .filter((rarity): rarity is string => Boolean(rarity)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [runners],
  );

  const difficulties = useMemo(
    () =>
      Array.from(
        new Set(
          runners
            .map((runner) => runner.difficulty?.trim())
            .filter((difficulty): difficulty is string => Boolean(difficulty)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [runners],
  );

  const matchesSearch = (runner: Runner, normalizedSearch: string) => {
    if (!normalizedSearch) {
      return true;
    }
    const searchable = [
      runner.name,
      runner.role,
      runner.description,
      runner.rarity,
      runner.difficulty,
      ...(runner.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchable.includes(normalizedSearch);
  };

  const filteredRunners = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const selectedRoles = new Set(activeRoles);
    const selectedRarities = new Set(activeRarities);
    const selectedDifficulties = new Set(activeDifficulties);

    return runners.filter((runner) => {
      const role = runner.role?.trim() || "Unknown";
      const rarity = runner.rarity?.trim() || "Unknown";
      const difficulty = runner.difficulty?.trim() || "Unknown";
      if (selectedRoles.size > 0 && !selectedRoles.has(role)) {
        return false;
      }
      if (selectedRarities.size > 0 && !selectedRarities.has(rarity)) {
        return false;
      }
      if (selectedDifficulties.size > 0 && !selectedDifficulties.has(difficulty)) {
        return false;
      }
      return matchesSearch(runner, normalizedSearch);
    });
  }, [activeDifficulties, activeRarities, activeRoles, runners, searchTerm]);

  const roleCounts = useMemo(() => {
    const selectedRarities = new Set(activeRarities);
    const selectedDifficulties = new Set(activeDifficulties);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return runners.reduce<Record<string, number>>((acc, runner) => {
      const role = runner.role?.trim() || "Unknown";
      const rarity = runner.rarity?.trim() || "Unknown";
      const difficulty = runner.difficulty?.trim() || "Unknown";
      if (selectedRarities.size > 0 && !selectedRarities.has(rarity)) {
        return acc;
      }
      if (selectedDifficulties.size > 0 && !selectedDifficulties.has(difficulty)) {
        return acc;
      }
      if (!matchesSearch(runner, normalizedSearch)) {
        return acc;
      }
      acc[role] = (acc[role] ?? 0) + 1;
      return acc;
    }, {});
  }, [activeDifficulties, activeRarities, runners, searchTerm]);

  const rarityCounts = useMemo(() => {
    const selectedRoles = new Set(activeRoles);
    const selectedDifficulties = new Set(activeDifficulties);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return runners.reduce<Record<string, number>>((acc, runner) => {
      const role = runner.role?.trim() || "Unknown";
      const rarity = runner.rarity?.trim() || "Unknown";
      const difficulty = runner.difficulty?.trim() || "Unknown";
      if (selectedRoles.size > 0 && !selectedRoles.has(role)) {
        return acc;
      }
      if (selectedDifficulties.size > 0 && !selectedDifficulties.has(difficulty)) {
        return acc;
      }
      if (!matchesSearch(runner, normalizedSearch)) {
        return acc;
      }
      acc[rarity] = (acc[rarity] ?? 0) + 1;
      return acc;
    }, {});
  }, [activeDifficulties, activeRoles, runners, searchTerm]);

  const difficultyCounts = useMemo(() => {
    const selectedRoles = new Set(activeRoles);
    const selectedRarities = new Set(activeRarities);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return runners.reduce<Record<string, number>>((acc, runner) => {
      const role = runner.role?.trim() || "Unknown";
      const rarity = runner.rarity?.trim() || "Unknown";
      const difficulty = runner.difficulty?.trim() || "Unknown";
      if (selectedRoles.size > 0 && !selectedRoles.has(role)) {
        return acc;
      }
      if (selectedRarities.size > 0 && !selectedRarities.has(rarity)) {
        return acc;
      }
      if (!matchesSearch(runner, normalizedSearch)) {
        return acc;
      }
      acc[difficulty] = (acc[difficulty] ?? 0) + 1;
      return acc;
    }, {});
  }, [activeRarities, activeRoles, runners, searchTerm]);

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        value: role,
        label: `${role} (${roleCounts[role] ?? 0})`,
      })),
    [roles, roleCounts],
  );

  const rarityOptions = useMemo(
    () =>
      rarities.map((rarity) => ({
        value: rarity,
        label: `${rarity} (${rarityCounts[rarity] ?? 0})`,
      })),
    [rarities, rarityCounts],
  );

  const difficultyOptions = useMemo(
    () =>
      difficulties.map((difficulty) => ({
        value: difficulty,
        label: `${difficulty} (${difficultyCounts[difficulty] ?? 0})`,
      })),
    [difficulties, difficultyCounts],
  );

  const selectedRunner = useMemo(
    () => runners.find((runner) => runner.id === selectedRunnerId) ?? null,
    [runners, selectedRunnerId],
  );

  let runnersContent: React.ReactNode;
  if (selectedRunner) {
    runnersContent = (
      <RunnerDetailSubPage
        runner={selectedRunner}
        shields={shields}
        equipments={equipments}
        cores={cores}
        headImplants={headImplants}
        torsoImplants={torsoImplants}
        legImplants={legImplants}
        fallbackRunnerIcon={FALLBACK_RUNNER_ICON}
        onBack={() => setSelectedRunnerId(null)}
      />
    );
  } else if (isLoading) {
    runnersContent = <div className="runners-empty">Loading runners...</div>;
  } else if (filteredRunners.length === 0) {
    runnersContent = <div className="runners-empty">No runners match your current filters.</div>;
  } else {
    runnersContent = (
      <section className="runners-category-block">
        <div className="runners-category-header">
          <h2>All Runners</h2>
          <span>{filteredRunners.length} runners</span>
        </div>
        <div className="runners-grid">
          {filteredRunners.map((runner) => (
            <button
              key={runner.id}
              type="button"
              className="runner-card"
              onClick={() => setSelectedRunnerId(runner.id)}
            >
              <div className="runner-card-image-wrap">
                <span className={`runner-rarity-tag ${getRunnerRarityTagClass(runner.rarity)}`}>
                  {runner.rarity || "Unknown"}
                </span>
                <img
                  className="runner-card-image"
                  src={getHeroImageSource(runner)}
                  alt={runner.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_RUNNER_ICON;
                  }}
                />
              </div>
              <div className="runner-card-body">
                <h3 className="runner-card-title">{runner.name}</h3>
                <p className="runner-card-description">
                  {runner.description?.trim() || "No description available."}
                </p>
                <div className="runner-card-pills">
                  <span className="runner-pill">{runner.role || "Unknown role"}</span>
                  <span className="runner-pill">Difficulty: {runner.difficulty || "Unknown"}</span>
                </div>
                {(runner.tags ?? []).length > 0 && (
                  <div className="runner-card-tags">
                    {(runner.tags ?? []).slice(0, 3).map((tag) => (
                      <span key={`${runner.id}-${tag}`} className="runner-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="runner-card-footer">
                  <span>{runner.abilities?.length ?? 0} abilities</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="runners-page-container">
      <section className="runners-page">
        {!selectedRunner && (
          <header className="runners-header">
            <div className="runners-title-wrap">
              <h1 className="runners-title">Runners</h1>
              <p className="runners-subtitle">
                Browse runner hero cards with key details, roles, rarity, and difficulty.
              </p>
            </div>
            <div className="runners-header-actions">
              <input
                className="runners-search"
                type="search"
                placeholder="Search runners, roles, tags, or rarity..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </header>
        )}

        {!selectedRunner && (
          <div className="runners-filter-row">
            <QuestFilterSelect
              id="runners-filter-difficulty"
              label="Difficulty"
              value={activeDifficulties}
              options={difficultyOptions}
              onChange={setActiveDifficulties}
              iconSrc="../../img/icons/filter_list.svg"
            />
            <button
              type="button"
              className="runners-clear-filters"
              onClick={() => {
                setActiveRoles([]);
                setActiveRarities([]);
                setActiveDifficulties([]);
              }}
              disabled={
                activeRoles.length === 0 &&
                activeRarities.length === 0 &&
                activeDifficulties.length === 0
              }
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="runners-content scroll-div">{runnersContent}</div>
      </section>
    </div>
  );
};
