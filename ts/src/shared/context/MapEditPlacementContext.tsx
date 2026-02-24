import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { FeatureProps } from '../../model/map/FeatureProps';

type MapEditPlacementState = {
  activeTool?: "icon" | "polygon" | null;
  isActive: boolean;
  iconPath: string | null;
  placementLocation: { x: number; y: number } | null;
  hoverLocation: { x: number; y: number } | null;
  activeFeature: GeoJSON.Feature<GeoJSON.Point, FeatureProps> | null;
  activeGeometry?: GeoJSON.Feature<GeoJSON.Geometry, FeatureProps> | null;
  refreshToken: number;
  activeLayerName: string | null;
  selectionResetToken: number;
  /** The edit feature id currently being edited, so renderers can filter out duplicates */
  activeEditFeatureId: string | null;
};

type MapEditPlacementContextValue = MapEditPlacementState & {
  setPlacementState: (state: MapEditPlacementState) => void;
  setActiveTool: (tool: "icon" | "polygon" | null) => void;
  setPlacementLocation: (location: { x: number; y: number } | null) => void;
  setHoverLocation: (location: { x: number; y: number } | null) => void;
  setActiveFeature: (feature: GeoJSON.Feature<GeoJSON.Point, FeatureProps> | null) => void;
  setActiveGeometry: (feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProps> | null) => void;
  setActiveLayerName: (name: string | null) => void;
  setActiveEditFeatureId: (id: string | null) => void;
  requestRefresh: () => void;
  requestSelectionReset: () => void;
};

const MapEditPlacementContext = createContext<MapEditPlacementContextValue | undefined>(undefined);

const isSamePoint = (
  a: { x: number; y: number } | null,
  b: { x: number; y: number } | null,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
};

const isSamePlacementState = (
  a: MapEditPlacementState,
  b: MapEditPlacementState,
): boolean =>
  a.activeTool === b.activeTool &&
  a.isActive === b.isActive &&
  a.iconPath === b.iconPath &&
  isSamePoint(a.placementLocation, b.placementLocation) &&
  isSamePoint(a.hoverLocation, b.hoverLocation) &&
  a.activeFeature === b.activeFeature &&
  a.activeGeometry === b.activeGeometry &&
  a.refreshToken === b.refreshToken &&
  a.activeLayerName === b.activeLayerName &&
  a.selectionResetToken === b.selectionResetToken &&
  a.activeEditFeatureId === b.activeEditFeatureId;

export const MapEditPlacementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MapEditPlacementState>({
    activeTool: null,
    isActive: false,
    iconPath: null,
    placementLocation: null,
    hoverLocation: null,
    activeFeature: null,
    activeGeometry: null,
    refreshToken: 0,
    activeLayerName: null,
    selectionResetToken: 0,
    activeEditFeatureId: null,
  });

  const setPlacementState = useCallback((nextState: MapEditPlacementState) => {
    setState((prev) => (isSamePlacementState(prev, nextState) ? prev : nextState));
  }, []);

  const setActiveTool = useCallback((tool: "icon" | "polygon" | null) => {
    setState((prev) => (prev.activeTool === tool ? prev : { ...prev, activeTool: tool }));
  }, []);

  const setPlacementLocation = useCallback((location: { x: number; y: number } | null) => {
    setState((prev) =>
      isSamePoint(prev.placementLocation, location) ? prev : { ...prev, placementLocation: location },
    );
  }, []);

  const setHoverLocation = useCallback((location: { x: number; y: number } | null) => {
    setState((prev) =>
      isSamePoint(prev.hoverLocation, location) ? prev : { ...prev, hoverLocation: location },
    );
  }, []);

  const setActiveFeature = useCallback((feature: GeoJSON.Feature<GeoJSON.Point, FeatureProps> | null) => {
    setState((prev) => (prev.activeFeature === feature ? prev : { ...prev, activeFeature: feature }));
  }, []);

  const setActiveGeometry = useCallback((feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProps> | null) => {
    setState((prev) => (prev.activeGeometry === feature ? prev : { ...prev, activeGeometry: feature }));
  }, []);

  const setActiveLayerName = useCallback((name: string | null) => {
    setState((prev) => (prev.activeLayerName === name ? prev : { ...prev, activeLayerName: name }));
  }, []);

  const setActiveEditFeatureId = useCallback((id: string | null) => {
    setState((prev) => (prev.activeEditFeatureId === id ? prev : { ...prev, activeEditFeatureId: id }));
  }, []);

  const requestRefresh = useCallback(() => {
    setState((prev) => ({ ...prev, refreshToken: prev.refreshToken + 1 }));
  }, []);

  const requestSelectionReset = useCallback(() => {
    setState((prev) => ({ ...prev, selectionResetToken: prev.selectionResetToken + 1 }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setPlacementState,
      setActiveTool,
      setPlacementLocation,
      setHoverLocation,
      setActiveFeature,
      setActiveGeometry,
      setActiveLayerName,
      setActiveEditFeatureId,
      requestRefresh,
      requestSelectionReset,
    }),
    [
      requestRefresh,
      requestSelectionReset,
      setActiveEditFeatureId,
      setActiveFeature,
      setActiveGeometry,
      setActiveLayerName,
      setActiveTool,
      setHoverLocation,
      setPlacementLocation,
      setPlacementState,
      state,
    ],
  );

  return (
    <MapEditPlacementContext.Provider value={value}>
      {children}
    </MapEditPlacementContext.Provider>
  );
};

export const useMapEditPlacementContext = () => {
  const ctx = useContext(MapEditPlacementContext);
  if (!ctx) {
    throw new Error('useMapEditPlacementContext must be used within MapEditPlacementProvider');
  }
  return ctx;
};

export const useOptionalMapEditPlacementContext = (): MapEditPlacementContextValue => {
  const ctx = useContext(MapEditPlacementContext);
  if (ctx) {
    return ctx;
  }
  return {
    activeTool: null,
    isActive: false,
    iconPath: null,
    placementLocation: null,
    hoverLocation: null,
    activeFeature: null,
    activeGeometry: null,
    refreshToken: 0,
    activeLayerName: null,
    selectionResetToken: 0,
    activeEditFeatureId: null,
    setPlacementState: () => {},
    setActiveTool: () => {},
    setPlacementLocation: () => {},
    setHoverLocation: () => {},
    setActiveFeature: () => {},
    setActiveGeometry: () => {},
    setActiveLayerName: () => {},
    setActiveEditFeatureId: () => {},
    requestRefresh: () => {},
    requestSelectionReset: () => {},
  };
};
