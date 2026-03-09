import React, { useEffect, useMemo, useState } from "react";
import { buildIconsLayer } from "../modules/icons.module";
import { buildLineLayer } from "../modules/lines.module";
import { buildPolygonLayer } from "../modules/polygons.module";
import { useCoordinateUtils } from "../useCoordinateUtils";
import { useIconAtlas } from "../useIconAtlas";
import { useIconImagePaths } from "../useIconImagePaths";
import { useIconsData } from "../useIconsData";
import { useLoadedImages } from "../useLoadedImages";
import { buildFloorsLayers, FloorHoverInfo } from "../modules/floors.module";
import type { IconDatum } from "../builder/icon.builder";
import type { MapGeoDocument } from "../../../../../model/map/MapGeoDocument";
import type { MapFloorElementsData } from "../../../../../model/floor/IMapFloorElements";
import type { CorrelationMeta, FeatureProps } from "../../../../../model/map/FeatureProps";

type DeckFlowInput = {
  mapDoc: MapGeoDocument | null;
  floors: MapFloorElementsData | null;
  placeholderImage: string;
  floorId?: number | string | null;
  extraIcons?: IconDatum[];
  preferredPinnedId?: number | null;
  resetSelectionToken?: number;
  onFloorClick?: (buildingId: string) => void;
  onFloorSelect?: (floorId: number | string | null | undefined) => void;
  onFloorHover?: (info: FloorHoverInfo | null) => void;
  hoveredFloor?: FloorHoverInfo | null;
  /** Called when an icon is clicked (edit mode). If provided, suppresses normal pin behavior. */
  onIconClick?: (icon: IconDatum) => void;
  /** Called when an icon is CTRL+CLICKed (edit mode). Used for icon removal. */
  onIconRemoveClick?: (icon: IconDatum) => void;
  /** Optional feature id to force-hover from external UI (e.g. correlation list rows). */
  externallyHoveredFeatureId?: string | null;
  /**
   * Set of original FeatureProps.id values (as strings) whose icons should be
   * hidden from the base layer because they have been replaced by an edit.
   */
  excludedEntityIds?: Set<string>;
};

type DeckFlowState = {
  layers: any[];
  hoveredId: number | null;
  selectedId: number | null;
  hoveredIcon: IconDatum | null;
  isHoveringPopupRef: React.RefObject<boolean>;
  clearHover: (force?: boolean) => void;
  handlers: {
    onHover: (info: any) => void;
    onClick: (info: any, event?: any) => void;
  };
};

