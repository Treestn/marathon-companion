import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CoreItem,
  ImplantItem,
  Item,
  ItemsModel,
  ModItem,
  WeaponItem,
} from "../../../model/items/IItemsElements";
import { ItemsElementUtils } from "../../../escape-from-tarkov/utils/ItemsElementUtils";
import { rarityToColor, rarityToLabel } from "../../../escape-from-tarkov/utils/RarityColorUtils";
import { ItemRarityImage } from "../../components/items/ItemRarityImage";
import { RarityPatternBackground } from "../../components/rarity/RarityPatternBackground";
import { ProgressionUpdatesService } from "../../services/ProgressionUpdatesService";
import { ItemRequirementTooltip } from "../../components/items/ItemRequirementTooltip";
import { NavigationTarget } from "../../services/NavigationEvents";
import {
  ensureItemsEditSessionConsoleApi,
  isItemsEditSessionEnabled,
  subscribeItemsEditSessionEnabled,
} from "../../services/ItemsEditSessionGate";
import "./items.css";

type ItemsPageProps = {
  navigationTarget?: NavigationTarget | null;
  onNavigationHandled?: () => void;
};

type ItemCategoryKey = "general" | "cores" | "implants" | "weapons" | "mods";
const DEV_EDIT_STORAGE_KEY = "itemsMapDevEdited";

const cloneItemsModel = (data: ItemsModel): ItemsModel =>
  structuredClone(data);

