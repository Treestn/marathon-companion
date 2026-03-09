import { useCallback, useMemo, useState } from "react";
import { UuidGenerator } from "../../../../escape-from-tarkov/service/helper/UuidGenerator";

import { CorrelationMeta, FeatureProps } from "../../../../model/map/FeatureProps";
import { MapGeoDocument } from "../../../../model/map/MapGeoDocument";
import type { RemovedMapIconEntry } from "../../../context/MapSubmissionContext";

export type EditLayer = {
  id: string;
  name: string;
  iconPath: string;
  /** IDs of features added by the user (not in the original layer) */
  addedFeatureIds: string[];
  /** IDs of original features the user modified */
  editedFeatureIds: string[];
  /**
   * GeoJSON FeatureCollection containing **only** user-changed features
   * (added or edited).  Does NOT include untouched originals.
   * The backend merges these into the existing layer using the tracking
   * arrays (addedFeatureIds / editedFeatureIds).
   */
  data: GeoJSON.FeatureCollection<GeoJSON.Geometry, FeatureProps>;
};

export type EditGroup = {
  id: string;
  name: string;
  layers: EditLayer[];
};

export type EditMapDocument = {
  mapId: string;
  groups: EditGroup[];
  /** IDs of original map features the user explicitly removed (not edit features). */
  removedFeatureIds: string[];
};

export type AddIconElementPayload = {
  groupId: string;
  groupName: string;
  layerId: string;
  layerName: string;
  iconPath: string;
  description: string;
  requiredItemIds: string[];
  imagePaths: string[];
  questId?: string;
  objectiveId?: string;
  correlation?: CorrelationMeta;
  correlations?: CorrelationMeta[];
  x: number;
  y: number;
};

export type UpsertIconElementPayload = AddIconElementPayload & {
  featureId?: string;
};

export type UpsertGeometryElementPayload = {
  featureId?: string;
  groupId: string;
  groupName: string;
  layerId: string;
  layerName: string;
  iconPath: string;
  description: string;
  requiredItemIds: string[];
  imagePaths: string[];
  questId?: string;
  objectiveId?: string;
  correlation?: CorrelationMeta;
  correlations?: CorrelationMeta[];
  polygonFillColor?: string;
  polygonOutlineColor?: string; 
  geometry: GeoJSON.Geometry;
};

