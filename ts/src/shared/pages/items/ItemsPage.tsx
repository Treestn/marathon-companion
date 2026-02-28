import React, { useEffect, useMemo, useRef, useState } from "react";
import { Item, ItemsModel } from "../../../model/items/IItemsElements";
import { ItemsElementUtils } from "../../../escape-from-tarkov/utils/ItemsElementUtils";
import { rarityToColor, rarityToLabel } from "../../../escape-from-tarkov/utils/RarityColorUtils";
import { ItemRarityImage } from "../../components/items/ItemRarityImage";
import { RarityPatternBackground } from "../../components/rarity/RarityPatternBackground";
import { ProgressionUpdatesService } from "../../services/ProgressionUpdatesService";
import { ItemRequirementTooltip } from "../../components/items/ItemRequirementTooltip";
import { NavigationTarget } from "../../services/NavigationEvents";
import "./items.css";

type ItemsPageProps = {
  navigationTarget?: NavigationTarget | null;
  onNavigationHandled?: () => void;
};

type ItemCategoryKey = "general" | "cores" | "implants" | "weapons" | "mods";

const resolveBridge = () =>
  (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;

export const ItemsPage: React.FC<ItemsPageProps> = ({
  navigationTarget,
  onNavigationHandled,
}) => {
  const [itemsData, setItemsData] = useState<ItemsModel | null>(null);
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
  }, []);

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
    if (!itemsData?.items) {
      return {
        general: [],
        cores: [],
        implants: [],
        weapons: [],
        mods: [],
      };
    }

    return {
      general: itemsData.items.items ?? [],
      cores: itemsData.items.cores ?? [],
      implants: itemsData.items.implants ?? [],
      weapons: itemsData.items.weapons ?? [],
      mods: itemsData.items.mods ?? [],
    };
  }, [itemsData]);

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

  const getRarityColor = (itemId: string) => {
    const rarity = ItemsElementUtils.getItemRarity(itemId);
    if (!rarity) {
      return "#545e6c";
    }
    const color = rarityToColor(rarity);
    if (!color || color === "black") {
      return "#545e6c";
    }
    return color;
  };

  const getRarityLabel = (itemId: string) => {
    const rarity = ItemsElementUtils.getItemRarity(itemId);
    return rarityToLabel(rarity);
  };

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
            return (
            <div
              key={item.id}
              className={`items-card${
                highlightedItemId === item.id ? " is-highlighted" : ""
              }`}
              id={`items-card-${item.id}`}
            >
              {controlsEnabled ? (
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
              ) : (
              <div className="items-no-requirements">
                No requirements
              </div>
              )}
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
                <div className="items-name">{item.name}</div>
                <div className="items-description">{getItemDescription(item)}</div>
                <div className="items-meta-row">
                <div
                  className={`items-total-count${
                    current >= total && total > 0 ? " is-complete" : ""
                  }`}
                >
                  Total: {total}
                </div>
                </div>
              </div>
              <div
                className="items-card-header"
                style={{ "--item-popup-rarity-color": getRarityColor(item.id) } as React.CSSProperties}
              >
                <span className="items-card-header-rarity">{getRarityLabel(item.id)}</span>
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
      </section>
    </div>
  );
};
