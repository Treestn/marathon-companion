import React, { useEffect, useMemo, useRef, useState } from "react";
import { CoreItem, ImplantItem, Runner } from "../../../model/items/IItemsElements";

type RunnerDetailSubPageProps = {
  runner: Runner;
  shields: ImplantItem[];
  equipments: ImplantItem[];
  cores: CoreItem[];
  headImplants: ImplantItem[];
  torsoImplants: ImplantItem[];
  legImplants: ImplantItem[];
  onBack: () => void;
  fallbackRunnerIcon: string;
};

const getImageSource = (runner: Runner, fallbackRunnerIcon: string): string =>
  runner.portraitUrl?.trim() || runner.heroUrl?.trim() || fallbackRunnerIcon;

const STAT_LABELS: Record<string, string> = {
  heatCapacity: "Heat Capacity",
  agility: "Agility",
  lootingSpeed: "Looting Speed",
  meleeDamage: "Melee Damage",
  primeRecovery: "Prime Recovery",
  tactivalRecovery: "Tactical Recovery",
  selfRepairSpeed: "Self Repair Speed",
  finisherSiphon: "Finisher Siphon",
  reviveSpeed: "Revive Speed",
  hardware: "Hardware",
  firewall: "Firewall",
  fallResistance: "Fall Resistance",
  pingDuration: "Ping Duration",
};

const CORE_STAT_ORDER = [
  "heatCapacity",
  "agility",
  "lootingSpeed",
  "meleeDamage",
  "primeRecovery",
  "tacticalRecovery",
  "tactivalRecovery",
];

const UTILITY_STAT_ORDER = [
  "selfRepairSpeed",
  "finisherSiphon",
  "reviveSpeed",
  "hardware",
  "firewall",
  "fallResistance",
  "pingDuration",
];

const formatStatLabel = (key: string): string => {
  const explicit = STAT_LABELS[key];
  if (explicit) {
    return explicit;
  }
  const words: string[] = [];
  let current = "";
  for (const char of key) {
    const isUppercase = char >= "A" && char <= "Z";
    if (isUppercase && current.length > 0) {
      words.push(current);
      current = char.toLowerCase();
      continue;
    }
    current += char;
  }
  if (current.length > 0) {
    words.push(current);
  }
  return words
    .map((word) => (word.length > 0 ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
};

const formatStatValue = (value: number): string => `${value}`;
const ABILITY_TOOLTIP_WIDTH = 230;
const ABILITY_TOOLTIP_GAP = 8;
const ABILITY_TOOLTIP_VIEWPORT_MARGIN = 8;

const normalizeAbilityType = (value?: string): string => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "Unknown type";
  }
  return trimmed
    .split("_")
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
};

const normalizeStatKey = (value: string): string =>
  value
    .toLowerCase()
    .split("")
    .filter((char) => /[a-z0-9]/.test(char))
    .join("");

const SHIELD_STAT_ALIASES: Record<string, string[]> = {
  tacticalrecovery: ["tactivalrecovery"],
  tactivalrecovery: ["tacticalrecovery"],
};

const parseNumericStatValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const getFirstString = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
};

const getFirstNumber = (record: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const parsed = parseNumericStatValue(record[key]);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
};

const parseImplantModifierList = (
  list: unknown,
): Array<{ normalizedShieldKey: string; numericValue: number }> => {
  if (!Array.isArray(list)) {
    return [];
  }
  const modifiers: Array<{ normalizedShieldKey: string; numericValue: number }> = [];
  list.forEach((entry) => {
    const record = asRecord(entry);
    if (!record) {
      return;
    }
    const rawType = getFirstString(record, ["type", "effect", "stat", "key", "name"]);
    const numericValue = getFirstNumber(record, ["value", "modifier", "amount", "delta", "bonus"]);
    const normalizedShieldKey = normalizeStatKey(rawType);
    if (!normalizedShieldKey || numericValue === null) {
      return;
    }
    modifiers.push({ normalizedShieldKey, numericValue });
  });
  return modifiers;
};

