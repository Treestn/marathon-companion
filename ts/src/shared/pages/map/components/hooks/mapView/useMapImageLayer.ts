import { useCallback } from "react";
import maplibregl, { MercatorCoordinate } from "maplibre-gl";
import type { MapState } from "./useMapStatePersistence";
import { MapGeoDocument } from "../../../../../../model/map/MapGeoDocument";

export type OriginalMapState = {
  bounds: maplibregl.LngLatBounds | null;
  center: [number, number] | null;
  zoom: number | null;
  bearing: number;
  pitch: number;
  padding: { top: number; bottom: number; left: number; right: number } | number | null;
};

const calculateMapCoordinates = (mapDoc: MapGeoDocument) => {
  const mapWidth = mapDoc.raster.width;
  const mapHeight = mapDoc.raster.height;

  // Validate dimensions
  if (!mapWidth || !mapHeight || mapWidth <= 0 || mapHeight <= 0 || !isFinite(mapWidth) || !isFinite(mapHeight)) {
    throw new Error(`Invalid map dimensions: ${mapWidth}x${mapHeight}`);
  }

  // Calculate aspect ratio
  const aspectRatio = mapWidth / mapHeight;

  // Choose an origin point near the equator to minimize Mercator distortion
  // Using (0, 0) as the center point
  const originLng = 0;
  const originLat = 0;

  // Convert origin to Mercator coordinates (normalized 0-1)
  const originMercator = MercatorCoordinate.fromLngLat([originLng, originLat]);

  // Define the size in normalized Mercator coordinates (0-1 range)
  // Use a reasonable scale - smaller values = larger geographic area
  // For a 4096x4096 image, we want it to cover a reasonable area
  // Using 0.1 means the image covers 10% of the world in each direction from center
  const mercatorSize = 0.1;

  // Calculate aspect ratio to maintain image proportions
  // In Mercator space, we need to account for the aspect ratio
  let mercatorWidth: number;
  let mercatorHeight: number;

  if (aspectRatio >= 1) {
    // Wider than tall - use full width, scale height proportionally
    mercatorWidth = mercatorSize;
    mercatorHeight = mercatorSize / aspectRatio;
  } else {
    // Taller than wide - use full height, scale width proportionally
    mercatorHeight = mercatorSize;
    mercatorWidth = mercatorSize * aspectRatio;
  }

  // Calculate half-widths and half-heights in Mercator space
  const halfMercatorWidth = mercatorWidth / 2;
  const halfMercatorHeight = mercatorHeight / 2;

  // Create a square/rectangle in Mercator space centered at origin
  // Top-left corner (in Mercator space: -halfWidth, -halfHeight)
  const topLeftMercator = new MercatorCoordinate(
    originMercator.x - halfMercatorWidth,
    originMercator.y - halfMercatorHeight,
    originMercator.z || 0
  );

  // Top-right corner (in Mercator space: +halfWidth, -halfHeight)
  const topRightMercator = new MercatorCoordinate(
    originMercator.x + halfMercatorWidth,
    originMercator.y - halfMercatorHeight,
    originMercator.z || 0
  );

  // Bottom-right corner (in Mercator space: +halfWidth, +halfHeight)
  const bottomRightMercator = new MercatorCoordinate(
    originMercator.x + halfMercatorWidth,
    originMercator.y + halfMercatorHeight,
    originMercator.z || 0
  );

  // Bottom-left corner (in Mercator space: -halfWidth, +halfHeight)
  const bottomLeftMercator = new MercatorCoordinate(
    originMercator.x - halfMercatorWidth,
    originMercator.y + halfMercatorHeight,
    originMercator.z || 0
  );

  // Convert Mercator coordinates back to lng/lat
  const topLeft = topLeftMercator.toLngLat();
  const topRight = topRightMercator.toLngLat();
  const bottomRight = bottomRightMercator.toLngLat();
  const bottomLeft = bottomLeftMercator.toLngLat();

  // Convert to [lng, lat] tuples
  const topLeftCoord: [number, number] = [topLeft.lng, topLeft.lat];
  const topRightCoord: [number, number] = [topRight.lng, topRight.lat];
  const bottomRightCoord: [number, number] = [bottomRight.lng, bottomRight.lat];
  const bottomLeftCoord: [number, number] = [bottomLeft.lng, bottomLeft.lat];

  // Validate coordinates
  const allCoords = [bottomLeftCoord, bottomRightCoord, topRightCoord, topLeftCoord];
  const hasInvalidCoords = allCoords.some((coord) => {
    const [lng, lat] = coord;
    return !isFinite(lng) || !isFinite(lat) ||
           lng < -180 || lng > 180 ||
           lat < -90 || lat > 90;
  });

  if (hasInvalidCoords) {
    throw new Error("Invalid coordinates generated");
  }

  // Calculate lngRange for zoom calculations
  const lngRange = Math.abs(topRightCoord[0] - bottomLeftCoord[0]);

  return {
    bottomLeft: bottomLeftCoord,
    bottomRight: bottomRightCoord,
    topRight: topRightCoord,
    topLeft: topLeftCoord,
    lngRange,
  };
};

