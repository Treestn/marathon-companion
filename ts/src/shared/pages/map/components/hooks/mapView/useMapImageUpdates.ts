import { useEffect } from "react";
import type maplibregl from "maplibre-gl";
import { MapGeoDocument } from "../../../../../../model/map/MapGeoDocument";

export const useMapImageUpdates = (
  mapRef: React.MutableRefObject<maplibregl.Map | null>,
  mapDoc: MapGeoDocument | null,
  mapLoaded: boolean,
  updateMapImage: (mapDoc: MapGeoDocument) => void
) => {
  useEffect(() => {
    if (!mapRef.current || !mapDoc || !mapLoaded) {
      return;
    }

    updateMapImage(mapDoc);
  }, [mapDoc, mapLoaded, mapRef, updateMapImage]);
};
