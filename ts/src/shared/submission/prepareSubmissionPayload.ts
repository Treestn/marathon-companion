import { UuidGenerator } from '../../escape-from-tarkov/service/helper/UuidGenerator';
import type { EditMapDocument } from '../pages/map/edit/useMapEditSession';
import type { RemovedMapIconEntry } from '../context/MapSubmissionContext';
import type { Quest } from '../../model/quest/IQuestsElements';
import type {
  SubmissionPayload,
  SubmissionImageEntry,
  SubmissionRemovedMapIcon,
  SubmissionIconType,
} from './SubmissionPayload';

// ---------------------------------------------------------------------------
// Collect every unique *local* image file path from the payload.
// Remote URLs (https://) are already hosted and do not need uploading.
// ---------------------------------------------------------------------------

/** Returns true for paths that are already hosted remotely. */
const isRemoteUrl = (path: string): boolean => path.startsWith('https://') || path.startsWith('http://');

const collectLayerImages = (layer: EditMapDocument["groups"][0]["layers"][0], out: string[]) => {
  for (const feature of layer.data.features) {
    for (const p of feature.properties.imageList ?? []) {
      if (p && !isRemoteUrl(p) && !out.includes(p)) out.push(p);
    }
  }
};

const collectMapImages = (editDoc: EditMapDocument): string[] => {
  const paths: string[] = [];
  for (const group of editDoc.groups) {
    for (const layer of group.layers) {
      collectLayerImages(layer, paths);
    }
  }
  return paths;
};

/** Collect unique local image paths from a single quest's objectives. */
const collectObjectiveImages = (objectives: Quest["objectives"], out: string[]): void => {
  for (const obj of objectives) {
    for (const qi of obj.questImages ?? []) {
      for (const p of qi.paths ?? []) {
        if (p && !isRemoteUrl(p) && !out.includes(p)) out.push(p);
      }
    }
  }
};

const collectQuestImages = (quests: Quest[]): string[] => {
  const paths: string[] = [];
  for (const quest of quests) {
    collectObjectiveImages(quest.objectives, paths);
  }
  return paths;
};

// ---------------------------------------------------------------------------
// Deep-clone the payload replacing every file path with its UUID
// ---------------------------------------------------------------------------

const replaceImagePath = (p: string, pathToId: Map<string, string>): string =>
  pathToId.get(p) ?? p;

/** Replace image paths in a single layer's features. */
const replacePathsInLayer = (
  layer: EditMapDocument["groups"][0]["layers"][0],
  pathToId: Map<string, string>,
): typeof layer => {
  const features = layer.data.features.map((f) => {
    if (!f.properties.imageList) return f;
    return {
      ...f,
      properties: {
        ...f.properties,
        imageList: f.properties.imageList.map((p) => replaceImagePath(p, pathToId)),
      },
    };
  });
  return { ...layer, data: { ...layer.data, features } };
};

/**
 * Clone the EditMapDocument, replacing image paths with UUIDs in
 * all features (every feature in data is a user change).
 */
const replacePathsInMapEditDoc = (
  doc: EditMapDocument,
  pathToId: Map<string, string>,
): EditMapDocument => ({
  ...doc,
  groups: doc.groups.map((group) => ({
    ...group,
    layers: group.layers.map((layer) => replacePathsInLayer(layer, pathToId)),
  })),
});

const replacePathsInQuests = (
  quests: Quest[],
  pathToId: Map<string, string>,
): Quest[] =>
  quests.map((quest) => {
    const cloned = structuredClone(quest);
    for (const obj of cloned.objectives) {
      if (!obj.questImages) continue;
      for (const qi of obj.questImages) {
        if (qi.paths) {
          qi.paths = qi.paths.map((p) => replaceImagePath(p, pathToId));
        }
      }
    }
    return cloned;
  });

// ---------------------------------------------------------------------------
// Convert flat RemovedMapIconEntry[] → grouped SubmissionRemovedMapIcon[]
// (matches backend: RemovedMapIcon { map, iconTypes: [{ type, path, iconIds }] })
// ---------------------------------------------------------------------------

export const groupRemovedMapIcons = (
  entries: RemovedMapIconEntry[],
): SubmissionRemovedMapIcon[] => {
  // Group by mapId, then by layerId
  const byMap = new Map<string, Map<string, { layerName: string; ids: Array<string | number> }>>();

  for (const entry of entries) {
    let mapEntry = byMap.get(entry.mapId);
    if (!mapEntry) {
      mapEntry = new Map();
      byMap.set(entry.mapId, mapEntry);
    }
    let typeEntry = mapEntry.get(entry.layerId);
    if (!typeEntry) {
      typeEntry = { layerName: entry.layerName, ids: [] };
      mapEntry.set(entry.layerId, typeEntry);
    }
    typeEntry.ids.push(entry.featureId);
  }

  const result: SubmissionRemovedMapIcon[] = [];
  for (const [mapId, types] of byMap) {
    const iconTypes: SubmissionIconType[] = [];
    for (const [layerId, data] of types) {
      iconTypes.push({ type: data.layerName, path: layerId, iconIds: data.ids });
    }
    result.push({ map: mapId, iconTypes });
  }
  return result;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type PreparedSubmission = {
  /** Payload with file paths replaced by image UUIDs */
  payload: SubmissionPayload;
  /** Flat list of images to upload after the JSON payload is accepted */
  images: SubmissionImageEntry[];
};

/**
 * Takes the raw payload built from the contexts and:
 * 1. Collects every unique image file path
 * 2. Generates a UUID for each unique path
 * 3. Deep-clones the payload replacing paths with UUIDs
 * 4. Returns the modified payload + the image list for sequential upload
 */
export const prepareSubmissionPayload = (
  raw: SubmissionPayload,
): PreparedSubmission => {
  // 1. Collect unique image paths across all sections
  const allPaths = new Set<string>();
  for (const doc of raw.mapFilters) {
    for (const p of collectMapImages(doc)) allPaths.add(p);
  }
  for (const p of collectQuestImages(raw.quests)) allPaths.add(p);

  // 2. Build path → UUID mapping
  const pathToId = new Map<string, string>();
  const images: SubmissionImageEntry[] = [];
  for (const filePath of allPaths) {
    const imageId = UuidGenerator.generate();
    pathToId.set(filePath, imageId);
    images.push({ imageId, filePath });
  }

  // 3. Clone payload with replacements
  const payload: SubmissionPayload = {
    ...raw,
    mapFilters: raw.mapFilters.map((doc) => replacePathsInMapEditDoc(doc, pathToId)),
    quests: replacePathsInQuests(raw.quests, pathToId),
  };

  return { payload, images };
};
