import React, { useEffect, useMemo, useRef, useState } from "react";
import { CoreItem, ImplantItem, Runner } from "../../../model/items/IItemsElements";
import { ItemHoverPopup } from "../../components/items/ItemHoverPopup";
import { RarityPatternBackground } from "../../components/rarity/RarityPatternBackground";

type RunnerDetailSubPageProps = {
  runner: Runner;
  shields: ImplantItem[];
  equipments: ImplantItem[];
  cores: CoreItem[];
  headImplants: ImplantItem[];
  torsoImplants: ImplantItem[];
  legImplants: ImplantItem[];
  isEditingEnabled: boolean;
  rarityOptions: string[];
  roleOptions: string[];
  difficultyOptions: string[];
  onUpdateTextField: (
    runnerId: string,
    field:
      | "name"
      | "description"
      | "rarity"
      | "role"
      | "difficulty"
      | "heroUrl"
      | "portraitUrl",
    value: string,
  ) => void;
  onUpdateStat: (runnerId: string, statKey: string, rawValue: string) => void;
  onUpdateAbilityTextField: (
    runnerId: string,
    abilityIndex: number,
    field: "name" | "description",
    value: string,
  ) => void;
  onUpdateAbilityCooldown: (runnerId: string, abilityIndex: number, rawValue: string) => void;
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

const getBuilderItemRarityClass = (rarity?: string): string => {
  const normalized = (rarity ?? "").trim().toLowerCase();
  if (normalized.includes("legendary") || normalized.includes("exotic")) {
    return "runner-builder-item-rarity-legendary";
  }
  if (normalized.includes("epic") || normalized.includes("heroic")) {
    return "runner-builder-item-rarity-epic";
  }
  if (normalized.includes("rare")) {
    return "runner-builder-item-rarity-rare";
  }
  if (normalized.includes("uncommon")) {
    return "runner-builder-item-rarity-uncommon";
  }
  if (normalized.includes("common") || normalized.includes("standard")) {
    return "runner-builder-item-rarity-common";
  }
  return "runner-builder-item-rarity-default";
};

const normalizeStatKey = (value: string): string =>
  value
    .toLowerCase()
    .split("")
    .filter((char) => /[a-z0-9]/.test(char))
    .join("");

const normalizeRunnerCompatibilityKey = (value: string): string => normalizeStatKey(value);
const BUILDER_SELECTOR_ESTIMATED_HEIGHT = 300;

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
  isEditingEnabled,
  rarityOptions,
  roleOptions,
  difficultyOptions,
  onUpdateTextField,
  onUpdateStat,
  onUpdateAbilityTextField,
  onUpdateAbilityCooldown,
  onBack,
  fallbackRunnerIcon,
}) => {
  type BuilderSlotKey =
    | "shield"
    | "equipment"
    | "coreOne"
    | "coreTwo"
    | "headImplant"
    | "torsoImplant"
    | "legImplant";
  const builderSectionRef = useRef<HTMLDivElement | null>(null);
  const slotWrapRefs = useRef<Partial<Record<BuilderSlotKey, HTMLDivElement | null>>>({});
  const slotSelectorRefs = useRef<Partial<Record<BuilderSlotKey, HTMLElement | null>>>({});
  const [selectedShieldId, setSelectedShieldId] = useState<string>("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [selectedCoreOneId, setSelectedCoreOneId] = useState<string>("");
  const [selectedCoreTwoId, setSelectedCoreTwoId] = useState<string>("");
  const [selectedHeadImplantId, setSelectedHeadImplantId] = useState<string>("");
  const [selectedTorsoImplantId, setSelectedTorsoImplantId] = useState<string>("");
  const [selectedLegImplantId, setSelectedLegImplantId] = useState<string>("");
  const [activeBuilderSlot, setActiveBuilderSlot] = useState<BuilderSlotKey | null>(null);
  const [selectorPlacementBySlot, setSelectorPlacementBySlot] = useState<
    Partial<Record<BuilderSlotKey, "above" | "below">>
  >({});
  const [hoveredBuilderItemPopup, setHoveredBuilderItemPopup] = useState<{
    item: BuilderOption;
    typeLabel: string;
    placement: "left" | "right" | "below";
    top: number;
    left: number;
  } | null>(null);
  const [builderSearchTerm, setBuilderSearchTerm] = useState("");

  const rawStats = runner.stats
    ? (Object.entries(runner.stats) as Array<[string, number]>)
        .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    : [];
  const baseStatLookup = new Map<string, number>(rawStats);
  const normalizedRunnerKeyToOriginal = new Map<string, string>(
    rawStats.map(([key]) => [normalizeStatKey(key), key]),
  );
  const compatibleCores = useMemo(() => {
    const normalizedRunnerIdentifiers = new Set(
      [runner.id, runner.name, runner.role, ...(runner.tags ?? [])]
        .map((value) => normalizeRunnerCompatibilityKey(value ?? ""))
        .filter(Boolean),
    );
    return cores.filter((core) => {
      if (!Array.isArray(core.runnerType) || core.runnerType.length === 0) {
        return true;
      }
      return core.runnerType.some((runnerTypeValue) =>
        normalizedRunnerIdentifiers.has(normalizeRunnerCompatibilityKey(runnerTypeValue ?? "")),
      );
    });
  }, [cores, runner.id, runner.name, runner.role, runner.tags]);
  const selectedShield = useMemo(
    () => shields.find((shield) => shield.id === selectedShieldId) ?? null,
    [selectedShieldId, shields],
  );
  const selectedEquipment = useMemo(
    () => equipments.find((equipment) => equipment.id === selectedEquipmentId) ?? null,
    [equipments, selectedEquipmentId],
  );
  const selectedCoreOne = useMemo(
    () => compatibleCores.find((core) => core.id === selectedCoreOneId) ?? null,
    [compatibleCores, selectedCoreOneId],
  );
  const selectedCoreTwo = useMemo(
    () => compatibleCores.find((core) => core.id === selectedCoreTwoId) ?? null,
    [compatibleCores, selectedCoreTwoId],
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
    if (!activeBuilderSlot) {
      return;
    }
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !builderSectionRef.current) {
        return;
      }
      if (!builderSectionRef.current.contains(target)) {
        setActiveBuilderSlot(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [activeBuilderSlot]);
  useEffect(() => {
    setBuilderSearchTerm("");
    setHoveredBuilderItemPopup(null);
  }, [activeBuilderSlot]);
  const resolveSelectorPlacement = (slotKey: BuilderSlotKey): "above" | "below" => {
    const slotWrap = slotWrapRefs.current[slotKey];
    if (!slotWrap) {
      return "below";
    }
    const margin = 8;
    const slotRect = slotWrap.getBoundingClientRect();
    const spaceBelow = globalThis.innerHeight - slotRect.bottom - margin;
    const spaceAbove = slotRect.top - margin;
    return spaceBelow < BUILDER_SELECTOR_ESTIMATED_HEIGHT && spaceAbove > spaceBelow
      ? "above"
      : "below";
  };
  const toggleBuilderSlot = (slotKey: BuilderSlotKey) => {
    setActiveBuilderSlot((previous) => {
      if (previous === slotKey) {
        return null;
      }
      const nextPlacement = resolveSelectorPlacement(slotKey);
      setSelectorPlacementBySlot((placementPrevious) => ({
        ...placementPrevious,
        [slotKey]: nextPlacement,
      }));
      return slotKey;
    });
  };
  useEffect(() => {
    if (!activeBuilderSlot) {
      return;
    }
    const updatePlacement = () => {
      const slotWrap = slotWrapRefs.current[activeBuilderSlot];
      const selectorPanel = slotSelectorRefs.current[activeBuilderSlot];
      if (!slotWrap || !selectorPanel) {
        return;
      }
      const margin = 8;
      const slotRect = slotWrap.getBoundingClientRect();
      const selectorRect = selectorPanel.getBoundingClientRect();
      const spaceBelow = globalThis.innerHeight - slotRect.bottom - margin;
      const spaceAbove = slotRect.top - margin;
      const nextPlacement: "above" | "below" =
        spaceBelow < selectorRect.height && spaceAbove > spaceBelow ? "above" : "below";
      setSelectorPlacementBySlot((previous) => {
        if (previous[activeBuilderSlot] === nextPlacement) {
          return previous;
        }
        return { ...previous, [activeBuilderSlot]: nextPlacement };
      });
    };
    const animationFrameId = globalThis.requestAnimationFrame(updatePlacement);
    globalThis.addEventListener("resize", updatePlacement);
    globalThis.addEventListener("scroll", updatePlacement, true);
    return () => {
      globalThis.cancelAnimationFrame(animationFrameId);
      globalThis.removeEventListener("resize", updatePlacement);
      globalThis.removeEventListener("scroll", updatePlacement, true);
    };
  }, [activeBuilderSlot, builderSearchTerm]);
  useEffect(() => {
    if (selectedCoreOneId && !compatibleCores.some((core) => core.id === selectedCoreOneId)) {
      setSelectedCoreOneId("");
    }
    if (selectedCoreTwoId && !compatibleCores.some((core) => core.id === selectedCoreTwoId)) {
      setSelectedCoreTwoId("");
    }
  }, [compatibleCores, selectedCoreOneId, selectedCoreTwoId]);
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
  const getStatInputValue = (key: string): string => {
    const value = baseStatLookup.get(key);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return "";
    }
    return String(value);
  };

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
              {!isEditingEnabled && <strong>{stat.value}</strong>}
              {isEditingEnabled && (
                <input
                  className="runner-dev-stat-input"
                  value={getStatInputValue(stat.id)}
                  onChange={(event) => onUpdateStat(runner.id, stat.id, event.target.value)}
                  type="number"
                  step="any"
                  aria-label={`${stat.label} value`}
                />
              )}
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
    description?: string;
    type?: string;
    slotType?: string;
    value?: number | null;
    runnerType?: string[];
  };
  type BuilderSlot = {
    key: BuilderSlotKey;
    label: string;
    typeLabel: string;
    emptyLabel: string;
    options: BuilderOption[];
    selectedId: string;
    selectedOption: BuilderOption | null;
    onSelect: (id: string) => void;
  };
  const builderSlots: BuilderSlot[] = [
    {
      key: "shield",
      label: "Shield",
      typeLabel: "Shield",
      emptyLabel: "No shield",
      options: shields,
      selectedId: selectedShieldId,
      selectedOption: selectedShield,
      onSelect: setSelectedShieldId,
    },
    {
      key: "equipment",
      label: "Equipment",
      typeLabel: "Equipment",
      emptyLabel: "No equipment",
      options: equipments,
      selectedId: selectedEquipmentId,
      selectedOption: selectedEquipment,
      onSelect: setSelectedEquipmentId,
    },
    {
      key: "coreOne",
      label: "Core 1",
      typeLabel: "Core",
      emptyLabel: "No core",
      options: compatibleCores,
      selectedId: selectedCoreOneId,
      selectedOption: selectedCoreOne,
      onSelect: setSelectedCoreOneId,
    },
    {
      key: "coreTwo",
      label: "Core 2",
      typeLabel: "Core",
      emptyLabel: "No core",
      options: compatibleCores,
      selectedId: selectedCoreTwoId,
      selectedOption: selectedCoreTwo,
      onSelect: setSelectedCoreTwoId,
    },
    {
      key: "headImplant",
      label: "Head Implant",
      typeLabel: "Implant",
      emptyLabel: "No head implant",
      options: headImplants,
      selectedId: selectedHeadImplantId,
      selectedOption: selectedHeadImplant,
      onSelect: setSelectedHeadImplantId,
    },
    {
      key: "torsoImplant",
      label: "Torso Implant",
      typeLabel: "Implant",
      emptyLabel: "No torso implant",
      options: torsoImplants,
      selectedId: selectedTorsoImplantId,
      selectedOption: selectedTorsoImplant,
      onSelect: setSelectedTorsoImplantId,
    },
    {
      key: "legImplant",
      label: "Leg Implant",
      typeLabel: "Implant",
      emptyLabel: "No leg implant",
      options: legImplants,
      selectedId: selectedLegImplantId,
      selectedOption: selectedLegImplant,
      onSelect: setSelectedLegImplantId,
    },
  ];
  const showBuilderItemPopup = (
    item: BuilderOption,
    typeLabel: string,
    trigger: HTMLButtonElement,
  ) => {
    const container = trigger.closest<HTMLElement>(
      ".weapons-page-container, .runners-page-container, .weapons-page, .runners-page",
    );
    const triggerRect = trigger.getBoundingClientRect();
    const containerRect = container?.getBoundingClientRect();
    const popupWidth = 360;
    const gap = 10;
    const rightBoundary = containerRect?.right ?? window.innerWidth;
    const spaceRight = rightBoundary - triggerRect.right;
    const leftBoundary = containerRect?.left ?? 0;
    const spaceLeft = triggerRect.left - leftBoundary;
    let placement: "left" | "right" | "below" = "right";
    if (spaceRight < popupWidth + gap) {
      placement = spaceLeft >= popupWidth + gap ? "left" : "below";
    }

    const top =
      placement === "below"
        ? triggerRect.bottom + 8
        : triggerRect.top + triggerRect.height / 2;
    let unclampedLeft = triggerRect.left;
    if (placement === "right") {
      unclampedLeft = triggerRect.right + gap;
    } else if (placement === "left") {
      unclampedLeft = triggerRect.left - gap;
    }
    const maxLeft = Math.max(8, window.innerWidth - popupWidth - 8);
    const left = Math.max(8, Math.min(unclampedLeft, maxLeft));

    setHoveredBuilderItemPopup((previous) => {
      if (
        previous?.item.id === item.id &&
        previous?.placement === placement &&
        previous?.top === top &&
        previous?.left === left
      ) {
        return previous;
      }
      return { item, typeLabel, placement, top, left };
    });
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
          <section className="runner-detail-abilities-section">
            {!isEditingEnabled && (
              <>
                <div className="runner-detail-title-row">
                  <h2 className="runner-detail-stats-title">{runner.name}</h2>
                  <span className="runner-detail-stats-subtitle">
                    Role: {runner.role || "Unknown"} | Difficulty: {runner.difficulty || "Unknown"}
                  </span>
                </div>
                <p className="runner-detail-slot-empty">
                  {runner.description || "No runner description available."}
                </p>
              </>
            )}
            {isEditingEnabled && (
              <div className="runner-dev-edit-grid">
                <input
                  className="runner-dev-edit-input"
                  value={runner.name ?? ""}
                  onChange={(event) => onUpdateTextField(runner.id, "name", event.target.value)}
                  placeholder="Name"
                />
                <select
                  className="runner-dev-edit-input"
                  value={runner.rarity ?? ""}
                  onChange={(event) => onUpdateTextField(runner.id, "rarity", event.target.value)}
                >
                  <option value="">Unknown</option>
                  {rarityOptions.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
                <select
                  className="runner-dev-edit-input"
                  value={runner.role ?? ""}
                  onChange={(event) => onUpdateTextField(runner.id, "role", event.target.value)}
                >
                  <option value="">Unknown role</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select
                  className="runner-dev-edit-input"
                  value={runner.difficulty ?? ""}
                  onChange={(event) => onUpdateTextField(runner.id, "difficulty", event.target.value)}
                >
                  <option value="">Unknown difficulty</option>
                  {difficultyOptions.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
                <input
                  className="runner-dev-edit-input"
                  value={runner.heroUrl ?? ""}
                  onChange={(event) => onUpdateTextField(runner.id, "heroUrl", event.target.value)}
                  placeholder="Hero image URL"
                />
                <input
                  className="runner-dev-edit-input"
                  value={runner.portraitUrl ?? ""}
                  onChange={(event) => onUpdateTextField(runner.id, "portraitUrl", event.target.value)}
                  placeholder="Portrait image URL"
                />
                <textarea
                  className="runner-dev-edit-textarea"
                  value={runner.description ?? ""}
                  onChange={(event) => onUpdateTextField(runner.id, "description", event.target.value)}
                  placeholder="Description"
                />
              </div>
            )}
            <h3 className="runner-stats-section-title">Abilities</h3>
            {runner.abilities?.length ? (
              <div className="runner-abilities-list">
                {runner.abilities.map((ability, index) => (
                  <article
                    key={`${runner.id}-ability-${ability.name || ability.type || index}`}
                    className="runner-ability-card"
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
                        {!isEditingEnabled && <strong>{ability.name || "Unknown ability"}</strong>}
                        {!isEditingEnabled && <span>{ability.cooldown ? `${ability.cooldown}s` : ""}</span>}
                        {isEditingEnabled && (
                          <input
                            className="runner-dev-edit-input"
                            value={ability.name ?? ""}
                            onChange={(event) =>
                              onUpdateAbilityTextField(runner.id, index, "name", event.target.value)
                            }
                            placeholder="Ability name"
                          />
                        )}
                        {isEditingEnabled && (
                          <input
                            className="runner-dev-stat-input"
                            value={
                              typeof ability.cooldown === "number" && Number.isFinite(ability.cooldown)
                                ? String(ability.cooldown)
                                : ""
                            }
                            onChange={(event) =>
                              onUpdateAbilityCooldown(runner.id, index, event.target.value)
                            }
                            type="number"
                            step="any"
                            min={0}
                            aria-label={`${ability.name || "Ability"} cooldown`}
                            placeholder="Cooldown (s)"
                          />
                        )}
                      </div>
                      {!isEditingEnabled && (
                        <p className="runner-ability-description">
                          {ability.description || "No description available."}
                        </p>
                      )}
                      {isEditingEnabled && (
                        <textarea
                          className="runner-dev-edit-textarea"
                          value={ability.description ?? ""}
                          onChange={(event) =>
                            onUpdateAbilityTextField(
                              runner.id,
                              index,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Ability description"
                        />
                      )}
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
          </section>
        </div>
      </header>
      <section className="runner-detail-build-stats">
        <section className="runner-detail-builder-section">
          <h3 className="runner-detail-slot-title">Runner Builder</h3>
          <div ref={builderSectionRef} className="runner-builder-controls">
            <div className="runner-builder-slots-grid">
              {builderSlots.map((slot) => {
                const isOpen = activeBuilderSlot === slot.key;
                const selectedRarityClass = getBuilderItemRarityClass(slot.selectedOption?.rarity);
                const selectorPlacement = selectorPlacementBySlot[slot.key] ?? "below";
                const normalizedSearch = builderSearchTerm.trim().toLowerCase();
                const filteredOptions =
                  normalizedSearch.length === 0
                    ? slot.options
                    : slot.options.filter((option) => {
                        const searchable = [
                          option.name,
                          option.rarity,
                          option.type,
                          option.slotType,
                          option.description,
                        ]
                          .filter(Boolean)
                          .join(" ")
                          .toLowerCase();
                        return searchable.includes(normalizedSearch);
                      });
                return (
                  <div
                    key={slot.key}
                    className="runner-builder-slot-wrap"
                    ref={(node) => {
                      slotWrapRefs.current[slot.key] = node;
                    }}
                  >
                    <button
                      type="button"
                      className={`runner-builder-slot ${isOpen ? "is-open" : ""}`}
                      onClick={() => toggleBuilderSlot(slot.key)}
                      aria-expanded={isOpen}
                      aria-controls={`runner-builder-selector-${normalizeStatKey(slot.key)}`}
                    >
                      <span className="runner-builder-slot-label">{slot.label}</span>
                      <span className="runner-builder-slot-content">
                        {slot.selectedOption ? (
                          <div className={`runner-builder-item-thumbnail-wrap ${selectedRarityClass}`}>
                            <RarityPatternBackground
                              rarity={slot.selectedOption.rarity}
                              className="runner-builder-item-thumbnail-pattern"
                            />
                            <img
                              className="runner-builder-item-thumbnail"
                              src={slot.selectedOption.url}
                              alt={slot.selectedOption.name}
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = fallbackRunnerIcon;
                              }}
                            />
                          </div>
                        ) : (
                          <div className="runner-builder-item-thumbnail-wrap runner-builder-item-rarity-default">
                            <RarityPatternBackground className="runner-builder-item-thumbnail-pattern" />
                            <div className="runner-builder-item-thumbnail runner-builder-item-icon-placeholder">
                              +
                            </div>
                          </div>
                        )}
                        <div className="runner-builder-slot-main">
                          <span className="runner-builder-slot-name">
                            {slot.selectedOption?.name ?? `Select ${slot.label}`}
                          </span>
                          <span className="runner-builder-slot-meta">
                            {slot.selectedOption
                              ? slot.selectedOption.rarity || "Unknown rarity"
                              : `${slot.options.length} options`}
                          </span>
                        </div>
                        <span className={`runner-builder-slot-chevron ${selectedRarityClass}`}>▾</span>
                      </span>
                    </button>
                    {isOpen && (
                      <section
                        className={`runner-builder-selector runner-builder-selector--${selectorPlacement}`}
                        id={`runner-builder-selector-${normalizeStatKey(slot.key)}`}
                        aria-label={`${slot.label} selector`}
                        ref={(node) => {
                          slotSelectorRefs.current[slot.key] = node;
                        }}
                      >
                        <div className="runner-builder-selector-header">
                          <strong>{slot.label}</strong>
                          <span>Select an item to modify runner stats</span>
                        </div>
                        <input
                          className="runner-builder-selector-search"
                          type="search"
                          placeholder={`Search ${slot.label.toLowerCase()}...`}
                          value={builderSearchTerm}
                          onChange={(event) => setBuilderSearchTerm(event.target.value)}
                          aria-label={`Search ${slot.label}`}
                        />
                        <div className="runner-builder-selector-grid">
                          <button
                            type="button"
                            className={`runner-builder-item-option ${
                              slot.selectedId === "" ? "is-selected" : ""
                            }`}
                            onClick={() => {
                              slot.onSelect("");
                              setActiveBuilderSlot(null);
                            }}
                          >
                            <div className="runner-builder-item-thumbnail-wrap runner-builder-item-rarity-default">
                              <RarityPatternBackground className="runner-builder-item-thumbnail-pattern" />
                              <div className="runner-builder-item-thumbnail runner-builder-item-icon-placeholder">
                                -
                              </div>
                            </div>
                            <div className="runner-builder-item-option-main">
                              <span className="runner-builder-item-option-name">{slot.emptyLabel}</span>
                              <span className="runner-builder-item-option-meta">Clear this slot</span>
                            </div>
                          </button>
                          {filteredOptions.map((option) => {
                            return (
                              <button
                                key={option.id}
                                type="button"
                                className={`runner-builder-item-option ${
                                  slot.selectedId === option.id ? "is-selected" : ""
                                }`}
                                onClick={() => {
                                  slot.onSelect(option.id);
                                  setActiveBuilderSlot(null);
                                }}
                                onMouseEnter={(event) =>
                                  showBuilderItemPopup(option, slot.typeLabel, event.currentTarget)
                                }
                                onFocus={(event) =>
                                  showBuilderItemPopup(option, slot.typeLabel, event.currentTarget)
                                }
                                onMouseLeave={() => setHoveredBuilderItemPopup(null)}
                                onBlur={() => setHoveredBuilderItemPopup(null)}
                              >
                                <div
                                  className={`runner-builder-item-thumbnail-wrap ${getBuilderItemRarityClass(
                                    option.rarity,
                                  )}`}
                                >
                                  <RarityPatternBackground
                                    rarity={option.rarity}
                                    className="runner-builder-item-thumbnail-pattern"
                                  />
                                  <img
                                    className="runner-builder-item-thumbnail"
                                    src={option.url}
                                    alt={option.name}
                                    loading="lazy"
                                    onError={(event) => {
                                      event.currentTarget.onerror = null;
                                      event.currentTarget.src = fallbackRunnerIcon;
                                    }}
                                  />
                                </div>
                                <div className="runner-builder-item-option-main">
                                  <span className="runner-builder-item-option-name">{option.name}</span>
                                  <span className="runner-builder-item-option-meta">
                                    {option.rarity || "Unknown rarity"} | {option.type || option.slotType || "Item"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                          {filteredOptions.length === 0 && (
                            <p className="runner-builder-selector-empty">No items match your search.</p>
                          )}
                        </div>
                        {hoveredBuilderItemPopup && (
                          <div
                            className={`runner-builder-item-popup-floating runner-builder-item-popup-floating--${hoveredBuilderItemPopup.placement}`}
                            style={{
                              top: `${hoveredBuilderItemPopup.top}px`,
                              left: `${hoveredBuilderItemPopup.left}px`,
                            }}
                          >
                            <ItemHoverPopup
                              item={hoveredBuilderItemPopup.item}
                              placement={hoveredBuilderItemPopup.placement}
                              typeLabel={hoveredBuilderItemPopup.typeLabel}
                              className="runner-builder-item-popup"
                            />
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
