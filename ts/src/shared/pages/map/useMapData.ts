import { useState, useEffect, useCallback } from 'react';
import { MapFloorElementsData } from '../../../model/floor/IMapFloorElements';
import endpoints from '../../services/api/tarkov-companion/endpoint';
import { TarkovCompanionService } from '../../services/api/tarkov-companion/TarkovCompanionService';
import { FloorUtils } from '../../../escape-from-tarkov/page/map/utils/FloorUtils';
import { MapGeoDocument } from '../../../model/map/MapGeoDocument';
import { StorageHelper } from '../../../escape-from-tarkov/service/helper/StorageHelper';

interface UseMapDataResult {
  mapDoc: MapGeoDocument | null;
  floors: MapFloorElementsData | null;
  loading: boolean;
  error: string | null;
  refreshMapData: () => void;
}

export const useMapData = (mapId: string): UseMapDataResult => {
  const [mapDoc, setMapDoc] = useState<MapGeoDocument | null>(null);
  const [floors, setFloors] = useState<MapFloorElementsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const refreshMapData = useCallback(() => {
    setRefreshCount((prev) => prev + 1);
  }, []);

  const parseStoredJson = <T,>(storedRaw: unknown): T | null => {
    if (!storedRaw) return null;
    try {
      return typeof storedRaw === "string" ? (JSON.parse(storedRaw) as T) : (storedRaw as T);
    } catch {
      return null;
    }
  };

  const getStoredMapDoc = (id: string): MapGeoDocument | null => {
    const stored = StorageHelper.getStoredData(`${id}_mapDoc`);
    return parseStoredJson<MapGeoDocument>(stored);
  };

  const getStoredMapVersion = (id: string): string => {
    const storedDoc = getStoredMapDoc(id);
    return storedDoc?.version ?? "0.0.0";
  };

  const saveMapDoc = (doc: MapGeoDocument) => {
    StorageHelper.save(`${doc.id}_mapDoc`, doc);
  };

  const getStoredFloorVersion = (id: string): string => {
    const storedRaw = FloorUtils.getStoredData(id);
    if (!storedRaw) return "0.0.0";
    try {
      const stored = typeof storedRaw === "string" ? JSON.parse(storedRaw) : storedRaw;
      return stored?.version ?? stored?.floorVersion ?? stored?.configVersion ?? "0.0.0";
    } catch {
      return "0.0.0";
    }
  };

  useEffect(() => {
    const fetchMapData = async () => {
      setLoading(true);
      setError(null);

      try {
        const storedMapDoc = getStoredMapDoc(mapId);
        if (storedMapDoc) {
          setMapDoc(storedMapDoc);
        }
        // Fetch map document (new schema)
        const mapDocVersion = getStoredMapVersion(mapId);
        const mapDocResponse = await TarkovCompanionService.getConfig(
          endpoints.map_filter_config_v2(mapId, mapDocVersion),
        );

        if (!mapDocResponse.ok) {
          throw new Error('Failed to fetch map document');
        }

        const mapDocText = await mapDocResponse.text();
        if (mapDocText && mapDocText.length > 0) {
          const fetchedMapDoc: MapGeoDocument = JSON.parse(mapDocText);
          setMapDoc(fetchedMapDoc);
          saveMapDoc(fetchedMapDoc);
        } else if (storedMapDoc) {
          setMapDoc(storedMapDoc);
        }

        // Fetch floors
        const floorVersion = getStoredFloorVersion(mapId);
        const floorResponse = await TarkovCompanionService.getConfig(
          endpoints.map_floor_config_v2(mapId, floorVersion),
        );

        if (!floorResponse.ok) {
          throw new Error('Failed to fetch floor config');
        }

        const floorText = await floorResponse.text();
        if (floorText && floorText.length > 0) {
          const floorData: MapFloorElementsData = JSON.parse(floorText);
          setFloors(floorData);
        } else {
          const storedFloors = parseStoredJson<MapFloorElementsData>(FloorUtils.getStoredData(mapId));
          if (storedFloors) {
            setFloors(storedFloors);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching map data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (mapId) {
      fetchMapData();
    }
  }, [mapId, refreshCount]);

  return { mapDoc, floors, loading, error, refreshMapData };
};


