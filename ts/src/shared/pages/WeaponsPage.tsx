import React, { useEffect, useMemo, useState } from "react";
import { ItemsModel, ModItem, WeaponItem } from "../../model/items/IItemsElements";
import "./weapons/weapons.css";
import { QuestFilterSelect } from "../components/quests/filters/QuestFilterSelect";
import "../components/quests/filters/quest-filters.css";
import { WeaponDetailSubPage } from "./weapons/WeaponDetailSubPage";
import { RarityPatternBackground } from "../components/rarity/RarityPatternBackground";
import { ALL_RARITY_OPTIONS } from "../../escape-from-tarkov/utils/RarityColorUtils";
import {
  ensureItemsEditSessionConsoleApi,
  isItemsEditSessionEnabled,
  subscribeItemsEditSessionEnabled,
} from "../services/ItemsEditSessionGate";
import { PageHeader } from "../components/PageHeader";

const FALLBACK_WEAPON_ICON = "../../icons/logo-256x256.png";
const DEV_EDIT_STORAGE_KEY = "weaponsMapDevEdited";
const CATEGORY_ORDER = [
  "Assault Rifles",
  "Machine Guns",
  "Pistols",
  "Precision Rifles",
  "Railguns",
  "Shotguns",
  "Sniper Rifles",
  "Submachine Guns",
];