const normalizeItemIdFromName = (name: string): string => {
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

const resolveBridge = () =>
  (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;

export const ItemsPage: React.FC<ItemsPageProps> = ({
  navigationTarget,
  onNavigationHandled,
}) => {
  const [isSessionEditEnabled, setIsSessionEditEnabled] = useState(() =>
    isItemsEditSessionEnabled(),
  );
  const [itemsData, setItemsData] = useState<ItemsModel | null>(null);
  const [draftItemsData, setDraftItemsData] = useState<ItemsModel | null>(null);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState<ItemCategoryKey>("general");
  const [saveMessage, setSaveMessage] = useState("");
  const [requiredCounts, setRequiredCounts] = useState<Record<string, number>>({});
  const [trackedRequiredCounts, setTrackedRequiredCounts] = useState<Record<string, number>>({});
  const [trackedItemIds, setTrackedItemIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [trackingOnly, setTrackingOnly] = useState(false);
  const [missingOnly, setMissingOnly] = useState(false);
  const [includeQuests, setIncludeQuests] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<Record<ItemCategoryKey, boolean>>({
    general: true,
    cores: true,
    implants: true,
    weapons: true,
    mods: true,
  });
  const [forcedItemId, setForcedItemId] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const PAGE_SIZE = 30;

  // Track whether we've done the initial load to avoid showing loading
  // on subsequent filter changes
  const hasLoadedOnce = useRef(false);

  // Single effect that loads all data in parallel
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      const bridge = resolveBridge();
      if (!bridge) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      // Wait for all data sources in parallel
      await Promise.all([
        bridge.waitForItemsData?.(),
        bridge.waitForQuestData?.(),
      ]);

      if (!isMounted) {
        return;
      }

      // Retrieve all data in one go
      const data = bridge.getItemsData?.() as ItemsModel | undefined;
      if (data?.items) {
        ItemsElementUtils.setItemsMap(data);
        setItemsData(data);
        if (isSessionEditEnabled) {
          setDraftItemsData(cloneItemsModel(data));
        }
      }

      // Get all quantities in a single bulk call instead of N individual calls
      const quantities = bridge.getAllItemQuantities?.() as Record<string, number> | undefined;
      setItemQuantities(quantities ?? {});

      // Get required counts
      const counts = bridge.getItemRequiredCounts?.({
        includeQuests: false,
        includeHideout: false,
      }) as Record<string, number> | undefined;
      const trackedCounts = bridge.getTrackedItemRequiredCounts?.({
        includeQuests: false,
        includeHideout: false,
      }) as Record<string, number> | undefined;
      const tracked = bridge.getTrackedItemIds?.({
        includeQuests: false,
        includeHideout: false,
      }) as string[] | undefined;

      setRequiredCounts(counts ?? {});
      setTrackedRequiredCounts(trackedCounts ?? {});
      setTrackedItemIds(tracked ?? []);

      hasLoadedOnce.current = true;
      setIsLoading(false);
    };
    loadAll();
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
    }
    if (isSessionEditEnabled && !draftItemsData && itemsData) {
      setDraftItemsData(cloneItemsModel(itemsData));
    }
  }, [draftItemsData, isEditingEnabled, isSessionEditEnabled, itemsData]);

  // Refresh counts when quest filter toggles change (after initial load)
  useEffect(() => {
    if (!hasLoadedOnce.current) {
      return;
    }
    const bridge = resolveBridge();
    if (!bridge) {
      return;
    }
    const counts = bridge.getItemRequiredCounts?.({
      includeQuests,
      includeHideout: false,
    }) as Record<string, number> | undefined;
    const trackedCounts = bridge.getTrackedItemRequiredCounts?.({
      includeQuests,
      includeHideout: false,
    }) as Record<string, number> | undefined;
    const tracked = bridge.getTrackedItemIds?.({
      includeQuests,
      includeHideout: false,
    }) as string[] | undefined;
    setRequiredCounts(counts ?? {});
    setTrackedRequiredCounts(trackedCounts ?? {});
    setTrackedItemIds(tracked ?? []);
  }, [includeQuests]);

  const categorizedItems = useMemo<Record<ItemCategoryKey, Item[]>>(() => {
    const renderedData =
      isSessionEditEnabled && isEditingEnabled && draftItemsData ? draftItemsData : itemsData;
    if (!renderedData?.items) {
      return {
        general: [],
        cores: [],
        implants: [],
        weapons: [],
        mods: [],
      };
    }

    return {
      general: renderedData.items.items ?? [],
      cores: renderedData.items.cores ?? [],
      implants: renderedData.items.implants ?? [],
      weapons: renderedData.items.weapons ?? [],
      mods: renderedData.items.mods ?? [],
    };
  }, [draftItemsData, isEditingEnabled, isSessionEditEnabled, itemsData]);

  const items = useMemo<Item[]>(() => {
    const seenIds = new Set<string>();
    const selectedItems = [
      ...(categoryFilters.general ? categorizedItems.general : []),
      ...(categoryFilters.cores ? categorizedItems.cores : []),
      ...(categoryFilters.implants ? categorizedItems.implants : []),
      ...(categoryFilters.weapons ? categorizedItems.weapons : []),
      ...(categoryFilters.mods ? categorizedItems.mods : []),
    ];

    return selectedItems.filter((item) => {
        if (!item?.id || seenIds.has(item.id)) {
          return false;
        }
        seenIds.add(item.id);
        return true;
      });
  }, [categoryFilters, categorizedItems]);

  const rarityOptions = useMemo<string[]>(() => {
    const values = new Set<string>();
    for (const item of items) {
      const rarity = (item as { rarity?: string }).rarity?.trim();
      if (rarity) {
        values.add(rarity);
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const typeOptions = useMemo<string[]>(() => {
    const add = (set: Set<string>, maybeValue?: string | null) => {
      const next = maybeValue?.trim();
      if (next) {
        set.add(next);
      }
    };

    const values = new Set<string>();
    for (const item of items) {
      add(values, (item as { type?: string }).type);
      add(values, (item as { slotType?: string }).slotType);
      add(values, (item as { category?: string }).category);
      const runnerType = (item as { runnerType?: string[] }).runnerType;
      if (Array.isArray(runnerType)) {
        for (const value of runnerType) {
          add(values, value);
        }
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  // Subscribe to live progression updates
  useEffect(() => {
    return ProgressionUpdatesService.subscribe((op) => {
      if (op?.type !== "item-quantity") {
        return;
      }
      setItemQuantities((prev) => {
        if (!op.itemId) {
          return prev;
        }
        const next = { ...prev };
        if (typeof op.quantity === "number") {
          next[op.itemId] = op.quantity;
        } else {
          const bridge = resolveBridge();
          next[op.itemId] = bridge?.getItemCurrentQuantity?.(op.itemId) ?? 0;
        }
        return next;
      });
    });
  }, []);

  useEffect(() => {
    if (navigationTarget?.pageId !== "items-needed") {
      return;
    }
    const filters = navigationTarget.filters;
    if (typeof filters?.trackingOnly === "boolean") {
      setTrackingOnly(filters.trackingOnly);
    }
    if (typeof filters?.missingOnly === "boolean") {
      setMissingOnly(filters.missingOnly);
    }
    if (typeof filters?.includeQuests === "boolean") {
      setIncludeQuests(filters.includeQuests);
    }
    if (navigationTarget.itemId) {
      setForcedItemId(navigationTarget.itemId);
      setHighlightedItemId(navigationTarget.itemId);
    }
  }, [navigationTarget]);

  // Reset to page 1 whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [trackingOnly, missingOnly, includeQuests, searchTerm, categoryFilters]);

  const effectiveCounts = trackingOnly ? trackedRequiredCounts : requiredCounts;

  const visibleItems = useMemo(() => {
    const trackedSet = new Set(trackedItemIds);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    let nextItems = items.filter((item) => {
      const total = effectiveCounts[item.id] ?? 0;
      if (normalizedSearch) {
        const itemName = item.name?.toLowerCase() ?? "";
        if (!itemName.includes(normalizedSearch)) {
          return false;
        }
      }
      if (includeQuests && total === 0) {
        return false;
      }
      if (trackingOnly && !trackedSet.has(item.id)) {
        return false;
      }
      if (missingOnly) {
        const current = itemQuantities[item.id] ?? 0;
        if (current >= total) {
          return false;
        }
      }
      return true;
    });
    if (forcedItemId) {
      const forcedItem = items.find((item) => item.id === forcedItemId);
      if (forcedItem && !nextItems.some((item) => item.id === forcedItemId)) {
        nextItems = [forcedItem, ...nextItems];
      }
    }
    return nextItems;
  }, [
    items,
    trackingOnly,
    missingOnly,
    requiredCounts,
    trackedRequiredCounts,
    itemQuantities,
    trackedItemIds,
    includeQuests,
    forcedItemId,
    searchTerm,
  ]);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visibleItems.slice(start, start + PAGE_SIZE);
  }, [visibleItems, currentPage]);

  const getRarity = (item: Item) => {
    const itemRarity = (item as { rarity?: string }).rarity;
    if (itemRarity?.trim()) {
      return itemRarity.trim();
    }
    return ItemsElementUtils.getItemRarity(item.id);
  };

  const getRarityColor = (item: Item) => {
    const rarity = getRarity(item);
    if (!rarity) {
      return "#545e6c";
    }
    const color = rarityToColor(rarity);
    if (!color || color === "black") {
      return "#545e6c";
    }
    return color;
  };

  const getRarityLabel = (item: Item) => rarityToLabel(getRarity(item));

  const getItemDescription = (item: Item) => {
    const description = (item as { description?: string }).description;
    if (!description?.trim()) {
      return "No description available.";
    }
    return description.trim();
  };

  const getItemValue = (item: Item) => {
    const value = (item as { value?: number | null }).value;
    if (typeof value !== "number") {
      return "N/A";
    }
    return value.toLocaleString();
  };

  const getItemTypeLabel = (item: Item) => {
    const modType = (item as { type?: string }).type;
    if (modType?.trim()) {
      return modType.trim();
    }
    const slotType = (item as { slotType?: string }).slotType;
    if (slotType?.trim()) {
      return slotType.trim();
    }
    const category = (item as { category?: string }).category;
    if (category?.trim()) {
      return category.trim();
    }
    const runnerType = (item as { runnerType?: string[] }).runnerType;
    if (Array.isArray(runnerType) && runnerType.length > 0) {
      return runnerType.filter(Boolean).join(" / ");
    }
    return "Item";
  };

  const getEditableDescription = (item: Item) =>
    ((item as { description?: string }).description ?? "").trim();

  const getEditableType = (item: Item) => {
    const explicitType = (item as { type?: string }).type;
    if (explicitType?.trim()) {
      return explicitType;
    }
    return getItemTypeLabel(item);
  };

  const updateDraftItem = (itemId: string, updater: (item: Record<string, unknown>) => void) => {
    setDraftItemsData((prev) => {
      if (!prev?.items) {
        return prev;
      }
      const next = cloneItemsModel(prev);
      const sections = [
        next.items.items,
        next.items.cores,
        next.items.implants,
        next.items.weapons,
        next.items.mods,
      ];
      for (const section of sections) {
        const editableTarget = section.find((entry) => entry.id === itemId) as unknown as
          | Record<string, unknown>
          | undefined;
        if (!editableTarget) {
          continue;
        }
        updater(editableTarget);
        break;
      }
      return next;
    });
  };

  const updateDraftTextField = (
    itemId: string,
    field: "name" | "description" | "rarity" | "type",
    value: string,
  ) => {
    updateDraftItem(itemId, (item) => {
      item[field] = value;
    });
  };

  const updateDraftCost = (itemId: string, rawValue: string) => {
    updateDraftItem(itemId, (item) => {
      const nextValue = rawValue.trim().replace(",", ".");
      if (!nextValue) {
        item.value = null;
        return;
      }
      const parsed = Number.parseFloat(nextValue);
      item.value = Number.isNaN(parsed) ? item.value : parsed;
    });
  };

  const removeDraftItem = (itemId: string) => {
    setDraftItemsData((prev) => {
      if (!prev?.items) {
        return prev;
      }
      const next = cloneItemsModel(prev);
      next.items.items = next.items.items.filter((entry) => entry.id !== itemId);
      next.items.cores = next.items.cores.filter((entry) => entry.id !== itemId);
      next.items.implants = next.items.implants.filter((entry) => entry.id !== itemId);
      next.items.weapons = next.items.weapons.filter((entry) => entry.id !== itemId);
      next.items.mods = next.items.mods.filter((entry) => entry.id !== itemId);
      return next;
    });
  };

  const createUniqueDraftItemId = (name: string, data: ItemsModel): string => {
    const existingIds = new Set<string>();
    const categories = [
      data.items.items,
      data.items.cores,
      data.items.implants,
      data.items.weapons,
      data.items.mods,
    ];
    for (const category of categories) {
      for (const item of category) {
        existingIds.add(item.id);
      }
    }

    const base = normalizeItemIdFromName(name) || "new-item";
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

  const createNewItemForCategory = (
    category: ItemCategoryKey,
    newId: string,
    itemName: string,
  ): Item => {
    const defaultRarity = rarityOptions[0] ?? "common";
    const defaultType = typeOptions[0] ?? "General";
    if (category === "weapons") {
      const weapon: WeaponItem = {
        id: newId,
        name: itemName,
        description: "",
        rarity: defaultRarity,
        category: defaultType,
        fireMode: "",
        ammoId: "",
        modTypes: [],
        attributes: [],
        stats: {},
        value: 0,
        url: "",
      };
      return weapon;
    }
    if (category === "implants") {
      const implant: ImplantItem = {
        id: newId,
        name: itemName,
        description: "",
        slotType: defaultType,
        rarity: defaultRarity,
        url: "",
        value: 0,
        stats: [],
      };
      return implant;
    }
    if (category === "cores") {
      const core: CoreItem = {
        id: newId,
        name: itemName,
        runnerType: [],
        rarity: defaultRarity,
        description: "",
        url: "",
        value: null,
        active: null,
        passive: null,
        triggerCondition: null,
        enhancesAbility: [],
        attributes: null,
        foundLocations: [],
        effects: [],
        tags: [],
      };
      return core;
    }
    const mod: ModItem = {
      id: newId,
      name: itemName,
      type: defaultType,
      rarity: defaultRarity,
      description: "",
      url: "",
      value: 0,
      damageType: "",
      effects: [],
    };
    return mod;
  };

  const addDraftItem = () => {
    let createdId = "";
    setDraftItemsData((prev) => {
      if (!prev?.items) {
        return prev;
      }
      const next = cloneItemsModel(prev);
      const newItemName = "New Item";
      const newItemId = createUniqueDraftItemId(newItemName, next);
      const newItem = createNewItemForCategory(newItemCategory, newItemId, newItemName);
      createdId = newItem.id;
      if (newItemCategory === "general") {
        next.items.items = [newItem, ...next.items.items];
      } else if (newItemCategory === "cores") {
        next.items.cores = [newItem as CoreItem, ...next.items.cores];
      } else if (newItemCategory === "implants") {
        next.items.implants = [newItem as ImplantItem, ...next.items.implants];
      } else if (newItemCategory === "weapons") {
        next.items.weapons = [newItem as WeaponItem, ...next.items.weapons];
      } else {
        next.items.mods = [newItem as ModItem, ...next.items.mods];
      }
      return next;
    });
    if (createdId) {
      setForcedItemId(createdId);
      setHighlightedItemId(createdId);
    }
  };

  const handleSaveDraft = () => {
    if (!draftItemsData) {
      return;
    }
    localStorage.setItem(DEV_EDIT_STORAGE_KEY, JSON.stringify(draftItemsData, null, 2));
    setSaveMessage(`Saved to localStorage key "${DEV_EDIT_STORAGE_KEY}"`);
  };

  const handleResetDraft = () => {
    if (!isEditingEnabled) {
      return;
    }
    if (itemsData) {
      setDraftItemsData(cloneItemsModel(itemsData));
    }
    localStorage.removeItem(DEV_EDIT_STORAGE_KEY);
    setSaveMessage(`Reset edits and cleared localStorage key "${DEV_EDIT_STORAGE_KEY}"`);
  };

  useEffect(() => {
    if (!forcedItemId) {
      return;
    }
    // Jump to the page containing the forced item
    const idx = visibleItems.findIndex((item) => item.id === forcedItemId);
    if (idx >= 0) {
      setCurrentPage(Math.floor(idx / PAGE_SIZE) + 1);
    }
    const handle = globalThis.requestAnimationFrame(() => {
      const element = document.getElementById(`items-card-${forcedItemId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      onNavigationHandled?.();
    });
    return () => globalThis.cancelAnimationFrame(handle);
  }, [forcedItemId, onNavigationHandled, visibleItems]);

  useEffect(() => {
    if (!highlightedItemId) {
      return;
    }
    const timeout = globalThis.setTimeout(() => {
      setHighlightedItemId((current) =>
        current === highlightedItemId ? null : current,
      );
    }, 2500);
    return () => globalThis.clearTimeout(timeout);
  }, [highlightedItemId]);

  if (isLoading) {
    return (
      <div className="items-container">
        <section className="items-page">
          <div className="items-loading-overlay">
            <div className="items-loading-spinner" />
            <div className="items-loading-text">Loading items...</div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="items-container">
      <section className="items-page">
        <header className="items-header">
          <div className="items-title">
            <img
              className="items-title-logo"
              src="../img/items-needed.png"
              alt=""
            />
            <span className="items-title-text">Items</span>
          </div>
          <div className="items-header-right">
            {isSessionEditEnabled && (
              <>
                <button
                  type="button"
                  className={`items-dev-button${isEditingEnabled ? " is-active" : ""}`}
                  onClick={() => {
                    setIsEditingEnabled((prev) => {
                      const next = !prev;
                      if (next && itemsData && !draftItemsData) {
                        setDraftItemsData(cloneItemsModel(itemsData));
                      }
                      return next;
                    });
                    setSaveMessage("");
                  }}
                >
                  {isEditingEnabled ? "Editing Enabled" : "Enable Editing"}
                </button>
                {isEditingEnabled && (
                  <>
                    <select
                      className="items-edit-input items-dev-select"
                      value={newItemCategory}
                      onChange={(event) =>
                        setNewItemCategory(event.target.value as ItemCategoryKey)
                      }
                    >
                      <option value="general">General</option>
                      <option value="cores">Cores</option>
                      <option value="implants">Implants</option>
                      <option value="weapons">Weapons</option>
                      <option value="mods">Mods</option>
                    </select>
                    <button
                      type="button"
                      className="items-dev-button"
                      onClick={addDraftItem}
                    >
                      Add Item
                    </button>
                    <button
                      type="button"
                      className="items-dev-button"
                      onClick={handleResetDraft}
                    >
                      Reset Edits
                    </button>
                    <button
                      type="button"
                      className="items-dev-button"
                      onClick={handleSaveDraft}
                    >
                      Save
                    </button>
                  </>
                )}
              </>
            )}
            <input
              className="items-search"
              type="search"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onInput={(event) =>
                setSearchTerm((event.target as HTMLInputElement).value)
              }
            />
          </div>
        </header>
        <div className="items-filters">
          <button
            type="button"
            className={`items-filter-label${trackingOnly ? " is-active" : ""}`}
            onClick={() => setTrackingOnly((prev) => !prev)}
          >
            Tracking
          </button>
          <button
            type="button"
            className={`items-filter-label${missingOnly ? " is-active" : ""}`}
            onClick={() => setMissingOnly((prev) => !prev)}
          >
            Missing Only
          </button>
          <button
            type="button"
            className={`items-filter-label${includeQuests ? " is-active" : ""}`}
            onClick={() => setIncludeQuests((prev) => !prev)}
          >
            Quest Only
          </button>
          <button
            type="button"
            className={`items-filter-label${categoryFilters.general ? " is-active" : ""}`}
            onClick={() =>
              setCategoryFilters((prev) => ({ ...prev, general: !prev.general }))
            }
          >
            General
          </button>
          <button
            type="button"
            className={`items-filter-label${categoryFilters.cores ? " is-active" : ""}`}
            onClick={() =>
              setCategoryFilters((prev) => ({ ...prev, cores: !prev.cores }))
            }
          >
            Cores
          </button>
          <button
            type="button"
            className={`items-filter-label${categoryFilters.implants ? " is-active" : ""}`}
            onClick={() =>
              setCategoryFilters((prev) => ({ ...prev, implants: !prev.implants }))
            }
          >
            Implants
          </button>
          <button
            type="button"
            className={`items-filter-label${categoryFilters.weapons ? " is-active" : ""}`}
            onClick={() =>
              setCategoryFilters((prev) => ({ ...prev, weapons: !prev.weapons }))
            }
          >
            Weapons
          </button>
          <button
            type="button"
            className={`items-filter-label${categoryFilters.mods ? " is-active" : ""}`}
            onClick={() =>
              setCategoryFilters((prev) => ({ ...prev, mods: !prev.mods }))
            }
          >
            Mods
          </button>
        </div>
        <div className="items-grid scroll-div">
          {paginatedItems.map((item) => {
            const total = effectiveCounts[item.id] ?? 0;
            const current = Math.max(0, itemQuantities[item.id] ?? 0);
            const controlsEnabled = total >= 1;
            const isEditingItem = isSessionEditEnabled && isEditingEnabled;
            const itemCostValue = (item as { value?: number | null }).value;
            let leftAction: React.ReactNode;
            if (isEditingItem) {
              leftAction = (
                <button
                  type="button"
                  className="items-remove-x-button"
                  onClick={() => removeDraftItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  title="Remove item"
                >
                  ×
                </button>
              );
            } else if (controlsEnabled) {
              leftAction = (
                <div className="items-controls">
                  <button
                    type="button"
                    className="items-control-button"
                    onClick={() => {
                      const bridge = resolveBridge();
                      bridge?.increaseItemQuantity?.(item.id, 1);
                    }}
                  >
                    +
                  </button>
                  <div className="items-control-amount">
                    <input
                      className="items-control-input"
                      value={current}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw.startsWith("-")) {
                          return;
                        }
                        const digitsOnly = raw.split(/\D/).join("");
                        event.target.value = digitsOnly;
                      }}
                      onBlur={(event) => {
                        const nextValue =
                          event.target.value === "" ? 0 : Number(event.target.value);
                        const bridge = resolveBridge();
                        bridge?.updateProgression?.({
                          type: "item-quantity",
                          itemId: item.id,
                          quantity: Math.max(0, nextValue),
                        });
                      }}
                      aria-label="Item quantity"
                    />
                  </div>
                  <button
                    type="button"
                    className="items-control-button"
                    onClick={() => {
                      const bridge = resolveBridge();
                      bridge?.decreaseItemQuantity?.(item.id, 1);
                    }}
                  >
                    −
                  </button>
                </div>
              );
            } else {
              leftAction = (
                <div className="items-no-requirements">
                  No requirements
                </div>
              );
            }
            return (
            <div
              key={item.id}
              className={`items-card${
                highlightedItemId === item.id ? " is-highlighted" : ""
              }`}
              id={`items-card-${item.id}`}
            >
              {leftAction}
              <div className="items-image">
                <RarityPatternBackground
                  rarity={ItemsElementUtils.getItemRarity(item.id)}
                  className="items-image-pattern"
                />
                <ItemRequirementTooltip
                  itemId={item.id}
                  includeQuests={includeQuests}
                  includeHideout={false}
                >
                  <div className="item-requirement-trigger">
                    <ItemRarityImage itemId={item.id} size={75} />
                  </div>
                </ItemRequirementTooltip>
              </div>
              <div className="items-info">
                {!isEditingItem && (
                  <>
                    <div className="items-name">{item.name}</div>
                    <div className="items-description">{getItemDescription(item)}</div>
                  </>
                )}
                {isEditingItem && (
                  <div className="items-edit-fields">
                    <input
                      className="items-edit-input"
                      value={item.name ?? ""}
                      onChange={(event) =>
                        updateDraftTextField(item.id, "name", event.target.value)
                      }
                      placeholder="Name"
                    />
                    <select
                      className="items-edit-input"
                      value={(item as { rarity?: string }).rarity ?? ""}
                      onChange={(event) =>
                        updateDraftTextField(item.id, "rarity", event.target.value)
                      }
                    >
                      <option value="">Unknown</option>
                      {rarityOptions.map((rarity) => (
                        <option key={rarity} value={rarity}>
                          {rarity}
                        </option>
                      ))}
                    </select>
                    <select
                      className="items-edit-input"
                      value={getEditableType(item)}
                      onChange={(event) =>
                        updateDraftTextField(item.id, "type", event.target.value)
                      }
                    >
                      <option value="">Unknown</option>
                      {typeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      className="items-edit-input"
                      value={itemCostValue === null || itemCostValue === undefined ? "" : String(itemCostValue)}
                      onChange={(event) => updateDraftCost(item.id, event.target.value)}
                      placeholder="Cost"
                      type="number"
                      min={0}
                      step="any"
                    />
                    <textarea
                      className="items-edit-textarea"
                      value={getEditableDescription(item)}
                      onChange={(event) =>
                        updateDraftTextField(item.id, "description", event.target.value)
                      }
                      placeholder="Description"
                    />
                  </div>
                )}
                {!isEditingItem && (
                  <div className="items-meta-row">
                    <div
                      className={`items-total-count${
                        current >= total && total > 0 ? " is-complete" : ""
                      }`}
                    >
                      Total: {total}
                    </div>
                  </div>
                )}
              </div>
              <div
                className="items-card-header"
                style={{ "--item-popup-rarity-color": getRarityColor(item) } as React.CSSProperties}
              >
                <span className="items-card-header-rarity">{getRarityLabel(item)}</span>
                <span className="items-card-header-type">{getItemTypeLabel(item)}</span>
                <span className="items-card-header-cost">{getItemValue(item)}</span>
              </div>
            </div>
          );
          })}
        </div>
        {totalPages > 1 && (
          <div className="items-pagination">
            <button
              type="button"
              className="items-pagination-button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <span className="items-pagination-info">
              Page {currentPage} of {totalPages}
              <span className="items-pagination-count">
                ({visibleItems.length} items)
              </span>
            </span>
            <button
              type="button"
              className="items-pagination-button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        )}
        {isSessionEditEnabled && saveMessage && (
          <div className="items-dev-save-message">{saveMessage}</div>
        )}
      </section>
    </div>
  );
};
