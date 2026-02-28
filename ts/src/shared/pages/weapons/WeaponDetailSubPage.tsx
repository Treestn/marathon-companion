import React, { useEffect, useMemo, useRef, useState } from "react";
import { ModItem, WeaponItem } from "../../../model/items/IItemsElements";
import { ItemHoverPopup } from "../../components/items/ItemHoverPopup";
import { RarityPatternBackground } from "../../components/rarity/RarityPatternBackground";

type AmmoLookupEntry = {
  name: string;
  url?: string;
};

type GeneralItemEntry = {
  id: string;
  name?: string;
  url?: string;
};

type WeaponDetailSubPageProps = {
  weapon: WeaponItem;
  ammoId?: string;
  generalItems: GeneralItemEntry[];
  mods: ModItem[];
  onBack: () => void;
  fallbackWeaponIcon: string;
};

const STAT_POSITIVE_IS_IMPROVEMENT: Record<string, boolean> = {
  firepower: true,
  accuracy: true,
  handling: true,
  range: true,
  magazine: true,
  zoom: true,
  rateOfFire: true,
  reloadSpeed: false,
  aimAssist: true,
  recoil: false,
  precision: true,
};

const formatStatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "N/A";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "N/A";
    }
    return value
      .map((entry) => {
        if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
          return String(entry);
        }
        if (entry === null || entry === undefined) {
          return "N/A";
        }
        try {
          return JSON.stringify(entry);
        } catch {
          return "N/A";
        }
      })
      .join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "N/A";
    }
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "N/A";
};

const normalizeStatKey = (value: string): string =>
  value
    .toLowerCase()
    .split("")
    .filter((char) => /[a-z0-9]/.test(char))
    .join("");

const formatMetricValue = (value: unknown, suffix?: string): string => {
  if (value === null || value === undefined) {
    return "N/A";
  }
  if (typeof value === "number") {
    if (!suffix) {
      return String(value);
    }
    return `${value}${suffix}`;
  }
  const formatted = formatStatValue(value);
  if (formatted === "N/A") {
    return "N/A";
  }
  return formatted;
};

