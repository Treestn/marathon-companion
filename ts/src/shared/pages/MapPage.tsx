import React, { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

import { useMapData } from "./map/useMapData";
import { MapView } from "./map/components/MapView";
import { MapFilterSidebar } from "./map/MapFilterSidebar";
import { MapDeckGLLayer } from "./map/MapDeckGLLayer";
import { MapEditPanel } from "./map/edit/MapEditPanel";
import { useMapEditSession } from "./map/edit/useMapEditSession";
import { useOptionalMapEditPlacementContext } from "../context/MapEditPlacementContext";
import { useOptionalEditModeContext } from "../context/EditModeContext";
import { useOptionalMapSubmissionContext } from "../context/MapSubmissionContext";
import { useOptionalQuestSubmissionContext } from "../context/QuestSubmissionContext";

import { Maps, MapsList } from "../../escape-from-tarkov/constant/MapsConst";
import { MapAdapter } from "../../adapter/MapAdapter";
import { FilterConst } from "../../escape-from-tarkov/constant/FilterConst";
import { QuestDataStore } from "../services/QuestDataStore";
import { ProgressionStateService } from "../services/ProgressionStateService";
import { CoordinateUtils } from "./map/utils/coordinateUtils";
import { AppConfigClient } from "../services/AppConfigClient";
import { I18nHelper } from "../../locale/I18nHelper";
import type { MapGeoDocument } from "../../model/map/MapGeoDocument";
import type { IconDatum } from "./map/deck/builder/icon.builder";
import type { Quest, QuestImage } from "../../model/quest/IQuestsElements";
import type { UpsertIconElementPayload } from "./map/edit/useMapEditSession";

const getInitialMapId = (): string => {
  const mapDefault =
    AppConfigClient.getConfig()?.userSettings?.mapDefaultPreference ?? MapsList[0].id;
  const mapIdFromPreference = MapAdapter.getIdFromMap(mapDefault);

  if (mapIdFromPreference) {
    AppConfigClient.updateConfig({
      userSettings: { mapDefaultPreference: mapIdFromPreference },
    });
    return mapIdFromPreference;
  }
  return mapDefault || MapsList[0].id;
};

// ---------------------------------------------------------------------------
// Edit Mode Hints (bottom center of map)
// ---------------------------------------------------------------------------

type EditHintsProps = {
  activeTool: "icon" | "polygon" | null;
  activeGeometryType?: GeoJSON.Geometry["type"] | null;
  isPlacementActive: boolean;
  hasPlacedDraft: boolean;
};

const EditHints: React.FC<EditHintsProps> = ({
  activeTool,
  activeGeometryType,
  isPlacementActive,
  hasPlacedDraft,
}) => {
  if (activeTool === "polygon") {
    if (activeGeometryType === "LineString") {
      return (
        <div className="map-edit-hints">
          <div className="map-edit-hint">
            <kbd>Click</kbd> to add polygon vertices
          </div>
          <div className="map-edit-hint">
            Complete (<kbd>Enter</kbd>) · Undo vertex (<kbd>Esc</kbd>)
          </div>
        </div>
      );
    }
    if (activeGeometryType === "Polygon") {
      return (
        <div className="map-edit-hints">
          <div className="map-edit-hint">
            <kbd>Click</kbd> and <kbd>Drag</kbd> corners to edit polygon
          </div>
          <div className="map-edit-hint"><kbd>Click</kbd> edge midpoint to add a vertex</div>
          <div className="map-edit-hint">Delete corner (<kbd>Ctrl</kbd> + <kbd>Click</kbd>)</div>
        </div>
      );
    }
    return (
      <div className="map-edit-hints">
        <div className="map-edit-hint">Start Polygon, then click map to place vertices</div>
      </div>
    );
  }

  if (isPlacementActive) {
    return (
      <div className="map-edit-hints">
        <div className="map-edit-hint">
          <kbd>Click</kbd> to place icon on map
        </div>
      </div>
    );
  }

  if (hasPlacedDraft) {
    return (
      <div className="map-edit-hints">
        <div className="map-edit-hint">Complete icon to place a new one</div>
        <div className="map-edit-hint">
          Cancel (<kbd>Esc</kbd>)
        </div>
      </div>
    );
  }

  return (
    <div className="map-edit-hints">
      <div className="map-edit-hint">
        <kbd>Click</kbd> an icon to start editing it
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MapPage
// ---------------------------------------------------------------------------

type MapPageProps = {
  allowQuestNavigation?: boolean;
};

export const MapPage: React.FC<MapPageProps> = ({
  allowQuestNavigation = true,
}) => {
  const [mapId, setMapId] = useState<string>(getInitialMapId);
  const [isVisible, setIsVisible] = useState(true);
  const [mapReadyVersion, setMapReadyVersion] = useState(0);
  const [mapReadyTick, setMapReadyTick] = useState(0);
  const mapContainerRef = useRef<HTMLElement | null>(null);

  const { isEditMode, canEdit, isAvailable: isEditModeAvailable, toggleEditMode, setEditMode } = useOptionalEditModeContext();
  const { addRemovedMapIcon, setMapEditDocs, clearMapEdits, clearRemovedMapIcons } = useOptionalMapSubmissionContext();
  const { questEdits, upsertQuest, clearQuestEdits } = useOptionalQuestSubmissionContext();

  const { mapDoc, floors, loading, error, refreshMapData } = useMapData(mapId);
  const upsertQuestIconImage = useCallback(
    (questId: string, objectiveId: string, iconId: string, imagePaths: string[], description: string) => {
      const existingEdit = questEdits.find((entry) => entry.quest.id === questId);
      const baseQuest = existingEdit?.quest ?? QuestDataStore.getQuestById(questId);
      if (!baseQuest) return;
      const modified = structuredClone(baseQuest);
      const objective = modified.objectives.find((obj) => obj.id === objectiveId);
      if (!objective) return;
      const iconIdStr = String(iconId);
      const remaining = (objective.questImages ?? []).filter((qi) => String(qi.id) !== iconIdStr);
      const normalizedDescription = description.trim();
      const locales: Record<string, string> = {};
      if (normalizedDescription) {
        locales[I18nHelper.currentLocale()] = normalizedDescription;
        if (!locales[I18nHelper.defaultLocale]) {
          locales[I18nHelper.defaultLocale] = normalizedDescription;
        }
      }
      const nextQuestImage: QuestImage & { locales: Record<string, string> } = {
        id: iconIdStr,
        paths: [...imagePaths],
        description: normalizedDescription,
        locales,
      };
      objective.questImages = [...remaining, nextQuestImage];
      upsertQuest(modified);
    },
    [questEdits, upsertQuest],
  );
  const removeQuestIconImage = useCallback((iconId: string | number) => {
    const iconIdStr = String(iconId);
    const questIds = new Set<string>();
    mapDoc?.groups.forEach((group) => {
      group.layers?.forEach((layer) => {
        layer.data?.features?.forEach((feature) => {
          if (String(feature.properties?.id) !== iconIdStr) return;
          if (feature.properties?.questId) {
            questIds.add(String(feature.properties.questId));
          }
        });
      });
    });
    questIds.forEach((questId) => {
      const existingEdit = questEdits.find((entry) => entry.quest.id === questId);
      const baseQuest: Quest | null | undefined =
        existingEdit?.quest ?? QuestDataStore.getQuestById(questId);
      if (!baseQuest) return;
      const modified = structuredClone(baseQuest);
      let didRemove = false;
      modified.objectives.forEach((obj) => {
        const before = (obj.questImages ?? []).length;
        obj.questImages = (obj.questImages ?? []).filter((qi) => String(qi.id) !== iconIdStr);
        if ((obj.questImages ?? []).length !== before) didRemove = true;
      });
      if (didRemove) {
        upsertQuest(modified);
      }
    });
  }, [mapDoc, questEdits, upsertQuest]);
  const handleIconUpsert = useCallback((payload: UpsertIconElementPayload, resolvedId: string) => {
    if (!payload.questId || !payload.objectiveId) return;
    upsertQuestIconImage(
      payload.questId,
      payload.objectiveId,
      resolvedId,
      payload.imagePaths ?? [],
      payload.description ?? "",
    );
  }, [upsertQuestIconImage]);
  const editSession = useMapEditSession(
    mapDoc,
    handleIconUpsert,
    (entry) => {
      addRemovedMapIcon(entry);
      removeQuestIconImage(entry.featureId);
    },
  );
  const placementCtx = useOptionalMapEditPlacementContext();

  // Sync all map edit docs into the submission context so the
  // review modal and header button can see map edits across all maps.
  useEffect(() => {
    if (isEditMode) {
      setMapEditDocs(editSession.allEditDocs);
    } else {
      setMapEditDocs([]);
    }
  }, [isEditMode, editSession.allEditDocs, setMapEditDocs]);

  // Icon click-to-edit flow: MapDeckGLLayer sets this, MapEditPanel consumes it
  const [editIconRequest, setEditIconRequest] = useState<IconDatum | null>(null);

  const handleEditIconClick = useCallback((icon: IconDatum) => {
    setEditIconRequest(icon);
  }, []);

  const handleEditIconRequestHandled = useCallback(() => {
    setEditIconRequest(null);
  }, []);

  // Keep the map instance in a ref (no rerender storms)
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [deckMountReady, setDeckMountReady] = useState(false);

  // Optional override for sidebar edits
  const [mapDocOverride, setMapDocOverride] = useState<MapGeoDocument | null>(null);

  // Whenever mapId changes OR new mapDoc arrives, reset local override
  useEffect(() => {
    setMapDocOverride(null);
  }, [mapId, mapDoc]);

  useEffect(() => {
    setDeckMountReady(false); // reset ONLY on mapId change
    mapRef.current = null;
  }, [mapId]);

  const activeMapDoc = mapDocOverride ?? mapDoc;

  const refreshQuestFilters = useCallback(async () => {
    if (!activeMapDoc) return;

    const activeQuests = QuestDataStore.getStoredQuestList().filter((quest) =>
      ProgressionStateService.isQuestActive(quest.id),
    );
    let didChange = false;

    const nextDoc = structuredClone(activeMapDoc);
    const questGroup = nextDoc.groups?.find((group) => {
      const normalizedName = group.name?.trim().toLowerCase();
      if (
        normalizedName === FilterConst.QUESTS.name.toLowerCase() ||
        normalizedName === "contracts"
      ) {
        return true;
      }
      return (group.layers ?? []).some((layer) =>
        (layer.data?.features ?? []).some(
          (feature) =>
            Boolean(feature.properties?.questId) ||
            feature.properties?.iconTypeId === "Contracts:Contracts"
        )
      );
    });
    if (!questGroup?.layers?.length) return;

    if (questGroup.active === false) {
      questGroup.layers.forEach((layer) => {
        if (layer.active !== false) {
          layer.active = false;
          didChange = true;
        }
        layer.data?.features?.forEach((feature) => {
          if (feature.properties && feature.properties.active !== false) {
            feature.properties.active = false;
            didChange = true;
          }
        });
      });
      if (didChange) {
        setMapDocOverride(nextDoc);
      }
      return;
    }

    questGroup.layers.forEach((layer) => {
      layer.data?.features?.forEach((feature) => {
        const questId = feature.properties?.questId;
        if (!questId || !feature.properties) return;
        let isActive = false;
        for (const quest of activeQuests) {
          const matches =
            String(quest.id) === String(questId) ||
            String(quest.oldQuestId) === String(questId);
          if (!matches) continue;
          if (
            ProgressionStateService.isQuestObjectiveCompletedByIconId(
              quest.id,
              String(feature.properties.id),
            ) &&
            !ProgressionStateService.isQuestCompleted(quest.id)
          ) {
            continue;
          }
          isActive = true;
          break;
        }
        if (feature.properties.active !== isActive) {
          feature.properties.active = isActive;
          didChange = true;
        }
      });

      const hasActiveChild =
        layer.data?.features?.some((feature) => feature.properties?.active !== false) ?? false;
      if (layer.active !== hasActiveChild) {
        layer.active = hasActiveChild;
        didChange = true;
      }
    });

    if (didChange) {
      setMapDocOverride(nextDoc);
    }
  }, [activeMapDoc]);

  useEffect(() => {
    void refreshQuestFilters();
  }, [refreshQuestFilters]);

  useEffect(() => {
    const handleQuestUpdate = () => {
      void refreshQuestFilters();
    };
    if (typeof globalThis.addEventListener !== "function") return;
    globalThis.addEventListener("quest-progress-updated", handleQuestUpdate);
    return () => {
      globalThis.removeEventListener("quest-progress-updated", handleQuestUpdate);
    };
  }, [refreshQuestFilters]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let retryTimeout: number | undefined;
    let attempts = 0;
    const maxAttempts = 50;
    const retryDelayMs = 100;

    const trySubscribe = () => {
      const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
      if (!bridge?.onProgressionUpdated) {
        if (attempts < maxAttempts) {
          attempts += 1;
          retryTimeout = globalThis.setTimeout(trySubscribe, retryDelayMs);
        }
        return;
      }

      unsubscribe = bridge.onProgressionUpdated(() => {
        void refreshQuestFilters();
      });
    };

    trySubscribe();

    return () => {
      if (retryTimeout) {
        globalThis.clearTimeout(retryTimeout);
      }
      unsubscribe?.();
    };
  }, [refreshQuestFilters]);

  type MapFocusIconId = string | number;
  type MapFocusDetail = {
    mapId?: string;
    pixelX?: number;
    pixelY?: number;
    iconId?: MapFocusIconId;
    floorId?: number | string | null;
  };
  const pendingFocusRef = useRef<MapFocusDetail | null>(null);

  const getFeaturePrimaryPoint = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Geometry, any>, doc: MapGeoDocument) => {
      const coords = (() => {
        if (feature.geometry.type === "Point") {
          return feature.geometry.coordinates as [number, number];
        }
        if (feature.geometry.type === "MultiPoint") {
          const points = feature.geometry.coordinates as [number, number][];
          return points.length > 0 ? points[0] : null;
        }
        return null;
      })();
      if (!coords) return null;
      if (doc.coordinateSystem.type === "image-normalized") {
        return {
          x: coords[0] * doc.raster.width,
          y: coords[1] * doc.raster.height,
        };
      }
      return { x: coords[0], y: coords[1] };
    },
    []
  );

  const findIconFocus = useCallback(
    (doc: MapGeoDocument, iconId: MapFocusIconId) => {
      const normalizedIconId = String(iconId);
      for (const group of doc.groups ?? []) {
        for (const layer of group.layers ?? []) {
          for (const feature of layer.data?.features ?? []) {
            if (String(feature.properties?.id) !== normalizedIconId) {
              continue;
            }
            const point = getFeaturePrimaryPoint(feature, doc);
            if (!point) {
              return null;
            }
            return {
              pixelX: point.x,
              pixelY: point.y,
              floorId: feature.properties?.floor ?? null,
            };
          }
        }
      }
      return null;
    },
    [getFeaturePrimaryPoint]
  );

  const resolveFocusDetail = useCallback(
    (detail: MapFocusDetail, doc: MapGeoDocument | null | undefined): MapFocusDetail => {
      if (typeof detail.pixelX === "number" && typeof detail.pixelY === "number") {
        return detail;
      }
      if (!doc || detail.iconId === undefined || detail.iconId === null) {
        return detail;
      }
      const focus = findIconFocus(doc, detail.iconId);
      if (!focus) {
        return detail;
      }
      return {
        ...detail,
        pixelX: focus.pixelX,
        pixelY: focus.pixelY,
        floorId: detail.floorId ?? focus.floorId,
      };
    },
    [findIconFocus]
  );

  const isFocusDetailReady = (
    detail: MapFocusDetail
  ): detail is MapFocusDetail & { pixelX: number; pixelY: number } =>
    typeof detail.pixelX === "number" && typeof detail.pixelY === "number";

  const isMapReadyForFocus = (map: maplibregl.Map): boolean => {
    const isLoaded = map.loaded?.() && map.isStyleLoaded?.();
    const isMoving = map.isMoving?.() ?? false;
    const isZooming = map.isZooming?.() ?? false;
    const isRotating = map.isRotating?.() ?? false;
    return Boolean(isLoaded && !isMoving && !isZooming && !isRotating);
  };

  const applyMapFocus = useCallback(
    (
      map: maplibregl.Map,
      docSource: MapGeoDocument,
      detail: MapFocusDetail & { pixelX: number; pixelY: number }
    ) => {
        const container = map.getContainer?.();
        if (container && container.clientWidth > 0 && container.clientHeight > 0) {
          map.resize();
        }
      if (detail.floorId !== undefined && typeof globalThis.dispatchEvent === "function") {
            globalThis.dispatchEvent(
              new CustomEvent("map-focus-icon", { detail: { floorId: detail.floorId } })
            );
        }
        const coord = new CoordinateUtils(docSource);
        const center = coord.pixelToLngLat(detail.pixelX, detail.pixelY);
        map.easeTo({
          center,
          zoom: 6.5,
          duration: 800,
        });
    },
    []
  );

  const clearMapRestoreTimeout = (map: maplibregl.Map) => {
    const mapWithState = map as maplibregl.Map & { __stateRestoreTimeout?: number };
    if (mapWithState.__stateRestoreTimeout) {
      clearTimeout(mapWithState.__stateRestoreTimeout);
      mapWithState.__stateRestoreTimeout = undefined;
    }
  };

  const createFocusOnceHandler = (
    map: maplibregl.Map,
    focusNow: () => void
  ): (() => void) => {
    let didFocus = false;
    const handler = () => {
      if (didFocus) return;
      didFocus = true;
      map.off("idle", handler);
      map.off("load", handler);
      focusNow();
    };
    return handler;
  };

  const registerFocusListeners = (map: maplibregl.Map, handler: () => void) => {
    map.once("idle", handler);
    if (!map.loaded?.() || !map.isStyleLoaded?.()) {
      map.once("load", handler);
      }
  };

  const findIconFeature = useCallback((doc: MapGeoDocument, iconId: MapFocusIconId) => {
    const normalizedIconId = String(iconId);
    for (const group of doc.groups ?? []) {
      for (const layer of group.layers ?? []) {
        for (const feature of layer.data?.features ?? []) {
          if (String(feature.properties?.id) === normalizedIconId) {
            return { group, layer, feature };
          }
        }
      }
    }
    return null;
  }, []);

  const enableIconInDoc = useCallback(
    (doc: MapGeoDocument, iconId: MapFocusIconId) => {
      const nextDoc = structuredClone(doc);
      const match = findIconFeature(nextDoc, iconId);
      if (!match) {
        return { doc: nextDoc, changed: false };
      }
      const activate = (target: { active?: boolean }) => {
        if (target.active === false) {
          target.active = true;
          return true;
        }
        return false;
      };
      const changed =
        activate(match.group) ||
        activate(match.layer) ||
        activate(match.feature.properties);
      return { doc: nextDoc, changed };
    },
    [findIconFeature]
  );

  const hasFocusIconId = (iconId: unknown): iconId is MapFocusIconId =>
    (typeof iconId === "number" && Number.isFinite(iconId)) ||
    (typeof iconId === "string" && iconId.trim().length > 0);

  const getValidFocusDetail = useCallback((detail?: MapFocusDetail) => {
    if (!detail) return null;
    const hasCoords =
      typeof detail.pixelX === "number" && typeof detail.pixelY === "number";
    const hasIcon = hasFocusIconId(detail.iconId);
    return hasCoords || hasIcon ? detail : null;
  }, []);

  const getDocForFocus = useCallback(
    (detail: MapFocusDetail, doc: MapGeoDocument) => {
      if (!hasFocusIconId(detail.iconId)) {
        return doc;
      }
      const { doc: nextDoc, changed } = enableIconInDoc(doc, detail.iconId);
      if (changed) {
        setMapDocOverride(nextDoc);
        return nextDoc;
      }
      return doc;
    },
    [enableIconInDoc]
  );

  const queueFocusForMapChange = useCallback(
    (detail: MapFocusDetail) => {
      if (detail.mapId && detail.mapId !== mapId) {
        pendingFocusRef.current = detail;
        setMapId(detail.mapId);
        return true;
      }
      return false;
    },
    [mapId]
  );

  const scheduleFocus = useCallback(
    (detail: MapFocusDetail, mapDocForFocus?: MapGeoDocument | null) => {
      const docSource = mapDocForFocus ?? activeMapDoc;
      const resolvedDetail = resolveFocusDetail(detail, docSource);
      if (!isFocusDetailReady(resolvedDetail)) return;
      if (queueFocusForMapChange(detail)) return;
      const map = mapRef.current;
      if (!map || !docSource) {
        pendingFocusRef.current = detail;
        return;
      }
      clearMapRestoreTimeout(map);

      const focusNow = () => applyMapFocus(map, docSource, resolvedDetail);

      if (isMapReadyForFocus(map)) {
        requestAnimationFrame(focusNow);
        return;
      }
      const doFocus = createFocusOnceHandler(map, focusNow);
      registerFocusListeners(map, doFocus);
    },
    [
      activeMapDoc,
      applyMapFocus,
      isMapReadyForFocus,
      mapId,
      queueFocusForMapChange,
      resolveFocusDetail,
    ]
  );

  const queueFocusUntilReady = useCallback((detail: MapFocusDetail) => {
    if (!mapRef.current || !activeMapDoc) {
      pendingFocusRef.current = detail;
      return true;
    }
    return false;
  }, [activeMapDoc]);

  const handleFocusIconDetail = useCallback(
    (detail?: MapFocusDetail) => {
      const validDetail = getValidFocusDetail(detail);
      if (!validDetail) return;
      if (queueFocusForMapChange(validDetail)) return;
      if (queueFocusUntilReady(validDetail)) return;
      const docForFocus = getDocForFocus(validDetail, activeMapDoc);
      scheduleFocus(validDetail, docForFocus);
    },
    [
      activeMapDoc,
      getDocForFocus,
      getValidFocusDetail,
      queueFocusForMapChange,
      queueFocusUntilReady,
      scheduleFocus,
    ]
  );

  useEffect(() => {
    const handleFocusIcon = (event: Event) => {
      handleFocusIconDetail(
        (event as CustomEvent).detail as MapFocusDetail | undefined
      );
    };

    if (typeof globalThis.addEventListener !== "function") return;
    globalThis.addEventListener("map-focus-icon", handleFocusIcon);
    return () => {
      globalThis.removeEventListener("map-focus-icon", handleFocusIcon);
    };
  }, [handleFocusIconDetail]);

  useEffect(() => {
    if (!pendingFocusRef.current) return;
    if (!mapRef.current || !activeMapDoc) return;
    if (pendingFocusRef.current.mapId && pendingFocusRef.current.mapId !== mapId) return;
    const detail = pendingFocusRef.current;
    pendingFocusRef.current = null;
    scheduleFocus(detail);
  }, [activeMapDoc, mapId, mapReadyTick, scheduleFocus]);

  useEffect(() => {
    const handleMapChangeRequest = (event: Event) => {
      const detail = (event as CustomEvent).detail as { mapId?: string } | undefined;
      if (!detail?.mapId) return;
      setMapId((prev) => (prev === detail.mapId ? prev : detail.mapId));
    };
    if (typeof globalThis.addEventListener !== "function") return;
    globalThis.addEventListener("map-change-request", handleMapChangeRequest);
    return () => {
      globalThis.removeEventListener("map-change-request", handleMapChangeRequest);
    };
  }, []);

  useEffect(() => {
    const pending = (globalThis as any).__pendingMapFocus as MapFocusDetail | undefined;
    if (!pending) return;
    if (pending.mapId && pending.mapId !== mapId) {
      setMapId(pending.mapId);
      return;
    }
    (globalThis as any).__pendingMapFocus = undefined;
    scheduleFocus(pending);
  }, [mapId, mapReadyTick, scheduleFocus]);

  useEffect(() => {
    const handleVisibilityChange = (event: Event) => {
      const detail = (event as CustomEvent).detail as { visible?: boolean } | undefined;
      if (!detail || typeof detail.visible !== "boolean") return;
      setIsVisible(detail.visible);
    };
    if (typeof globalThis.addEventListener !== "function") return;
    globalThis.addEventListener("interactive-map-visibility", handleVisibilityChange);
    return () => {
      globalThis.removeEventListener("interactive-map-visibility", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !mapRef.current) return;
    const container = mapRef.current.getContainer?.();
    if (container && container.clientWidth > 0 && container.clientHeight > 0) {
      mapRef.current.resize();
    }
  }, [isVisible]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    requestAnimationFrame(() => {
      const container = map.getContainer?.();
      if (container && container.clientWidth > 0 && container.clientHeight > 0) {
        map.resize();
      }
    });
  }, [isEditMode]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || typeof MutationObserver === "undefined") return;

    const updateVisibility = () => {
      const isConnected = container.isConnected;
      const isRendered = container.getClientRects().length > 0;
      setIsVisible(isConnected && isRendered);
    };

    updateVisibility();
    const observer = new MutationObserver(updateVisibility);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      observer.disconnect();
    };
  }, [mapReadyVersion]);

  // --- Escape key: cancel placement or current edit ---
  useEffect(() => {
    if (!isEditMode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // If actively placing an icon, stop placement
      if (placementCtx.isActive) {
        placementCtx.setPlacementState({
          isActive: false,
          iconPath: null,
          placementLocation: null,
          hoverLocation: null,
          activeFeature: null,
          refreshToken: placementCtx.refreshToken,
          activeLayerName: null,
          selectionResetToken: placementCtx.selectionResetToken + 1,
          activeEditFeatureId: null,
        });
        return;
      }
      // If we have a placed icon draft, cancel it
      if (placementCtx.placementLocation) {
        placementCtx.setPlacementState({
          isActive: false,
          iconPath: null,
          placementLocation: null,
          hoverLocation: null,
          activeFeature: null,
          refreshToken: placementCtx.refreshToken,
          activeLayerName: null,
          selectionResetToken: placementCtx.selectionResetToken + 1,
          activeEditFeatureId: null,
        });
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, placementCtx]);

  // --- Reset edit states when leaving edit mode ---
  const prevEditModeRef = useRef(isEditMode);
  useEffect(() => {
    if (prevEditModeRef.current && !isEditMode) {
      clearMapEdits();
      clearRemovedMapIcons();
      setMapEditDocs([]);
      clearQuestEdits();
      editSession.resetSession();
      placementCtx.setPlacementState({
        isActive: false,
        iconPath: null,
        placementLocation: null,
        hoverLocation: null,
        activeFeature: null,
        refreshToken: 0,
        activeLayerName: null,
        selectionResetToken: 0,
        activeEditFeatureId: null,
      });
      setEditIconRequest(null);
    }
    prevEditModeRef.current = isEditMode;
  }, [
    clearMapEdits,
    clearQuestEdits,
    clearRemovedMapIcons,
    isEditMode,
    editSession,
    placementCtx,
    setMapEditDocs,
  ]);

  const handleMapReady = useCallback((map) => {
    mapRef.current = map;
    mapContainerRef.current = map.getContainer?.() ?? null;
    setMapReadyVersion((prev) => prev + 1);
    setMapReadyTick((prev) => prev + 1);
  
    const mark = () => setDeckMountReady(true);
  
    if (map.loaded?.() && map.isStyleLoaded?.()) mark();
    else map.once("load", mark);
  }, [mapId]);

  const handleMapDocChange = useCallback((updatedDoc: MapGeoDocument) => {
    setMapDocOverride(updatedDoc);
  }, []);

  const handleMapChange = useCallback((newMapId: string) => {
    setMapId((prev) => (prev === newMapId ? prev : newMapId));
  }, []);

  if (loading) {
    return (
      <div className="mapRunner runner map-loading-container">
        <div className="map-loading-spinner" aria-hidden="true" />
        <div className="map-loading-text">Loading map data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mapRunner runner map-error-container">
        <div className="map-error-icon">⚠</div>
        <div className="map-error-title">Map is temporarily unavailable</div>
        <div className="map-error-message">
          The server is currently unavailable. Please try again soon.
        </div>
        <button type="button" className="map-error-refresh-button" onClick={refreshMapData}>
          Refresh
        </button>
      </div>
    );
  }

  if (!mapDoc || !activeMapDoc) {
    return (
      <div className="mapRunner runner" style={{ padding: 20, textAlign: "center" }}>
        <div>No map data available</div>
      </div>
    );
  }

  return (
    <div className="mapRunner runner map-layout-root" style={{ width: "100%", height: "100%", background: "#1F1D20" }}>
      <div className="map-main-stage">
        <MapFilterSidebar
          mapDoc={activeMapDoc}
          onMapDocChange={handleMapDocChange}
          currentMapId={mapId}
          onMapChange={handleMapChange}
          isEditMode={isEditMode}
          isEditModeAvailable={isEditModeAvailable}
          canEdit={canEdit}
          onToggleEditMode={toggleEditMode}
        />

        <MapView
          key={`mapview-${mapId}`} // Unique key for MapView
          mapDoc={mapDoc}
          style={{ width: "100%", height: "100%" }}
          onMapReady={handleMapReady}
        />

        {/* Mount deck only once map is ready */}
        {deckMountReady && mapRef.current && (
          <MapDeckGLLayer
            key={`deckgl-${mapId}`}
            map={mapRef.current}
            mapDoc={activeMapDoc}
            floors={floors}
            allowQuestNavigation={allowQuestNavigation}
            editDoc={isEditMode ? editSession.editDoc : undefined}
            onEditIconClick={isEditMode ? handleEditIconClick : undefined}
          />
        )}

        {isEditMode && (
          <EditHints
            activeTool={placementCtx.activeTool ?? null}
            activeGeometryType={placementCtx.activeGeometry?.geometry?.type ?? null}
            isPlacementActive={placementCtx.isActive}
            hasPlacedDraft={Boolean(placementCtx.placementLocation)}
          />
        )}
      </div>

      <div className={`map-edit-panel-shell ${isEditMode ? "is-open" : "is-closed"}`}>
        <MapEditPanel
          mapDoc={activeMapDoc}
          editSession={editSession}
          editIconRequest={editIconRequest}
          onEditIconRequestHandled={handleEditIconRequestHandled}
        />
      </div>
    </div>
  );
};
