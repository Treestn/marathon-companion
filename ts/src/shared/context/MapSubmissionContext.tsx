import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { MapGeoDocument } from '../../model/map/MapGeoDocument';
import type { HighLevelGroup } from '../../model/map/HighLevelGroup';
import type { ElementLayer } from '../../model/map/ElementLayer';
import type { FeatureProps } from '../../model/map/FeatureProps';
import type { UpsertIconElementPayload, EditMapDocument } from '../pages/map/edit/useMapEditSession';

type SubmissionFeatureProps = FeatureProps & {
  editId?: string;
  requiredItemIds?: string[];
  changeType?: 'added' | 'edited';
};

// ---------------------------------------------------------------------------
// Removed map icon tracking
// ---------------------------------------------------------------------------

export type RemovedMapIconEntry = {
  mapId: string;
  layerId: string;
  layerName: string;
  featureId: number;
  label?: string;
};

export type MapSubmissionContextValue = {
  mapEdits: MapGeoDocument[];
  upsertMapIconEdit: (
    mapDoc: MapGeoDocument | null,
    payload: UpsertIconElementPayload,
    editId?: string,
  ) => void;
  removeMapIconEdit: (mapId: string, editId: string) => void;
  clearMapEdits: (mapId?: string) => void;

  /** All live EditMapDocuments from useMapEditSession (one per map), synced by MapPage */
  mapEditDocs: EditMapDocument[];
  setMapEditDocs: (docs: EditMapDocument[]) => void;

  removedMapIcons: RemovedMapIconEntry[];
  addRemovedMapIcon: (entry: RemovedMapIconEntry) => void;
  cancelRemovedMapIcon: (mapId: string, featureId: number) => void;
  clearRemovedMapIcons: (mapId?: string) => void;
};

const MapSubmissionContext = createContext<MapSubmissionContextValue | undefined>(undefined);

const createBaseMapEditDoc = (mapDoc: MapGeoDocument): MapGeoDocument => ({
  schemaVersion: mapDoc.schemaVersion,
  id: mapDoc.id,
  mapId: mapDoc.mapId,
  name: mapDoc.name,
  author: mapDoc.author,
  version: mapDoc.version,
  coordinateSystem: mapDoc.coordinateSystem,
  raster: mapDoc.raster,
  groups: [],
});

const resolveSourceGroup = (mapDoc: MapGeoDocument, payload: UpsertIconElementPayload) =>
  mapDoc.groups.find(
    (group) => group.id === payload.groupId || group.name === payload.groupName,
  );

const resolveSourceLayer = (
  group: HighLevelGroup | undefined,
  payload: UpsertIconElementPayload,
) =>
  group?.layers?.find(
    (layer) => layer.id === payload.layerId || layer.name === payload.layerName,
  );

const createBaseGroup = (
  payload: UpsertIconElementPayload,
  sourceGroup?: HighLevelGroup,
): HighLevelGroup => ({
  id: sourceGroup?.id ?? payload.groupId,
  name: sourceGroup?.name ?? payload.groupName,
  active: sourceGroup?.active,
  icon: sourceGroup?.icon,
  layers: [],
});

const createBaseLayer = (
  payload: UpsertIconElementPayload,
  sourceLayer?: ElementLayer,
): ElementLayer => ({
  id: sourceLayer?.id ?? payload.layerId,
  name: sourceLayer?.name ?? payload.layerName,
  active: sourceLayer?.active,
  style: sourceLayer?.style ?? (payload.iconPath ? { iconImagePath: payload.iconPath } : undefined),
  data: {
    type: 'FeatureCollection',
    features: [],
  },
});

const nextNumericId = () => Date.now() + Math.floor(Math.random() * 1000);

const resolveOrCreateGroup = (
  groups: HighLevelGroup[],
  payload: UpsertIconElementPayload,
  sourceGroup?: HighLevelGroup,
) => {
  const groupIndex = groups.findIndex((group) => group.id === payload.groupId);
  const group =
    groupIndex >= 0
      ? { ...groups[groupIndex], layers: [...groups[groupIndex].layers] }
      : createBaseGroup(payload, sourceGroup);
  return { groupIndex, group };
};

const resolveOrCreateLayer = (
  group: HighLevelGroup,
  payload: UpsertIconElementPayload,
  sourceLayer?: ElementLayer,
) => {
  const layerIndex = group.layers.findIndex((layer) => layer.id === payload.layerId);
  const layer: ElementLayer =
    layerIndex >= 0
      ? {
          ...group.layers[layerIndex],
          data: {
            type: 'FeatureCollection' as const,
            features: [...group.layers[layerIndex].data.features],
          },
        }
      : createBaseLayer(payload, sourceLayer);
  return { layerIndex, layer };
};

const applyFeatureToLayer = (
  layer: ElementLayer,
  feature: GeoJSON.Feature<GeoJSON.Point, SubmissionFeatureProps>,
  resolvedEditId: string,
) => {
  const existingIndex = layer.data.features.findIndex((existing) => {
    const props = existing.properties as SubmissionFeatureProps | undefined;
    return props?.editId === resolvedEditId;
  });
  if (existingIndex >= 0) {
    layer.data.features[existingIndex] = feature;
  } else {
    layer.data.features.push(feature);
  }
};

const removeEditFromLayer = (layer: ElementLayer, editId: string): ElementLayer => {
  const features = layer.data.features.filter((feature) => {
    const props = feature.properties as SubmissionFeatureProps | undefined;
    return props?.editId !== editId;
  });
  return { ...layer, data: { ...layer.data, features } };
};

const removeEditFromGroup = (group: HighLevelGroup, editId: string): HighLevelGroup => {
  const layers = group.layers
    .map((layer) => removeEditFromLayer(layer, editId))
    .filter((layer) => layer.data.features.length > 0);
  return { ...group, layers };
};

