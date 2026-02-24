import React from "react";
import { createPortal } from "react-dom";
import { PolygonLayer } from "@deck.gl/layers";
import { useMapboxOverlay } from "./deck/useMapboxOverlay";
import { useDeckFlow } from "./deck/flow/useDeckFlow";
import { useCoordinateUtils } from "./deck/useCoordinateUtils";
import { buildDotsLayer } from "./deck/modules/dot.module";
import { buildLineLayer } from "./deck/modules/lines.module";
import type { FloorHoverInfo } from "./deck/modules/floors.module";
import { IconPopup } from "./components/IconPopup";
import { FullscreenImageViewer } from "./components/FullscreenImageViewer";
import { useFullscreenState } from "./components/hooks/useFullscreenState";
import { usePopupContainer } from "./components/hooks/usePopupContainer";
import { useViewerContainer } from "./components/hooks/useViewerContainer";
import { useOptionalMapEditPlacementContext } from "../../context/MapEditPlacementContext";
import type { FeatureProps } from "../../../model/map/FeatureProps";
import type { EditMapDocument } from "./edit/useMapEditSession";
import type { IconDatum } from "./deck/builder/icon.builder";
import type { CoordinateUtils } from "./utils/coordinateUtils";

const START_CORRELATION_PICK_EVENT = "map-correlation-pick:start";
const STOP_CORRELATION_PICK_EVENT = "map-correlation-pick:stop";
const TARGET_PICKED_CORRELATION_EVENT = "map-correlation-pick:target-picked";
const CORRELATION_ITEM_HOVER_EVENT = "map-correlation-item:hover";

function buildEditIcons(
  editDoc: EditMapDocument | undefined,
  coord: CoordinateUtils | null,
  activeEditFeatureId: string | null,
): IconDatum[] {
  if (!editDoc || !coord) return [];

  const activeIdNum = activeEditFeatureId ? Number(activeEditFeatureId) : Number.NaN;

  type Entry = { feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>; layer: typeof editDoc.groups[0]["layers"][0] };
  const entries: Entry[] = [];

  for (const group of editDoc.groups) {
    for (const layer of group.layers) {
      for (const feature of layer.data.features) {
        if (feature.properties.id !== activeIdNum) {
          entries.push({ feature, layer });
        }
      }
    }
  }

  return entries
    .filter(({ feature }) => feature.geometry.type === "Point")
    .map(({ feature, layer }, idx) => {
    const numericId = 990700000 + idx;
    const coords = (feature.geometry as GeoJSON.Point).coordinates;
    const position = coord.pixelToLngLat(coords[0], coords[1]);
    return {
      id: numericId,
      position,
      image: layer.iconPath,
      width: 22,
      height: 22,
      entity: feature.properties,
      name: layer.name,
      pixelX: coords[0],
      pixelY: coords[1],
      iconTypeId: layer.id,
      editFeatureId: String(feature.properties.id),
    };
    });
}

/**
 * Collect the IDs of original map features that should be hidden from the
 * base icon layer because they are either being edited or have been removed.
 */
function collectEditedOriginalIds(
  editDoc: EditMapDocument | undefined,
  activeEditFeatureId: string | null,
): Set<string> {
  const ids = new Set<string>();

  // Edited features (originals that were modified) should hide the base icon
  for (const group of (editDoc?.groups ?? [])) {
    for (const layer of group.layers) {
      for (const id of layer.editedFeatureIds) {
        ids.add(String(id));
      }
    }
  }

  // Include original features that were explicitly removed by the user
  for (const removedId of editDoc?.removedFeatureIds ?? []) {
    ids.add(removedId);
  }

  // The feature currently being edited in the panel is not in editDoc yet
  // (it only lands there on submit), so include it separately.
  if (activeEditFeatureId) {
    const activeNum = Number(activeEditFeatureId);
    if (!Number.isNaN(activeNum) && activeNum > 0) {
      ids.add(activeEditFeatureId);
    }
  }

  return ids;
}

type PixelPoint = [number, number];

const getFeatureRing = (feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>): PixelPoint[] => {
  if (feature.geometry.type === "Polygon") {
    const ring = (feature.geometry.coordinates?.[0] ?? []) as PixelPoint[];
    if (ring.length <= 1) return [];
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      return ring.slice(0, -1);
    }
    return ring;
  }
  if (feature.geometry.type === "LineString") {
    return (feature.geometry.coordinates ?? []) as PixelPoint[];
  }
  return [];
};

const closeRing = (ring: PixelPoint[]): PixelPoint[] => {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, [first[0], first[1]]];
};