export const useMapImageLayer = (
  mapRef: React.MutableRefObject<maplibregl.Map | null>,
  originalStateRef: React.MutableRefObject<OriginalMapState | null>,
  loadMapState: () => MapState | null
) => {
  const updateMapImage = useCallback(
    (mapDoc: MapGeoDocument) => {
      const mapInstance = mapRef.current;
      if (!mapInstance) return;

      try {
        const coords = calculateMapCoordinates(mapDoc);

        // Remove old source and layer if they exist
        if (mapInstance.getSource("map-image")) {
          mapInstance.removeLayer("map-image-layer");
          mapInstance.removeSource("map-image");
        }

        // Add the image source
        // MapLibre expects coordinates in order: [bottom-left, bottom-right, top-right, top-left]
        // To flip horizontally (swap left/right), we swap:
        // bottom-left <-> bottom-right and top-left <-> top-right
        mapInstance.addSource("map-image", {
          type: "image",
          url: mapDoc.raster.imagePath,
          coordinates: [
            coords.topLeft, // bottom-right as bottom-left (flip horizontal)
            coords.topRight, // bottom-left as bottom-right (flip horizontal)
            coords.bottomRight, // top-left as top-right (flip horizontal)
            coords.bottomLeft, // top-right as top-left (flip horizontal)
          ],
        });
        // Add the layer
        mapInstance.addLayer({
          id: "map-image-layer",
          type: "raster",
          source: "map-image",
          paint: {
            "raster-opacity": 1,
          },
        });

        // Set maxBounds with padding to allow panning beyond image edges (but still prevent wrapping)
        // Calculate padding as a percentage of the coordinate range (e.g., 20% on each side)
        const paddingFactor = 0.2; // 20% padding on each side
        const lngSpan = coords.topRight[0] - coords.bottomLeft[0];
        const latSpan = coords.topRight[1] - coords.bottomLeft[1];
        const lngPadding = Math.abs(lngSpan) * paddingFactor;
        const latPadding = Math.abs(latSpan) * paddingFactor;

        const expandedBottomLeft: [number, number] = [
          coords.bottomLeft[0] - lngPadding,
          coords.bottomLeft[1] - latPadding,
        ];
        const expandedTopRight: [number, number] = [
          coords.topRight[0] + lngPadding,
          coords.topRight[1] + latPadding,
        ];

        // Clamp to valid coordinate ranges
        expandedBottomLeft[0] = Math.max(-180, expandedBottomLeft[0]);
        expandedBottomLeft[1] = Math.max(-90, expandedBottomLeft[1]);
        expandedTopRight[0] = Math.min(180, expandedTopRight[0]);
        expandedTopRight[1] = Math.min(90, expandedTopRight[1]);

        const expandedBounds = new maplibregl.LngLatBounds(expandedBottomLeft, expandedTopRight);
        mapInstance.setMaxBounds(expandedBounds);

        // Calculate center and fit bounds (use original image bounds for fitting)
        const imageBounds = new maplibregl.LngLatBounds(coords.bottomLeft, coords.topRight);

        // Calculate padding that maintains aspect ratio and ensures entire image is visible
        const container = mapInstance.getContainer();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        if (containerWidth > 0 && containerHeight > 0) {
          // Check if we have saved state - if so, skip fitBounds and restore later
          const savedState = loadMapState();

          const imageAspectRatio = mapDoc.raster.width / mapDoc.raster.height;
          const containerAspectRatio = containerWidth / containerHeight;

          // Calculate padding to maintain image aspect ratio
          let padding: { top: number; bottom: number; left: number; right: number };

          if (imageAspectRatio > containerAspectRatio) {
            // Image is wider than container - fit to width, add vertical padding
            const scaledHeight = containerWidth / imageAspectRatio;
            const verticalPadding = Math.max(20, (containerHeight - scaledHeight) / 2);
            padding = {
              top: verticalPadding,
              bottom: verticalPadding,
              left: 20,
              right: 20,
            };
          } else {
            // Image is taller than container - fit to height, add horizontal padding
            const scaledWidth = containerHeight * imageAspectRatio;
            const horizontalPadding = Math.max(20, (containerWidth - scaledWidth) / 2);
            padding = {
              top: 20,
              bottom: 20,
              left: horizontalPadding,
              right: horizontalPadding,
            };
          }

          // Only fit bounds if we don't have saved state to restore
          if (!savedState) {
            try {
              mapInstance.fitBounds(imageBounds, {
                padding: padding,
                maxZoom: 10,
                duration: 0, // Instant fit, no animation
              });

              // Store original state for reset functionality
              if (!originalStateRef.current) {
                originalStateRef.current = {
                  bounds: imageBounds,
                  center: mapInstance.getCenter().toArray() as [number, number],
                  zoom: mapInstance.getZoom(),
                  bearing: mapInstance.getBearing(),
                  pitch: mapInstance.getPitch(),
                  padding: padding,
                };
              }
            } catch (error) {
              // Fallback to center and zoom if fitBounds fails
              console.warn("fitBounds failed, using setCenter/setZoom:", error);
              const centerLng = (coords.bottomLeft[0] + coords.topRight[0]) / 2;
              const centerLat = (coords.bottomLeft[1] + coords.topRight[1]) / 2;
              mapInstance.setCenter([centerLng, centerLat]);

              // Calculate zoom to fit entire image
              const lngSpanFallback = Math.abs(coords.topRight[0] - coords.bottomLeft[0]);
              const latSpan = Math.abs(coords.topRight[1] - coords.bottomLeft[1]);
              const lngZoom = Math.log2(
                360 / (lngSpanFallback * (1 + padding.left / containerWidth + padding.right / containerWidth))
              );
              const latZoom = Math.log2(
                180 / (latSpan * (1 + padding.top / containerHeight + padding.bottom / containerHeight))
              );
              const zoomLevel = Math.min(10, Math.max(0, Math.min(lngZoom, latZoom)));
              mapInstance.setZoom(zoomLevel);

              // Store original state for reset functionality (fallback case)
              if (!originalStateRef.current) {
                originalStateRef.current = {
                  bounds: imageBounds,
                  center: [centerLng, centerLat],
                  zoom: zoomLevel,
                  bearing: mapInstance.getBearing(),
                  pitch: mapInstance.getPitch(),
                  padding: padding,
                };
              }
            }
          } else {
            // We have saved state, so store original state but don't fit bounds
            // The saved state will be restored after the image loads
            if (!originalStateRef.current) {
              originalStateRef.current = {
                bounds: imageBounds,
                center: savedState.center,
                zoom: savedState.zoom,
                bearing: savedState.bearing,
                pitch: savedState.pitch,
                padding: padding,
              };
            }
          }
        } else {
          // Fallback if container dimensions aren't available
          const savedState = loadMapState();
          if (!savedState) {
            try {
              mapInstance.fitBounds(imageBounds, {
                padding: 20,
                maxZoom: 10,
                duration: 0,
              });

              // Store original state for reset functionality
              if (!originalStateRef.current) {
                originalStateRef.current = {
                  bounds: imageBounds,
                  center: mapInstance.getCenter().toArray() as [number, number],
                  zoom: mapInstance.getZoom(),
                  bearing: mapInstance.getBearing(),
                  pitch: mapInstance.getPitch(),
                  padding: 20,
                };
              }
            } catch (error) {
              console.warn("fitBounds failed:", error);
              const centerLng = (coords.bottomLeft[0] + coords.topRight[0]) / 2;
              const centerLat = (coords.bottomLeft[1] + coords.topRight[1]) / 2;
              mapInstance.setCenter([centerLng, centerLat]);
              const zoomLevel = Math.min(10, Math.max(0, Math.log2(360 / coords.lngRange)));
              mapInstance.setZoom(zoomLevel);

              // Store original state for reset functionality (fallback case)
              if (!originalStateRef.current) {
                originalStateRef.current = {
                  bounds: imageBounds,
                  center: [centerLng, centerLat],
                  zoom: zoomLevel,
                  bearing: mapInstance.getBearing(),
                  pitch: mapInstance.getPitch(),
                  padding: 20,
                };
              }
            }
          } else {
            // We have saved state, store original state but don't fit bounds
            if (!originalStateRef.current) {
              originalStateRef.current = {
                bounds: imageBounds,
                center: savedState.center,
                zoom: savedState.zoom,
                bearing: savedState.bearing,
                pitch: savedState.pitch,
                padding: 20,
              };
            }
          }
        }
      } catch (error) {
        console.error("Error updating map image:", error);
      }
    },
    [loadMapState, mapRef, originalStateRef]
  );

  return { updateMapImage };
};
