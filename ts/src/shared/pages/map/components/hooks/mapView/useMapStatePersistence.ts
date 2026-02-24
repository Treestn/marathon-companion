import { useCallback } from "react";
import type maplibregl from "maplibre-gl";

export type MapState = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};

export const useMapStatePersistence = (
  mapRef: React.MutableRefObject<maplibregl.Map | null>,
  storageKey: string
) => {
  const saveMapState = useCallback(() => {
    if (!mapRef.current) return;

    try {
      const state: MapState = {
        center: mapRef.current.getCenter().toArray() as [number, number],
        zoom: mapRef.current.getZoom(),
        bearing: mapRef.current.getBearing(),
        pitch: mapRef.current.getPitch(),
      };
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      // Ignore storage errors (e.g., in private browsing mode)
    }
  }, [mapRef, storageKey]);

  const loadMapState = useCallback((): MapState | null => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      // Ignore storage errors
    }
    return null;
  }, [storageKey]);

  return { saveMapState, loadMapState };
};
