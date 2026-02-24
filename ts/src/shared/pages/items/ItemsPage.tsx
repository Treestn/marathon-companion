import React, { useEffect, useMemo, useRef, useState } from "react";
import { ItemsV2Object, ItemV2 } from "../../../model/items/IItemsElements";
import { ItemsElementUtils } from "../../../escape-from-tarkov/utils/ItemsElementUtils";
import { rarityToColor } from "../../../escape-from-tarkov/utils/RarityColorUtils";
import { ItemRarityImage } from "../../components/items/ItemRarityImage";
import { ProgressionUpdatesService } from "../../services/ProgressionUpdatesService";
import { ItemRequirementTooltip } from "../../components/items/ItemRequirementTooltip";
import { NavigationTarget } from "../../services/NavigationEvents";
import "./items.css";

type ItemsPageProps = {
  navigationTarget?: NavigationTarget | null;
  onNavigationHandled?: () => void;
};

const resolveBridge = () =>
  (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;

export const ItemsPage: React.FC<ItemsPageProps> = ({
  navigationTarget,
  onNavigationHandled,
}) => {
  const [itemsData, setItemsData] = useState<ItemsV2Object | null>(null);
  const [requiredCounts, setRequiredCounts] = useState<Record<string, number>>({});
  const [trackedRequiredCounts, setTrackedRequiredCounts] = useState<Record<string, number>>({});
  const [trackedItemIds, setTrackedItemIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [trackingOnly, setTrackingOnly] = useState(false);
  const [missingOnly, setMissingOnly] = useState(false);
  const [includeQuests, setIncludeQuests] = useState(true);
  const [includeHideout, setIncludeHideout] = useState(true);
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
        bridge.waitForHideoutData?.(),
      ]);

      if (!isMounted) {
        return;
      }

      // Retrieve all data in one go
      const data = bridge.getItemsData?.() as ItemsV2Object | undefined;
      if (data?.items?.length) {
        ItemsElementUtils.setItemsMap(data);
        setItemsData(data);
      }

      // Get all quantities in a single bulk call instead of N individual calls
      const quantities = bridge.getAllItemQuantities?.() as Record<string, number> | undefined;
      setItemQuantities(quantities ?? {});

      // Get required counts
      const counts = bridge.getItemRequiredCounts?.({
        includeQuests: true,
        includeHideout: true,
      }) as Record<string, number> | undefined;
      const trackedCounts = bridge.getTrackedItemRequiredCounts?.({
        includeQuests: true,
        includeHideout: true,
      }) as Record<string, number> | undefined;
      const tracked = bridge.getTrackedItemIds?.({
        includeQuests: true,
        includeHideout: true,
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

  // Refresh counts when quest/hideout filter toggles change (after initial load)
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
      includeHideout,
    }) as Record<string, number> | undefined;
    const trackedCounts = bridge.getTrackedItemRequiredCounts?.({
      includeQuests,
      includeHideout,
    }) as Record<string, number> | undefined;
    const tracked = bridge.getTrackedItemIds?.({
      includeQuests,
      includeHideout,
    }) as string[] | undefined;
    setRequiredCounts(counts ?? {});
    setTrackedRequiredCounts(trackedCounts ?? {});
    setTrackedItemIds(tracked ?? []);
  }, [includeQuests, includeHideout]);

  const items = useMemo<ItemV2[]>(() => itemsData?.items ?? [], [itemsData]);

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
    if (typeof filters?.includeHideout === "boolean") {
      setIncludeHideout(filters.includeHideout);
    }
    if (navigationTarget.itemId) {
      setForcedItemId(navigationTarget.itemId);
      setHighlightedItemId(navigationTarget.itemId);
    }
  }, [navigationTarget]);

  // Reset to page 1 whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [trackingOnly, missingOnly, includeQuests, includeHideout, searchTerm]);

  const effectiveCounts = trackingOnly ? trackedRequiredCounts : requiredCounts;

  const visibleItems = useMemo(() => {
    const trackedSet = new Set(trackedItemIds);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    let nextItems = items.filter((item) => {
      const total = effectiveCounts[item.id] ?? 0;
      if (normalizedSearch) {
        const itemName = item.name?.toLowerCase() ?? "";
        const itemShortName = item.shortname?.toLowerCase() ?? "";
        if (!itemName.includes(normalizedSearch) && !itemShortName.includes(normalizedSearch)) {
          return false;
        }
      }
      if ((includeQuests || includeHideout) && total === 0) {
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
    includeHideout,
    forcedItemId,
    searchTerm,
  ]);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visibleItems.slice(start, start + PAGE_SIZE);
  }, [visibleItems, currentPage]);

  const getRarityStyle = (itemId: string) => {
    const rarity = ItemsElementUtils.getItemRarity(itemId);
    if (!rarity) {
      return { backgroundColor: "white" };
    }
    const color = rarityToColor(rarity);
    if (!color || color === "black") {
      return undefined;
    }
    return { backgroundColor: color };
  };

  const getRarityLabel = (itemId: string) => {
    const rarity = ItemsElementUtils.getItemRarity(itemId);
    if (!rarity) {
      return "Unknown";
    }
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
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
            className={`items-filter-label${includeHideout ? " is-active" : ""}`}
            onClick={() => setIncludeHideout((prev) => !prev)}
          >
            Hideout Only
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
                <ItemRequirementTooltip
                  itemId={item.id}
                  includeQuests={includeQuests}
                  includeHideout={includeHideout}
                >
                  <div className="item-requirement-trigger">
                    <ItemRarityImage itemId={item.id} size={75} />
                  </div>
                </ItemRequirementTooltip>
              </div>
              <div className="items-info">
                <div className="items-name">{item.name}</div>
                <div
                  className={`items-total-count${
                    current >= total && total > 0 ? " is-complete" : ""
                  }`}
                >
                  Total: {total}
                </div>
                <div
                  className="items-rarity-label"
                  style={getRarityStyle(item.id)}
                >
                  {getRarityLabel(item.id)}
                </div>
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