const parseNumericMetricValue = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getStatValueByAliases = (
  statLookup: Record<string, unknown>,
  aliases: string[],
): unknown => {
  for (const alias of aliases) {
    const value = statLookup[normalizeStatKey(alias)];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return null;
};

const getModRarityClass = (rarity?: string): string => {
  const normalized = (rarity ?? "").trim().toLowerCase();
  if (normalized.includes("legendary") || normalized.includes("exotic")) {
    return "weapon-mod-rarity-legendary";
  }
  if (normalized.includes("epic") || normalized.includes("heroic")) {
    return "weapon-mod-rarity-epic";
  }
  if (normalized.includes("rare")) {
    return "weapon-mod-rarity-rare";
  }
  if (normalized.includes("uncommon")) {
    return "weapon-mod-rarity-uncommon";
  }
  if (
    normalized.includes("common") ||
    normalized.includes("standard") ||
    normalized.includes("basic")
  ) {
    return "weapon-mod-rarity-common";
  }
  return "weapon-mod-rarity-default";
};

const getWeaponRarityTagClass = (rarity?: string): string => {
  const normalized = (rarity ?? "").trim().toLowerCase();
  if (normalized.includes("legendary")) {
    return "weapon-rarity-tag-legendary";
  }
  if (normalized.includes("epic")) {
    return "weapon-rarity-tag-epic";
  }
  if (normalized.includes("rare")) {
    return "weapon-rarity-tag-rare";
  }
  if (normalized.includes("uncommon")) {
    return "weapon-rarity-tag-uncommon";
  }
  if (normalized.includes("common")) {
    return "weapon-rarity-tag-common";
  }
  return "weapon-rarity-tag-default";
};

const getModEffectsList = (mod: ModItem): string[] => {
  if (!Array.isArray(mod.effects) || mod.effects.length === 0) {
    return [];
  }
  return mod.effects.map((effect) => {
    const numericModifier = Number(effect.modifier);
    const prefix = Number.isFinite(numericModifier) && numericModifier > 0 ? "+" : "";
    return `${effect.effect}: ${prefix}${effect.modifier}`;
  });
};

export const WeaponDetailSubPage: React.FC<WeaponDetailSubPageProps> = ({
  weapon,
  ammoId,
  generalItems,
  mods,
  onBack,
  fallbackWeaponIcon,
}) => {
  const moddingSectionRef = useRef<HTMLDivElement | null>(null);
  type MeterStat = {
    id: string;
    label: string;
    value: string;
    fillPercent: number;
    baseFillPercent: number;
    deltaValue: number | null;
    deltaLabel: string;
    deltaStartPercent: number;
    deltaWidthPercent: number;
    deltaClassName: string;
  };

  const statEntries = Object.entries(weapon.stats ?? {});
  const baseStatLookup = useMemo(
    () =>
      statEntries.reduce<Record<string, unknown>>((acc, [key, value]) => {
        acc[normalizeStatKey(key)] = value;
        return acc;
      }, {}),
    [statEntries],
  );
  const getTtkVariantClass = (label: string): string => {
    const normalized = label.toLowerCase().split(/\s+/).join("");
    if (normalized.includes("noshield")) {
      return "weapon-ttk-card-none";
    }
    if (normalized.includes("green")) {
      return "weapon-ttk-card-green";
    }
    if (normalized.includes("blue")) {
      return "weapon-ttk-card-blue";
    }
    if (normalized.includes("purple")) {
      return "weapon-ttk-card-purple";
    }
    return "";
  };
  const getTtkPatternColorRgb = (label: string): string => {
    const normalized = label.toLowerCase().split(/\s+/).join("");
    if (normalized.includes("green")) {
      return "108, 255, 171";
    }
    if (normalized.includes("blue")) {
      return "96, 188, 255";
    }
    if (normalized.includes("purple")) {
      return "199, 134, 255";
    }
    return "217, 230, 255";
  };

  const normalizedWeaponModTypes = (weapon.modTypes ?? [])
    .map((type) => (type ?? "").trim())
    .filter(Boolean);
  const weaponModTypeRows = useMemo(
    () =>
      normalizedWeaponModTypes.map((modType) => {
        const matchingMods = mods
          .filter((mod) => (mod.type ?? "").trim().toLowerCase() === modType.toLowerCase())
          .sort((a, b) => a.name.localeCompare(b.name));
        return { modType, matchingMods };
      }),
    [mods, normalizedWeaponModTypes],
  );
  const [selectedModsByType, setSelectedModsByType] = useState<Record<string, string>>({});
  const [openModType, setOpenModType] = useState<string | null>(null);
  const [popupDirectionByModId, setPopupDirectionByModId] = useState<
    Record<string, "left" | "right" | "below">
  >({});
  const updatePopupDirection = (modId: string, trigger: HTMLButtonElement) => {
    const popupElement = trigger.querySelector<HTMLElement>(".item-hover-popup");
    if (!popupElement) {
      return;
    }
    const container = trigger.closest<HTMLElement>(
      ".weapons-page-container, .runners-page-container, .weapons-page, .runners-page",
    );
    const triggerRect = trigger.getBoundingClientRect();
    const containerRect = container?.getBoundingClientRect();
    const popupWidth = popupElement.offsetWidth || 360;
    const gap = 10;
    const rightBoundary = containerRect?.right ?? window.innerWidth;
    const spaceRight = rightBoundary - triggerRect.right;
    const leftBoundary = containerRect?.left ?? 0;
    const spaceLeft = triggerRect.left - leftBoundary;
    let nextDirection: "left" | "right" | "below" = "right";
    if (spaceRight < popupWidth + gap) {
      nextDirection = spaceLeft >= popupWidth + gap ? "left" : "below";
    }

    setPopupDirectionByModId((previous) => {
      if (previous[modId] === nextDirection) {
        return previous;
      }
      return { ...previous, [modId]: nextDirection };
    });
  };
  const setModSelection = (modType: string, modId: string) => {
    setSelectedModsByType((previous) => ({
      ...previous,
      [modType]: modId,
    }));
    setOpenModType(null);
  };
  const activeModTypeRow = useMemo(
    () => weaponModTypeRows.find(({ modType }) => modType === openModType) ?? null,
    [openModType, weaponModTypeRows],
  );

  useEffect(() => {
    if (!openModType) {
      return;
    }
    const stillExists = weaponModTypeRows.some(({ modType }) => modType === openModType);
    if (!stillExists) {
      setOpenModType(null);
    }
  }, [openModType, weaponModTypeRows]);

  useEffect(() => {
    if (!openModType) {
      return;
    }
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !moddingSectionRef.current) {
        return;
      }
      if (!moddingSectionRef.current.contains(target)) {
        setOpenModType(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [openModType]);

  const selectedMods = useMemo(() => {
    return weaponModTypeRows
      .map(({ modType, matchingMods }) =>
        matchingMods.find((mod) => mod.id === selectedModsByType[modType]),
      )
      .filter((mod): mod is ModItem => Boolean(mod));
  }, [selectedModsByType, weaponModTypeRows]);

  const totalModifierByStat = useMemo(() => {
    const map: Record<string, number> = {};
    selectedMods.forEach((mod) => {
      (mod.effects ?? []).forEach((effect) => {
        const effectKey = normalizeStatKey(effect.effect ?? "");
        const effectModifier = Number(effect.modifier);
        if (!effectKey || !Number.isFinite(effectModifier)) {
          return;
        }
        map[effectKey] = (map[effectKey] ?? 0) + effectModifier;
      });
    });
    return map;
  }, [selectedMods]);

  const statLookup = useMemo(() => {
    const effective: Record<string, unknown> = { ...baseStatLookup };
    Object.entries(totalModifierByStat).forEach(([key, modifier]) => {
      const baseValue = parseNumericMetricValue(effective[key]);
      if (baseValue === null) {
        return;
      }
      effective[key] = baseValue + modifier;
    });
    return effective;
  }, [baseStatLookup, totalModifierByStat]);

  const buildMeterStat = (
    id: string,
    label: string,
    aliases: string[],
    maxValue: number,
    suffix?: string,
  ): MeterStat => {
    const baseRawValue = getStatValueByAliases(baseStatLookup, aliases);
    const effectiveRawValue = getStatValueByAliases(statLookup, aliases);
    const baseNumericValue = parseNumericMetricValue(baseRawValue);
    const effectiveNumericValue = parseNumericMetricValue(effectiveRawValue);
    const fillPercent =
      effectiveNumericValue === null
        ? 0
        : Math.max(0, Math.min(100, (effectiveNumericValue / maxValue) * 100));
    const baseFillPercent =
      baseNumericValue === null
        ? 0
        : Math.max(0, Math.min(100, (baseNumericValue / maxValue) * 100));
    const deltaValue =
      baseNumericValue === null || effectiveNumericValue === null
        ? null
        : effectiveNumericValue - baseNumericValue;
    let deltaLabel = "";
    if (deltaValue !== null && deltaValue !== 0) {
      const deltaPrefix = deltaValue > 0 ? "+" : "";
      deltaLabel = `${deltaPrefix}${formatMetricValue(deltaValue, suffix)}`;
    }
    const deltaStartPercent = Math.min(baseFillPercent, fillPercent);
    const deltaWidthPercent = Math.abs(fillPercent - baseFillPercent);
    const positiveIsImprovement = STAT_POSITIVE_IS_IMPROVEMENT[id] ?? true;
    let deltaClassName = "";
    if (deltaValue !== null && deltaValue !== 0) {
      const isImprovement = deltaValue > 0 ? positiveIsImprovement : !positiveIsImprovement;
      deltaClassName = isImprovement
        ? "weapon-stat-delta-positive"
        : "weapon-stat-delta-negative";
    }
    return {
      id,
      label,
      value: formatMetricValue(effectiveRawValue, suffix),
      fillPercent,
      baseFillPercent,
      deltaValue,
      deltaLabel,
      deltaStartPercent,
      deltaWidthPercent,
      deltaClassName,
    };
  };

  const coreStats: MeterStat[] = [
    buildMeterStat("firepower", "Firepower", ["firepower", "damage", "power", "dmg"], 150),
    buildMeterStat("accuracy", "Accuracy", ["accuracy", "acc"], 100, "%"),
    buildMeterStat("handling", "Handling", ["handling", "mobility", "control"], 100),
    buildMeterStat("range", "Range", ["range", "effectiveRange"], 100, "m"),
    buildMeterStat("magazine", "Magazine", ["magazine", "magSize", "ammoPerMag"], 60),
    buildMeterStat("zoom", "Zoom", ["zoom", "zoomMultiplier", "adsZoom"], 2.5, "x"),
  ];

  const advancedStats: MeterStat[] = [
    buildMeterStat("rateOfFire", "Rate of Fire", ["rateOfFire", "rpm", "fireRate"], 900, " RPM"),
    buildMeterStat("reloadSpeed", "Reload Speed", ["reloadSpeed", "reload", "reloadTime"], 6.5, "s"),
    buildMeterStat("aimAssist", "Aim Assist", ["aimAssist", "assist"], 2),
    buildMeterStat("recoil", "Recoil", ["recoil", "kick"], 100),
    buildMeterStat("precision", "Precision", ["precision", "critMultiplier"], 2, "x"),
  ];

  const ttkSource = weapon.stats?.ttk;
  const ttkMap =
    ttkSource && typeof ttkSource === "object" && !Array.isArray(ttkSource)
      ? (ttkSource as unknown as Record<string, unknown>)
      : {};
  const ttkStats = [
    { label: "No Shield", value: formatMetricValue(ttkMap.none, "s") },
    { label: "Green Shield", value: formatMetricValue(ttkMap.green, "s") },
    { label: "Blue Shield", value: formatMetricValue(ttkMap.blue, "s") },
    { label: "Purple Shield", value: formatMetricValue(ttkMap.purple, "s") },
  ];

  const resolvedAmmo = useMemo<AmmoLookupEntry>(() => {
    const normalizedAmmoId = (ammoId ?? "").trim();
    if (!normalizedAmmoId) {
      return { name: "Unknown ammo" };
    }

    const matchedAmmo = generalItems.find((item) => (item.id ?? "").trim() === normalizedAmmoId);
    if (!matchedAmmo) {
      return { name: normalizedAmmoId };
    }

    return {
      name: matchedAmmo.name?.trim() || normalizedAmmoId,
      url: matchedAmmo.url,
    };
  }, [ammoId, generalItems]);

  return (
    <section className="weapon-detail-page">
      <button type="button" className="weapon-detail-back" onClick={onBack}>
        Back to weapons
      </button>
      <header className="weapon-detail-header">
        <div className="weapon-detail-image-wrap">
          <RarityPatternBackground
            rarity={weapon.rarity}
            className="weapon-detail-rarity-pattern"
          />
          <img
            className="weapon-detail-image"
            src={weapon.url}
            alt={weapon.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackWeaponIcon;
            }}
          />
        </div>
        <div className="weapon-detail-hero-content">
          <div className="weapon-detail-title-row">
            <h2 className="weapon-detail-title">{weapon.name}</h2>
            <span className={`weapon-rarity-tag ${getWeaponRarityTagClass(weapon.rarity)}`}>
              {weapon.rarity || "Unknown"}
            </span>
          </div>
          <p className="weapon-detail-description">
            {weapon.description || "No description available."}
          </p>
          <div className="weapon-detail-pills">
            <span className="weapon-pill">{weapon.category || "Uncategorized"}</span>
            <span className="weapon-pill">{weapon.fireMode || "Unknown fire mode"}</span>
          </div>
          <span className="weapon-pill weapon-ammo-pill">
            {resolvedAmmo.url ? (
              <img
                className="weapon-ammo-pill-icon"
                src={resolvedAmmo.url}
                alt={resolvedAmmo.name || "Ammo"}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <span>{resolvedAmmo.name ?? "Unknown ammo"}</span>
          </span>
          <div className="weapon-cost-badge" aria-label="Weapon cost">
            <span className="weapon-cost-badge-label">Cost</span>
            <span className="weapon-cost-badge-value">{weapon.value ?? "N/A"}</span>
          </div>
        </div>
      </header>

      {weaponModTypeRows.length > 0 && (
        <div ref={moddingSectionRef} className="weapon-modding-section">
          <h3 className="weapon-stats-section-title">Weapon Modding</h3>
          <div className="weapon-attachment-slots-grid">
            {weaponModTypeRows.map(({ modType, matchingMods }) => {
              const selectedModId = selectedModsByType[modType] ?? "";
              const selectedMod = matchingMods.find((mod) => mod.id === selectedModId);
              const selectedRarityClass = getModRarityClass(selectedMod?.rarity);
              const isOpen = openModType === modType;
              return (
                <button
                  key={modType}
                  type="button"
                  className={`weapon-attachment-slot ${isOpen ? "is-open" : ""}`}
                  onClick={() => setOpenModType((previous) => (previous === modType ? null : modType))}
                  aria-expanded={isOpen}
                  aria-controls={`weapon-attachment-selector-${normalizeStatKey(modType)}`}
                >
                  <span className="weapon-attachment-slot-label">{modType}</span>
                  <span className="weapon-attachment-slot-content">
                    {selectedMod ? (
                      <div className={`weapon-mod-thumbnail-wrap ${getModRarityClass(selectedMod.rarity)}`}>
                        <RarityPatternBackground rarity={selectedMod.rarity} className="weapon-mod-thumbnail-pattern" />
                        <img
                          className="weapon-mod-thumbnail"
                          src={selectedMod.url}
                          alt={selectedMod.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = fallbackWeaponIcon;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="weapon-mod-thumbnail-wrap weapon-mod-rarity-default">
                        <RarityPatternBackground className="weapon-mod-thumbnail-pattern" />
                        <div className="weapon-mod-thumbnail weapon-mod-option-icon-placeholder">
                          +
                        </div>
                      </div>
                    )}
                    <div className="weapon-attachment-slot-main">
                      <span className="weapon-attachment-slot-name">
                        {selectedMod?.name ?? `Select ${modType}`}
                      </span>
                      <span className="weapon-attachment-slot-meta">
                        {selectedMod ? selectedMod.rarity || "Unknown rarity" : `${matchingMods.length} options`}
                      </span>
                    </div>
                    <span className={`weapon-attachment-slot-chevron ${selectedRarityClass}`}>▾</span>
                  </span>
                </button>
              );
            })}
          </div>
          {activeModTypeRow && (
            <section
              className="weapon-attachment-selector"
              id={`weapon-attachment-selector-${normalizeStatKey(activeModTypeRow.modType)}`}
              aria-label={`${activeModTypeRow.modType} selector`}
            >
              <div className="weapon-attachment-selector-header">
                <strong>{activeModTypeRow.modType}</strong>
                <span>Select an attachment to apply stat modifiers</span>
              </div>
              <div className="weapon-attachment-selector-grid">
                <button
                  type="button"
                  className={`weapon-mod-option ${
                    (selectedModsByType[activeModTypeRow.modType] ?? "") === "" ? "is-selected" : ""
                  }`}
                  onClick={() => setModSelection(activeModTypeRow.modType, "")}
                >
                  <div className="weapon-mod-thumbnail-wrap weapon-mod-rarity-default">
                    <RarityPatternBackground className="weapon-mod-thumbnail-pattern" />
                    <div className="weapon-mod-thumbnail weapon-mod-option-icon-placeholder">-</div>
                  </div>
                  <div className="weapon-mod-option-main">
                    <span className="weapon-mod-option-name">No attachment</span>
                    <span className="weapon-mod-option-meta">Clear this slot</span>
                  </div>
                </button>
                {activeModTypeRow.matchingMods.map((mod) => {
                  const popupDirection = popupDirectionByModId[mod.id];
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      className={`weapon-mod-option ${
                        (selectedModsByType[activeModTypeRow.modType] ?? "") === mod.id ? "is-selected" : ""
                      }`}
                      onClick={() => setModSelection(activeModTypeRow.modType, mod.id)}
                      onMouseEnter={(event) => updatePopupDirection(mod.id, event.currentTarget)}
                      onFocus={(event) => updatePopupDirection(mod.id, event.currentTarget)}
                    >
                      <div className={`weapon-mod-thumbnail-wrap ${getModRarityClass(mod.rarity)}`}>
                        <RarityPatternBackground rarity={mod.rarity} className="weapon-mod-thumbnail-pattern" />
                        <img
                          className="weapon-mod-thumbnail"
                          src={mod.url}
                          alt={mod.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = fallbackWeaponIcon;
                          }}
                        />
                      </div>
                      <div className="weapon-mod-option-main">
                        <span className="weapon-mod-option-name">{mod.name}</span>
                        <span className="weapon-mod-option-meta">
                          {mod.rarity || "Unknown rarity"} | {mod.type}
                        </span>
                      </div>
                      <ItemHoverPopup
                        item={mod}
                        placement={popupDirection ?? "right"}
                        typeLabel={mod.type || "Attachment"}
                      />
                    </button>
                  );
                })}
              </div>
              {(() => {
                const selectedModId = selectedModsByType[activeModTypeRow.modType] ?? "";
                const selectedMod = activeModTypeRow.matchingMods.find((mod) => mod.id === selectedModId);
                const selectedModEffects = selectedMod ? getModEffectsList(selectedMod) : [];
                if (selectedModEffects.length === 0) {
                  return null;
                }
                return (
                  <div className="weapon-mod-selected-effects">
                    {selectedModEffects.map((effectText) => (
                      <span key={effectText} className="weapon-mod-selected-effect-pill">
                        {effectText}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </section>
          )}
        </div>
      )}

      <section className="weapon-detail-stats">
        <div className="weapon-stats-two-column">
          <div className="weapon-stats-column">
            <h3 className="weapon-stats-section-title">Core Stats</h3>
            <div className="weapon-stat-lines">
              {coreStats.map((stat) => (
                <div key={stat.id} className="weapon-stat-line">
                  <div className="weapon-stat-line-header">
                    <span>{stat.label}</span>
                    <div className="weapon-stat-value-group">
                      <strong>{stat.value}</strong>
                      {stat.deltaValue !== null && stat.deltaValue !== 0 && (
                        <span
                          className={`weapon-stat-delta ${stat.deltaClassName}`}
                        >
                          {stat.deltaLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="weapon-stat-line-track">
                    <div
                      className="weapon-stat-line-fill-base"
                      style={{ width: `${stat.baseFillPercent}%` }}
                    />
                    <div
                      className="weapon-stat-line-fill"
                      style={{ width: `${stat.fillPercent}%` }}
                    />
                    {stat.deltaWidthPercent > 0 && (
                      <div
                        className={`weapon-stat-line-delta ${stat.deltaClassName}`}
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
          </div>
          <div className="weapon-stats-column">
            <h3 className="weapon-stats-section-title">Advanced</h3>
            <div className="weapon-stat-lines weapon-stat-lines-advanced">
              {advancedStats.map((stat) => (
                <div key={stat.id} className="weapon-stat-line">
                  <div className="weapon-stat-line-header">
                    <span>{stat.label}</span>
                    <div className="weapon-stat-value-group">
                      <strong>{stat.value}</strong>
                      {stat.deltaValue !== null && stat.deltaValue !== 0 && (
                        <span
                          className={`weapon-stat-delta ${stat.deltaClassName}`}
                        >
                          {stat.deltaLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="weapon-stat-line-track">
                    <div
                      className="weapon-stat-line-fill-base"
                      style={{ width: `${stat.baseFillPercent}%` }}
                    />
                    <div
                      className="weapon-stat-line-fill"
                      style={{ width: `${stat.fillPercent}%` }}
                    />
                    {stat.deltaWidthPercent > 0 && (
                      <div
                        className={`weapon-stat-line-delta ${stat.deltaClassName}`}
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
          </div>
        </div>

        <div className="weapon-secondary-two-column">
          <div className="weapon-stats-column">
            <h3 className="weapon-stats-section-title">Time To Kill</h3>
            <div className="weapon-ttk-grid">
              {ttkStats.map((ttk) => (
                <div
                  key={ttk.label}
                  className={`weapon-ttk-card ${getTtkVariantClass(ttk.label)}`.trim()}
                >
                  <RarityPatternBackground
                    className="weapon-ttk-pattern"
                    colorRgb={getTtkPatternColorRgb(ttk.label)}
                  />
                  <span className="weapon-ttk-card-label">{ttk.label}</span>
                  <strong className="weapon-ttk-card-value">{ttk.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>
    </section>
  );
};
