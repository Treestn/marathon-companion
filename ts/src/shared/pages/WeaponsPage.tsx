import React, { useEffect, useMemo, useState } from "react";
import { ItemsModel, ModItem, WeaponItem } from "../../model/items/IItemsElements";
import "./weapons/weapons.css";
import { QuestFilterSelect } from "../components/quests/filters/QuestFilterSelect";
import "../components/quests/filters/quest-filters.css";
import { WeaponDetailSubPage } from "./weapons/WeaponDetailSubPage";
import { RarityPatternBackground } from "../components/rarity/RarityPatternBackground";

const FALLBACK_WEAPON_ICON = "./img/side-nav-quest-icon.png";
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

export const WeaponsPage: React.FC = () => {
  const [weapons, setWeapons] = useState<WeaponItem[]>([]);
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
      setWeapons(data?.items?.weapons ?? []);
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
  }, []);

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
        weapons
          .map((weapon) => weapon.category?.trim())
          .filter((category): category is string => Boolean(category)),
      ),
    );

    const known = CATEGORY_ORDER.filter((category) => unique.includes(category));
    const custom = unique
      .filter((category) => !CATEGORY_ORDER.includes(category))
      .sort((a, b) => a.localeCompare(b));
    return [...known, ...custom];
  }, [weapons]);

  const ammoNamesByWeaponId = useMemo(() => {
    return weapons.reduce<Record<string, string>>((acc, weapon) => {
      acc[weapon.id] = resolveAmmo(weapon).name ?? "Unknown ammo";
      return acc;
    }, {});
  }, [ammoLookup, weapons]);

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
    return weapons.reduce<Record<string, number>>((acc, weapon) => {
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
  }, [activeAmmoTypes, ammoNamesByWeaponId, searchTerm, weapons]);

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
    return weapons.reduce<Record<string, number>>((acc, weapon) => {
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
  }, [activeCategories, ammoNamesByWeaponId, searchTerm, weapons]);

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
    return weapons.filter((weapon) => {
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
  }, [activeAmmoTypes, activeCategories, ammoNamesByWeaponId, searchTerm, weapons]);

  const groupedWeapons = useMemo(() => {
    return categories.map((category) => ({
      category,
      weapons: filteredWeapons.filter(
        (weapon) => (weapon.category?.trim() || "Uncategorized") === category,
      ),
    })).filter((group) => group.weapons.length > 0);
  }, [categories, filteredWeapons]);

  const selectedWeapon = useMemo(
    () => weapons.find((weapon) => weapon.id === selectedWeaponId) ?? null,
    [selectedWeaponId, weapons],
  );

  let weaponsContent: React.ReactNode;
  if (selectedWeapon) {
    weaponsContent = (
      <WeaponDetailSubPage
        key={selectedWeapon.id}
        weapon={selectedWeapon}
        ammoId={selectedWeapon.ammoId}
        generalItems={generalItems}
        mods={mods}
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
          <header className="weapons-header">
            <div className="weapons-title-wrap">
              <h1 className="weapons-title">Weapons</h1>
              <p className="weapons-subtitle">
                Complete weapon guide with categories, ammo types, mods, and rarity.
              </p>
            </div>
            <div className="weapons-header-actions">
              <input
                className="weapons-search"
                type="search"
                placeholder="Search weapons, categories, ammo, or fire mode..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </header>
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
      </section>
    </div>
  );
};
