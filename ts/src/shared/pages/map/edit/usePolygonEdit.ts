import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MapGeoDocument } from "../../../../model/map/MapGeoDocument";
import type { UpsertPolygonElementPayload } from "./useMapEditSession";
import { useOptionalMapEditPlacementContext } from "../../../context/MapEditPlacementContext";

const DEFAULT_POLYGON_FILL_COLOR = "#5ac89f";
const DEFAULT_POLYGON_OUTLINE_COLOR = "#78f0c4";

const POLYGON_COLOR_PRESETS = [
  { id: "mint", label: "Mint", fill: "#5ac89f", outline: "#78f0c4" },
  { id: "amber", label: "Amber", fill: "#d1a04a", outline: "#f5c86a" },
  { id: "violet", label: "Violet", fill: "#8a67d1", outline: "#b696ff" },
  { id: "crimson", label: "Crimson", fill: "#b95865", outline: "#ec8a97" },
  { id: "slate", label: "Slate", fill: "#5a6778", outline: "#94a3b8" },
] as const;

type LayerOption = {
  groupId: string;
  groupName: string;
  layerId: string;
  layerName: string;
  iconPath: string;
};

type LayerGroup = {
  groupId: string;
  name: string;
  options: LayerOption[];
};

type UsePolygonEditInput = {
  mapDoc: MapGeoDocument | null;
  onUpsertPolygonElement: (payload: UpsertPolygonElementPayload) => string;
  onRemoveGeometryElement: (params: { editFeatureId?: string; originalEntityId: string }) => void;
};

const toRing = (coords: [number, number][]) => {
  if (coords.length < 3) return [];
  const ring = [...coords];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }
  return ring;
};

const getDraftVertices = (
  geometry: GeoJSON.Geometry | null | undefined,
): [number, number][] => {
  if (!geometry) return [];
  if (geometry.type === "LineString") return geometry.coordinates as [number, number][];
  if (geometry.type === "Polygon") {
    const ring = (geometry.coordinates?.[0] ?? []) as [number, number][];
    if (ring.length <= 1) return [];
    return ring.slice(0, -1);
  }
  return [];
};

