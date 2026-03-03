import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ItemsElementUtils } from "../../../../escape-from-tarkov/utils/ItemsElementUtils";
import { FileUtils } from "../../../../escape-from-tarkov/utils/FileUtils";
import { createImageBlobFromFile, revokeObjectUrl } from "../../../utils/imageBlob";
import { Item } from "../../../../model/items/IItemsElements";
import { CorrelationMeta, FeatureProps } from "../../../../model/map/FeatureProps";
import { MapGeoDocument } from "../../../../model/map/MapGeoDocument";
import type { EditMapDocument, EditLayer, UpsertGeometryElementPayload, UpsertIconElementPayload } from "./useMapEditSession";
import { AppConfigClient } from "../../../services/AppConfigClient";
import { useOptionalMapEditPlacementContext } from "../../../context/MapEditPlacementContext";
import { QuestDataStore } from "../../../services/QuestDataStore";
import { I18nHelper } from "../../../../locale/I18nHelper";
import type { IconDatum } from "../deck/builder/icon.builder";
import type { QuestOption } from "./QuestSelectorSection";
import type { ObjectiveOption } from "./ObjectiveSelectorSection";
import type { QuestEditEntry } from "../../../context/QuestSubmissionContext";
import type { Quest, QuestImage } from "../../../../model/quest/IQuestsElements";

export type IconOption = {
  id: string;
  label: string;
  groupId: string;
  groupName: string;
  layerId: string;
  layerName: string;
  iconPath: string;
};

type IconGroup = {
  groupId: string;
  name: string;
  options: Array<{
    id: string;
    label: string;
    iconPath: string;
    groupId: string;
    groupName: string;
    layerId: string;
    layerName: string;
  }>;
};

type IconSourceData = {
  featureId: string;
  description: string;
  imagePaths: string[];
  x: number;
  y: number;
  correlation?: CorrelationMeta;
  correlations?: CorrelationMeta[];
};

const getCorrelations = (props: FeatureProps | undefined): CorrelationMeta[] => {
  if (!props) return [];
  if (Array.isArray(props.correlations) && props.correlations.length > 0) {
    return props.correlations;
  }
  return props.correlation ? [props.correlation] : [];
};

const DEFAULT_CORRELATION_LINE_COLOR: [number, number, number, number] = [120, 210, 210, 200];
const DEFAULT_CORRELATION_LINE_WIDTH = 2;

const clampByte = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const rgbToHex = (rgb: [number, number, number]): string =>
  `#${rgb
    .map((channel) => clampByte(channel).toString(16).padStart(2, "0"))
    .join("")}`;

const lineColorToHex = (lineColor: [number, number, number, number] | undefined): string => {
  const rgb = (lineColor ?? DEFAULT_CORRELATION_LINE_COLOR).slice(0, 3) as [number, number, number];
  return rgbToHex(rgb);
};

const hexToLineColor = (
  hexValue: string,
  alpha: number,
): [number, number, number, number] | undefined => {
  const normalized = hexValue.trim();
  const match = /^#?([0-9a-fA-F]{6})$/.exec(normalized);
  if (!match) return undefined;
  const [r, g, b] = [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16));
  return [clampByte(r), clampByte(g), clampByte(b), clampByte(alpha)] as [number, number, number, number];
};

/**
 * Check if a feature id is tracked (added or edited) in the given layer.
 */
const isTrackedInLayer = (layer: EditLayer, idNum: number): boolean =>
  layer.addedFeatureIds.includes(idNum) || layer.editedFeatureIds.includes(idNum);

/**
 * Search the editDoc for a tracked (added/edited) feature matching the given id.
 * Returns the feature data if found, or null.
 */
const findFeatureInEditDoc = (editDoc: EditMapDocument, targetId: string): IconSourceData | null => {
  const targetIdNum = Number(targetId);
  if (Number.isNaN(targetIdNum)) return null;

  for (const group of editDoc.groups) {
    for (const layer of group.layers) {
      if (!isTrackedInLayer(layer, targetIdNum)) continue;
      const match = layer.data.features.find((f) => f.properties.id === targetIdNum);
      if (match) {
        const coords = (match.geometry as GeoJSON.Point).coordinates;
        return {
          featureId: String(match.properties.id),
          description: match.properties.description ?? "",
          imagePaths: match.properties.imageList ? [...match.properties.imageList] : [],
          x: coords[0],
          y: coords[1],
          correlation: match.properties.correlation,
          correlations: getCorrelations(match.properties),
        };
      }
    }
  }
  return null;
};

/**
 * Resolve the best source data for an icon being loaded for editing.
 * Priority: editDoc (by editFeatureId) → editDoc (by entity id) → mapDoc entity.
 */
const resolveIconSourceData = (datum: IconDatum, editDoc: EditMapDocument): IconSourceData => {
  // 1. If the datum came from an edit icon, look up by its editFeatureId
  if (datum.editFeatureId) {
    const found = findFeatureInEditDoc(editDoc, datum.editFeatureId);
    if (found) return found;
  }

  // 2. Check editDoc by original entity id
  if (datum.entity?.id) {
    const found = findFeatureInEditDoc(editDoc, String(datum.entity.id));
    if (found) return found;
  }

  // 3. Fall back to the data carried in the IconDatum entity
  return {
    featureId: String(datum.entity.id),
    description: datum.entity.description ?? "",
    imagePaths: datum.entity.imageList ? [...datum.entity.imageList] : [],
    x: datum.pixelX,
    y: datum.pixelY,
    correlation: datum.entity.correlation,
    correlations: getCorrelations(datum.entity),
  };
};

/**
 * Resolve image preview URLs for a list of image paths.
 * Local files are converted to blob URLs; remote URLs are used as-is.
 */
const resolveImagePreviews = async (
  imagePaths: string[],
): Promise<Array<{ path: string; previewUrl: string }>> => {
  const resolved: Array<{ path: string; previewUrl: string }> = [];
  for (const imagePath of imagePaths) {
    const isLocalFile = imagePath.startsWith("file:///") || !imagePath.includes(":");
    if (isLocalFile) {
      try {
        const { url } = await createImageBlobFromFile(imagePath, "image/png");
        resolved.push({ path: imagePath, previewUrl: url });
      } catch (err) {
        console.warn("[IconEdit] Failed to create blob for image:", imagePath, err);
        resolved.push({ path: imagePath, previewUrl: imagePath });
      }
    } else {
      resolved.push({ path: imagePath, previewUrl: imagePath });
    }
  }
  return resolved;
};

/**
 * Resolve the image paths for a quest icon.
 * Priority: quest edit context → original QuestDataStore data.
 */
