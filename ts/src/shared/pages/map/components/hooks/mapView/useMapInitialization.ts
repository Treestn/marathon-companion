import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { MapState } from "./useMapStatePersistence";
import type { OriginalMapState } from "./useMapImageLayer";
import { MapGeoDocument } from "../../../../../../model/map/MapGeoDocument";

type UseMapInitializationParams = {
  mapContainer: React.MutableRefObject<HTMLDivElement | null>;
  map: React.MutableRefObject<maplibregl.Map | null>;
  mapDoc: MapGeoDocument | null;
  setMapLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  setBearing: React.Dispatch<React.SetStateAction<number>>;
  onMapReady?: (map: maplibregl.Map) => void;
  saveMapState: () => void;
  loadMapState: () => MapState | null;
  updateMapImage: (mapDoc: MapGeoDocument) => void;
  originalState: React.MutableRefObject<OriginalMapState | null>;
  onInitError?: (error: Error) => void;
};

export const useMapInitialization = ({
  mapContainer,
  map,
  mapDoc,
  setMapLoaded,
  setBearing,
  onMapReady,
  saveMapState,
  loadMapState,
  updateMapImage,
  originalState,
  onInitError,
}: UseMapInitializationParams) => {
  useEffect(() => {
    if (!mapContainer.current || !mapDoc || map.current) {
      return;
    }

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
          sources: {},
          layers: [],
        },
        renderWorldCopies: false, // Prevent map from wrapping around like a globe
        attributionControl: false, // Remove the MapLibre attribution control
        dragPan: true, // Keep panning enabled
        dragRotate: true, // Enable rotation with right-click + drag or Ctrl + drag
        boxZoom: false,
        doubleClickZoom: false,
        keyboard: false,
        scrollZoom: true,
        touchZoomRotate: true, // Enable rotation and pitch on touch devices
        pitchWithRotate: true, // Allow pitch changes when rotating
        touchPitch: true, // Enable pitch with two-finger drag
      });
    } catch (error) {
      console.error("[MapInit] Failed to initialize map:", error);
      map.current = null;
      onInitError?.(error instanceof Error ? error : new Error(String(error)));
      return;
    }

    const mapInstance = map.current;
    if (!mapInstance) return;

    // Override MapLibre's default cursor behavior immediately and aggressively
    const canvas = mapInstance.getCanvas();

    // Use CSS with !important to override MapLibre's cursor
    canvas.style.setProperty("cursor", "default", "important");

    // Prevent MapLibre from changing cursor on mouse events
    const preventCursorChange = () => {
      canvas.style.setProperty("cursor", "default", "important");
    };

    // Use a more aggressive approach - set cursor on every mouse event
    canvas.addEventListener("mousedown", preventCursorChange, true);
    canvas.addEventListener("mousemove", preventCursorChange, true);
    canvas.addEventListener("mouseup", preventCursorChange, true);
    canvas.addEventListener("mouseenter", preventCursorChange, true);
    canvas.addEventListener("mouseleave", preventCursorChange, true);

    // Use MutationObserver to watch for cursor style changes and override them
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "style") {
          const target = mutation.target as HTMLElement;
          if (target.style.cursor && target.style.cursor !== "default") {
            target.style.setProperty("cursor", "default", "important");
          }
        }
      });
    });

    observer.observe(canvas, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Update bearing when map rotates
    const updateBearing = () => {
      if (map.current) {
        setBearing(map.current.getBearing());
      }
    };

    // Store updateBearing for cleanup
    const updateBearingRef = updateBearing;

    // Listen to rotation and pitch changes
    mapInstance.on("rotate", updateBearingRef);
    mapInstance.on("pitch", updateBearingRef);

    // Save map state whenever the map moves, zooms, rotates, or pitches
    const saveStateHandler = () => {
      saveMapState();
    };

    mapInstance.on("moveend", saveStateHandler);
    mapInstance.on("zoomend", saveStateHandler);
    mapInstance.on("rotateend", saveStateHandler);
    mapInstance.on("pitchend", saveStateHandler);

    // Add the image source and layer after the map loads
    mapInstance.on("load", () => {
      if (!map.current) return;

      // Set cursor to default for MapLibre container and canvas (override grab cursor)
      const container = mapInstance.getContainer();
      if (container) {
        container.style.setProperty("cursor", "default", "important");
        // Also set cursor on the canvas element with !important
        const canvasElement = container.querySelector("canvas");
        if (canvasElement) {
          (canvasElement as HTMLElement).style.setProperty("cursor", "default", "important");
        }
      }

      // Wait for container to have dimensions before updating map image
      const ensureContainerReady = () => {
        const containerElement = map.current?.getContainer();
        if (containerElement && containerElement.clientWidth > 0 && containerElement.clientHeight > 0) {
          // Check if we have saved state before updating map image
          const savedState = loadMapState();

          // Update map image (this may reset position if no saved state)
          updateMapImage(mapDoc);
          setMapLoaded(true);
          updateBearing(); // Initial bearing update

          // Restore saved state after map image is loaded
          if (savedState) {
            const mapWithState = map.current as maplibregl.Map & {
              __stateRestoreTimeout?: number;
            };
            if (mapWithState.__stateRestoreTimeout) {
              clearTimeout(mapWithState.__stateRestoreTimeout);
            }
            // Wait a bit longer to ensure map image is fully rendered
            mapWithState.__stateRestoreTimeout = globalThis.setTimeout(() => {
              if (map.current) {
                map.current.easeTo({
                  center: savedState.center,
                  zoom: savedState.zoom,
                  bearing: savedState.bearing,
                  pitch: savedState.pitch,
                  duration: 0, // Instant restore
                });
              }
            }, 200);
          }

          // Expose map instance when ready
          if (onMapReady && map.current) {
            onMapReady(map.current);
          }
        } else {
          // Retry after a short delay if container isn't ready
          setTimeout(ensureContainerReady, 50);
        }
      };

      ensureContainerReady();
    });

    // Store references for cleanup
    const canvasRef = canvas;
    const preventCursorChangeRef = preventCursorChange;
    const observerRef = observer;
    const saveStateHandlerRef = saveStateHandler;

    // Cleanup
    return () => {
      // Save state before unmounting
      saveMapState();

      // Stop observing
      observerRef.disconnect();

      // Remove event listeners
      canvasRef.removeEventListener("mousedown", preventCursorChangeRef, true);
      canvasRef.removeEventListener("mousemove", preventCursorChangeRef, true);
      canvasRef.removeEventListener("mouseup", preventCursorChangeRef, true);
      canvasRef.removeEventListener("mouseenter", preventCursorChangeRef, true);
      canvasRef.removeEventListener("mouseleave", preventCursorChangeRef, true);

      if (map.current) {
        const mapWithState = map.current as maplibregl.Map & {
          __stateRestoreTimeout?: number;
        };
        if (mapWithState.__stateRestoreTimeout) {
          clearTimeout(mapWithState.__stateRestoreTimeout);
          mapWithState.__stateRestoreTimeout = undefined;
        }
        map.current.off("rotate", updateBearingRef);
        map.current.off("pitch", updateBearingRef);
        map.current.off("moveend", saveStateHandlerRef);
        map.current.off("zoomend", saveStateHandlerRef);
        map.current.off("rotateend", saveStateHandlerRef);
        map.current.off("pitchend", saveStateHandlerRef);
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
        originalState.current = null;
      }
    };
  }, [mapDoc]);
};