const normalizeLookupKey = (value?: string | null): string =>
  (value ?? "")
    .trim()
    .replace(/^["']+/, "")
    .replace(/["']+$/, "")
    .split(/[^a-zA-Z0-9]+/)
    .join("")
    .toLowerCase();

const getUrlSlugKey = (url?: string): string => {
  if (!url) {
    return "";
  }
  const fileName = url.split("/").pop() ?? "";
  const noExtension = fileName.replace(/\.[^/.]+$/, "");
  const noSizeSuffix = noExtension.replace(/-\d+x\d+$/i, "");
  return normalizeLookupKey(noSizeSuffix);
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

type AmmoLookupEntry = {
  name: string;
  url?: string;
};

const cloneWeapons = (data: WeaponItem[]): WeaponItem[] => structuredClone(data);
const normalizeWeaponIdFromName = (name: string): string => {
  const source = name.trim().toLowerCase();
  let normalized = "";
  let lastWasDash = false;
  for (const char of source) {
    const isAlphaNumeric =
      (char >= "a" && char <= "z") || (char >= "0" && char <= "9");
    const shouldBeDash = char === " " || char === "_" || char === "-";
    if (isAlphaNumeric) {
      normalized += char;
      lastWasDash = false;
      continue;
    }
    if (shouldBeDash && !lastWasDash && normalized.length > 0) {
      normalized += "-";
      lastWasDash = true;
    }
  }
  if (normalized.endsWith("-")) {
    return normalized.slice(0, -1);
  }
  return normalized;
};

export const WeaponsPage: React.FC = () => {
  const [isSessionEditEnabled, setIsSessionEditEnabled] = useState(() =>
    isItemsEditSessionEnabled(),
  );
  const [weapons, setWeapons] = useState<WeaponItem[]>([]);
  const [draftWeapons, setDraftWeapons] = useState<WeaponItem[]>([]);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [generalItems, setGeneralItems] = useState<
    Array<{ id: string; name?: string; url?: string }>
  >([]);
  const [mods, setMods] = useState<ModItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeAmmoTypes, setActiveAmmoTypes] = useState<string[]>([]);
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadWeapons = async () => {
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
      const loadedWeapons = data?.items?.weapons ?? [];
      setWeapons(loadedWeapons);
      if (isSessionEditEnabled) {
        setDraftWeapons(cloneWeapons(loadedWeapons));
      }
      setGeneralItems(
        (data?.items?.items ?? []) as Array<{ id: string; name?: string; url?: string }>,
      );
      setMods(data?.items?.mods ?? []);
      setIsLoading(false);
    };

    loadWeapons();
    return () => {
      isMounted = false;
    };
  }, [isSessionEditEnabled]);

  useEffect(() => {
    ensureItemsEditSessionConsoleApi();
    return subscribeItemsEditSessionEnabled(setIsSessionEditEnabled);
  }, []);

  useEffect(() => {
    if (!isSessionEditEnabled && isEditingEnabled) {
      setIsEditingEnabled(false);
      return;
    }
    if (isSessionEditEnabled && draftWeapons.length === 0 && weapons.length > 0) {
      setDraftWeapons(cloneWeapons(weapons));
    }
  }, [draftWeapons.length, isEditingEnabled, isSessionEditEnabled, weapons]);

  const renderedWeapons = isSessionEditEnabled && isEditingEnabled ? draftWeapons : weapons;

  const ammoLookup = useMemo(() => {
    return generalItems.reduce<Record<string, AmmoLookupEntry>>(
      (acc, item) => {
        if (!item?.id) {
          return acc;
        }
        const name = item.name?.trim() || item.id;
        const entry = {
          name,
          url: item.url,
        };
        acc[normalizeLookupKey(item.id)] = entry;
        acc[normalizeLookupKey(name)] = entry;
        const slugKey = getUrlSlugKey(item.url);
        if (slugKey) {
          acc[slugKey] = entry;
        }
        return acc;
      },
      {},
    );
  }, [generalItems]);

  const resolveAmmo = (weapon: WeaponItem): AmmoLookupEntry => {
    const ammoId = weapon.ammoId?.trim();
    const normalizedAmmoId = normalizeLookupKey(ammoId);
    if (!normalizedAmmoId) {
      return { name: "Unknown ammo" };
    }

    const exact = ammoLookup[normalizedAmmoId];
    if (exact) {
      return exact;
    }

    const dynamicPartialKey = Object.keys(ammoLookup).find(
      (key) => key.includes(normalizedAmmoId) || normalizedAmmoId.includes(key),
    );
    if (dynamicPartialKey) {
      return ammoLookup[dynamicPartialKey];
    }

    return { name: ammoId || "Unknown ammo" };
  };

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        renderedWeapons
          .map((weapon) => weapon.category?.trim())
          .filter((category): category is string => Boolean(category)),
      ),
    );

    const known = CATEGORY_ORDER.filter((category) => unique.includes(category));
    const custom = unique
      .filter((category) => !CATEGORY_ORDER.includes(category))
      .sort((a, b) => a.localeCompare(b));
    return [...known, ...custom];
  }, [renderedWeapons]);

  const ammoNamesByWeaponId = useMemo(() => {
    return renderedWeapons.reduce<Record<string, string>>((acc, weapon) => {
      acc[weapon.id] = resolveAmmo(weapon).name ?? "Unknown ammo";
      return acc;
    }, {});
  }, [ammoLookup, renderedWeapons]);

  const allAmmoTypes = useMemo(() => {
    return Array.from(new Set(Object.values(ammoNamesByWeaponId))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [ammoNamesByWeaponId]);

  const matchesSearch = (weapon: WeaponItem, ammoName: string, normalizedSearch: string) => {
    if (!normalizedSearch) {
      return true;
    }
    const category = weapon.category?.trim() || "Uncategorized";
    const fireMode = weapon.fireMode?.trim() || "";
    const ammoId = weapon.ammoId?.trim() || "";
    const ammoSearchText = `${ammoId} ${ammoName}`.trim();
    return (
      weapon.name.toLowerCase().includes(normalizedSearch) ||
      ammoSearchText.toLowerCase().includes(normalizedSearch) ||
      category.toLowerCase().includes(normalizedSearch) ||
      fireMode.toLowerCase().includes(normalizedSearch)
    );
  };

  const categoryCounts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const selectedAmmoTypes = new Set(activeAmmoTypes);
    return renderedWeapons.reduce<Record<string, number>>((acc, weapon) => {
      const category = weapon.category?.trim() || "Uncategorized";
      const ammoName = ammoNamesByWeaponId[weapon.id] ?? "Unknown ammo";
      if (selectedAmmoTypes.size > 0 && !selectedAmmoTypes.has(ammoName)) {
        return acc;
      }
      if (!matchesSearch(weapon, ammoName, normalizedSearch)) {
        return acc;
      }
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {});
  }, [activeAmmoTypes, ammoNamesByWeaponId, renderedWeapons, searchTerm]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category,
        label: `${category} (${categoryCounts[category] ?? 0})`,
      })),
    [categories, categoryCounts],
  );

  const ammoTypeCounts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const selectedCategories = new Set(activeCategories);
    return renderedWeapons.reduce<Record<string, number>>((acc, weapon) => {
      const category = weapon.category?.trim() || "Uncategorized";
      const ammoName = ammoNamesByWeaponId[weapon.id] ?? "Unknown ammo";
      if (selectedCategories.size > 0 && !selectedCategories.has(category)) {
        return acc;
      }
      if (!matchesSearch(weapon, ammoName, normalizedSearch)) {
        return acc;
      }
      acc[ammoName] = (acc[ammoName] ?? 0) + 1;
      return acc;
    }, {});
  }, [activeCategories, ammoNamesByWeaponId, renderedWeapons, searchTerm]);

  const ammoTypeOptions = useMemo(
    () =>
      allAmmoTypes.map((ammoType) => ({
        value: ammoType,
        label: `${ammoType} (${ammoTypeCounts[ammoType] ?? 0})`,
      })),
    [allAmmoTypes, ammoTypeCounts],
  );

  const filteredWeapons = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const selectedCategories = new Set(activeCategories);
    const selectedAmmoTypes = new Set(activeAmmoTypes);
    return renderedWeapons.filter((weapon) => {
      const category = weapon.category?.trim() || "Uncategorized";
      const ammoName = ammoNamesByWeaponId[weapon.id] ?? "Unknown ammo";
      if (selectedCategories.size > 0 && !selectedCategories.has(category)) {
        return false;
      }
      if (selectedAmmoTypes.size > 0 && !selectedAmmoTypes.has(ammoName)) {
        return false;
      }
      return matchesSearch(weapon, ammoName, normalizedSearch);
    });
  }, [activeAmmoTypes, activeCategories, ammoNamesByWeaponId, renderedWeapons, searchTerm]);

  const groupedWeapons = useMemo(() => {
    return categories.map((category) => ({
      category,
      weapons: filteredWeapons.filter(
        (weapon) => (weapon.category?.trim() || "Uncategorized") === category,
      ),
    })).filter((group) => group.weapons.length > 0);
  }, [categories, filteredWeapons]);

  const selectedWeapon = useMemo(
    () => renderedWeapons.find((weapon) => weapon.id === selectedWeaponId) ?? null,
    [renderedWeapons, selectedWeaponId],
  );

  const rarityOptions = useMemo(() => {
    const values = new Set<string>(ALL_RARITY_OPTIONS);
    renderedWeapons.forEach((weapon) => {
      const rarity = weapon.rarity?.trim();
      if (rarity) {
        values.add(rarity);
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [renderedWeapons]);

  const categoryTypeOptions = useMemo(() => {
    const values = new Set<string>();
    renderedWeapons.forEach((weapon) => {
      const category = weapon.category?.trim();
      if (category) {
        values.add(category);
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [renderedWeapons]);

  const modTypeOptions = useMemo(() => {
    const values = new Set<string>();
    mods.forEach((mod) => {
      const type = mod.type?.trim();
      if (type) {
        values.add(type);
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [mods]);

  const updateDraftWeapon = (weaponId: string, updater: (weapon: WeaponItem) => void) => {
    setDraftWeapons((previous) => {
      if (previous.length === 0) {
        return previous;
      }
      const next = cloneWeapons(previous);
      const index = next.findIndex((entry) => entry.id === weaponId);
      if (index < 0) {
        return previous;
      }
      updater(next[index]);
      return next;
    });
  };

  const updateDraftWeaponTextField = (
    weaponId: string,
    field: "name" | "description" | "rarity" | "category",
    value: string,
  ) => {
    updateDraftWeapon(weaponId, (weapon) => {
      weapon[field] = value;
    });
  };

  const updateDraftWeaponCost = (weaponId: string, rawValue: string) => {
    updateDraftWeapon(weaponId, (weapon) => {
      const nextValue = rawValue.trim().replace(",", ".");
      if (!nextValue) {
        weapon.value = 0;
        return;
      }
      const parsed = Number.parseFloat(nextValue);
      if (!Number.isNaN(parsed)) {
        weapon.value = parsed;
      }
    });
  };

  const updateDraftWeaponStat = (weaponId: string, statKey: string, rawValue: string) => {
    updateDraftWeapon(weaponId, (weapon) => {
      if (!weapon.stats || typeof weapon.stats !== "object") {
        weapon.stats = {};
      }
      const nextValue = rawValue.trim().replace(",", ".");
      if (!nextValue) {
        delete weapon.stats[statKey];
        return;
      }
      const parsed = Number.parseFloat(nextValue);
      if (!Number.isNaN(parsed)) {
        weapon.stats[statKey] = parsed;
      }
    });
  };

  const updateDraftWeaponTtk = (
    weaponId: string,
    ttkKey: "none" | "green" | "blue" | "purple",
    rawValue: string,
  ) => {
    updateDraftWeapon(weaponId, (weapon) => {
      if (!weapon.stats || typeof weapon.stats !== "object") {
        weapon.stats = {};
      }
      const nextValue = rawValue.trim().replace(",", ".");
      if (!weapon.stats.ttk || typeof weapon.stats.ttk !== "object") {
        weapon.stats.ttk = {
          none: null,
          green: null,
          blue: null,
          purple: null,
        };
      }
      if (!nextValue) {
        weapon.stats.ttk[ttkKey] = null;
        return;
      }
      const parsed = Number.parseFloat(nextValue);
      if (!Number.isNaN(parsed)) {
        weapon.stats.ttk[ttkKey] = parsed;
      }
    });
  };

  const toggleDraftWeaponModType = (weaponId: string, modType: string) => {
    updateDraftWeapon(weaponId, (weapon) => {
      const normalized = modType.trim();
      if (!normalized) {
        return;
      }
      const current = Array.isArray(weapon.modTypes) ? weapon.modTypes : [];
      const exists = current.some((value) => value.trim().toLowerCase() === normalized.toLowerCase());
      if (exists) {
        weapon.modTypes = current.filter(
          (value) => value.trim().toLowerCase() !== normalized.toLowerCase(),
        );
        return;
      }
      weapon.modTypes = [...current, normalized];
    });
  };

  const handleSaveDraft = () => {
    if (!isEditingEnabled) {
      return;
    }
    localStorage.setItem(DEV_EDIT_STORAGE_KEY, JSON.stringify(draftWeapons, null, 2));
    setSaveMessage(`Saved to localStorage key "${DEV_EDIT_STORAGE_KEY}"`);
  };

  const handleResetDraft = () => {
    if (!isEditingEnabled) {
      return;
    }
    setDraftWeapons(cloneWeapons(weapons));
    localStorage.removeItem(DEV_EDIT_STORAGE_KEY);
    setSelectedWeaponId(null);
    setSaveMessage(`Reset edits and cleared localStorage key "${DEV_EDIT_STORAGE_KEY}"`);
  };

  const createUniqueDraftWeaponId = (name: string, sourceWeapons: WeaponItem[]): string => {
    const existingIds = new Set(sourceWeapons.map((weapon) => weapon.id));
    const base = normalizeWeaponIdFromName(name) || "new-weapon";
    if (!existingIds.has(base)) {
      return base;
    }
    let suffix = 2;
    let candidate = `${base}-${suffix}`;
    while (existingIds.has(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  };

  const addDraftWeapon = () => {
    let createdId = "";
    setDraftWeapons((previous) => {
      const next = cloneWeapons(previous);
      const newWeaponName = "New Weapon";
      const newWeaponId = createUniqueDraftWeaponId(newWeaponName, next);
      const defaultRarity = rarityOptions[0] ?? "Common";
      const defaultCategory = categoryTypeOptions[0] ?? "Assault Rifles";
      const newWeapon: WeaponItem = {
        id: newWeaponId,
        name: newWeaponName,
        description: "",
        rarity: defaultRarity,
        category: defaultCategory,
        fireMode: "",
        ammoId: "",
        modTypes: [],
        attributes: [],
        stats: {
          ttk: {
            none: null,
            green: null,
            blue: null,
            purple: null,
          },
        },
        value: 0,
        url: "",
      };
      next.unshift(newWeapon);
      createdId = newWeaponId;
      return next;
    });
    if (createdId) {
      setSelectedWeaponId(createdId);
    }
    setSaveMessage("");
  };

  const removeDraftWeapon = (weaponId: string) => {
    setDraftWeapons((previous) => previous.filter((weapon) => weapon.id !== weaponId));
    setSelectedWeaponId((current) => (current === weaponId ? null : current));
    setSaveMessage("");
  };

  let weaponsContent: React.ReactNode;
  if (selectedWeapon) {
    weaponsContent = (
      <WeaponDetailSubPage
        key={selectedWeapon.id}
        weapon={selectedWeapon}
        ammoId={selectedWeapon.ammoId}
        generalItems={generalItems}
        mods={mods}
        isEditingEnabled={isSessionEditEnabled && isEditingEnabled}
        rarityOptions={rarityOptions}
        categoryOptions={categoryTypeOptions}
        modTypeOptions={modTypeOptions}
        onUpdateTextField={updateDraftWeaponTextField}
        onUpdateCost={updateDraftWeaponCost}
        onUpdateStat={updateDraftWeaponStat}
        onUpdateTtk={updateDraftWeaponTtk}
        onToggleModType={toggleDraftWeaponModType}
        onRemoveWeapon={removeDraftWeapon}
        fallbackWeaponIcon={FALLBACK_WEAPON_ICON}
        onBack={() => setSelectedWeaponId(null)}
      />
    );
  } else if (isLoading) {
    weaponsContent = <div className="weapons-empty">Loading weapons...</div>;
  } else if (groupedWeapons.length === 0) {
    weaponsContent = <div className="weapons-empty">No weapons match your current filters.</div>;
  } else {
    weaponsContent = groupedWeapons.map((group) => (
      <section className="weapons-category-block" key={group.category}>
        <div className="weapons-category-header">
          <h2>{group.category}</h2>
          <span>{group.weapons.length} weapons</span>
        </div>
        <div className="weapons-grid">
          {group.weapons.map((weapon) => {
            const ammo = resolveAmmo(weapon);
            return (
              <button
                key={weapon.id}
                type="button"
                className="weapon-card"
                onClick={() => setSelectedWeaponId(weapon.id)}
              >
                <div className="weapon-card-image-wrap">
                  <RarityPatternBackground
                    rarity={weapon.rarity}
                    className="weapon-card-rarity-pattern"
                  />
                  <span className={`weapon-rarity-tag weapon-card-rarity-tag ${getWeaponRarityTagClass(weapon.rarity)}`}>
                    {weapon.rarity || "Unknown"}
                  </span>
                  <img
                    className="weapon-card-image"
                    src={weapon.url}
                    alt={weapon.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_WEAPON_ICON;
                    }}
                  />
                </div>
                <div className="weapon-card-body">
                  <h3 className="weapon-card-title">{weapon.name}</h3>
                  <p className="weapon-card-description">
                    {weapon.description || "No description available."}
                  </p>
                  <div className="weapon-card-pills">
                    <span className="weapon-pill">{weapon.fireMode || "Unknown fire mode"}</span>
                    <span className="weapon-pill">{weapon.category || "Uncategorized"}</span>
                  </div>
                  <div className="weapon-card-footer">
                    <div className="weapon-ammo">
                      {ammo?.url ? (
                        <img
                          className="weapon-ammo-icon"
                          src={ammo.url}
                          alt={ammo.name}
                          loading="lazy"
                        />
                      ) : null}
                      <span>{ammo?.name ?? "Unknown ammo"}</span>
                    </div>
                    <div className="weapon-card-cost">{weapon.value ?? "N/A"}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    ));
  }

  return (
    <div className="weapons-page-container">
      <section className="weapons-page">
        {!selectedWeapon && (
          <PageHeader
            className="weapons-header"
            title="Weapons"
            subtitle="Complete weapon guide with categories, ammo types, mods, and rarity."
            iconSrc="../img/pages/weapon.png"
            actions={
              <div className="weapons-header-actions">
                {isSessionEditEnabled && (
                  <button
                    type="button"
                    className={`weapons-dev-button${isEditingEnabled ? " is-active" : ""}`}
                    onClick={() => {
                      setIsEditingEnabled((previous) => {
                        const next = !previous;
                        if (next && draftWeapons.length === 0 && weapons.length > 0) {
                          setDraftWeapons(cloneWeapons(weapons));
                        }
                        return next;
                      });
                      setSaveMessage("");
                    }}
                  >
                    {isEditingEnabled ? "Editing Enabled" : "Enable Editing"}
                  </button>
                )}
                <input
                  className="weapons-search"
                  type="search"
                  placeholder="Search weapons, categories, ammo, or fire mode..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            }
          />
        )}

        {isSessionEditEnabled && isEditingEnabled && (
          <div className="weapons-dev-toolbar">
            <button
              type="button"
              className="weapons-dev-button"
              onClick={addDraftWeapon}
            >
              Add Weapon
            </button>
            <button
              type="button"
              className="weapons-dev-button"
              onClick={handleResetDraft}
            >
              Reset Edits
            </button>
            <button
              type="button"
              className="weapons-dev-button"
              onClick={handleSaveDraft}
            >
              Save
            </button>
          </div>
        )}

        {!selectedWeapon && (
          <div className="weapons-filter-row">
            <QuestFilterSelect
              id="weapons-filter-category"
              label="Category"
              value={activeCategories}
              options={categoryOptions}
              onChange={setActiveCategories}
              iconSrc="../../img/icons/filter_list.svg"
            />
            <QuestFilterSelect
              id="weapons-filter-ammo-type"
              label="Ammo Type"
              value={activeAmmoTypes}
              options={ammoTypeOptions}
              onChange={setActiveAmmoTypes}
              iconSrc="../../img/icons/filter_list.svg"
            />
            <button
              type="button"
              className="weapons-clear-filters"
              onClick={() => {
                setActiveCategories([]);
                setActiveAmmoTypes([]);
              }}
              disabled={activeCategories.length === 0 && activeAmmoTypes.length === 0}
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="weapons-content scroll-div">{weaponsContent}</div>
        {isSessionEditEnabled && saveMessage && (
          <div className="weapons-dev-save-message">{saveMessage}</div>
        )}
      </section>
    </div>
  );
};