const extractImplantModifiers = (
  implant: ImplantItem | null,
): Array<{ normalizedShieldKey: string; numericValue: number }> => {
  if (!implant) {
    return [];
  }
  const directStats = parseImplantModifierList(implant.stats);
  if (directStats.length > 0) {
    return directStats;
  }
  const implantRecord = implant as unknown as Record<string, unknown>;
  const fallbackSources = ["effects", "modifiers", "bonuses"];
  for (const source of fallbackSources) {
    const parsed = parseImplantModifierList(implantRecord[source]);
    if (parsed.length > 0) {
      return parsed;
    }
  }
  return [];
};

const extractCoreModifiers = (
  core: CoreItem | null,
): Array<{ normalizedShieldKey: string; numericValue: number }> => {
  if (!core) {
    return [];
  }
  const coreRecord = core as unknown as Record<string, unknown>;
  const effectModifiers = parseImplantModifierList(coreRecord.effects);
  const attributes = asRecord(coreRecord.attributes);
  if (!attributes) {
    return effectModifiers;
  }
  const attributeModifiers: Array<{ normalizedShieldKey: string; numericValue: number }> = [];
  Object.entries(attributes).forEach(([key, value]) => {
    const numericValue = parseNumericStatValue(value);
    const normalizedShieldKey = normalizeStatKey(key);
    if (!normalizedShieldKey || numericValue === null) {
      return;
    }
    attributeModifiers.push({ normalizedShieldKey, numericValue });
  });
  return [...effectModifiers, ...attributeModifiers];
};

const resolveRunnerStatKey = (
  normalizedShieldKey: string,
  normalizedRunnerKeyToOriginal: Map<string, string>,
): string | null => {
  const exact = normalizedRunnerKeyToOriginal.get(normalizedShieldKey);
  if (exact) {
    return exact;
  }
  const aliases = SHIELD_STAT_ALIASES[normalizedShieldKey] ?? [];
  for (const alias of aliases) {
    const aliasKey = normalizedRunnerKeyToOriginal.get(alias);
    if (aliasKey) {
      return aliasKey;
    }
  }

  // Fallback for keys with prefixes/suffixes (e.g. "shieldfirewallbonus").
  let bestMatch: string | null = null;
  let bestMatchNormalizedLength = -1;
  for (const [normalizedRunnerKey, originalRunnerKey] of normalizedRunnerKeyToOriginal.entries()) {
    const isMatch =
      normalizedShieldKey.includes(normalizedRunnerKey) ||
      normalizedRunnerKey.includes(normalizedShieldKey);
    if (!isMatch) {
      continue;
    }
    if (normalizedRunnerKey.length > bestMatchNormalizedLength) {
      bestMatch = originalRunnerKey;
      bestMatchNormalizedLength = normalizedRunnerKey.length;
    }
  }
  if (bestMatch) {
    return bestMatch;
  }

  return null;
};