export const usePolygonEdit = ({
  mapDoc,
  onUpsertPolygonElement,
  onRemoveGeometryElement,
}: UsePolygonEditInput) => {
  const {
    activeGeometry,
    activeEditFeatureId,
    setActiveGeometry,
    setActiveEditFeatureId,
    requestRefresh,
    setActiveLayerName,
  } = useOptionalMapEditPlacementContext();
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [layerInputValue, setLayerInputValue] = useState("");
  const [layerQuery, setLayerQuery] = useState("");
  const [isLayerDropdownOpen, setIsLayerDropdownOpen] = useState(false);
  const layerDropdownRef = useRef<HTMLDivElement | null>(null);

  const layerOptions = useMemo<LayerOption[]>(() => {
    if (!mapDoc?.groups?.length) return [];
    const options: LayerOption[] = [];
    for (const group of mapDoc.groups) {
      for (const layer of group.layers ?? []) {
        options.push({
          groupId: group.id,
          groupName: group.name,
          layerId: layer.id,
          layerName: layer.name,
          iconPath: layer.style?.iconImagePath ?? "",
        });
      }
    }
    return options;
  }, [mapDoc]);

  useEffect(() => {
    if (!layerOptions.length) {
      setSelectedLayerId(null);
      return;
    }
    if (!selectedLayerId || !layerOptions.some((l) => l.layerId === selectedLayerId)) {
      setSelectedLayerId(layerOptions[0].layerId);
    }
  }, [layerOptions, selectedLayerId]);

  const selectedLayer = useMemo(
    () => layerOptions.find((l) => l.layerId === selectedLayerId) ?? null,
    [layerOptions, selectedLayerId],
  );

  const groupedLayerOptions = useMemo<LayerGroup[]>(() => {
    const searchLower = layerQuery.trim().toLowerCase();
    const groups = new Map<string, { name: string; options: LayerOption[] }>();
    layerOptions.forEach((option) => {
      const matchesGroup = searchLower
        ? option.groupName.toLowerCase().includes(searchLower)
        : true;
      const matchesOption = searchLower
        ? option.layerName.toLowerCase().includes(searchLower)
        : true;
      if (!matchesGroup && !matchesOption) return;
      if (!groups.has(option.groupId)) {
        groups.set(option.groupId, { name: option.groupName, options: [] });
      }
      const group = groups.get(option.groupId);
      if (!group) return;
      group.options.push(option);
    });
    return Array.from(groups.entries()).map(([groupId, group]) => ({
      groupId,
      name: group.name,
      options: group.options,
    }));
  }, [layerOptions, layerQuery]);

  useEffect(() => {
    const iconTypeId = activeGeometry?.properties?.iconTypeId;
    if (!iconTypeId) return;
    if (layerOptions.some((l) => l.layerId === iconTypeId)) {
      setSelectedLayerId(iconTypeId);
    }
  }, [activeGeometry, layerOptions]);

  useEffect(() => {
    if (!isLayerDropdownOpen) {
      setLayerInputValue(selectedLayer?.layerName ?? "");
      setLayerQuery("");
    }
  }, [isLayerDropdownOpen, selectedLayer]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layerDropdownRef.current && !layerDropdownRef.current.contains(event.target as Node)) {
        setIsLayerDropdownOpen(false);
      }
    };

    if (isLayerDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLayerDropdownOpen]);

  const vertices = useMemo(
    () => getDraftVertices(activeGeometry?.geometry ?? null),
    [activeGeometry],
  );

  const isDrawing = activeGeometry?.geometry.type === "LineString";
  const isPolygon = activeGeometry?.geometry.type === "Polygon";

  const startPolygon = useCallback(() => {
    if (!selectedLayer) return;
    const next: GeoJSON.Feature<GeoJSON.LineString, any> = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {
        id: 0,
        iconTypeId: selectedLayer.layerId,
        polygonFillColor: DEFAULT_POLYGON_FILL_COLOR,
        polygonOutlineColor: DEFAULT_POLYGON_OUTLINE_COLOR,
      },
    };
    setActiveEditFeatureId(null);
    setActiveLayerName(selectedLayer.layerName);
    setActiveGeometry(next as GeoJSON.Feature<GeoJSON.Geometry, any>);
    requestRefresh();
  }, [selectedLayer, setActiveEditFeatureId, setActiveGeometry, requestRefresh, setActiveLayerName]);

  const completePolygon = useCallback(() => {
    if (activeGeometry?.geometry.type !== "LineString") return;
    const points = activeGeometry.geometry.coordinates as [number, number][];
    if (points.length < 3) return;
    const polygonFeature: GeoJSON.Feature<GeoJSON.Polygon, any> = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [toRing(points)] },
      properties: { ...activeGeometry.properties },
    };
    setActiveGeometry(polygonFeature as GeoJSON.Feature<GeoJSON.Geometry, any>);
    requestRefresh();
  }, [activeGeometry, setActiveGeometry, requestRefresh]);

  const undoVertex = useCallback(() => {
    if (!activeGeometry) return;
    if (activeGeometry.geometry.type === "LineString") {
      const points = [...(activeGeometry.geometry.coordinates as [number, number][])];
      if (points.length <= 1) {
        setActiveGeometry(null);
        setActiveEditFeatureId(null);
        requestRefresh();
        return;
      }
      points.pop();
      setActiveGeometry({
        ...activeGeometry,
        geometry: { type: "LineString", coordinates: points },
      } as GeoJSON.Feature<GeoJSON.Geometry, any>);
      requestRefresh();
      return;
    }
    if (activeGeometry.geometry.type === "Polygon") {
      const ring = ((activeGeometry.geometry.coordinates?.[0] ?? []) as [number, number][]).slice(0, -1);
      if (ring.length <= 1) {
        setActiveGeometry(null);
        setActiveEditFeatureId(null);
        requestRefresh();
        return;
      }
      const nextRing = ring.slice(0, -1);
      if (nextRing.length < 3) {
        setActiveGeometry({
          ...activeGeometry,
          geometry: { type: "LineString", coordinates: nextRing },
        } as GeoJSON.Feature<GeoJSON.Geometry, any>);
        requestRefresh();
        return;
      }
      setActiveGeometry({
        ...activeGeometry,
        geometry: { type: "Polygon", coordinates: [toRing(nextRing)] },
      } as GeoJSON.Feature<GeoJSON.Geometry, any>);
      requestRefresh();
    }
  }, [activeGeometry, requestRefresh, setActiveEditFeatureId, setActiveGeometry]);

  const resetPolygonEdit = useCallback(() => {
    setActiveGeometry(null);
    setActiveEditFeatureId(null);
    requestRefresh();
  }, [setActiveGeometry, setActiveEditFeatureId, requestRefresh]);

  const savePolygon = useCallback(() => {
    if (!selectedLayer || activeGeometry?.geometry.type !== "Polygon") return;
    const payload: UpsertPolygonElementPayload = {
      featureId: activeEditFeatureId ?? undefined,
      groupId: selectedLayer.groupId,
      groupName: selectedLayer.groupName,
      layerId: selectedLayer.layerId,
      layerName: selectedLayer.layerName,
      iconPath: selectedLayer.iconPath,
      description: activeGeometry.properties?.description ?? "",
      requiredItemIds: activeGeometry.properties?.requiredItemIds ?? [],
      imagePaths: activeGeometry.properties?.imageList ?? [],
      questId: activeGeometry.properties?.questId,
      objectiveId: activeGeometry.properties?.objectiveId,
      polygonFillColor: activeGeometry.properties?.polygonFillColor,
      polygonOutlineColor: activeGeometry.properties?.polygonOutlineColor,
      geometry: activeGeometry.geometry as GeoJSON.Polygon,
    };
    onUpsertPolygonElement(payload);

    // After save, immediately reset to a fresh polygon draft on the same layer.
    const next: GeoJSON.Feature<GeoJSON.LineString, any> = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {
        id: 0,
        iconTypeId: selectedLayer.layerId,
        polygonFillColor:
          activeGeometry.properties?.polygonFillColor ?? DEFAULT_POLYGON_FILL_COLOR,
        polygonOutlineColor:
          activeGeometry.properties?.polygonOutlineColor ?? DEFAULT_POLYGON_OUTLINE_COLOR,
      },
    };
    setActiveEditFeatureId(null);
    setActiveLayerName(selectedLayer.layerName);
    setActiveGeometry(next as GeoJSON.Feature<GeoJSON.Geometry, any>);
    requestRefresh();
  }, [
    activeGeometry,
    onUpsertPolygonElement,
    requestRefresh,
    selectedLayer,
    setActiveEditFeatureId,
    setActiveGeometry,
    setActiveLayerName,
  ]);

  const deletePolygon = useCallback(() => {
    if (!activeEditFeatureId) return;
    onRemoveGeometryElement({
      editFeatureId: activeEditFeatureId,
      originalEntityId: activeEditFeatureId,
    });
    resetPolygonEdit();
  }, [activeEditFeatureId, onRemoveGeometryElement, resetPolygonEdit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeGeometry) return;
      if (e.key === "Enter") {
        e.preventDefault();
        completePolygon();
      } else if (e.key === "Escape") {
        e.preventDefault();
        undoVertex();
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [activeGeometry, completePolygon, undoVertex]);

  useEffect(() => {
    return () => {
      setActiveGeometry(null);
      setActiveEditFeatureId(null);
      requestRefresh();
    };
  }, [requestRefresh, setActiveEditFeatureId, setActiveGeometry]);

  const polygonFillColor = activeGeometry?.properties?.polygonFillColor ?? DEFAULT_POLYGON_FILL_COLOR;
  const polygonOutlineColor =
    activeGeometry?.properties?.polygonOutlineColor ?? DEFAULT_POLYGON_OUTLINE_COLOR;

  const setPolygonFillColor = useCallback(
    (hex: string) => {
      if (!activeGeometry) return;
      setActiveGeometry({
        ...activeGeometry,
        properties: {
          ...activeGeometry.properties,
          polygonFillColor: hex,
        },
      } as GeoJSON.Feature<GeoJSON.Geometry, any>);
      requestRefresh();
    },
    [activeGeometry, requestRefresh, setActiveGeometry],
  );

  const setPolygonOutlineColor = useCallback(
    (hex: string) => {
      if (!activeGeometry) return;
      setActiveGeometry({
        ...activeGeometry,
        properties: {
          ...activeGeometry.properties,
          polygonOutlineColor: hex,
        },
      } as GeoJSON.Feature<GeoJSON.Geometry, any>);
      requestRefresh();
    },
    [activeGeometry, requestRefresh, setActiveGeometry],
  );

  const selectedPresetId = useMemo(() => {
    const match = POLYGON_COLOR_PRESETS.find(
      (preset) =>
        preset.fill.toLowerCase() === polygonFillColor.toLowerCase() &&
        preset.outline.toLowerCase() === polygonOutlineColor.toLowerCase(),
    );
    return match?.id ?? "custom";
  }, [polygonFillColor, polygonOutlineColor]);

  const applyColorPreset = useCallback(
    (presetId: string) => {
      const preset = POLYGON_COLOR_PRESETS.find((entry) => entry.id === presetId);
      if (!preset) return;
      if (!activeGeometry) return;
      setActiveGeometry({
        ...activeGeometry,
        properties: {
          ...activeGeometry.properties,
          polygonFillColor: preset.fill,
          polygonOutlineColor: preset.outline,
        },
      } as GeoJSON.Feature<GeoJSON.Geometry, any>);
      requestRefresh();
    },
    [activeGeometry, requestRefresh, setActiveGeometry],
  );

  return {
    layerOptions,
    groupedLayerOptions,
    selectedLayerId,
    setSelectedLayerId,
    layerDropdownRef,
    layerInputValue,
    setLayerInputValue,
    setLayerQuery,
    isLayerDropdownOpen,
    setIsLayerDropdownOpen,
    vertices,
    isDrawing,
    isPolygon,
    hasActiveGeometry: Boolean(activeGeometry),
    activeEditFeatureId,
    polygonFillColor,
    polygonOutlineColor,
    colorPresets: POLYGON_COLOR_PRESETS,
    selectedPresetId,
    applyColorPreset,
    setPolygonFillColor,
    setPolygonOutlineColor,
    startPolygon,
    completePolygon,
    savePolygon,
    resetPolygonEdit,
    deletePolygon,
  };
};