const resolveQuestImagePaths = (
  questId: string,
  objectiveId: string | null,
  entityId: string | number | undefined,
  questEdits: QuestEditEntry[],
): string[] => {
  // 1. Check quest edit context first (full Quest stored)
  const editEntry = questEdits.find((e) => e.quest.id === questId);
  if (editEntry && objectiveId) {
    const obj = editEntry.quest.objectives.find((o) => o.id === objectiveId);
    if (obj?.questImages) {
      const images: string[] = [];
      for (const qi of obj.questImages) {
        if (qi.paths && qi.paths.length > 0) images.push(...qi.paths);
      }
      if (images.length > 0) return images;
    }
  }

  // 2. Fall back to original quest data from QuestDataStore
  const quest = QuestDataStore.getQuestById(questId);
  if (!quest?.objectives) return [];

  // If we know the objective, look up images from it
  if (objectiveId) {
    const obj = quest.objectives.find((o) => o.id === objectiveId);
    if (obj?.questImages) {
      const images: string[] = [];
      for (const qi of obj.questImages) {
        if (qi.paths && qi.paths.length > 0) images.push(...qi.paths);
      }
      if (images.length > 0) return images;
    }
  }

  // If no objective match, try matching by entity id (original icon id → questImage id)
  if (entityId != null) {
    const iconIdStr = String(entityId);
    for (const obj of quest.objectives) {
      if (!obj.questImages) continue;
      for (const qi of obj.questImages) {
        if (String(qi.id) === iconIdStr && qi.paths && qi.paths.length > 0) {
          return [...qi.paths];
        }
      }
    }
  }

  return [];
};

/**
 * Derive the objective ID from the original quest data by matching
 * the icon's entity id against `questImages[].id`.
 */
const resolveObjectiveIdFromQuestData = (
  questId: string,
  entityId: number | undefined,
): string | null => {
  const quest = QuestDataStore.getQuestById(questId);
  if (!quest?.objectives || entityId == null) return null;
  const iconIdStr = String(entityId);
  for (const obj of quest.objectives) {
    const match = obj.questImages?.find((img) => String(img.id) === iconIdStr);
    if (match) return obj.id;
  }
  return null;
};

/** The layer ID used by quest icons in the map data */
const QUEST_ICON_TYPE_ID = "Contracts:Contracts";
const START_CORRELATION_PICK_EVENT = "map-correlation-pick:start";
const STOP_CORRELATION_PICK_EVENT = "map-correlation-pick:stop";
const TARGET_PICKED_CORRELATION_EVENT = "map-correlation-pick:target-picked";

type CorrelationTrigger = "hover" | "click" | "always";

type CorrelationTargetPickDetail = {
  kind: "icon" | "polygon";
  featureId: string;
  groupId: string;
  groupName: string;
  layerId: string;
  layerName: string;
  iconPath: string;
  geometry: GeoJSON.Geometry;
  properties: FeatureProps;
  label: string;
};

type CorrelationListItem = {
  correlationId: string;
  trigger: CorrelationTrigger;
  targetKind: "icon" | "polygon" | "unknown";
  targetLabel: string;
  targetFeatureId: string | null;
  lineColorHex: string;
  lineWidth: number;
};

type CorrelatedFeatureRef = {
  featureId: string;
  groupId: string;
  groupName: string;
  layerId: string;
  layerName: string;
  iconPath: string;
  geometry: GeoJSON.Geometry;
  properties: FeatureProps;
  source: "edit" | "base";
};

type CorrelationTargetSnapshot = {
  featureId: string;
  groupId: string;
  groupName: string;
  layerId: string;
  layerName: string;
  iconPath: string;
  geometry: GeoJSON.Geometry;
  properties: FeatureProps;
  correlations: CorrelationMeta[];
};

type UseIconEditInput = {
  mapDoc: MapGeoDocument | null;
  editDoc: EditMapDocument;
  onUpsertIconElement: (payload: UpsertIconElementPayload) => string;
  onUpsertGeometryElement: (payload: UpsertGeometryElementPayload) => string;
  onRemoveIconElement: (params: { editFeatureId?: string; originalEntityId: string }) => void;
  upsertQuest?: (quest: Quest) => void;
  removeQuestEntry?: (questId: string) => void;
  questEdits?: QuestEditEntry[];
  editIconRequest?: IconDatum | null;
  onEditIconRequestHandled?: () => void;
};