export const useDeckFlow = ({
  mapDoc,
  floors,
  placeholderImage,
  floorId = null,
  extraIcons = [],
  preferredPinnedId = null,
  resetSelectionToken = 0,
  onFloorClick,
  onFloorSelect,
  onFloorHover,
  hoveredFloor,
  onIconClick,
  onIconRemoveClick,
  excludedEntityIds,
  externallyHoveredFeatureId = null,
}: DeckFlowInput): DeckFlowState => {
  const { coord } = useCoordinateUtils(mapDoc);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredIcon, setHoveredIcon] = useState<IconDatum | null>(null);
  const [pinnedId, setPinnedId] = useState<number | null>(null);
  const [pinnedIcon, setPinnedIcon] = useState<IconDatum | null>(null);
  const isHoveringPopupRef = React.useRef(false);
  const appliedPreferredPinnedIdRef = React.useRef<number | null>(null);

  const paths = useIconImagePaths(mapDoc, placeholderImage);
  const { images, version } = useLoadedImages(paths, {
    cacheBust: false,
    crossOrigin: "anonymous",
  });

  const iconAtlas = useIconAtlas(images, version, 32);
  const activeFloorIds = useMemo(() => {
    if (!floors) return new Set<string>();
    const ids = new Set<string>();
    floors.elements?.forEach((building) => {
      building.floors?.forEach((floor) => {
        if (floor.active) {
          ids.add(String(floor.UUID));
        }
      });
    });
    return ids;
  }, [floors]);

  const iconBuildOptions = useMemo(
    () => ({
      getVisibility: (le: any) => {
        if (le?.active === false) return "hidden";
        const leFloor = le?.floor ?? le?.floorId;
        if (leFloor !== undefined && leFloor !== null && String(leFloor).length > 0) {
          if (activeFloorIds.has(String(leFloor))) return "visible";
          return le?.questId ? "dimmed" : "hidden";
        }
        return "visible";
      },
      floorId,
    }),
    [floorId, activeFloorIds]
  );
  const iconsData = useIconsData(mapDoc, floors, coord, placeholderImage, iconBuildOptions);


  const decoratedIconsData = useMemo<IconDatum[]>(() => {
    if (!coord) return iconsData;
    return [
      ...iconsData
    ];
  }, [coord, iconsData, placeholderImage]);

  // Filter out original map icons whose entity id is in the excluded set.
  // This prevents showing both the original and the edited version.
  const filteredIconsData = useMemo(() => {
    if (!excludedEntityIds || excludedEntityIds.size === 0) return decoratedIconsData;
    return decoratedIconsData.filter((icon) => {
      const entityId = String(icon.entity?.id ?? "");
      return !excludedEntityIds.has(entityId);
    });
  }, [decoratedIconsData, excludedEntityIds]);

  const mergedIconsData = useMemo(
    () => [...filteredIconsData, ...extraIcons],
    [filteredIconsData, extraIcons]
  );

  const getCorrelations = React.useCallback((props: FeatureProps | undefined): CorrelationMeta[] => {
    if (!props) return [];
    if (Array.isArray(props.correlations) && props.correlations.length > 0) {
      return props.correlations;
    }
    return props.correlation ? [props.correlation] : [];
  }, []);

  const resolveCorrelationId = React.useCallback(
    (icon: IconDatum | null | undefined): string | null => {
      if (!icon) return null;
      const direct = getCorrelations(icon.entity)?.[0]?.correlationId ?? null;
      if (direct) return direct;

      // Some maps have stacked duplicate icons at the same pixel location where
      // only one copy carries correlation metadata. Fall back to that copy.
      const fallback = mergedIconsData.find((candidate) => {
        if (candidate.id === icon.id) return false;
        if (candidate.pixelX !== icon.pixelX || candidate.pixelY !== icon.pixelY) return false;
        if ((candidate.iconTypeId ?? "") !== (icon.iconTypeId ?? "")) return false;
        return getCorrelations(candidate.entity).length > 0;
      });
      return fallback ? getCorrelations(fallback.entity)?.[0]?.correlationId ?? null : null;
    },
    [getCorrelations, mergedIconsData],
  );

  const activeCorrelationId = useMemo(() => {
    const pinnedCorrelation = resolveCorrelationId(pinnedIcon);
    if (pinnedCorrelation) return pinnedCorrelation;
    return resolveCorrelationId(hoveredIcon);
  }, [hoveredIcon, pinnedIcon, resolveCorrelationId]);

  useEffect(() => {
    if (!resetSelectionToken) return;
    setHoveredId(null);
    setHoveredIcon(null);
    setPinnedId(null);
    setPinnedIcon(null);
    setSelectedId(null);
  }, [resetSelectionToken]);

  const isCorrelationVisibleForIcon = React.useCallback(
    (icon: IconDatum) => {
      const correlations = getCorrelations(icon.entity);
      if (correlations.length === 0) return true;
      if (correlations.some((c) => c.trigger === "always")) return true;

      if (activeCorrelationId) {
        return correlations.some((c) => c.correlationId === activeCorrelationId);
      }

      // Keep only the primary/source node visible by default.
      // Source nodes carry their own id in anchors; target nodes carry source id.
      const iconId = Number(icon.entity?.id);
      return correlations.some(
        (c) =>
          c.role === "node" &&
          (((c.anchors ?? []).length === 0) ||
            (Number.isFinite(iconId) &&
              (c.anchors ?? []).some((anchorId) => Number(anchorId) === iconId))),
      );
    },
    [activeCorrelationId, getCorrelations]
  );

  const visibleIconsData = useMemo(
    () => mergedIconsData.filter((icon) => isCorrelationVisibleForIcon(icon)),
    [mergedIconsData, isCorrelationVisibleForIcon]
  );

  const externalHoveredIcon = useMemo(() => {
    if (!externallyHoveredFeatureId) return null;
    return (
      visibleIconsData.find(
        (icon) =>
          String(icon.editFeatureId ?? "") === externallyHoveredFeatureId ||
          String(icon.entity?.id ?? "") === externallyHoveredFeatureId,
      ) ?? null
    );
  }, [externallyHoveredFeatureId, visibleIconsData]);

  const effectiveHoveredId = externalHoveredIcon?.id ?? hoveredId;

  const correlationLines = useMemo(
    () => {
      const pickLineStyleCorrelation = (
        ...entries: Array<CorrelationMeta | undefined>
      ): CorrelationMeta | undefined => {
        const styled = entries.find(
          (entry) =>
            entry &&
            (Array.isArray(entry.lineColor) ||
              (typeof entry.lineWidth === "number" && entry.lineWidth > 0)),
        );
        return styled ?? entries.find(Boolean);
      };

      const grouped = new Map<
        string,
        Array<{ icon: IconDatum; correlation: CorrelationMeta }>
      >();

      visibleIconsData.forEach((icon) => {
        const correlations = getCorrelations(icon.entity);
        correlations.forEach((correlation) => {
          if (correlation.role === "area" || !correlation.correlationId) return;
          const list = grouped.get(correlation.correlationId) ?? [];
          list.push({ icon, correlation });
          grouped.set(correlation.correlationId, list);
        });
      });

      const lines: Array<{
        id: string;
        source: [number, number];
        target: [number, number];
        correlation?: CorrelationMeta;
      }> = [];

      grouped.forEach((nodes, correlationId) => {
        if (nodes.length < 2) return;

        const anchorIds = new Set<number>();
        nodes.forEach((node) => {
          (node.correlation.anchors ?? []).forEach((anchorId) => {
            if (Number.isFinite(anchorId)) anchorIds.add(anchorId);
          });
        });

        const isAnchorNode = (node: { icon: IconDatum }) =>
          anchorIds.has(Number(node.icon.entity?.id));

        const anchorNodes = nodes.filter(
          (node) => node.correlation.role === "node" && isAnchorNode(node),
        );
        const targetNodes = nodes.filter(
          (node) => !(node.correlation.role === "node" && isAnchorNode(node)),
        );

        if (anchorNodes.length > 0 && targetNodes.length > 0) {
          anchorNodes.forEach((anchorNode) => {
            targetNodes.forEach((targetNode) => {
              lines.push({
                id: `corr-line-${correlationId}-${anchorNode.icon.id}-${targetNode.icon.id}`,
                source: [anchorNode.icon.pixelX, anchorNode.icon.pixelY],
                target: [targetNode.icon.pixelX, targetNode.icon.pixelY],
                correlation: pickLineStyleCorrelation(
                  targetNode.correlation,
                  anchorNode.correlation,
                ),
              });
            });
          });
          return;
        }

        // Fallback for drafts where the source icon id is not persisted yet.
        const ordered = [...nodes].sort((a, b) => a.icon.id - b.icon.id);
        for (let idx = 1; idx < ordered.length; idx += 1) {
          const prev = ordered[idx - 1];
          const curr = ordered[idx];
          lines.push({
            id: `corr-line-${correlationId}-${prev.icon.id}-${curr.icon.id}`,
            source: [prev.icon.pixelX, prev.icon.pixelY],
            target: [curr.icon.pixelX, curr.icon.pixelY],
            correlation: pickLineStyleCorrelation(curr.correlation, prev.correlation),
          });
        }
      });

      return lines;
    },
    [getCorrelations, visibleIconsData]
  );

  useEffect(() => {
    if (preferredPinnedId === null || preferredPinnedId === undefined) {
      appliedPreferredPinnedIdRef.current = null;
      return;
    }
    if (appliedPreferredPinnedIdRef.current === preferredPinnedId) {
      return;
    }
    const icon = visibleIconsData.find((entry) => entry.id === preferredPinnedId) ?? null;
    if (!icon) return;
    appliedPreferredPinnedIdRef.current = preferredPinnedId;
    setPinnedId(preferredPinnedId);
    setHoveredId(preferredPinnedId);
    setSelectedId(preferredPinnedId);
    setPinnedIcon(icon);
    setHoveredIcon(icon);
  }, [preferredPinnedId, visibleIconsData]);

  useEffect(() => {
    const handleFocusIcon = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { iconId?: string | number }
        | undefined;
      const focusIconId = detail?.iconId;
      if (focusIconId === undefined || focusIconId === null) return;
      const icon = visibleIconsData.find(
        (entry) => String(entry.entity?.id) === String(focusIconId)
      );
      if (!icon) return;
      setPinnedId(icon.id);
      setHoveredId(icon.id);
      setSelectedId(icon.id);
      setPinnedIcon(icon);
      setHoveredIcon(icon);
    };
    if (typeof globalThis.addEventListener !== "function") return;
    globalThis.addEventListener("map-focus-icon", handleFocusIcon);
    return () => {
      globalThis.removeEventListener("map-focus-icon", handleFocusIcon);
    };
  }, [visibleIconsData]);

  // Keep pinned/hovered icon objects in sync with latest map/edit data so popup
  // content updates live while editing (description/images/quest metadata).
  useEffect(() => {
    if (pinnedId === null) return;
    const latestPinned = visibleIconsData.find((icon) => icon.id === pinnedId) ?? null;
    if (!latestPinned) {
      setPinnedId(null);
      setPinnedIcon(null);
      if (hoveredId === pinnedId) {
        setHoveredId(null);
        setHoveredIcon(null);
      }
      return;
    }
    if (pinnedIcon !== latestPinned) {
      setPinnedIcon(latestPinned);
    }
    if (hoveredId === pinnedId && hoveredIcon !== latestPinned) {
      setHoveredIcon(latestPinned);
    }
  }, [hoveredIcon, hoveredId, pinnedIcon, pinnedId, visibleIconsData]);

  useEffect(() => {
    if (hoveredId === null || hoveredId === pinnedId) return;
    const latestHovered = visibleIconsData.find((icon) => icon.id === hoveredId) ?? null;
    if (!latestHovered) {
      setHoveredId(null);
      setHoveredIcon(null);
      return;
    }
    if (hoveredIcon !== latestHovered) {
      setHoveredIcon(latestHovered);
    }
  }, [hoveredIcon, hoveredId, pinnedId, visibleIconsData]);

  const clearHover = React.useCallback((force = false) => {
    if (!force && pinnedId !== null) {
      return;
    }
    setHoveredId(null);
    setHoveredIcon(null);
    if (force) {
      setPinnedId(null);
      setPinnedIcon(null);
    }
  }, [pinnedId]);

  const handlers = useMemo(
    () => ({
      onHover: (info: any) => {
        const id = info?.object?.id ?? null;
        if (id !== null) {
          if ((info.object as IconDatum)?.dimmed) {
            if (!isHoveringPopupRef.current) {
              clearHover();
            }
            return;
          }
          setHoveredId(id);
          setHoveredIcon(info.object as IconDatum);
          return;
        }

        if (pinnedId !== null) {
          return;
        }
        if (!isHoveringPopupRef.current) {
          clearHover();
        }
      },
      onClick: (info: any, event?: any) => {
        const id = info?.object?.id ?? null;
        if (id !== null) {
          const icon = info.object as IconDatum;
          if (icon?.dimmed) {
            onFloorSelect?.(icon.floor);
            return;
          }

          const nativeEvent = event?.srcEvent ?? info?.srcEvent;
          const isCtrl = nativeEvent?.ctrlKey || nativeEvent?.metaKey;

          if (isCtrl && onIconRemoveClick) {
            onIconRemoveClick(icon);
            clearHover(true);
            return;
          }

          if (onIconClick) {
            onIconClick(icon);
            return;
          }
          setPinnedId(id);
          setPinnedIcon(icon);
          setHoveredId(id);
          setHoveredIcon(icon);
          return;
        }
        setPinnedId(null);
        setPinnedIcon(null);
        setSelectedId(id);
        clearHover(true);
      },
    }),
    [clearHover, pinnedId, onFloorSelect, onIconClick, onIconRemoveClick]
  );

  const layers = useMemo(() => {
    const out: any[] = [];

    const floorLayers = buildFloorsLayers({
      id: "map-floors",
      floors,
      raster: mapDoc?.raster ?? null,
      coord,
      opacity: 1,
      onFloorClick,
      onFloorHover,
    });
    out.push(...floorLayers);

    const correlationPolygonLayer = buildPolygonLayer({
      id: "map-correlation-polygons",
      mapDoc,
      coord,
      activeCorrelationId,
    });
    if (correlationPolygonLayer) out.push(correlationPolygonLayer);

    if (correlationLines.length > 0) {
      const lineLayer = buildLineLayer({
        id: "map-correlation-lines",
        coord,
        activeCorrelationId,
        lines: correlationLines,
      });
      if (lineLayer) out.push(lineLayer);
    }



    if (iconAtlas && visibleIconsData && visibleIconsData.length > 0) {
      const questIcons = visibleIconsData.filter((icon) => Boolean(icon?.entity?.questId));
      const regularIcons = visibleIconsData.filter((icon) => !icon?.entity?.questId);

      if (regularIcons.length > 0) {
        const icons = buildIconsLayer({
          id: "map-icons",
          data: regularIcons,
          atlas: iconAtlas,
          placeholder: placeholderImage,
          ui: { hoveredId: effectiveHoveredId, selectedId },
        });
        out.push(icons);
      }

      if (questIcons.length > 0) {
        const questLayer = buildIconsLayer({
          id: "map-quest-icons",
          data: questIcons,
          atlas: iconAtlas,
          placeholder: placeholderImage,
          ui: { hoveredId: effectiveHoveredId, selectedId },
        });
        out.push(questLayer);
      }
    }

    return out;
  }, [iconAtlas, visibleIconsData, effectiveHoveredId, selectedId, placeholderImage, floors, mapDoc, coord, hoveredFloor, onFloorClick, onFloorHover, pinnedId, activeCorrelationId, pinnedIcon, hoveredIcon, correlationLines]);

  return {
    layers,
    hoveredId,
    selectedId,
    hoveredIcon: pinnedIcon ?? externalHoveredIcon ?? hoveredIcon,
    isHoveringPopupRef,
    clearHover,
    handlers,
  };
};