export const RunnerDetailSubPage: React.FC<RunnerDetailSubPageProps> = ({
  runner,
  shields,
  equipments,
  cores,
  headImplants,
  torsoImplants,
  legImplants,
  onBack,
  fallbackRunnerIcon,
}) => {
  const abilitiesContainerRef = useRef<HTMLDivElement | null>(null);
  const shieldDropdownRef = useRef<HTMLDivElement | null>(null);
  const equipmentDropdownRef = useRef<HTMLDivElement | null>(null);
  const coreOneDropdownRef = useRef<HTMLDivElement | null>(null);
  const coreTwoDropdownRef = useRef<HTMLDivElement | null>(null);
  const headImplantDropdownRef = useRef<HTMLDivElement | null>(null);
  const torsoImplantDropdownRef = useRef<HTMLDivElement | null>(null);
  const legImplantDropdownRef = useRef<HTMLDivElement | null>(null);
  const [hoveredAbility, setHoveredAbility] = useState<{
    description: string;
    top: number;
    left: number;
  } | null>(null);
  const [selectedShieldId, setSelectedShieldId] = useState<string>("");
  const [isShieldDropdownOpen, setIsShieldDropdownOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [isEquipmentDropdownOpen, setIsEquipmentDropdownOpen] = useState(false);
  const [selectedCoreOneId, setSelectedCoreOneId] = useState<string>("");
  const [isCoreOneDropdownOpen, setIsCoreOneDropdownOpen] = useState(false);
  const [selectedCoreTwoId, setSelectedCoreTwoId] = useState<string>("");
  const [isCoreTwoDropdownOpen, setIsCoreTwoDropdownOpen] = useState(false);
  const [selectedHeadImplantId, setSelectedHeadImplantId] = useState<string>("");
  const [isHeadImplantDropdownOpen, setIsHeadImplantDropdownOpen] = useState(false);
  const [selectedTorsoImplantId, setSelectedTorsoImplantId] = useState<string>("");
  const [isTorsoImplantDropdownOpen, setIsTorsoImplantDropdownOpen] = useState(false);
  const [selectedLegImplantId, setSelectedLegImplantId] = useState<string>("");
  const [isLegImplantDropdownOpen, setIsLegImplantDropdownOpen] = useState(false);

  const rawStats = runner.stats
    ? (Object.entries(runner.stats) as Array<[string, number]>)
        .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    : [];
  const baseStatLookup = new Map<string, number>(rawStats);
  const normalizedRunnerKeyToOriginal = new Map<string, string>(
    rawStats.map(([key]) => [normalizeStatKey(key), key]),
  );
  const selectedShield = useMemo(
    () => shields.find((shield) => shield.id === selectedShieldId) ?? null,
    [selectedShieldId, shields],
  );
  const selectedEquipment = useMemo(
    () => equipments.find((equipment) => equipment.id === selectedEquipmentId) ?? null,
    [equipments, selectedEquipmentId],
  );
  const selectedCoreOne = useMemo(
    () => cores.find((core) => core.id === selectedCoreOneId) ?? null,
    [cores, selectedCoreOneId],
  );
  const selectedCoreTwo = useMemo(
    () => cores.find((core) => core.id === selectedCoreTwoId) ?? null,
    [cores, selectedCoreTwoId],
  );
  const selectedHeadImplant = useMemo(
    () => headImplants.find((implant) => implant.id === selectedHeadImplantId) ?? null,
    [headImplants, selectedHeadImplantId],
  );
  const selectedTorsoImplant = useMemo(
    () => torsoImplants.find((implant) => implant.id === selectedTorsoImplantId) ?? null,
    [selectedTorsoImplantId, torsoImplants],
  );
  const selectedLegImplant = useMemo(
    () => legImplants.find((implant) => implant.id === selectedLegImplantId) ?? null,
    [legImplants, selectedLegImplantId],
  );

  useEffect(() => {
    if (
      !isShieldDropdownOpen &&
      !isEquipmentDropdownOpen &&
      !isCoreOneDropdownOpen &&
      !isCoreTwoDropdownOpen &&
      !isHeadImplantDropdownOpen &&
      !isTorsoImplantDropdownOpen &&
      !isLegImplantDropdownOpen
    ) {
      return;
    }
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        isShieldDropdownOpen &&
        shieldDropdownRef.current &&
        target &&
        !shieldDropdownRef.current.contains(target)
      ) {
        setIsShieldDropdownOpen(false);
      }
      if (
        isEquipmentDropdownOpen &&
        equipmentDropdownRef.current &&
        target &&
        !equipmentDropdownRef.current.contains(target)
      ) {
        setIsEquipmentDropdownOpen(false);
      }
      if (
        isCoreOneDropdownOpen &&
        coreOneDropdownRef.current &&
        target &&
        !coreOneDropdownRef.current.contains(target)
      ) {
        setIsCoreOneDropdownOpen(false);
      }
      if (
        isCoreTwoDropdownOpen &&
        coreTwoDropdownRef.current &&
        target &&
        !coreTwoDropdownRef.current.contains(target)
      ) {
        setIsCoreTwoDropdownOpen(false);
      }
      if (
        isHeadImplantDropdownOpen &&
        headImplantDropdownRef.current &&
        target &&
        !headImplantDropdownRef.current.contains(target)
      ) {
        setIsHeadImplantDropdownOpen(false);
      }
      if (
        isTorsoImplantDropdownOpen &&
        torsoImplantDropdownRef.current &&
        target &&
        !torsoImplantDropdownRef.current.contains(target)
      ) {
        setIsTorsoImplantDropdownOpen(false);
      }
      if (
        isLegImplantDropdownOpen &&
        legImplantDropdownRef.current &&
        target &&
        !legImplantDropdownRef.current.contains(target)
      ) {
        setIsLegImplantDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [
    isCoreOneDropdownOpen,
    isCoreTwoDropdownOpen,
    isEquipmentDropdownOpen,
    isHeadImplantDropdownOpen,
    isLegImplantDropdownOpen,
    isShieldDropdownOpen,
    isTorsoImplantDropdownOpen,
  ]);
  const itemModifierByRunnerKey = useMemo(() => {
    const map = new Map<string, number>();
    const applyModifiers = (modifiers: Array<{ normalizedShieldKey: string; numericValue: number }>) => {
      modifiers.forEach(({ normalizedShieldKey, numericValue }) => {
        const runnerStatKey = resolveRunnerStatKey(
          normalizedShieldKey,
          normalizedRunnerKeyToOriginal,
        );
        if (!runnerStatKey) {
          return;
        }
        map.set(runnerStatKey, (map.get(runnerStatKey) ?? 0) + numericValue);
      });
    };
    [
      selectedShield,
      selectedEquipment,
      selectedHeadImplant,
      selectedTorsoImplant,
      selectedLegImplant,
    ].forEach((implant) => applyModifiers(extractImplantModifiers(implant)));
    [selectedCoreOne, selectedCoreTwo].forEach((core) => applyModifiers(extractCoreModifiers(core)));
    return map;
  }, [
    normalizedRunnerKeyToOriginal,
    selectedCoreOne,
    selectedCoreTwo,
    selectedEquipment,
    selectedHeadImplant,
    selectedLegImplant,
    selectedShield,
    selectedTorsoImplant,
  ]);
  const effectiveStatLookup = useMemo(() => {
    const map = new Map(baseStatLookup);
    itemModifierByRunnerKey.forEach((modifier, key) => {
      const baseValue = map.get(key);
      if (typeof baseValue !== "number") {
        return;
      }
      map.set(key, baseValue + modifier);
    });
    return map;
  }, [baseStatLookup, itemModifierByRunnerKey]);
  const scaleMax = Math.max(
    100,
    ...Array.from(baseStatLookup.values()),
    ...Array.from(effectiveStatLookup.values()),
  );
  const scalePercent = (value: number): number =>
    Math.max(0, Math.min(100, (value / scaleMax) * 100));

  const buildStat = (key: string) => {
    const baseValue = baseStatLookup.get(key);
    const value = effectiveStatLookup.get(key);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }
    const normalizedBaseValue = typeof baseValue === "number" ? baseValue : value;
    const deltaValue = value - normalizedBaseValue;
    const fillPercent = scalePercent(value);
    const baseFillPercent = scalePercent(normalizedBaseValue);
    const deltaStartPercent = Math.min(baseFillPercent, fillPercent);
    const deltaWidthPercent = Math.abs(fillPercent - baseFillPercent);
    return {
      id: key,
      label: formatStatLabel(key),
      value: formatStatValue(value),
      fillPercent,
      baseFillPercent,
      deltaValue,
      deltaStartPercent,
      deltaWidthPercent,
    };
  };

  const coreStats = CORE_STAT_ORDER
    .map((key) => buildStat(key))
    .filter((entry): entry is NonNullable<ReturnType<typeof buildStat>> => Boolean(entry));

  const utilityStats = UTILITY_STAT_ORDER
    .map((key) => buildStat(key))
    .filter((entry): entry is NonNullable<ReturnType<typeof buildStat>> => Boolean(entry));

  const renderedStatIds = new Set([...coreStats, ...utilityStats].map((entry) => entry.id));
  const uncategorizedStats = rawStats
    .filter(([key]) => !renderedStatIds.has(key))
    .map(([key]) => buildStat(key))
    .filter((entry): entry is NonNullable<ReturnType<typeof buildStat>> => Boolean(entry));
  type RunnerStatEntry = NonNullable<ReturnType<typeof buildStat>>;
  const renderStatLines = (stats: RunnerStatEntry[]) => (
    <div className="runner-stat-lines">
      {stats.map((stat) => (
        <div key={stat.id} className="runner-stat-line">
          <div className="runner-stat-line-header">
            <span>{stat.label}</span>
            <div className="runner-stat-value-group">
              <strong>{stat.value}</strong>
              {stat.deltaValue !== 0 && (
                <span
                  className={`runner-stat-delta ${
                    stat.deltaValue > 0 ? "runner-stat-delta-positive" : "runner-stat-delta-negative"
                  }`}
                >
                  {stat.deltaValue > 0 ? "+" : ""}
                  {stat.deltaValue}
                </span>
              )}
            </div>
          </div>
          <div className="runner-stat-line-track">
            <div
              className="runner-stat-line-fill-base"
              style={{ width: `${stat.baseFillPercent}%` }}
            />
            <div
              className="runner-stat-line-fill"
              style={{ width: `${stat.fillPercent}%` }}
            />
            {stat.deltaWidthPercent > 0 && (
              <div
                className={`runner-stat-line-delta ${
                  stat.deltaValue > 0 ? "runner-stat-delta-positive" : "runner-stat-delta-negative"
                }`}
                style={{
                  left: `${stat.deltaStartPercent}%`,
                  width: `${stat.deltaWidthPercent}%`,
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  type BuilderOption = {
    id: string;
    name: string;
    url?: string;
    rarity?: string;
  };
  const closeAllBuilderDropdowns = () => {
    setIsShieldDropdownOpen(false);
    setIsEquipmentDropdownOpen(false);
    setIsCoreOneDropdownOpen(false);
    setIsCoreTwoDropdownOpen(false);
    setIsHeadImplantDropdownOpen(false);
    setIsTorsoImplantDropdownOpen(false);
    setIsLegImplantDropdownOpen(false);
  };
  const renderBuilderDropdown = (params: {
    label: string;
    options: BuilderOption[];
    selectedId: string;
    selectedOption: BuilderOption | null;
    isOpen: boolean;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
    onToggle: () => void;
    onSelect: (id: string) => void;
    emptyLabel: string;
  }) => {
    const {
      label,
      options,
      selectedId,
      selectedOption,
      isOpen,
      dropdownRef,
      onToggle,
      onSelect,
      emptyLabel,
    } = params;
    return (
      <div className="runner-builder-group" key={label}>
        <span className="runner-builder-label">{label}</span>
        <div ref={dropdownRef} className={`runner-builder-dropdown${isOpen ? " is-open" : ""}`}>
          <button type="button" className="runner-builder-dropdown-trigger" onClick={onToggle}>
            {selectedOption ? (
              <img
                className="runner-builder-option-icon"
                src={selectedOption.url}
                alt={selectedOption.name}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackRunnerIcon;
                }}
              />
            ) : (
              <div className="runner-builder-option-icon runner-builder-option-icon-placeholder">-</div>
            )}
            <div className="runner-builder-dropdown-main">
              <span className="runner-builder-dropdown-name">
                {selectedOption ? selectedOption.name : emptyLabel}
              </span>
            </div>
            <span className="runner-builder-dropdown-chevron">▾</span>
          </button>
          {isOpen && (
            <div className="runner-builder-dropdown-menu">
              <button
                type="button"
                className={`runner-builder-option${selectedId === "" ? " is-selected" : ""}`}
                onClick={() => onSelect("")}
              >
                <div className="runner-builder-option-icon runner-builder-option-icon-placeholder">-</div>
                <div className="runner-builder-option-main">
                  <span className="runner-builder-option-name">{emptyLabel}</span>
                </div>
              </button>
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`runner-builder-option${selectedId === option.id ? " is-selected" : ""}`}
                  onClick={() => onSelect(option.id)}
                >
                  <img
                    className="runner-builder-option-icon"
                    src={option.url}
                    alt={option.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = fallbackRunnerIcon;
                    }}
                  />
                  <div className="runner-builder-option-main">
                    <span className="runner-builder-option-name">{option.name}</span>
                    <span className="runner-builder-option-meta">
                      {option.rarity || "Unknown rarity"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="runner-detail-page">
      <button type="button" className="runner-detail-back" onClick={onBack}>
        Back to runners
      </button>

      <header className="runner-detail-header">
        <div className="runner-detail-hero-row">
          <div className="runner-detail-portrait-wrap">
            <img
              className="runner-detail-portrait"
              src={getImageSource(runner, fallbackRunnerIcon)}
              alt={runner.name}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = fallbackRunnerIcon;
              }}
            />
          </div>
          <section
            ref={abilitiesContainerRef}
            className="runner-detail-abilities-section"
          >
            <div className="runner-detail-title-row">
              <h2 className="runner-detail-stats-title">{runner.name}</h2>
              <span className="runner-detail-stats-subtitle">
                Role: {runner.role || "Unknown"} | Difficulty: {runner.difficulty || "Unknown"}
              </span>
            </div>
            <p className="runner-detail-slot-empty">
              {runner.description || "No runner description available."}
            </p>
            <h3 className="runner-stats-section-title">Abilities</h3>
            {runner.abilities?.length ? (
              <div className="runner-abilities-list">
                {runner.abilities.map((ability, index) => (
                  <article
                    key={`${runner.id}-ability-${ability.name || ability.type || index}`}
                    className="runner-ability-card"
                    onMouseEnter={(event) => {
                      const cardRect = event.currentTarget.getBoundingClientRect();
                        const clampedLeft = Math.max(
                          ABILITY_TOOLTIP_VIEWPORT_MARGIN,
                          Math.min(
                            cardRect.left,
                            window.innerWidth - ABILITY_TOOLTIP_WIDTH - ABILITY_TOOLTIP_VIEWPORT_MARGIN,
                          ),
                        );
                      setHoveredAbility({
                        description: ability.description || "No description available.",
                          top: cardRect.bottom + ABILITY_TOOLTIP_GAP,
                          left: clampedLeft,
                      });
                    }}
                    onMouseLeave={() => setHoveredAbility(null)}
                  >
                    {ability.url ? (
                      <img
                        className="runner-ability-icon"
                        src={ability.url}
                        alt={ability.name || "Runner ability"}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    <div className="runner-ability-main">
                      <div className="runner-ability-title-row">
                        <strong>{ability.name || "Unknown ability"}</strong>
                        <span>{ability.cooldown ? `${ability.cooldown}s` : "N/A"}</span>
                      </div>
                      <div className="runner-ability-type">
                        {normalizeAbilityType(ability.type)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="runner-detail-slot-empty">No abilities available.</p>
            )}
            {hoveredAbility && (
              <div
                className="runner-ability-tooltip-floating"
                style={{ top: `${hoveredAbility.top}px`, left: `${hoveredAbility.left}px` }}
              >
                {hoveredAbility.description}
              </div>
            )}
          </section>
        </div>
      </header>
      <section className="runner-detail-build-stats">
        <section className="runner-detail-builder-section">
          <h3 className="runner-detail-slot-title">Runner</h3>
          <p className="runner-detail-slot-empty">
            {runner.description || "No runner description available."}
          </p>
          <h3 className="runner-detail-slot-title">Runner Builder</h3>
          <div className="runner-builder-controls">
            <div className="runner-builder-row">
              {renderBuilderDropdown({
                label: "Shield",
                options: shields,
                selectedId: selectedShieldId,
                selectedOption: selectedShield,
                isOpen: isShieldDropdownOpen,
                dropdownRef: shieldDropdownRef,
                onToggle: () => {
                  const next = !isShieldDropdownOpen;
                  closeAllBuilderDropdowns();
                  setIsShieldDropdownOpen(next);
                },
                onSelect: (id) => {
                  setSelectedShieldId(id);
                  setIsShieldDropdownOpen(false);
                },
                emptyLabel: "No shield",
              })}
              {renderBuilderDropdown({
                label: "Equipment",
                options: equipments,
                selectedId: selectedEquipmentId,
                selectedOption: selectedEquipment,
                isOpen: isEquipmentDropdownOpen,
                dropdownRef: equipmentDropdownRef,
                onToggle: () => {
                  const next = !isEquipmentDropdownOpen;
                  closeAllBuilderDropdowns();
                  setIsEquipmentDropdownOpen(next);
                },
                onSelect: (id) => {
                  setSelectedEquipmentId(id);
                  setIsEquipmentDropdownOpen(false);
                },
                emptyLabel: "No equipment",
              })}
            </div>
            <div className="runner-builder-row">
              {renderBuilderDropdown({
                label: "Core 1",
                options: cores,
                selectedId: selectedCoreOneId,
                selectedOption: selectedCoreOne,
                isOpen: isCoreOneDropdownOpen,
                dropdownRef: coreOneDropdownRef,
                onToggle: () => {
                  const next = !isCoreOneDropdownOpen;
                  closeAllBuilderDropdowns();
                  setIsCoreOneDropdownOpen(next);
                },
                onSelect: (id) => {
                  setSelectedCoreOneId(id);
                  setIsCoreOneDropdownOpen(false);
                },
                emptyLabel: "No core",
              })}
              {renderBuilderDropdown({
                label: "Core 2",
                options: cores,
                selectedId: selectedCoreTwoId,
                selectedOption: selectedCoreTwo,
                isOpen: isCoreTwoDropdownOpen,
                dropdownRef: coreTwoDropdownRef,
                onToggle: () => {
                  const next = !isCoreTwoDropdownOpen;
                  closeAllBuilderDropdowns();
                  setIsCoreTwoDropdownOpen(next);
                },
                onSelect: (id) => {
                  setSelectedCoreTwoId(id);
                  setIsCoreTwoDropdownOpen(false);
                },
                emptyLabel: "No core",
              })}
            </div>
            <div className="runner-builder-row">
              {renderBuilderDropdown({
                label: "Head Implant",
                options: headImplants,
                selectedId: selectedHeadImplantId,
                selectedOption: selectedHeadImplant,
                isOpen: isHeadImplantDropdownOpen,
                dropdownRef: headImplantDropdownRef,
                onToggle: () => {
                  const next = !isHeadImplantDropdownOpen;
                  closeAllBuilderDropdowns();
                  setIsHeadImplantDropdownOpen(next);
                },
                onSelect: (id) => {
                  setSelectedHeadImplantId(id);
                  setIsHeadImplantDropdownOpen(false);
                },
                emptyLabel: "No head implant",
              })}
              {renderBuilderDropdown({
                label: "Torso Implant",
                options: torsoImplants,
                selectedId: selectedTorsoImplantId,
                selectedOption: selectedTorsoImplant,
                isOpen: isTorsoImplantDropdownOpen,
                dropdownRef: torsoImplantDropdownRef,
                onToggle: () => {
                  const next = !isTorsoImplantDropdownOpen;
                  closeAllBuilderDropdowns();
                  setIsTorsoImplantDropdownOpen(next);
                },
                onSelect: (id) => {
                  setSelectedTorsoImplantId(id);
                  setIsTorsoImplantDropdownOpen(false);
                },
                emptyLabel: "No torso implant",
              })}
              {renderBuilderDropdown({
                label: "Leg Implant",
                options: legImplants,
                selectedId: selectedLegImplantId,
                selectedOption: selectedLegImplant,
                isOpen: isLegImplantDropdownOpen,
                dropdownRef: legImplantDropdownRef,
                onToggle: () => {
                  const next = !isLegImplantDropdownOpen;
                  closeAllBuilderDropdowns();
                  setIsLegImplantDropdownOpen(next);
                },
                onSelect: (id) => {
                  setSelectedLegImplantId(id);
                  setIsLegImplantDropdownOpen(false);
                },
                emptyLabel: "No leg implant",
              })}
            </div>
          </div>
          <p className="runner-detail-slot-empty">
            Select shield, equipment, cores, and implants to modify runner stats.
          </p>
        </section>
        <section className="runner-detail-stats-space">
          <div className="runner-stats-column">
            <h3 className="runner-stats-section-title">Core Stats</h3>
            {renderStatLines(coreStats)}
            <h3 className="runner-stats-section-title">Utility Stats</h3>
            {renderStatLines(utilityStats)}
            {uncategorizedStats.length > 0 && (
              <>
                <h3 className="runner-stats-section-title">Other Stats</h3>
                {renderStatLines(uncategorizedStats)}
              </>
            )}
          </div>
        </section>
      </section>
    </section>
  );
};
