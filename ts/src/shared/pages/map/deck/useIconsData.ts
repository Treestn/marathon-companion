// deck/useIconsData.ts
import { useMemo } from "react";
import type { CoordinateUtils } from "../utils/coordinateUtils";
import type { BuildIconsParams, IconDatum } from "./builder/icon.builder";
import { MapGeoDocument } from "../../../../model/map/MapGeoDocument";
import { MapFloorElementsData } from "../../../../model/floor/IMapFloorElements";
import { buildIcons } from "./builder/icon.builder";

type IconBuildOptions = Pick<BuildIconsParams, "isActive" | "floorId" | "selectImage" | "getVisibility">;

// TEMP: replace this with your IconLayerManager later.
// For now: returns empty list if missing inputs.
export function useIconsData(
    mapDoc: MapGeoDocument | null,
    floors: MapFloorElementsData | null,
    coord: CoordinateUtils | null,
    placeholderImage: string,
    options?: IconBuildOptions
  ): IconDatum[] {
    return useMemo(() => {
      if (!mapDoc || !coord) return [];
      return buildIcons({
        mapDoc,
        floors,
        coord,
        placeholderImage,
        isActive: options?.isActive,
        getVisibility: options?.getVisibility,
        floorId: options?.floorId,
        selectImage: options?.selectImage,
      });
    }, [
      mapDoc,
      floors,
      coord,
      placeholderImage,
      options?.isActive,
      options?.getVisibility,
      options?.floorId,
      options?.selectImage,
    ]);
  }