export type UpsertPolygonElementPayload = Omit<UpsertGeometryElementPayload, "geometry"> & {
  geometry: GeoJSON.Polygon;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createEmptyEditDoc = (mapId: string): EditMapDocument => ({
  mapId,
  groups: [],
  removedFeatureIds: [],
});

const nextGeneratedFeatureId = (): string => UuidGenerator.generate();

/** Build an empty GeoJSON FeatureCollection. */
const emptyFeatureCollection = (): GeoJSON.FeatureCollection<GeoJSON.Geometry, FeatureProps> => ({
  type: "FeatureCollection",
  features: [],
});

/**
 * Look up the original FeatureProps for a given feature id from the source
 * MapGeoDocument.  Used when building base props for a first-time edit of
 * an existing feature.
 */
const findOriginalFeatureProps = (
  mapDoc: MapGeoDocument | null,
  featureId: string,
): FeatureProps | null => {
  if (!mapDoc) return null;
  const target = String(featureId);
  for (const group of mapDoc.groups) {
    for (const layer of group.layers) {
      const match = layer.data.features.find((f) => String(f.properties.id) === target);
      if (match) return match.properties;
    }
  }
  return null;
};

// ---------------------------------------------------------------------------
// Extract helpers
// ---------------------------------------------------------------------------

type ExtractedFeature = {
  geoFeature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>;
  changeType: "added" | "edited";
};

/**
 * Try to extract a tracked feature from a single layer.
 * Returns the extracted data or null if the feature is not tracked in this layer.
 */
const extractFromLayer = (layer: EditLayer, idNum: number): ExtractedFeature | null => {
  const id = String(idNum);
  const isAdded = layer.addedFeatureIds.includes(id);
  const isEdited = !isAdded && layer.editedFeatureIds.includes(id);
  if (!isAdded && !isEdited) return null;

  const idx = layer.data.features.findIndex((f) => String(f.properties.id) === id);
  if (idx < 0) return null;

  const [removed] = layer.data.features.splice(idx, 1);
  if (isAdded) {
    layer.addedFeatureIds = layer.addedFeatureIds.filter((trackedId) => trackedId !== id);
  } else {
    layer.editedFeatureIds = layer.editedFeatureIds.filter((trackedId) => trackedId !== id);
  }
  return { geoFeature: removed, changeType: isAdded ? "added" : "edited" };
};

/**
 * Search all groups/layers for a tracked (added or edited) feature matching
 * the given id and remove it from both `data.features` and the tracking set.
 */
const extractExistingFeature = (
  groups: EditGroup[],
  featureId: string | undefined,
): ExtractedFeature | null => {
  if (!featureId) return null;
  const targetId = String(featureId);

  for (const group of groups) {
    for (const layer of group.layers) {
      const idx = layer.data.features.findIndex((f) => String(f.properties.id) === targetId);
      if (idx < 0) continue;
      const isAdded = layer.addedFeatureIds.includes(targetId);
      const isEdited = !isAdded && layer.editedFeatureIds.includes(targetId);
      const [removed] = layer.data.features.splice(idx, 1);
      if (isAdded) {
        layer.addedFeatureIds = layer.addedFeatureIds.filter((id) => id !== targetId);
      } else if (isEdited) {
        layer.editedFeatureIds = layer.editedFeatureIds.filter((id) => id !== targetId);
      }
      const changeType: "added" | "edited" = isAdded ? "added" : "edited";
      const result: ExtractedFeature = { geoFeature: removed, changeType };
      if (result) return result;
    }
  }
  return null;
};

// ---------------------------------------------------------------------------
// Group / layer lookup helpers
// ---------------------------------------------------------------------------

const findOrCreateGroup = (
  groups: EditGroup[],
  payload: UpsertGeometryElementPayload,
): EditGroup => {
  const existingIndex = groups.findIndex((g) => g.id === payload.groupId);

  if (existingIndex >= 0) {
    const clone = { ...groups[existingIndex], layers: [...groups[existingIndex].layers] };
    groups[existingIndex] = clone;
    return clone;
  }

  const newGroup: EditGroup = { id: payload.groupId, name: payload.groupName, layers: [] };
  groups.push(newGroup);
  return newGroup;
};

/**
 * Remove empty layers from groups and empty groups from the list.
 * A layer is considered empty when it has no tracked adds or edits.
 */
const cleanEmptyGroupsAndLayers = (groups: EditGroup[]): EditGroup[] =>
  groups
    .map((g) => ({
      ...g,
      layers: g.layers.filter(
        (l) => l.addedFeatureIds.length > 0 || l.editedFeatureIds.length > 0,
      ),
    }))
    .filter((g) => g.layers.length > 0);

const findOrCreateLayer = (
  group: EditGroup,
  payload: UpsertGeometryElementPayload,
): EditLayer => {
  const existingIndex = group.layers.findIndex((l) => l.id === payload.layerId);

  if (existingIndex >= 0) {
    const existing = group.layers[existingIndex];
    const clone: EditLayer = {
      ...existing,
      addedFeatureIds: [...existing.addedFeatureIds],
      editedFeatureIds: [...existing.editedFeatureIds],
      data: { ...existing.data, features: [...existing.data.features] },
    };
    if (clone.iconPath !== payload.iconPath) {
      clone.iconPath = payload.iconPath;
    }
    group.layers[existingIndex] = clone;
    return clone;
  }

  const newLayer: EditLayer = {
    id: payload.layerId,
    name: payload.layerName,
    iconPath: payload.iconPath,
    addedFeatureIds: [],
    editedFeatureIds: [],
    data: emptyFeatureCollection(),
  };
  group.layers.push(newLayer);
  return newLayer;
};

// ---------------------------------------------------------------------------
// Feature builder
// ---------------------------------------------------------------------------

/**
 * Build base FeatureProps for the feature being upserted.
 * For edits this starts from the existing properties (either from a
 * previous version already in the edit session, or from the original
 * MapGeoDocument); for new features it's a blank slate.
 */
const buildBaseProps = (
  featureId: string,
  changeType: "added" | "edited",
  previousVersion: ExtractedFeature | null,
  mapDoc: MapGeoDocument | null,
): FeatureProps => {
  if (previousVersion) return { ...previousVersion.geoFeature.properties };
  if (changeType === "edited") {
    const original = findOriginalFeatureProps(mapDoc, featureId);
    return original ? { ...original } : { id: featureId };
  }
  return { id: featureId };
};

/**
 * Overlay user-editable fields onto the base props and return a GeoJSON Feature.
 */
const buildGeoFeature = (
  baseProps: FeatureProps,
  payload: UpsertGeometryElementPayload,
): GeoJSON.Feature<GeoJSON.Geometry, FeatureProps> => {
  baseProps.description = payload.description;
  baseProps.imageList = [...payload.imagePaths];
  baseProps.iconTypeId = payload.layerId;
  if (payload.questId !== undefined) baseProps.questId = payload.questId;
  if (payload.objectiveId !== undefined) baseProps.objectiveId = payload.objectiveId;
  if (payload.correlations !== undefined) {
    baseProps.correlations = [...payload.correlations];
    baseProps.correlation = payload.correlations[0];
  } else if (payload.correlation !== undefined) {
    baseProps.correlation = payload.correlation;
    baseProps.correlations = payload.correlation ? [payload.correlation] : undefined;
  }
  if (payload.polygonFillColor !== undefined) {
    baseProps.polygonFillColor = payload.polygonFillColor;
  }
  if (payload.polygonOutlineColor !== undefined) {
    baseProps.polygonOutlineColor = payload.polygonOutlineColor;
  }
  if (payload.requiredItemIds.length > 0) {
    baseProps.requiredItemIds = [...payload.requiredItemIds];
  }
  return {
    type: "Feature",
    geometry: payload.geometry,
    properties: baseProps,
  };
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useMapEditSession = (
  mapDoc: MapGeoDocument | null,
  onUpsertIconElement?: (payload: UpsertIconElementPayload, resolvedId: string) => void,
  onOriginalIconRemoved?: (entry: RemovedMapIconEntry) => void,
) => {
  const resolveOriginalRemovalEntry = useCallback(
    (featureId: string): RemovedMapIconEntry | null => {
      if (!mapDoc) return null;
      for (const group of mapDoc.groups) {
        for (const layer of group.layers) {
          const match = layer.data.features.find((feature) => String(feature.properties?.id) === featureId);
          if (!match) continue;
          return {
            mapId: mapDoc.mapId ?? mapDoc.id,
            layerId: layer.id,
            layerName: layer.name,
            featureId: match.properties?.id ?? featureId,
            label: match.properties?.description ?? undefined,
          };
        }
      }
      return null;
    },
    [mapDoc],
  );

  const id = mapDoc?.id ?? "unknown-map";
  const [editDocs, setEditDocs] = useState<Map<string, EditMapDocument>>(new Map());

  /** Edit doc for the currently-active map. */
  const resolvedEditDoc = useMemo(() => {
    return editDocs.get(id) ?? createEmptyEditDoc(id);
  }, [editDocs, id]);

  /** All non-empty edit docs across every map touched this session. */
  const allEditDocs = useMemo(() => {
    return Array.from(editDocs.values()).filter(
      (doc) => doc.groups.length > 0 || doc.removedFeatureIds.length > 0,
    );
  }, [editDocs]);

  const upsertGeometryElement = useCallback((payload: UpsertGeometryElementPayload) => {
    const resolvedId = payload.featureId
      ? String(payload.featureId)
      : nextGeneratedFeatureId();

    setEditDocs((prev) => {
      const next = new Map(prev);
      const doc = { ...(next.get(id) ?? createEmptyEditDoc(id)) };
      const groups = [...doc.groups];

      // If we are updating an existing feature, pull it out of wherever it lives
      // so we can re-insert it in the correct group/layer with updated data.
      const previousVersion = extractExistingFeature(groups, resolvedId);

      const group = findOrCreateGroup(groups, payload);
      const layer = findOrCreateLayer(group, payload);

      const featureId = resolvedId;

      const isExistingMapFeature = Number(featureId) > 0;
      const changeType = previousVersion?.changeType ?? (isExistingMapFeature ? "edited" : "added");

      const baseProps = buildBaseProps(featureId, changeType, previousVersion, mapDoc);
      const geoFeature = buildGeoFeature(baseProps, payload);

      // Insert / replace in data.features
      if (changeType === "edited") {
        const existingIdx = layer.data.features.findIndex((f) => String(f.properties.id) === featureId);
        if (existingIdx >= 0) {
          layer.data.features[existingIdx] = geoFeature;
        } else {
          layer.data.features.push(geoFeature);
        }
        if (!layer.editedFeatureIds.includes(featureId)) {
          layer.editedFeatureIds.push(featureId);
        }
      } else {
        layer.data.features.push(geoFeature);
        if (!layer.addedFeatureIds.includes(featureId)) {
          layer.addedFeatureIds.push(featureId);
        }
      }

      console.log("[MapEditSession] Updated edit doc", { doc });
      next.set(id, { ...doc, groups });
      return next;
    });

    if (resolvedId) {
      const pointGeometry = payload.geometry.type === "Point" ? payload.geometry.coordinates : null;
      if (pointGeometry && pointGeometry.length >= 2) {
        onUpsertIconElement?.(
          {
            featureId: payload.featureId,
            groupId: payload.groupId,
            groupName: payload.groupName,
            layerId: payload.layerId,
            layerName: payload.layerName,
            iconPath: payload.iconPath,
            description: payload.description,
            requiredItemIds: payload.requiredItemIds,
            imagePaths: payload.imagePaths,
            questId: payload.questId,
            objectiveId: payload.objectiveId,
            x: pointGeometry[0],
            y: pointGeometry[1],
          },
          resolvedId,
        );
      }
    }

    return resolvedId;
  }, [id, mapDoc, onUpsertIconElement]);

  const upsertIconElement = useCallback(
    (payload: UpsertIconElementPayload) =>
      upsertGeometryElement({
        featureId: payload.featureId,
        groupId: payload.groupId,
        groupName: payload.groupName,
        layerId: payload.layerId,
        layerName: payload.layerName,
        iconPath: payload.iconPath,
        description: payload.description,
        requiredItemIds: payload.requiredItemIds,
        imagePaths: payload.imagePaths,
        questId: payload.questId,
        objectiveId: payload.objectiveId,
        correlation: payload.correlation,
        correlations: payload.correlations,
        geometry: { type: "Point", coordinates: [payload.x, payload.y] },
      }),
    [upsertGeometryElement],
  );

  const upsertPolygonElement = useCallback(
    (payload: UpsertPolygonElementPayload) => upsertGeometryElement(payload),
    [upsertGeometryElement],
  );

  /**
   * Remove an icon from the edit session.
   *
   * - If the icon is a tracked edit (added or edited), it is removed from
   *   `data.features` and the tracking set.
   * - If the icon is NOT tracked (unmodified original), its id is added to
   *   `removedFeatureIds` so the base layer hides it.
   */
  const removeIconElement = useCallback((params: {
    editFeatureId?: string;
    originalEntityId: string;
  }) => {
    const { editFeatureId, originalEntityId } = params;

    setEditDocs((prev) => {
      const next = new Map(prev);
      const doc = { ...(next.get(id) ?? createEmptyEditDoc(id)) };
      const groups = [...doc.groups];

      const extracted = extractExistingFeature(groups, editFeatureId);

      if (extracted) {
        const cleanedGroups = cleanEmptyGroupsAndLayers(groups);
        if (extracted.changeType === "edited") {
          const editedOriginalId = String(extracted.geoFeature.properties.id);
          const removedFeatureIds = doc.removedFeatureIds.includes(editedOriginalId)
            ? doc.removedFeatureIds
            : [...doc.removedFeatureIds, editedOriginalId];
          const removalEntry = resolveOriginalRemovalEntry(editedOriginalId);
          if (removalEntry) {
            onOriginalIconRemoved?.(removalEntry);
          }
          console.log("[MapEditSession] Removed edited original feature", editedOriginalId);
          next.set(id, { ...doc, groups: cleanedGroups, removedFeatureIds });
          return next;
        }

        console.log("[MapEditSession] Removed added edit feature", editFeatureId);
        next.set(id, { ...doc, groups: cleanedGroups });
        return next;
      }

      if (doc.removedFeatureIds.includes(originalEntityId)) {
        return prev;
      }

      console.log("[MapEditSession] Marked original feature as removed", originalEntityId);
      const removalEntry = resolveOriginalRemovalEntry(originalEntityId);
      if (removalEntry) {
        onOriginalIconRemoved?.(removalEntry);
      }
      next.set(id, { ...doc, groups, removedFeatureIds: [...doc.removedFeatureIds, originalEntityId] });
      return next;
    });
  }, [id, onOriginalIconRemoved, resolveOriginalRemovalEntry]);

  const removeGeometryElement = useCallback(
    (params: { editFeatureId?: string; originalEntityId: string }) => removeIconElement(params),
    [removeIconElement],
  );

  /** Reset edits for ALL maps in this session. */
  const resetSession = useCallback(() => {
    setEditDocs(new Map());
  }, []);

  return {
    /** Edit doc for the currently-active map. */
    editDoc: resolvedEditDoc,
    /** All non-empty edit docs (across all maps) for review / submission. */
    allEditDocs,
    upsertGeometryElement,
    upsertIconElement,
    upsertPolygonElement,
    removeGeometryElement,
    removeIconElement,
    resetSession,
  };
};