const removeEditFromDoc = (doc: MapGeoDocument, editId: string): MapGeoDocument => {
  const groups = doc.groups
    .map((group) => removeEditFromGroup(group, editId))
    .filter((group) => group.layers.length > 0);
  return { ...doc, groups };
};

export const MapSubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mapEdits, setMapEdits] = useState<MapGeoDocument[]>([]);
  const [mapEditDocs, setMapEditDocs] = useState<EditMapDocument[]>([]);
  const [removedMapIcons, setRemovedMapIcons] = useState<RemovedMapIconEntry[]>([]);

  const upsertMapIconEdit = (
    mapDoc: MapGeoDocument | null,
    payload: UpsertIconElementPayload,
    editId?: string,
  ) => {
    if (!mapDoc) return;
    const resolvedEditId = editId ?? payload.featureId ?? `edit-${Date.now()}`;
    setMapEdits((prev) => {
      const next = [...prev];
      const editMapIndex = next.findIndex((doc) => doc.id === mapDoc.id);
      const editMap = editMapIndex >= 0 ? { ...next[editMapIndex] } : createBaseMapEditDoc(mapDoc);
      const groups = [...editMap.groups];

      const sourceGroup = resolveSourceGroup(mapDoc, payload);
      const { groupIndex, group } = resolveOrCreateGroup(groups, payload, sourceGroup);

      const sourceLayer = resolveSourceLayer(sourceGroup, payload);
      const { layerIndex, layer } = resolveOrCreateLayer(group, payload, sourceLayer);

      if (payload.iconPath) {
        if (layer.style) {
          layer.style = { ...layer.style, iconImagePath: payload.iconPath };
        } else {
          layer.style = { iconImagePath: payload.iconPath };
        }
      }

      const isEditingExisting = Boolean(
        editId && !editId.startsWith('edit-'),
      );
      const changeType: 'added' | 'edited' = isEditingExisting ? 'edited' : 'added';

      const feature: GeoJSON.Feature<GeoJSON.Point, SubmissionFeatureProps> = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [payload.x, payload.y],
        },
        properties: {
          id: nextNumericId(),
          editId: resolvedEditId,
          kind: payload.layerName,
          description: payload.description || undefined,
          imageList: payload.imagePaths?.length ? payload.imagePaths : undefined,
          requiredItemIds: payload.requiredItemIds?.length ? payload.requiredItemIds : undefined,
          changeType,
        },
      };

      applyFeatureToLayer(layer, feature, resolvedEditId);

      if (layerIndex >= 0) {
        group.layers[layerIndex] = layer;
      } else {
        group.layers.push(layer);
      }

      if (groupIndex >= 0) {
        groups[groupIndex] = group;
      } else {
        groups.push(group);
      }

      editMap.groups = groups;
      if (editMapIndex >= 0) {
        next[editMapIndex] = editMap;
      } else {
        next.push(editMap);
      }
      return next;
    });
  };

  const removeMapIconEdit = (id: string, editId: string) => {
    setMapEdits((prev) => {
      const next = prev.map((doc) => {
        if (doc.id !== id) return doc;
        return removeEditFromDoc(doc, editId);
      });
      return next.filter((doc) => doc.groups.length > 0);
    });
  };

  const clearMapEdits = (id?: string) => {
    if (!id) {
      setMapEdits([]);
      return;
    }
    setMapEdits((prev) => prev.filter((doc) => doc.id !== id));
  };

  const addRemovedMapIcon = useCallback((entry: RemovedMapIconEntry) => {
    setRemovedMapIcons((prev) => {
      if (prev.some((e) => e.mapId === entry.mapId && e.featureId === entry.featureId)) {
        return prev;
      }
      return [...prev, entry];
    });
  }, []);

  const cancelRemovedMapIcon = useCallback((mapId: string, featureId: number) => {
    setRemovedMapIcons((prev) =>
      prev.filter((e) => !(e.mapId === mapId && e.featureId === featureId)),
    );
  }, []);

  const clearRemovedMapIcons = useCallback((mapId?: string) => {
    if (!mapId) {
      setRemovedMapIcons([]);
      return;
    }
    setRemovedMapIcons((prev) => prev.filter((e) => e.mapId !== mapId));
  }, []);

  const value = useMemo(
    () => ({
      mapEdits,
      upsertMapIconEdit,
      removeMapIconEdit,
      clearMapEdits,
      mapEditDocs,
      setMapEditDocs,
      removedMapIcons,
      addRemovedMapIcon,
      cancelRemovedMapIcon,
      clearRemovedMapIcons,
    }),
    [mapEdits, mapEditDocs, removedMapIcons, addRemovedMapIcon, cancelRemovedMapIcon, clearRemovedMapIcons],
  );

  return <MapSubmissionContext.Provider value={value}>{children}</MapSubmissionContext.Provider>;
};

export const useMapSubmissionContext = () => {
  const ctx = useContext(MapSubmissionContext);
  if (!ctx) {
    throw new Error('useMapSubmissionContext must be used within MapSubmissionProvider');
  }
  return ctx;
};

export const useOptionalMapSubmissionContext = (): MapSubmissionContextValue => {
  const ctx = useContext(MapSubmissionContext);
  if (ctx) {
    return ctx;
  }
  return {
    mapEdits: [],
    upsertMapIconEdit: () => {},
    removeMapIconEdit: () => {},
    clearMapEdits: () => {},
    mapEditDocs: [],
    setMapEditDocs: () => {},
    removedMapIcons: [],
    addRemovedMapIcon: () => {},
    cancelRemovedMapIcon: () => {},
    clearRemovedMapIcons: () => {},
  };
};
