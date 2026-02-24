import { StorageHelper } from "../../../../escape-from-tarkov/service/helper/StorageHelper";
import type { FilterElementsData, ListElementEntity } from "../../../../model/IFilterElements";
import type { MapGeoDocument } from "../../../../model/map/MapGeoDocument";
import type { HighLevelGroup } from "../../../../model/map/HighLevelGroup";
import type { ElementLayer } from "../../../../model/map/ElementLayer";
import type { FeatureProps } from "../../../../model/map/FeatureProps";
import type { MapCoordinateSystem } from "../../../../model/map/MapCoordinateSystem";
import { MapAdapter } from "../../../../adapter/MapAdapter";

const mappedSuffix = "-mapped";

const getLegacyStorageKey = (mapId: string): string =>
  `${MapAdapter.getMapFromId(mapId)}_filter`;

export const getMappedStorageKey = (mapId: string): string =>
  `${getLegacyStorageKey(mapId)}${mappedSuffix}`;

const toPointFeature = (entity: ListElementEntity, x: number, y: number) => {
  const properties: FeatureProps = {
    id: entity.id,
    kind: undefined,
    active: entity.active,
    protectedEntity: entity.protectedEntity,
    questId: entity.questId,
    floor: entity.floor,
    image: entity.image ?? null,
    imageList: entity.imageList,
    description: entity.description,
    locales: entity.locales,
    longDescription: entity.longDescription,
    longDescriptionLocales: entity.longDescriptionLocales,
    spawnChance: entity.spawnChance,
    infoList: entity.infoList,
  };
  return {
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [x, y] as [number, number],
    },
    properties,
  };
};

const buildFeatures = (entities: ListElementEntity[]) => {
  const features: Array<GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>> = [];

  entities.forEach((entity) => {
    const positions = entity.position ?? [];
    if (positions.length > 0) {
      if (positions.length === 1) {
        const [pos] = positions;
        if (Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
          features.push(toPointFeature(entity, pos.x, pos.y));
        }
      } else {
        const coords = positions
          .filter((pos) => Number.isFinite(pos.x) && Number.isFinite(pos.y))
          .map((pos) => [pos.x, pos.y] as [number, number]);
        if (coords.length > 0) {
          const properties: FeatureProps = {
            id: entity.id,
            kind: undefined,
            active: entity.active,
            protectedEntity: entity.protectedEntity,
            questId: entity.questId,
            floor: entity.floor,
            image: entity.image ?? null,
            imageList: entity.imageList,
            description: entity.description,
            locales: entity.locales,
            longDescription: entity.longDescription,
            longDescriptionLocales: entity.longDescriptionLocales,
            spawnChance: entity.spawnChance,
            infoList: entity.infoList,
          };
          features.push({
            type: "Feature",
            geometry: {
              type: "MultiPoint",
              coordinates: coords,
            },
            properties,
          });
        }
      }
      return;
    }

    if (Number.isFinite(entity.x) && Number.isFinite(entity.y)) {
      features.push(toPointFeature(entity, entity.x as number, entity.y as number));
    }
  });

  return features;
};

export const mapLegacyFiltersToGeoDocument = (filters: FilterElementsData): MapGeoDocument => {
  const coordinateSystem: MapCoordinateSystem = {
    type: "image-pixels",
    origin: "top-left",
    units: "px",
  };

  const groups: HighLevelGroup[] = (filters.highLevelElements ?? []).map((hle) => {
    const layers: ElementLayer[] = (hle.elements ?? []).map((element) => ({
      id: `${hle.name}:${element.name}`,
      name: element.name,
      active: element.active,
      style: {
        iconImagePath: element.imagePath ?? undefined,
        iconWidth: element.width,
        iconHeight: element.height,
        billboard: element.centered ?? undefined,
      },
      data: {
        type: "FeatureCollection",
        features: buildFeatures(element.listElements ?? []),
      },
    }));

    return {
      id: hle.name,
      name: hle.name,
      active: hle.active,
      icon: {
        imagePath: hle.imagePath ?? null,
        secondaryImage: hle.secondaryImage ?? null,
      },
      layers,
    };
  });

  return {
    schemaVersion: "2.0",
    id: MapAdapter.getIdFromMap(filters.map),
    mapId: filters.map,
    author: filters.author,
    version: filters.version,
    coordinateSystem,
    raster: {
      imagePath: filters.mapImagePath,
      width: filters.width,
      height: filters.height,
      offsetX: filters.offsetX,
      offsetY: filters.offsetY,
      northDegrees: filters.north,
    },
    groups,
  };
};

export const saveMappedGeoDocument = (mapId: string, doc: MapGeoDocument) => {
  StorageHelper.save(getMappedStorageKey(mapId), doc);
};

export const loadMappedGeoDocument = (mapId: string): MapGeoDocument | null => {
  const raw = StorageHelper.getStoredData(getMappedStorageKey(mapId));
  if (!raw) {
    return null;
  }
  try {
    return typeof raw === "string" ? (JSON.parse(raw) as MapGeoDocument) : (raw as MapGeoDocument);
  } catch {
    return null;
  }
};
