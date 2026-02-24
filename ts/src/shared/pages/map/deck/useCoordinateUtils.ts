import { useMemo } from "react";
import { CoordinateUtils } from "../utils/coordinateUtils";
import { MapGeoDocument } from "../../../../model/map/MapGeoDocument";

type UseCoordinateUtilsResult = {
  coord: CoordinateUtils | null;
  signature: string; // stable key that represents the coordinate system
};

/**
 * Build CoordinateUtils only when the map "structure" changes.
 *
 * Structure = things that affect the coordinate transform:
 * - width / height
 * - offsetX / offsetY
 *
 * Not structure:
 * - icon active states
 * - which elements are enabled
 * - hover/selection
 */
export function useCoordinateUtils(mapDoc: MapGeoDocument | null): UseCoordinateUtilsResult {
  const signature = useMemo(() => {
    if (!mapDoc) return "";
    const ox = mapDoc.raster.offsetX ?? 0;
    const oy = mapDoc.raster.offsetY ?? 0;
    return `${mapDoc.raster.width}|${mapDoc.raster.height}|${ox}|${oy}`;
  }, [mapDoc?.raster.width, mapDoc?.raster.height, mapDoc?.raster.offsetX, mapDoc?.raster.offsetY]);

  const coord = useMemo(() => {
    if (!mapDoc) return null;

    try {
      return new CoordinateUtils(mapDoc);
    } catch (e) {
      console.error("❌ CoordinateUtils init failed:", e);
      return null;
    }
  }, [signature]); // IMPORTANT: depends on signature, not whole filters object

  return { coord, signature };
}