const pointDistance = (a: PixelPoint, b: PixelPoint): number => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.hypot(dx, dy);
};

const clampChannel = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const hexToRgba = (hex: string | undefined, alpha: number, fallback: [number, number, number, number]) => {
  if (!hex) return fallback;
  const normalized = hex.trim();
  const full = /^#([0-9a-fA-F]{6})$/;
  const short = /^#([0-9a-fA-F]{3})$/;
  let parsed = normalized;
  if (short.test(normalized)) {
    const m = normalized.slice(1);
    parsed = `#${m[0]}${m[0]}${m[1]}${m[1]}${m[2]}${m[2]}`;
  }
  if (!full.test(parsed)) return fallback;
  const r = Number.parseInt(parsed.slice(1, 3), 16);
  const g = Number.parseInt(parsed.slice(3, 5), 16);
  const b = Number.parseInt(parsed.slice(5, 7), 16);
  return [r, g, b, clampChannel(alpha)] as [number, number, number, number];
};

const pointInPolygon = (point: PixelPoint, ring: PixelPoint[]): boolean => {
  if (ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

type MapDeckGLLayerProps = {
  map: any;
  mapDoc: any;
  floors: any;
  allowQuestNavigation?: boolean;
  editDoc?: EditMapDocument;
  /** Called when an icon is clicked while in edit mode */
  onEditIconClick?: (icon: IconDatum) => void;
};

export function MapDeckGLLayer({ 
  map, 
  mapDoc,
  floors,
  allowQuestNavigation = true,
  editDoc,
  onEditIconClick,
}: Readonly<MapDeckGLLayerProps>) {

  const DEFAULT_PLACEHOLDER_IMAGE = '../../img/icons/target.png';

  const [activeFloorsByBuilding, setActiveFloorsByBuilding] = React.useState<Record<string, number>>({});
  const [hoveredFloor, setHoveredFloor] = React.useState<FloorHoverInfo | null>(null);
  const hoveredFloorRef = React.useRef<FloorHoverInfo | null>(null);
  const {
    activeTool,
    isActive: isPlacementActive,
    iconPath: placementIconPath,
    placementLocation,
    hoverLocation,
    activeFeature,
    activeGeometry,
    refreshToken,
    activeLayerName,
    selectionResetToken,
    activeEditFeatureId,
    setHoverLocation,
    setActiveGeometry,
    setActiveEditFeatureId,
    requestRefresh,
    setPlacementState,
  } = useOptionalMapEditPlacementContext();
  const { coord } = useCoordinateUtils(mapDoc);
  const [ghostLngLat, setGhostLngLat] = React.useState<[number, number] | null>(null);
  const dragVertexIndexRef = React.useRef<number | null>(null);
  const didDragVertexRef = React.useRef(false);
  const didDeleteVertexRef = React.useRef(false);
  const [correlationPickActive, setCorrelationPickActive] = React.useState(false);
  const [hoveredCorrelationTargetFeatureId, setHoveredCorrelationTargetFeatureId] = React.useState<string | null>(null);

  const [floorTooltipContainer, setFloorTooltipContainer] = React.useState<HTMLDivElement | null>(null);
  const lastLayersRef = React.useRef<any[] | null>(null);

  const floorsForRender = React.useMemo(() => {
    if (!floors) return floors;

    return {
      ...floors,
      elements: floors.elements.map((building) => {
        const floorCount = building.floors?.length ?? 0;
        if (floorCount === 0) return building;

        const storedIndex = activeFloorsByBuilding[building.UUID];
        const fallbackIndex = Math.max(
          0,
          building.floors.findIndex((floor) => floor.active)
        );
        const activeIndex = storedIndex ?? fallbackIndex;

        return {
          ...building,
          floors: building.floors.map((floor, idx) => ({
            ...floor,
            active: idx === activeIndex,
          })),
        };
      }),
    };
  }, [floors, activeFloorsByBuilding]);

  const handleFloorClick = React.useCallback(
    (buildingId: string) => {
      if (!floors) return;
      const building = floors.elements.find((b) => b.UUID === buildingId);
      if (!building?.floors?.length) return;

      setActiveFloorsByBuilding((prev) => {
        const currentIndex =
          prev[buildingId] ??
          Math.max(0, building.floors.findIndex((floor) => floor.active));
        const nextIndex = (currentIndex + 1) % building.floors.length;
        return { ...prev, [buildingId]: nextIndex };
      });
    },
    [floors]
  );

  const handleFloorSelect = React.useCallback(
    (floorId: number | string | null | undefined) => {
      if (!floors || floorId === null || floorId === undefined) return;
      const floorIdStr = String(floorId);
      const building = floors.elements.find((b) =>
        b.floors?.some((floor) => String(floor.UUID) === floorIdStr)
      );
      if (!building?.floors?.length) return;
      const index = building.floors.findIndex((floor) => String(floor.UUID) === floorIdStr);
      if (index === -1) return;
      setActiveFloorsByBuilding((prev) => ({ ...prev, [building.UUID]: index }));
    },
    [floors]
  );

  const handleFloorHover = React.useCallback((info: FloorHoverInfo | null) => {
    hoveredFloorRef.current = info;
    setHoveredFloor(info);
  }, []);

  const ghostIcon = React.useMemo(() => {
    if (!isPlacementActive || !ghostLngLat || !coord || !placementIconPath) return [];
    const [pixelX, pixelY] = coord.lngLatToPixel(ghostLngLat[0], ghostLngLat[1]);
    return [
      {
        id: 990500000,
        position: ghostLngLat,
        image: placementIconPath,
        width: 22,
        height: 22,
        entity: { id: 990500000, kind: "edit-ghost" },
        name: "Click to Place",
        pixelX,
        pixelY,
        iconTypeId: activeFeature?.properties?.iconTypeId ?? undefined,
      },
    ];
  }, [isPlacementActive, ghostLngLat, coord, placementIconPath]);

  const placedIcon = React.useMemo(() => {
    if (!placementLocation || !coord || !placementIconPath || !activeFeature) return [];
    const position = coord.pixelToLngLat(placementLocation.x, placementLocation.y);
    return [
      {
        id: 990600000,
        position,
        image: placementIconPath,
        width: 22,
        height: 22,
        entity: activeFeature.properties,
        name: activeLayerName || "Placed Icon",
        pixelX: placementLocation.x,
        pixelY: placementLocation.y,
        iconTypeId: activeFeature.properties?.iconTypeId ?? undefined,
      },
    ];
  }, [placementLocation, coord, placementIconPath, activeFeature, refreshToken]);

  // Convert submitted edit features into renderable icons
  // Skip the feature currently being edited (it is shown via placedIcon instead)
  const editIcons = React.useMemo(
    () => buildEditIcons(editDoc, coord, activeEditFeatureId),
    [editDoc, coord, activeEditFeatureId],
  );

  // Collect IDs of original map features that have been edited so they
  // can be hidden from the base icon layer (the edit version replaces them).
  const editedOriginalIds = React.useMemo(
    () => collectEditedOriginalIds(editDoc, activeEditFeatureId),
    [editDoc, activeEditFeatureId],
  );

  const editablePolygons = React.useMemo(() => {
    const out: Array<{
      id: string;
      ring: PixelPoint[];
      featureId: string;
      groupId: string;
      groupName: string;
      layerId: string;
      layerName: string;
      iconPath: string;
      properties: FeatureProps;
    }> = [];
    for (const group of editDoc?.groups ?? []) {
      for (const layer of group.layers) {
        for (const feature of layer.data.features) {
          if (feature.geometry.type !== "Polygon") continue;
          const featureId = String(feature.properties?.id ?? "");
          const ring = getFeatureRing(feature);
          if (ring.length < 3) continue;
          out.push({
            id: `${group.id}:${layer.id}:${featureId}`,
            ring,
            featureId,
            groupId: group.id,
            groupName: group.name,
            layerId: layer.id,
            layerName: layer.name,
            iconPath: layer.iconPath,
            properties: feature.properties,
          });
        }
      }
    }
    return out;
  }, [editDoc]);
  const pickablePolygons = React.useMemo(() => {
    const out = [...editablePolygons];
    for (const group of mapDoc?.groups ?? []) {
      for (const layer of group.layers ?? []) {
        for (const feature of layer.data?.features ?? []) {
          if (feature.geometry.type !== "Polygon") continue;
          const featureId = String(feature.properties?.id ?? "");
          if (!featureId) continue;
          const alreadyTracked = out.some((entry) => entry.featureId === featureId);
          if (alreadyTracked) continue;
          const ring = getFeatureRing(feature as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
          if (ring.length < 3) continue;
          out.push({
            id: `${group.id}:${layer.id}:${featureId}`,
            ring,
            featureId,
            groupId: group.id,
            groupName: group.name,
            layerId: layer.id,
            layerName: layer.name,
            iconPath: layer.style?.iconImagePath ?? "",
            properties: feature.properties,
          });
        }
      }
    }
    return out;
  }, [editablePolygons, mapDoc]);
  const activeGeometryRef = React.useRef(activeGeometry);
  const editablePolygonsRef = React.useRef(editablePolygons);
  const pickablePolygonsRef = React.useRef(pickablePolygons);

  React.useEffect(() => {
    activeGeometryRef.current = activeGeometry;
  }, [activeGeometry]);

  React.useEffect(() => {
    editablePolygonsRef.current = editablePolygons;
  }, [editablePolygons]);

  React.useEffect(() => {
    pickablePolygonsRef.current = pickablePolygons;
  }, [pickablePolygons]);

  React.useEffect(() => {
    const handleStart = () => setCorrelationPickActive(true);
    const handleStop = () => setCorrelationPickActive(false);
    if (typeof globalThis.addEventListener !== "function") return;
    globalThis.addEventListener(START_CORRELATION_PICK_EVENT, handleStart);
    globalThis.addEventListener(STOP_CORRELATION_PICK_EVENT, handleStop);
    return () => {
      globalThis.removeEventListener(START_CORRELATION_PICK_EVENT, handleStart);
      globalThis.removeEventListener(STOP_CORRELATION_PICK_EVENT, handleStop);
    };
  }, []);

  React.useEffect(() => {
    const handleCorrelationItemHover = (event: Event) => {
      const detail = (event as CustomEvent<{ featureId?: string | null }>).detail;
      const featureId = detail?.featureId;
      setHoveredCorrelationTargetFeatureId(featureId ? String(featureId) : null);
    };
    if (typeof globalThis.addEventListener !== "function") return;
    globalThis.addEventListener(CORRELATION_ITEM_HOVER_EVENT, handleCorrelationItemHover as EventListener);
    return () => {
      globalThis.removeEventListener(
        CORRELATION_ITEM_HOVER_EVENT,
        handleCorrelationItemHover as EventListener,
      );
    };
  }, []);

  const emitCorrelationTargetPicked = React.useCallback((detail: Record<string, unknown>) => {
    if (typeof globalThis.dispatchEvent !== "function") return;
    globalThis.dispatchEvent(
      new CustomEvent(TARGET_PICKED_CORRELATION_EVENT, { detail }),
    );
    globalThis.dispatchEvent(new CustomEvent(STOP_CORRELATION_PICK_EVENT));
    setCorrelationPickActive(false);
  }, []);

  const handleMapIconClick = React.useCallback(
    (icon: IconDatum) => {
      if (correlationPickActive) {
        const layerId = icon.iconTypeId ?? icon.entity?.iconTypeId;
        const editGroup = editDoc?.groups?.find((g: any) =>
          g.layers?.some((l: any) => l.id === layerId),
        );
        const baseGroup = mapDoc?.groups?.find((g: any) =>
          g.layers?.some((l: any) => l.id === layerId),
        );
        const group = editGroup ?? baseGroup;
        const layer = group?.layers?.find((l: any) => l.id === layerId);
        if (!layerId || !group || !layer) return;
        const layerIconPath = layer.iconPath ?? layer.style?.iconImagePath ?? "";
        emitCorrelationTargetPicked({
          kind: "icon",
          featureId: String(icon.editFeatureId ?? icon.entity?.id ?? ""),
          groupId: group.id,
          groupName: group.name,
          layerId: layer.id,
          layerName: layer.name,
          iconPath: layerIconPath,
          geometry: { type: "Point", coordinates: [icon.pixelX, icon.pixelY] },
          properties: icon.entity,
          label: `${group.name} / ${layer.name}`,
        });
        return;
      }
      if (editDoc && !isPlacementActive && activeTool !== "polygon") {
        onEditIconClick?.(icon);
      }
    },
    [
      activeTool,
      correlationPickActive,
      editDoc,
      emitCorrelationTargetPicked,
      isPlacementActive,
      mapDoc,
      onEditIconClick,
    ],
  );

  const polygonRenderLayers = React.useMemo(() => {
    if (!coord) return [] as any[];
    const out: any[] = [];

    if (editablePolygons.length > 0) {
      out.push(
        new PolygonLayer({
          id: "map-edit-polygons",
          data: editablePolygons,
          pickable: false,
          stroked: true,
          filled: true,
          getPolygon: (d: { ring: PixelPoint[] }) =>
            closeRing(d.ring).map(([x, y]) => coord.pixelToLngLat(x, y)),
          getFillColor: (d: { properties: FeatureProps }) =>
            hexToRgba(d.properties?.polygonFillColor, 55, [90, 200, 160, 55]),
          getLineColor: (d: { properties: FeatureProps }) =>
            hexToRgba(d.properties?.polygonOutlineColor, 220, [120, 240, 190, 220]),
          lineWidthMinPixels: 2,
          parameters: { depthTest: false, depthMask: false },
        }),
      );
    }

    const activeVertices = activeGeometry ? getFeatureRing(activeGeometry) : [];
    if (activeGeometry?.geometry.type === "LineString" && activeVertices.length >= 2) {
      const lines = activeVertices.slice(0, -1).map((source, idx) => ({
        id: `draft-line-${idx}`,
        source,
        target: activeVertices[idx + 1],
      }));
      const lineLayer = buildLineLayer({
        id: "map-edit-polygon-draft-line",
        coord,
        lines,
      });
      if (lineLayer) out.push(lineLayer);
    }
    if (
      activeGeometry?.geometry.type === "LineString" &&
      activeVertices.length >= 1 &&
      hoverLocation
    ) {
      const last = activeVertices[activeVertices.length - 1];
      if (last) {
        const hoverLine = buildLineLayer({
          id: "map-edit-polygon-hover-line",
          coord,
          lines: [
            {
              id: "draft-hover-line",
              source: last,
              target: [hoverLocation.x, hoverLocation.y],
            },
          ],
        });
        if (hoverLine) out.push(hoverLine);
      }
    }
    if (activeGeometry?.geometry.type === "LineString" && hoverLocation) {
      out.push(
        buildDotsLayer({
          id: "map-edit-polygon-hover-vertex",
          data: [
            {
              id: "hover-vertex",
              position: coord.pixelToLngLat(hoverLocation.x, hoverLocation.y),
              color: [255, 210, 80, 240] as [number, number, number, number],
              radiusPx: 6,
            },
          ],
          pickable: false,
        }),
      );
    }

    if (activeGeometry?.geometry.type === "Polygon" && activeVertices.length >= 3) {
      out.push(
        new PolygonLayer({
          id: "map-edit-polygon-active",
          data: [{ ring: activeVertices }],
          pickable: false,
          stroked: true,
          filled: true,
          getPolygon: (d: { ring: PixelPoint[] }) =>
            closeRing(d.ring).map(([x, y]) => coord.pixelToLngLat(x, y)),
          getFillColor: () =>
            hexToRgba(activeGeometry.properties?.polygonFillColor, 65, [90, 200, 160, 65]),
          getLineColor: () =>
            hexToRgba(activeGeometry.properties?.polygonOutlineColor, 240, [120, 240, 190, 240]),
          lineWidthMinPixels: 2,
          parameters: { depthTest: false, depthMask: false },
        }),
      );
    }

    if (activeVertices.length > 0) {
      const vertexDots = activeVertices.map((point, idx) => ({
        id: `vertex-${idx}`,
        position: coord.pixelToLngLat(point[0], point[1]),
        color: [255, 210, 80, 240] as [number, number, number, number],
        radiusPx: 6,
      }));
      out.push(
        buildDotsLayer({
          id: "map-edit-polygon-vertices",
          data: vertexDots,
          pickable: false,
        }),
      );
    }

    if (activeGeometry?.geometry.type === "Polygon" && activeVertices.length >= 2) {
      const midpoints = activeVertices.map((point, idx) => {
        const next = activeVertices[(idx + 1) % activeVertices.length];
        const mx = (point[0] + next[0]) / 2;
        const my = (point[1] + next[1]) / 2;
        return {
          id: `mid-${idx}`,
          position: coord.pixelToLngLat(mx, my),
          color: [120, 220, 255, 220] as [number, number, number, number],
          radiusPx: 4,
        };
      });
      out.push(
        buildDotsLayer({
          id: "map-edit-polygon-midpoints",
          data: midpoints,
          pickable: false,
        }),
      );
    }
    return out;
  }, [coord, editablePolygons, activeGeometry, hoverLocation]);

  const {
    layers,
    hoveredIcon,
    isHoveringPopupRef,
    clearHover,
    handlers,
  } = useDeckFlow({
    mapDoc,
    floors: floorsForRender,
    placeholderImage: DEFAULT_PLACEHOLDER_IMAGE,
    extraIcons: [...ghostIcon, ...placedIcon, ...editIcons],
    preferredPinnedId: placementLocation ? 990600000 : null,
    resetSelectionToken: selectionResetToken,
    onFloorClick: handleFloorClick,
    onFloorSelect: handleFloorSelect,
    onFloorHover: handleFloorHover,
    hoveredFloor,
    onIconClick:
      correlationPickActive || Boolean(editDoc) ? handleMapIconClick : undefined,
    excludedEntityIds: editedOriginalIds,
    externallyHoveredFeatureId: hoveredCorrelationTargetFeatureId,
  });
  const sanitizedLayers = React.useMemo(
    () => [...layers.filter(Boolean), ...polygonRenderLayers.filter(Boolean)],
    [layers, polygonRenderLayers],
  );
  const fullscreen = useFullscreenState();

  const readyOnceRef = React.useRef(false);
  const [overlayReady, setOverlayReady] = React.useState(false);

  const onReady = React.useCallback(() => {
    if (readyOnceRef.current) return;
    readyOnceRef.current = true;
    setOverlayReady(true);
  }, []);

  const overlayRef = useMapboxOverlay({
    map,
    interleaved: false,
    handlers,
    onReady
  });

  const popupContainer = usePopupContainer(map);
  const viewerContainer = useViewerContainer(map);

  React.useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    if (!container) return;

    const handleMouseMove = (event: MouseEvent) => {
      const current = hoveredFloorRef.current;
      if (!current) return;
      const rect = container.getBoundingClientRect();
      const next = {
        ...current,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      hoveredFloorRef.current = next;
      setHoveredFloor(next);
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, [map]);

  React.useEffect(() => {
    if (!map || !coord) return;
    if (activeTool !== "icon" || !isPlacementActive || !placementIconPath) {
      setGhostLngLat(null);
      return;
    }
    const handleMove = (event: any) => {
      const [pixelX, pixelY] = coord.lngLatToPixel(event.lngLat.lng, event.lngLat.lat);
      setHoverLocation({ x: pixelX, y: pixelY });
      setGhostLngLat([event.lngLat.lng, event.lngLat.lat]);
    };
    const handleLeave = () => {
      setHoverLocation(null);
        setGhostLngLat(null);
    };
    const handleClick = (event: any) => {
      const [pixelX, pixelY] = coord.lngLatToPixel(event.lngLat.lng, event.lngLat.lat);
      clearHover(true);
      setPlacementState({
        activeTool: "icon",
        isActive: false,
        iconPath: placementIconPath ?? null,
        placementLocation: { x: pixelX, y: pixelY },
        hoverLocation: null,
        activeFeature,
        activeGeometry,
        refreshToken,
        activeLayerName,
        selectionResetToken,
        activeEditFeatureId,
      });
      setGhostLngLat(null);
    };
    map.on("mousemove", handleMove);
    map.on("mouseleave", handleLeave);
    map.on("click", handleClick);
    return () => {
      map.off("mousemove", handleMove);
      map.off("mouseleave", handleLeave);
      map.off("click", handleClick);
    };
  }, [
    activeTool,
    map,
    coord,
    isPlacementActive,
    placementIconPath,
    setHoverLocation,
    clearHover,
    setPlacementState,
  ]);

  React.useEffect(() => {
    if (!map || !coord) return;
    if (activeTool !== "polygon") return;

    const getPixelPoint = (event: any): PixelPoint | null => {
      const lng = event?.lngLat?.lng;
      const lat = event?.lngLat?.lat;
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        return coord.lngLatToPixel(lng, lat);
      }

      const pointX = event?.point?.x;
      const pointY = event?.point?.y;
      if (Number.isFinite(pointX) && Number.isFinite(pointY)) {
        const ll = map.unproject([pointX, pointY]);
        return coord.lngLatToPixel(ll.lng, ll.lat);
      }

      const src = event?.originalEvent ?? event?.srcEvent;
      const clientX = src?.clientX;
      const clientY = src?.clientY;
      if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
        const rect = map.getContainer()?.getBoundingClientRect?.();
        if (rect) {
          const ll = map.unproject([clientX - rect.left, clientY - rect.top]);
          return coord.lngLatToPixel(ll.lng, ll.lat);
        }
      }
      return null;
    };

    const setPolygonVertices = (vertices: PixelPoint[]) => {
      const currentGeometry = activeGeometryRef.current;
      if (!currentGeometry || currentGeometry.geometry.type !== "Polygon") return;
      const nextRing = closeRing(vertices);
      setActiveGeometry({
        ...currentGeometry,
        geometry: { type: "Polygon", coordinates: [nextRing] },
      } as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
      requestRefresh();
    };

    const nearestVertexIndex = (vertices: PixelPoint[], point: PixelPoint): number => {
      let bestIdx = -1;
      let bestDist = Number.POSITIVE_INFINITY;
      vertices.forEach((v, idx) => {
        const d = pointDistance(v, point);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });
      return bestDist <= 22 ? bestIdx : -1;
    };

    const nearestMidpointIndex = (vertices: PixelPoint[], point: PixelPoint): number => {
      let bestIdx = -1;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < vertices.length; i += 1) {
        const a = vertices[i];
        const b = vertices[(i + 1) % vertices.length];
        const mid: PixelPoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const d = pointDistance(mid, point);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      return bestDist <= 22 ? bestIdx : -1;
    };

    const handleMouseDown = (event: any) => {
      const currentGeometry = activeGeometryRef.current;
      if (!currentGeometry || currentGeometry.geometry.type !== "Polygon") return;
      const point = getPixelPoint(event);
      if (!point) return;
      const vertices = getFeatureRing(currentGeometry);
      const vertexIndex = nearestVertexIndex(vertices, point);
      if (vertexIndex >= 0) {
        const nativeEvent = event?.originalEvent ?? event?.srcEvent ?? event;
        const isDeleteClick = Boolean(nativeEvent?.ctrlKey || nativeEvent?.metaKey);
        if (isDeleteClick) {
          if (vertices.length > 3) {
            const next = vertices.filter((_, idx) => idx !== vertexIndex);
            setPolygonVertices(next);
          }
          didDeleteVertexRef.current = true;
          return;
        }
        dragVertexIndexRef.current = vertexIndex;
        map.dragPan?.disable?.();
        return;
      }
      const midpointAfter = nearestMidpointIndex(vertices, point);
      if (midpointAfter >= 0) {
        const next = [...vertices];
        next.splice(midpointAfter + 1, 0, point);
        setPolygonVertices(next);
        dragVertexIndexRef.current = midpointAfter + 1;
        map.dragPan?.disable?.();
      }
    };

    const handleMouseMove = (event: any) => {
      const point = getPixelPoint(event);
      if (!point) return;
      setHoverLocation({ x: point[0], y: point[1] });
      if (dragVertexIndexRef.current === null) return;
      const currentGeometry = activeGeometryRef.current;
      if (!currentGeometry || currentGeometry.geometry.type !== "Polygon") return;
      const vertices = [...getFeatureRing(currentGeometry)];
      const idx = dragVertexIndexRef.current;
      if (idx < 0 || idx >= vertices.length) return;
      didDragVertexRef.current = true;
      vertices[idx] = point;
      setPolygonVertices(vertices);
    };

    const handleMouseLeave = () => {
      setHoverLocation(null);
    };

    const handleMouseUp = () => {
      dragVertexIndexRef.current = null;
      map.dragPan?.enable?.();
    };

    const handleClick = (event: any) => {
      if (didDeleteVertexRef.current) {
        didDeleteVertexRef.current = false;
        return;
      }
      if (didDragVertexRef.current) {
        didDragVertexRef.current = false;
        return;
      }
      const point = getPixelPoint(event);
      if (!point) return;
      const currentGeometry = activeGeometryRef.current;
      if (!currentGeometry) {
        const hit = editablePolygonsRef.current.find((poly) => pointInPolygon(point, poly.ring));
        if (hit) {
          setActiveGeometry({
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [closeRing(hit.ring)] },
            properties: { ...hit.properties },
          } as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
          setActiveEditFeatureId(hit.featureId);
          requestRefresh();
          return;
        }

        setActiveGeometry({
          type: "Feature",
          geometry: { type: "LineString", coordinates: [point] },
          properties: { id: 0 },
        } as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
        setActiveEditFeatureId(null);
        requestRefresh();
        return;
      }

      if (currentGeometry.geometry.type === "LineString") {
        const next = [...(currentGeometry.geometry.coordinates as PixelPoint[]), point];
        setActiveGeometry({
          ...currentGeometry,
          geometry: { type: "LineString", coordinates: next },
        } as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
        requestRefresh();
        return;
      }

      // If already editing a polygon, clicking inside another saved polygon switches selection.
      if (currentGeometry.geometry.type === "Polygon" && dragVertexIndexRef.current === null) {
        const hit = editablePolygonsRef.current.find((poly) => pointInPolygon(point, poly.ring));
        if (hit) {
          setActiveGeometry({
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [closeRing(hit.ring)] },
            properties: { ...hit.properties },
          } as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
          setActiveEditFeatureId(hit.featureId);
          requestRefresh();
        }
      }
    };

    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseleave", handleMouseLeave);
    map.on("mouseup", handleMouseUp);
    map.on("click", handleClick);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseleave", handleMouseLeave);
      map.off("mouseup", handleMouseUp);
      map.off("click", handleClick);
      dragVertexIndexRef.current = null;
      didDragVertexRef.current = false;
      didDeleteVertexRef.current = false;
      map.dragPan?.enable?.();
    };
  }, [
    map,
    coord,
    activeTool,
    requestRefresh,
    setActiveEditFeatureId,
    setActiveGeometry,
    setHoverLocation,
  ]);

  React.useEffect(() => {
    if (!map || !coord || !correlationPickActive) return;
    const getPixelPoint = (event: any): PixelPoint | null => {
      const lng = event?.lngLat?.lng;
      const lat = event?.lngLat?.lat;
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        return coord.lngLatToPixel(lng, lat);
      }
      return null;
    };
    const handlePickClick = (event: any) => {
      const point = getPixelPoint(event);
      if (!point) return;
      const hit = pickablePolygonsRef.current.find((poly) => pointInPolygon(point, poly.ring));
      if (!hit) return;
      emitCorrelationTargetPicked({
        kind: "polygon",
        featureId: hit.featureId,
        groupId: hit.groupId,
        groupName: hit.groupName,
        layerId: hit.layerId,
        layerName: hit.layerName,
        iconPath: hit.iconPath,
        geometry: { type: "Polygon", coordinates: [closeRing(hit.ring)] },
        properties: hit.properties,
        label: `${hit.groupName} / ${hit.layerName}`,
      });
    };
    map.on("click", handlePickClick);
    return () => {
      map.off("click", handlePickClick);
    };
  }, [coord, correlationPickActive, emitCorrelationTargetPicked, map]);

  React.useEffect(() => {
    const handleFocusIcon = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { floorId?: number | string | null }
        | undefined;
      if (!detail) return;
      handleFloorSelect(detail.floorId);
    };
    if (typeof globalThis.addEventListener !== "function") return;
    globalThis.addEventListener("map-focus-icon", handleFocusIcon);
    return () => {
      globalThis.removeEventListener("map-focus-icon", handleFocusIcon);
    };
  }, [handleFloorSelect]);

  React.useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    if (!container) return;

    let tooltipDiv: HTMLDivElement = container.querySelector(".deckgl-floor-tooltip-container");
    if (!tooltipDiv) {
      tooltipDiv = document.createElement("div");
      tooltipDiv.className = "deckgl-floor-tooltip-container";
      container.appendChild(tooltipDiv);
    }
    setFloorTooltipContainer(tooltipDiv);

    return () => {
      tooltipDiv?.remove();
    };
  }, [map]);

  const handleOpenFullscreen = (
    images: string[],
    elementName: string,
    startIndex: number = 0
  ) => {
    clearHover(true);
    fullscreen.open(images, elementName, startIndex);
  };

  // Push layers into overlay
  React.useEffect(() => {
    if (!overlayReady || !overlayRef.current) return;
    if (lastLayersRef.current === sanitizedLayers) return;
    lastLayersRef.current = sanitizedLayers;
    try {
      overlayRef.current.setProps({ layers: sanitizedLayers });
    } catch (error) {
      console.error('[MapDeckGLLayer2] Error setting layers:', error);
    }
  }, [sanitizedLayers, overlayReady]);
  
  return (
    <>
      {floorTooltipContainer && hoveredFloor
        ? createPortal(
            <div
              className="deckgl-floor-tooltip"
              style={{
                left: hoveredFloor.x,
                top: hoveredFloor.y,
              }}
            >
              <div className="deckgl-floor-tooltip-title">{hoveredFloor.description}</div>
              <div className="deckgl-floor-tooltip-hint">Click to cycle floor</div>
            </div>,
            floorTooltipContainer
          )
        : null}
      {popupContainer &&
      hoveredIcon &&
      map &&
      fullscreen.index === null &&
      !isPlacementActive &&
      activeTool !== "polygon"
        ? createPortal(
            <IconPopup
              map={map}
              icon={hoveredIcon}
              onOpenFullscreen={handleOpenFullscreen}
              allowQuestNavigation={allowQuestNavigation}
              onMouseEnter={() => {
                isHoveringPopupRef.current = true;
              }}
              onMouseLeave={() => {
                isHoveringPopupRef.current = false;
                clearHover();
              }}
            />,
            popupContainer
          )
        : null}
      {fullscreen.index !== null && fullscreen.images.length > 0 && viewerContainer && (
        <FullscreenImageViewer
          images={fullscreen.images}
          currentIndex={fullscreen.index}
          elementName={fullscreen.elementName}
          container={viewerContainer}
          onClose={fullscreen.close}
          onPrevious={fullscreen.previous}
          onNext={fullscreen.next}
        />
      )}
    </>
  );
}