export const useIconEdit = ({
  mapDoc,
  editDoc,
  onUpsertIconElement,
  onUpsertGeometryElement,
  onRemoveIconElement,
  upsertQuest,
  removeQuestEntry,
  questEdits = [],
  editIconRequest,
  onEditIconRequestHandled,
}: UseIconEditInput) => {
  const {
    placementLocation,
    setPlacementLocation,
    setPlacementState,
    setActiveFeature,
    setActiveGeometry,
    setActiveLayerName,
    requestRefresh,
    requestSelectionReset,
    selectionResetToken,
    hoverLocation,
  } = useOptionalMapEditPlacementContext();
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [currentFeatureId, setCurrentFeatureId] = useState<string | null>(null);
  const [iconInputValue, setIconInputValue] = useState("");
  const [iconQuery, setIconQuery] = useState("");
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const iconDropdownRef = useRef<HTMLDivElement | null>(null);
  const [iconDescription, setIconDescription] = useState("");
  const [itemsData, setItemsData] = useState<Item[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemInputValue, setItemInputValue] = useState("");
  const [itemQuery, setItemQuery] = useState("");
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const itemDropdownRef = useRef<HTMLDivElement | null>(null);
  const [selectedImages, setSelectedImages] = useState<Array<{ path: string; previewUrl: string }>>([]);
  const [imageSelectionError, setImageSelectionError] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [placedLocation, setPlacedLocation] = useState<{ x: number; y: number } | null>(null);
  const [draftFeature, setDraftFeature] = useState<
    GeoJSON.Feature<GeoJSON.Point, FeatureProps> | null
  >(null);
  const lastPlacedLocationRef = useRef<{ x: number; y: number } | null>(null);

  // Quest-specific state
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [correlationTrigger, setCorrelationTrigger] = useState<CorrelationTrigger>("hover");
  const [isCorrelationPicking, setIsCorrelationPicking] = useState(false);
  const correlationRevertsRef = useRef<Map<string, CorrelationTargetSnapshot>>(new Map());

  const iconOptions = useMemo<IconOption[]>(() => {
    if (!mapDoc?.groups?.length) return [];
    const options: IconOption[] = [];
    mapDoc.groups.forEach((group) => {
      group.layers?.forEach((layer) => {
        const iconPath = layer.style?.iconImagePath ?? null;
        if (!iconPath) return;
        options.push({
          id: layer.id,
          label: layer.name,
          groupId: group.id,
          groupName: group.name,
          layerId: layer.id,
          layerName: layer.name,
          iconPath,
        });
      });
    });
    return options;
  }, [mapDoc]);

  useEffect(() => {
    if (!iconOptions.length) {
      setSelectedIconId(null);
      return;
    }
    if (selectedIconId && !iconOptions.some((opt) => opt.id === selectedIconId)) {
      setSelectedIconId(null);
    }
  }, [iconOptions, selectedIconId]);

  const selectedIcon = useMemo(
    () => iconOptions.find((option) => option.id === selectedIconId) ?? null,
    [iconOptions, selectedIconId]
  );

  /** Whether the currently selected icon type is a quest icon */
  const isQuestIcon = selectedIcon?.layerId === QUEST_ICON_TYPE_ID;

  const applyIconPlacementState = useCallback(
    (params: {
      isActive: boolean;
      iconPath?: string | null;
      placementLocation?: { x: number; y: number } | null;
      hoverLocation?: { x: number; y: number } | null;
      activeFeature?: GeoJSON.Feature<GeoJSON.Point, FeatureProps> | null;
      activeLayerName?: string | null;
      activeEditFeatureId?: string | null;
    }) => {
      const feature = params.activeFeature ?? draftFeature ?? null;
      setPlacementState({
        activeTool: "icon",
        isActive: params.isActive,
        iconPath: params.iconPath ?? selectedIcon?.iconPath ?? null,
        placementLocation: params.placementLocation ?? null,
        hoverLocation: params.hoverLocation ?? hoverLocation,
        activeFeature: feature,
        activeGeometry: feature as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps> | null,
        refreshToken: 0,
        activeLayerName: params.activeLayerName ?? selectedIcon?.layerName ?? null,
        selectionResetToken,
        activeEditFeatureId: params.activeEditFeatureId ?? currentFeatureId ?? null,
      });
    },
    [
      currentFeatureId,
      draftFeature,
      hoverLocation,
      selectedIcon?.iconPath,
      selectedIcon?.layerName,
      selectionResetToken,
      setPlacementState,
    ],
  );

  // ---------------------------------------------------------------------------
  // Quest options — built from QuestDataStore
  // ---------------------------------------------------------------------------
  const questOptions = useMemo<QuestOption[]>(() => {
    if (!isQuestIcon) return [];
    const quests = QuestDataStore.getStoredQuestList();
    return quests.map((q) => ({
      id: q.id,
      name: q.locales?.[I18nHelper.currentLocale()] ?? q.locales?.[I18nHelper.defaultLocale] ?? q.name,
      traderName: (q.trader as { name?: string })?.name ?? undefined,
    }));
  }, [isQuestIcon]);

  // Clear quest selection when the icon type changes away from quest
  useEffect(() => {
    if (!isQuestIcon) {
      setSelectedQuestId(null);
      setSelectedObjectiveId(null);
    }
  }, [isQuestIcon]);

  // ---------------------------------------------------------------------------
  // Objective options — built from the selected quest's objectives
  // ---------------------------------------------------------------------------
  const objectiveOptions = useMemo<ObjectiveOption[]>(() => {
    if (!isQuestIcon || !selectedQuestId) return [];
    const quest = QuestDataStore.getQuestById(selectedQuestId);
    if (!quest?.objectives) return [];
    return quest.objectives.map((obj) => ({
      id: obj.id,
      description: obj.locales?.[I18nHelper.currentLocale()] ?? obj.description ?? obj.id,
    }));
  }, [isQuestIcon, selectedQuestId]);

  /**
   * Push the current quest + objective + images to the quest edit context.
   * Called whenever a relevant piece of quest data changes so the popup / overview stays in sync.
   */
  const syncQuestEditToContext = useCallback(
    (questId: string, objectiveId: string, imagePaths: string[]) => {
      if (!upsertQuest) return;
      // Find existing edit or original quest
      const existingEdit = questEdits.find((e) => e.quest.id === questId);
      const baseQuest: Quest | null | undefined =
        existingEdit?.quest ?? QuestDataStore.getQuestById(questId);
      if (!baseQuest) return;

      const modified = structuredClone(baseQuest);
      const obj = modified.objectives.find((o) => o.id === objectiveId);
      if (obj) {
        obj.questImages = imagePaths.map((p, i): QuestImage => ({
          id: `edit-${objectiveId}-${i}`,
          paths: [p],
        }));
      }
      upsertQuest(modified);
    },
    [upsertQuest, questEdits],
  );

  const handleSelectQuest = useCallback((questId: string) => {
    setSelectedQuestId(questId);
    // Clear objective when the user picks a different quest (different objectives list)
    setSelectedObjectiveId(null);
    // Update the draft feature questId and push to placement context so the popup refreshes
    setDraftFeature((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        properties: {
          ...prev.properties,
          questId,
        },
      };
      setActiveFeature(next);
      requestRefresh();
      return next;
    });
    // If an objective is already selected, push the quest edit to context immediately
    if (selectedObjectiveId) {
      syncQuestEditToContext(
        questId,
        selectedObjectiveId,
        selectedImages.map((img) => img.path),
      );
    }
  }, [setActiveFeature, requestRefresh, selectedObjectiveId, selectedImages, syncQuestEditToContext]);

  const handleSelectObjective = useCallback((objectiveId: string) => {
    setSelectedObjectiveId(objectiveId);
    // As soon as quest + objective are both selected, push to quest context
    if (selectedQuestId) {
      syncQuestEditToContext(
        selectedQuestId,
        objectiveId,
        selectedImages.map((img) => img.path),
      );
    }
  }, [selectedQuestId, selectedImages, syncQuestEditToContext]);

  const createBlankFeatureProps = (iconTypeId?: string): FeatureProps => ({
    id: 0,
    kind: undefined,
    iconTypeId,
    active: undefined,
    protectedEntity: undefined,
    questId: undefined,
    floor: undefined,
    imageList: [],
    description: "",
    locales: undefined,
    longDescription: "",
    longDescriptionLocales: undefined,
    spawnChance: undefined,
    infoList: [],
    style: undefined,
    correlation: undefined,
  });

  const setDraftCorrelations = useCallback(
    (nextCorrelations: CorrelationMeta[] | undefined) => {
      setDraftFeature((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          properties: {
            ...prev.properties,
            correlation: nextCorrelations && nextCorrelations.length > 0 ? nextCorrelations[0] : undefined,
            correlations: nextCorrelations && nextCorrelations.length > 0 ? nextCorrelations : undefined,
          },
        };
        setActiveFeature(next);
        setActiveGeometry(next as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
        requestRefresh();
        return next;
      });
    },
    [requestRefresh, setActiveFeature, setActiveGeometry],
  );

  const correlationList = useMemo(
    () => getCorrelations(draftFeature?.properties),
    [draftFeature],
  );

  useEffect(() => {
    const latest = correlationList.length > 0 ? correlationList[correlationList.length - 1] : undefined;
    if (!latest) return;
    setCorrelationTrigger((latest.trigger as CorrelationTrigger | undefined) ?? "hover");
  }, [correlationList]);

  const currentFeatureIdNum = useMemo(() => {
    const parsed = Number(currentFeatureId ?? "");
    return Number.isFinite(parsed) ? parsed : null;
  }, [currentFeatureId]);

  const collectCorrelatedFeatureRefs = useCallback(
    (targetCorrelationId: string): CorrelatedFeatureRef[] => {
      const refsByFeatureId = new Map<string, CorrelatedFeatureRef>();

      for (const group of mapDoc?.groups ?? []) {
        for (const layer of group.layers ?? []) {
          for (const feature of layer.data?.features ?? []) {
            const properties = feature.properties;
            if (!properties?.id) continue;
            const hasCorrelation = getCorrelations(properties).some(
              (entry) => entry.correlationId === targetCorrelationId,
            );
            if (!hasCorrelation) continue;
            const featureId = String(properties.id);
            refsByFeatureId.set(featureId, {
              featureId,
              groupId: group.id,
              groupName: group.name,
              layerId: layer.id,
              layerName: layer.name,
              iconPath: layer.style?.iconImagePath ?? "",
              geometry: feature.geometry,
              properties,
              source: "base",
            });
          }
        }
      }

      for (const group of editDoc.groups) {
        for (const layer of group.layers) {
          for (const feature of layer.data.features) {
            const properties = feature.properties;
            if (!properties?.id) continue;
            const hasCorrelation = getCorrelations(properties).some(
              (entry) => entry.correlationId === targetCorrelationId,
            );
            if (!hasCorrelation) continue;
            const featureId = String(properties.id);
            refsByFeatureId.set(featureId, {
              featureId,
              groupId: group.id,
              groupName: group.name,
              layerId: layer.id,
              layerName: layer.name,
              iconPath: layer.iconPath ?? "",
              geometry: feature.geometry,
              properties,
              source: "edit",
            });
          }
        }
      }

      return Array.from(refsByFeatureId.values()).filter((ref) => {
        if (currentFeatureIdNum == null) return true;
        return Number(ref.featureId) !== currentFeatureIdNum;
      });
    },
    [currentFeatureIdNum, editDoc.groups, mapDoc?.groups],
  );

  const correlationItems = useMemo<CorrelationListItem[]>(
    () =>
      correlationList.map((entry) => {
        const refs = collectCorrelatedFeatureRefs(entry.correlationId);
        const target = refs[0];
        let targetKind: "icon" | "polygon" | "unknown" = "unknown";
        if (target) {
          targetKind = target.geometry.type === "Polygon" ? "polygon" : "icon";
        }
        const targetLabel = target ? `${target.groupName} / ${target.layerName}` : "Unknown target";
        return {
          correlationId: entry.correlationId,
          trigger: (entry.trigger as CorrelationTrigger | undefined) ?? "hover",
          targetKind,
          targetLabel,
          targetFeatureId: target?.featureId ?? null,
          lineColorHex: lineColorToHex(entry.lineColor),
          lineWidth:
            typeof entry.lineWidth === "number" && entry.lineWidth > 0
              ? entry.lineWidth
              : DEFAULT_CORRELATION_LINE_WIDTH,
        };
      }),
    [collectCorrelatedFeatureRefs, correlationList],
  );

  const upsertCorrelationTargets = useCallback(
    (targetCorrelationId: string, mutate: (input: CorrelationMeta[]) => CorrelationMeta[]) => {
      const refs = collectCorrelatedFeatureRefs(targetCorrelationId);
      refs.forEach((target) => {
        if (!correlationRevertsRef.current.has(target.featureId)) {
          correlationRevertsRef.current.set(target.featureId, {
            featureId: target.featureId,
            groupId: target.groupId,
            groupName: target.groupName,
            layerId: target.layerId,
            layerName: target.layerName,
            iconPath: target.iconPath,
            geometry: target.geometry,
            properties: { ...target.properties },
            correlations: getCorrelations(target.properties).map((entry) => ({ ...entry })),
          });
        }
        const existing = getCorrelations(target.properties);
        const next = mutate(existing);
        onUpsertGeometryElement({
          featureId: target.featureId,
          groupId: target.groupId,
          groupName: target.groupName,
          layerId: target.layerId,
          layerName: target.layerName,
          iconPath: target.iconPath,
          description: target.properties.description ?? "",
          requiredItemIds: target.properties.requiredItemIds ?? [],
          imagePaths: target.properties.imageList ?? [],
          questId: target.properties.questId,
          objectiveId: target.properties.objectiveId,
          correlation: next[0],
          correlations: next,
          polygonFillColor: target.properties.polygonFillColor,
          polygonOutlineColor: target.properties.polygonOutlineColor,
          geometry: target.geometry,
        });
      });
    },
    [collectCorrelatedFeatureRefs, onUpsertGeometryElement],
  );

  const updateCorrelationTrigger = useCallback(
    (targetCorrelationId: string, nextTrigger: CorrelationTrigger) => {
      const nextMainCorrelations = correlationList.map((entry) =>
        entry.correlationId === targetCorrelationId
          ? { ...entry, trigger: nextTrigger }
          : entry,
      );
      setDraftCorrelations(nextMainCorrelations);
      upsertCorrelationTargets(targetCorrelationId, (existing) =>
        existing.map((entry) =>
          entry.correlationId === targetCorrelationId
            ? { ...entry, trigger: nextTrigger }
            : entry,
        ),
      );
      setCorrelationTrigger(nextTrigger);
    },
    [correlationList, setDraftCorrelations, upsertCorrelationTargets],
  );

  const updateCorrelationLineStyle = useCallback(
    (
      targetCorrelationId: string,
      style: { lineColor?: [number, number, number, number]; lineWidth?: number },
    ) => {
      const nextMainCorrelations = correlationList.map((entry) =>
        entry.correlationId === targetCorrelationId
          ? { ...entry, ...style }
          : entry,
      );
      setDraftCorrelations(nextMainCorrelations);
      upsertCorrelationTargets(targetCorrelationId, (existing) =>
        existing.map((entry) =>
          entry.correlationId === targetCorrelationId
            ? { ...entry, ...style }
            : entry,
        ),
      );
    },
    [correlationList, setDraftCorrelations, upsertCorrelationTargets],
  );

  const updateCorrelationLineColor = useCallback(
    (targetCorrelationId: string, hexColor: string) => {
      const current = correlationList.find((entry) => entry.correlationId === targetCorrelationId);
      const alpha = current?.lineColor?.[3] ?? DEFAULT_CORRELATION_LINE_COLOR[3];
      const nextLineColor = hexToLineColor(hexColor, alpha);
      if (!nextLineColor) return;
      updateCorrelationLineStyle(targetCorrelationId, { lineColor: nextLineColor });
    },
    [correlationList, updateCorrelationLineStyle],
  );

  const updateCorrelationLineWidth = useCallback(
    (targetCorrelationId: string, widthValue: number) => {
      if (!Number.isFinite(widthValue) || widthValue <= 0) return;
      const normalized = Math.max(1, Math.min(16, Math.round(widthValue * 10) / 10));
      updateCorrelationLineStyle(targetCorrelationId, { lineWidth: normalized });
    },
    [updateCorrelationLineStyle],
  );

  const removeCorrelation = useCallback(
    (targetCorrelationId: string) => {
      const nextMainCorrelations = correlationList.filter(
        (entry) => entry.correlationId !== targetCorrelationId,
      );
      setDraftCorrelations(nextMainCorrelations.length > 0 ? nextMainCorrelations : undefined);
      upsertCorrelationTargets(targetCorrelationId, (existing) =>
        existing.filter((entry) => entry.correlationId !== targetCorrelationId),
      );
    },
    [correlationList, setDraftCorrelations, upsertCorrelationTargets],
  );

  const beginCorrelationPick = useCallback(() => {
    setIsCorrelationPicking(true);
    if (typeof globalThis.dispatchEvent === "function") {
      globalThis.dispatchEvent(new CustomEvent(START_CORRELATION_PICK_EVENT));
    }
  }, []);

  const stopCorrelationPicking = useCallback(() => {
    setIsCorrelationPicking(false);
    if (typeof globalThis.dispatchEvent === "function") {
      globalThis.dispatchEvent(new CustomEvent(STOP_CORRELATION_PICK_EVENT));
    }
  }, []);

  const clearCorrelation = useCallback(() => {
    setDraftCorrelations(undefined);
    stopCorrelationPicking();
  }, [setDraftCorrelations, stopCorrelationPicking]);

  useEffect(() => {
    const handleTargetPicked = (event: Event) => {
      const detail = (event as CustomEvent<CorrelationTargetPickDetail>).detail;
      if (!detail || !draftFeature) return;
      const existingMainCorrelations = getCorrelations(draftFeature.properties);
      const nextCorrelationId = `corr-${Date.now()}-${existingMainCorrelations.length + 1}`;
      stopCorrelationPicking();

      const sourceId = Number(currentFeatureId);
      const mainRole: CorrelationMeta["role"] = "node";
      const targetRole: CorrelationMeta["role"] =
        detail.geometry.type === "Polygon" ? "area" : "node";
      const mainCorrelation: CorrelationMeta = {
        correlationId: nextCorrelationId,
        anchors: Number.isFinite(sourceId) && sourceId > 0 ? [sourceId] : [],
        role: mainRole,
        trigger: correlationTrigger,
      };
      const targetCorrelation: CorrelationMeta = {
        correlationId: nextCorrelationId,
        anchors: Number.isFinite(sourceId) && sourceId > 0 ? [sourceId] : [],
        role: targetRole,
        trigger: correlationTrigger,
      };

      const nextMainCorrelations = [...existingMainCorrelations, mainCorrelation];
      setDraftCorrelations(nextMainCorrelations);

      const existingTargetCorrelations = getCorrelations(detail.properties);
      if (!correlationRevertsRef.current.has(detail.featureId)) {
        correlationRevertsRef.current.set(detail.featureId, {
          featureId: detail.featureId,
          groupId: detail.groupId,
          groupName: detail.groupName,
          layerId: detail.layerId,
          layerName: detail.layerName,
          iconPath: detail.iconPath,
          geometry: detail.geometry,
          properties: { ...detail.properties },
          correlations: existingTargetCorrelations.map((entry) => ({ ...entry })),
        });
      }
      const nextTargetCorrelations = [...existingTargetCorrelations, targetCorrelation];
      onUpsertGeometryElement({
        featureId: detail.featureId,
        groupId: detail.groupId,
        groupName: detail.groupName,
        layerId: detail.layerId,
        layerName: detail.layerName,
        iconPath: detail.iconPath,
        description: detail.properties.description ?? "",
        requiredItemIds: detail.properties.requiredItemIds ?? [],
        imagePaths: detail.properties.imageList ?? [],
        questId: detail.properties.questId,
        objectiveId: detail.properties.objectiveId,
        correlation: targetCorrelation,
        correlations: nextTargetCorrelations,
        polygonFillColor: detail.properties.polygonFillColor,
        polygonOutlineColor: detail.properties.polygonOutlineColor,
        geometry: detail.geometry,
      });
    };
    if (typeof globalThis.addEventListener !== "function") return;
    globalThis.addEventListener(TARGET_PICKED_CORRELATION_EVENT, handleTargetPicked as EventListener);
    return () => {
      globalThis.removeEventListener(
        TARGET_PICKED_CORRELATION_EVENT,
        handleTargetPicked as EventListener,
      );
    };
  }, [
    correlationTrigger,
    currentFeatureId,
    draftFeature,
    onUpsertGeometryElement,
    setDraftCorrelations,
    stopCorrelationPicking,
  ]);

  useEffect(() => {
    if (!selectedIconId) {
      setDraftFeature(null);
      setPlacedLocation(null);
      setPlacementLocation(null);
      setActiveFeature(null);
      setActiveGeometry(null);
      setActiveLayerName(null);
      return;
    }
    // If a draft already exists for the SAME icon type, keep it
    const currentIconTypeId = draftFeature?.properties?.iconTypeId;
    if (draftFeature && currentIconTypeId === selectedIcon?.layerId) return;

    // Icon type changed or no draft yet — create a fresh one and reset placement
    if (draftFeature) {
      // Switching icon types: clear location and quest state
      setPlacedLocation(null);
      setPlacementLocation(null);
      setSelectedQuestId(null);
      setSelectedObjectiveId(null);
      setIconDescription("");
      setSelectedImages([]);
      setCurrentFeatureId(null);
    }
    const nextFeature: GeoJSON.Feature<GeoJSON.Point, FeatureProps> = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: createBlankFeatureProps(selectedIcon?.layerId),
    };
    setDraftFeature(nextFeature);
    setActiveFeature(nextFeature);
    setActiveGeometry(nextFeature as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
    setActiveLayerName(selectedIcon?.layerName ?? null);
  }, [selectedIconId, draftFeature, selectedIcon?.layerId]);

  useEffect(() => {
    if (selectedIcon && draftFeature && !placedLocation) {
      applyIconPlacementState({
        isActive: true,
        iconPath: selectedIcon.iconPath,
        placementLocation: null,
        activeFeature: draftFeature,
        activeLayerName: selectedIcon.layerName,
        activeEditFeatureId: currentFeatureId,
      });
      return;
    }
    if (selectedIcon && placedLocation) {
      applyIconPlacementState({
        isActive: false,
        iconPath: selectedIcon.iconPath,
        placementLocation: placedLocation,
        activeFeature: draftFeature,
        activeLayerName: selectedIcon.layerName,
        activeEditFeatureId: currentFeatureId,
      });
      return;
    }
    applyIconPlacementState({
      isActive: false,
      iconPath: null,
      placementLocation: null,
      activeFeature: null,
      activeLayerName: null,
      activeEditFeatureId: null,
    });
  }, [selectedIcon, draftFeature, placedLocation, currentFeatureId, applyIconPlacementState]);

  // Escape key cancels the current placement step or draft edit
  useEffect(() => {
    const isInPlacementMode = (selectedIcon && draftFeature && !placedLocation) || isPlacing;
    const isEditingDraft = selectedIcon && draftFeature && placedLocation && !isPlacing;
    if (!isInPlacementMode && !isEditingDraft) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPlacing) {
          // Moving an existing icon — cancel the move and restore previous location
          togglePlacement();
        } else {
          // Placement mode or editing draft — cancel the entire edit
          resetCurrentEdit();
        }
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [selectedIcon, draftFeature, placedLocation, isPlacing]);

  useEffect(() => {
    if (!placementLocation) return;
    setPlacedLocation(placementLocation);
    setIsPlacing(false);
    lastPlacedLocationRef.current = placementLocation;
    setDraftFeature((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        geometry: {
          ...prev.geometry,
          coordinates: [placementLocation.x, placementLocation.y],
        },
      };
      setActiveFeature(next);
      setActiveGeometry(next as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
      requestRefresh();
      return next;
    });
  }, [placementLocation]);

  const isItem = (item: Item | undefined): item is Item => item !== undefined;

  const selectedItems = useMemo(() => {
    if (!itemsData.length || selectedItemIds.length === 0) return [];
    const itemMap = new Map(itemsData.map((item) => [item.id, item]));
    return selectedItemIds
      .map((id) => itemMap.get(id))
      .filter(isItem);
  }, [itemsData, selectedItemIds]);

  const filteredItems = useMemo(() => {
    if (!itemsData.length) return [];
    const searchLower = itemQuery.trim().toLowerCase();
    const selectedSet = new Set(selectedItemIds);
    return itemsData.filter((item) => {
      if (!item?.id || selectedSet.has(item.id)) return false;
      if (!searchLower) return true;
      const name = item.name?.toLowerCase() ?? "";
      return name.includes(searchLower);
    });
  }, [itemsData, itemQuery, selectedItemIds]);

  const groupedIconOptions = useMemo<IconGroup[]>(() => {
    const searchLower = iconQuery.trim().toLowerCase();
    const groups = new Map<string, { name: string; options: IconGroup["options"] }>();
    iconOptions.forEach((option) => {
      const groupName = option.groupName ?? "";
      const matchesGroup = searchLower
        ? groupName.toLowerCase().includes(searchLower)
        : true;
      const matchesOption = searchLower
        ? option.label.toLowerCase().includes(searchLower)
        : true;
      if (!matchesGroup && !matchesOption) return;
      if (!groups.has(option.groupId)) {
        groups.set(option.groupId, { name: option.groupName, options: [] });
      }
      if (matchesGroup || matchesOption) {
        const group = groups.get(option.groupId);
        if (!group) return;
        group.options.push({
          id: option.id,
          label: option.label,
          iconPath: option.iconPath,
          groupId: option.groupId,
          groupName: option.groupName,
          layerId: option.layerId,
          layerName: option.layerName,
        });
      }
    });
    return Array.from(groups.entries()).map(([groupId, group]) => ({
      groupId,
      name: group.name,
      options: group.options,
    }));
  }, [iconOptions, iconQuery]);

  useEffect(() => {
    if (!isIconDropdownOpen) {
      setIconInputValue(selectedIcon?.label ?? "");
      setIconQuery("");
    }
  }, [isIconDropdownOpen, selectedIcon]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target as Node)) {
        setIsIconDropdownOpen(false);
      }
    };

    if (isIconDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isIconDropdownOpen]);

  useEffect(() => {
    if (!ItemsElementUtils.exists()) {
      ItemsElementUtils.initFromStorage();
    }
    const data = ItemsElementUtils.getAllItems();
    if (data.length) {
      const validItems = data.filter((item) => item?.id && item?.name);
      setItemsData(validItems);
    }
  }, []);

  useEffect(() => {
    if (!isItemDropdownOpen) {
      setItemInputValue("");
      setItemQuery("");
    }
  }, [isItemDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target as Node)) {
        setIsItemDropdownOpen(false);
      }
    };

    if (isItemDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isItemDropdownOpen]);

  const isImage16by9 = (blob: Blob): Promise<boolean> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        resolve(Math.abs(aspectRatio - 16 / 9) < 0.01);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve(false);
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(blob);
    });

  const resolvePreferredImagePath = async () => {
    const config = await AppConfigClient.waitForConfig();
    const preferredPath = config?.userSettings?.preferredImageUploadPath;
    if (preferredPath) {
      return preferredPath;
    }
    return globalThis.overwolf?.io?.paths?.documents ?? "";
  };

  const saveFolderPath = (filePath: string) => {
    const folderPath = filePath.substring(0, filePath.lastIndexOf("\\") + 1);
    if (!folderPath) return;
    AppConfigClient.updateConfig({
      userSettings: { preferredImageUploadPath: folderPath },
    });
  };

  const selectImage = async () => {
    setImageSelectionError(null);
    try {
      const preferredPath = await resolvePreferredImagePath();
      const result = await FileUtils.openSelectFileDialog(preferredPath, ".png");
      if (!result.success || !result.file) {
        setImageSelectionError("Image could not be loaded");
        return;
      }

      saveFolderPath(result.file);
      const { blob, url: previewUrl } = await createImageBlobFromFile(result.file, "image/png");
      if (blob.size > 8 * 1024 * 1024) {
        revokeObjectUrl(previewUrl);
        setImageSelectionError("Image exceeds 8MB");
        return;
      }

      const isValidRatio = await isImage16by9(blob);
      if (!isValidRatio) {
        revokeObjectUrl(previewUrl);
        setImageSelectionError("Image does not respect the 16/9 aspect ratio");
        return;
      }

      const existing = selectedImages.some((item) => item.path === result.file);
      if (existing) {
        revokeObjectUrl(previewUrl);
        return;
      }
      const nextImages = [...selectedImages, { path: result.file, previewUrl }];
      setSelectedImages(nextImages);
      setDraftFeature((prevFeature) => {
        if (!prevFeature) return prevFeature;
        const nextFeature = {
          ...prevFeature,
          properties: {
            ...prevFeature.properties,
            imageList: nextImages.map((image) => image.path),
          },
        };
        setActiveFeature(nextFeature);
        setActiveGeometry(nextFeature as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
        requestRefresh();
        return nextFeature;
      });
    } catch (error) {
      console.warn("[IconEdit] Image selection failed", error);
      setImageSelectionError("Image could not be loaded");
    }
  };

  const togglePlacement = () => {
    if (isPlacing) {
      const previousLocation = lastPlacedLocationRef.current;
      setIsPlacing(false);
      if (previousLocation) {
        setPlacedLocation(previousLocation);
        setPlacementLocation(previousLocation);
        applyIconPlacementState({
          isActive: false,
          placementLocation: previousLocation,
        });
      } else {
        applyIconPlacementState({
          isActive: false,
          placementLocation: null,
        });
      }
      requestRefresh();
      return;
    }

    if (!placedLocation) return;
    lastPlacedLocationRef.current = placedLocation;
    setIsPlacing(true);
    setPlacedLocation(null);
    setPlacementLocation(null);
    applyIconPlacementState({
      isActive: true,
      placementLocation: null,
    });
    requestRefresh();
  };

  const submitIconElement = () => {
    if (!selectedIcon || !placedLocation || !draftFeature) {
      console.warn("[IconEdit] Cannot submit icon element", { selectedIcon, placedLocation, draftFeature });
      return;
    }

    // For quest icons, quest + objective + description + at least one image are mandatory
    if (isQuestIcon) {
      if (!selectedQuestId || !selectedObjectiveId) {
        console.warn("[IconEdit] Quest icon requires quest and objective");
        return;
      }
      if (!iconDescription.trim()) {
        console.warn("[IconEdit] Quest icon requires a description");
        return;
      }
      if (selectedImages.length === 0) {
        console.warn("[IconEdit] Quest icon requires at least one image");
        return;
      }
    }

    const payload: UpsertIconElementPayload = {
      featureId: currentFeatureId ?? undefined,
      groupId: selectedIcon.groupId,
      groupName: selectedIcon.groupName,
      layerId: selectedIcon.layerId,
      layerName: selectedIcon.layerName,
      iconPath: selectedIcon.iconPath,
      description: draftFeature.properties?.description ?? "",
      requiredItemIds: selectedItemIds,
      imagePaths: selectedImages.map((image) => image.path),
      questId: isQuestIcon ? selectedQuestId ?? undefined : undefined,
      objectiveId: isQuestIcon ? selectedObjectiveId ?? undefined : undefined,
      correlation: draftFeature.properties?.correlation,
      correlations: getCorrelations(draftFeature.properties),
      x: placedLocation.x,
      y: placedLocation.y,
    };

    console.log("[IconEdit] Built icon payload", payload);
    console.log("[IconEdit] Built icon feature", draftFeature);

    const resolvedId = onUpsertIconElement(payload);
    console.log("[IconEdit] Submitted icon element, resolvedId:", resolvedId);
    correlationRevertsRef.current.clear();

    // If this is a quest icon, also push the quest edit to the submission context
    if (isQuestIcon && selectedQuestId && selectedObjectiveId && upsertQuest) {
      syncQuestEditToContext(
        selectedQuestId,
        selectedObjectiveId,
        selectedImages.map((image) => image.path),
      );
      console.log("[IconEdit] Submitted quest edit for", selectedQuestId);
    }

    // Keep the selected icon but reset to the "place on map" state
    resetForNextPlacement();
  };

  const applySelectedImages = (nextImages: Array<{ path: string; previewUrl: string }>) => {
    setSelectedImages(nextImages);
    setDraftFeature((prevFeature) => {
      if (!prevFeature) return prevFeature;
      const nextFeature = {
        ...prevFeature,
        properties: {
          ...prevFeature.properties,
          imageList: nextImages.map((image) => image.path),
        },
      };
      setActiveFeature(nextFeature);
      requestRefresh();
      return nextFeature;
    });
    // Live-sync quest images to the quest edit context
    if (isQuestIcon && selectedQuestId && selectedObjectiveId) {
      syncQuestEditToContext(
        selectedQuestId,
        selectedObjectiveId,
        nextImages.map((img) => img.path),
      );
    }
  };

  const removeImagePath = (path: string) => {
    const nextImages = selectedImages.filter((image) => image.path !== path);
    if (nextImages.length === selectedImages.length) {
      return;
    }
    applySelectedImages(nextImages);
  };

  const moveImagePath = (path: string, direction: "up" | "down") => {
    const index = selectedImages.findIndex((image) => image.path === path);
    if (index === -1) return;
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= selectedImages.length) {
      return;
    }
    const nextImages = [...selectedImages];
    const temp = nextImages[index];
    nextImages[index] = nextImages[nextIndex];
    nextImages[nextIndex] = temp;
    applySelectedImages(nextImages);
  };
  const moveSelectedItem = (_itemId: string, _direction: "up" | "down") => {};

  const updateDescription = (value: string) => {
    setIconDescription(value);
    setDraftFeature((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        properties: {
          ...prev.properties,
          description: value,
        },
      };
      setActiveFeature(next);
      requestRefresh();
      return next;
    });
  };

  const resetForNextPlacement = () => {
    // Clear edit-specific state but keep the selected icon, quest, and objective
    setCurrentFeatureId(null);
    setIconDescription("");
    setSelectedItemIds([]);
    setItemInputValue("");
    setItemQuery("");
    setIsItemDropdownOpen(false);
    setSelectedImages([]);
    setImageSelectionError(null);
    stopCorrelationPicking();
    setPlacedLocation(null);
    setPlacementLocation(null);
    setIsPlacing(false);
    lastPlacedLocationRef.current = null;
    correlationRevertsRef.current.clear();
    // Keep selectedQuestId and selectedObjectiveId so the next quest icon auto-assigns them

    // Create a fresh draft feature for the same icon type, pre-populating questId if applicable
    const blankProps = createBlankFeatureProps(selectedIcon?.layerId);
    if (isQuestIcon && selectedQuestId) {
      blankProps.questId = selectedQuestId;
    }
    const nextFeature: GeoJSON.Feature<GeoJSON.Point, FeatureProps> = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: blankProps,
    };
    setDraftFeature(nextFeature);
    setActiveFeature(nextFeature);
    setActiveGeometry(nextFeature as GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>);
    setActiveLayerName(selectedIcon?.layerName ?? null);

    // Enter placement mode immediately
    applyIconPlacementState({
      isActive: true,
      placementLocation: null,
      activeFeature: nextFeature,
      activeEditFeatureId: null,
    });
    requestRefresh();
    requestSelectionReset();
  };

  const resetCurrentEdit = () => {
    if (correlationRevertsRef.current.size > 0) {
      correlationRevertsRef.current.forEach((snapshot) => {
        const restoredCorrelations =
          snapshot.correlations.length > 0
            ? snapshot.correlations.map((entry) => ({ ...entry }))
            : undefined;
        onUpsertGeometryElement({
          featureId: snapshot.featureId,
          groupId: snapshot.groupId,
          groupName: snapshot.groupName,
          layerId: snapshot.layerId,
          layerName: snapshot.layerName,
          iconPath: snapshot.iconPath,
          description: snapshot.properties.description ?? "",
          requiredItemIds: snapshot.properties.requiredItemIds ?? [],
          imagePaths: snapshot.properties.imageList ?? [],
          questId: snapshot.properties.questId,
          objectiveId: snapshot.properties.objectiveId,
          correlation: restoredCorrelations?.[0],
          correlations: restoredCorrelations,
          polygonFillColor: snapshot.properties.polygonFillColor,
          polygonOutlineColor: snapshot.properties.polygonOutlineColor,
          geometry: snapshot.geometry,
        });
      });
      correlationRevertsRef.current.clear();
    }

    // Remove quest edit from context before clearing state
    if (selectedQuestId && removeQuestEntry) {
      removeQuestEntry(selectedQuestId);
    }

    setSelectedIconId(null);
    setCurrentFeatureId(null);
    setIconInputValue("");
    setIconQuery("");
    setIsIconDropdownOpen(false);
    setIconDescription("");
    setSelectedItemIds([]);
    setItemInputValue("");
    setItemQuery("");
    setIsItemDropdownOpen(false);
    setSelectedImages([]);
    setDraftFeature(null);
    setPlacedLocation(null);
    setPlacementLocation(null);
    setActiveFeature(null);
    setActiveGeometry(null);
    setActiveLayerName(null);
    setSelectedQuestId(null);
    setSelectedObjectiveId(null);
    stopCorrelationPicking();
    applyIconPlacementState({
      isActive: false,
      iconPath: null,
      placementLocation: null,
      activeFeature: null,
      activeLayerName: null,
      activeEditFeatureId: null,
    });
    requestRefresh();
    requestSelectionReset();
    setIsPlacing(false);
    lastPlacedLocationRef.current = null;
  };

  /**
   * Delete the currently-loaded icon.
   * If the icon exists in editDoc, remove it. If it's an original map icon,
   * mark it as removed so it disappears from the base layer.
   * Then reset the edit panel back to its initial state.
   */
  const deleteCurrentIcon = useCallback(() => {
    if (!currentFeatureId) return;

    onRemoveIconElement({
      editFeatureId: currentFeatureId,
      originalEntityId: currentFeatureId,
    });
    resetCurrentEdit();
  }, [currentFeatureId, onRemoveIconElement, resetCurrentEdit]);

  // ---------------------------------------------------------------------------
  // Load an existing icon into the edit panel (click-to-edit flow)
  // ---------------------------------------------------------------------------

  /**
   * Given a clicked IconDatum, look up the richest version of its data:
   *   1. Check the edit context (editDoc) first — it has the user's latest changes.
   *   2. Fall back to the original map data carried in the IconDatum entity.
   * Then hydrate all edit state so the user can continue editing.
   */
  const loadExistingIcon = useCallback(
    async (datum: IconDatum) => {
      const iconTypeId = datum.iconTypeId ?? datum.entity?.iconTypeId;
      const matchingOption = iconOptions.find((opt) => opt.layerId === iconTypeId);
      if (!matchingOption) {
        console.warn("[IconEdit] No matching icon option for iconTypeId:", iconTypeId);
        return;
      }

      const source = resolveIconSourceData(datum, editDoc);

      // Hydrate all edit state
      setSelectedIconId(matchingOption.id);
      setIconInputValue(matchingOption.label);
      setIconQuery("");
      setIsIconDropdownOpen(false);
      setCurrentFeatureId(source.featureId);
      setIconDescription(source.description);
      setSelectedItemIds([]);
      setItemInputValue("");
      setItemQuery("");
      setIsItemDropdownOpen(false);
      setImageSelectionError(null);
      setIsPlacing(false);
      lastPlacedLocationRef.current = { x: source.x, y: source.y };

      // Hydrate quest state if this is a quest icon
      let resolvedObjectiveId: string | null = null;
      const isQuest = matchingOption.layerId === QUEST_ICON_TYPE_ID && datum.entity?.questId;

      if (isQuest) {
        setSelectedQuestId(datum.entity.questId);

        // For edit-created icons, objectiveId is stored on the entity directly
        const entityObjectiveId = (datum.entity as unknown as Record<string, unknown>).objectiveId as string | undefined;
        if (entityObjectiveId) {
          resolvedObjectiveId = entityObjectiveId;
        } else {
          // Fallback: derive objective from original quest data
          resolvedObjectiveId = resolveObjectiveIdFromQuestData(datum.entity.questId, datum.entity.id);
        }
        setSelectedObjectiveId(resolvedObjectiveId);
      } else {
        setSelectedQuestId(null);
        setSelectedObjectiveId(null);
      }

      // Resolve image paths — for quest icons, include quest-specific images
      let imagePaths = source.imagePaths;
      if (isQuest && imagePaths.length === 0) {
        imagePaths = resolveQuestImagePaths(
          datum.entity.questId,
          resolvedObjectiveId,
          datum.entity.id,
          questEdits,
        );
      }

      // Build the draft feature with hydrated data
      const featureProps = createBlankFeatureProps(matchingOption.layerId);
      featureProps.description = source.description;
      featureProps.imageList = imagePaths;
      featureProps.correlation = source.correlation;
      featureProps.correlations = source.correlations;
      if (isQuest) {
        featureProps.questId = datum.entity.questId;
      }

      const nextFeature: GeoJSON.Feature<GeoJSON.Point, FeatureProps> = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [source.x, source.y] },
        properties: featureProps,
      };
      setDraftFeature(nextFeature);

      // Resolve image previews (async for local files)
      const resolvedImages = await resolveImagePreviews(imagePaths);
      setSelectedImages(resolvedImages);

      // Set the placed location and update placement context
      const location = { x: source.x, y: source.y };
      setPlacedLocation(location);
      setPlacementLocation(location);
      setActiveFeature(nextFeature);
      setActiveLayerName(matchingOption.layerName);
      applyIconPlacementState({
        isActive: false,
        iconPath: matchingOption.iconPath,
        placementLocation: location,
        activeFeature: nextFeature,
        activeLayerName: matchingOption.layerName,
        activeEditFeatureId: source.featureId,
      });
      requestRefresh();
    },
    [
      iconOptions,
      editDoc,
      questEdits,
      hoverLocation,
      selectionResetToken,
      setPlacementLocation,
      setPlacementState,
      setActiveFeature,
      setActiveLayerName,
      requestRefresh,
    ],
  );

  // React to an incoming editIconRequest from the map
  useEffect(() => {
    if (!editIconRequest) return;
    loadExistingIcon(editIconRequest);
    onEditIconRequestHandled?.();
  }, [editIconRequest, loadExistingIcon, onEditIconRequestHandled]);

  // Clean up placement state when the component unmounts
  // (e.g. switching tools in the edit panel, navigating away from the map page)
  useEffect(() => {
    return () => {
      stopCorrelationPicking();
      setPlacementState({
        activeTool: "icon",
        isActive: false,
        iconPath: null,
        placementLocation: null,
        hoverLocation: null,
        activeFeature: null,
        activeGeometry: null,
        refreshToken: 0,
        activeLayerName: null,
        selectionResetToken: 0,
        activeEditFeatureId: null,
      });
      setActiveGeometry(null);
      requestSelectionReset();
    };
  }, [requestSelectionReset, setActiveGeometry, setPlacementState, stopCorrelationPicking]);

  return {
    filteredItems,
    groupedIconOptions,
    iconDescription,
    iconDropdownRef,
    iconInputValue,
    isIconDropdownOpen,
    isItemDropdownOpen,
    itemDropdownRef,
    itemInputValue,
    selectedIcon,
    selectedItems,
    selectedImages,
    imageSelectionError,
    isPlacing,
    hoverLocation,
    placedLocation,
    draftFeature,
    currentFeatureId,
    updateDescription,
    setIconInputValue,
    setIconQuery,
    setIsIconDropdownOpen,
    setIsItemDropdownOpen,
    setItemInputValue,
    setItemQuery,
    setSelectedIconId,
    setSelectedItemIds,
    removeImagePath,
    moveImagePath,
    moveSelectedItem,
    selectImage,
    togglePlacement,
    submitIconElement,
    resetCurrentEdit,
    deleteCurrentIcon,
    // Quest-specific
    isQuestIcon,
    questOptions,
    objectiveOptions,
    selectedQuestId,
    selectedObjectiveId,
    handleSelectQuest,
    handleSelectObjective,
    correlationList,
    correlationItems,
    correlationTrigger,
    isCorrelationPicking,
    setCorrelationTrigger,
    updateCorrelationTrigger,
    updateCorrelationLineColor,
    updateCorrelationLineWidth,
    beginCorrelationPick,
    removeCorrelation,
    clearCorrelation,
  };
};
