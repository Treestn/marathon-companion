// deck/builders/icons.builder.ts

import { MapGeoDocument } from "../../../../../model/map/MapGeoDocument";
import { FeatureProps } from "../../../../../model/map/FeatureProps";
import { MapFloorElementsData } from "../../../../../model/floor/IMapFloorElements";
import { CoordinateUtils } from "../../utils/coordinateUtils";

export type IconDatum = {
  id: number;
  position: [number, number]; // map coordinates (lng/lat-like in your custom space)
  image: string; // atlas key
  width?: number;
  height?: number;
  dimmed?: boolean;
  iconTypeId?: string;

  // Keep original entity for popup/click actions
  entity: FeatureProps;

  // Optional metadata (useful later)
  name?: string;
  pixelX: number;
  pixelY: number;
  floor?: number | string;

  /** If this icon was built from an EditMapDocument feature, the feature's string id */
  editFeatureId?: string;
};

export type BuildIconsParams = {
  mapDoc: MapGeoDocument;
  floors: MapFloorElementsData | null;
  coord: CoordinateUtils;
  placeholderImage: string;

  /**
   * Optional: choose which image to use when entity has many.
   * Default: entity.image ?? first of imageList ?? placeholder
   */
  selectImage?: (fallback: string, props: FeatureProps, layerName: string) => string;

  /**
   * Optional: include only active entities if your model has "active" booleans.
   * If your entities don’t have active, leave it undefined.
   */
  isActive?: (props: FeatureProps) => boolean;

  /**
   * Optional: resolve visibility state for an entity.
   * If provided, takes precedence over isActive.
   */
  getVisibility?: (props: FeatureProps) => "visible" | "dimmed" | "hidden";

  /**
   * Optional: if you want to restrict to a specific floor.
   */
  floorId?: number | string | null;
};

export function buildIcons({
  mapDoc,
  floors,
  coord,
  placeholderImage,
  selectImage = defaultSelectImage,
  isActive,
  getVisibility,
  floorId = null,
}: BuildIconsParams): IconDatum[] {
  const coordinateUtils = new CoordinateUtils(mapDoc);
  const out: IconDatum[] = [];

  for (const group of mapDoc.groups ?? []) {
    for (const layer of group.layers ?? []) {
      out.push(
        ...buildIconsForLayer({
          mapDoc,
          group,
          layer,
          coord: coordinateUtils,
          placeholderImage,
          selectImage,
          visibilityOptions: { isActive, getVisibility, floorId },
        }),
      );
    }
  }

  return out;
}

type LayerBuildInput = {
  mapDoc: MapGeoDocument;
  group: MapGeoDocument["groups"][number];
  layer: MapGeoDocument["groups"][number]["layers"][number];
  coord: CoordinateUtils;
  placeholderImage: string;
  selectImage: (fallback: string, props: FeatureProps, layerName: string, imageOverride?: string) => string;
  visibilityOptions: ResolveVisibilityInput;
};

function buildIconsForLayer({
  mapDoc,
  group,
  layer,
  coord,
  placeholderImage,
  selectImage,
  visibilityOptions,
}: LayerBuildInput): IconDatum[] {
  const out: IconDatum[] = [];
  for (const feature of layer.data?.features ?? []) {
    const props = feature.properties;
    if (!props) continue;
    const visibility = resolveVisibility(props, visibilityOptions);
    if (visibility === "hidden") continue;

    const points = normalizeGeometryPoints(feature.geometry, mapDoc);
    if (points.length === 0) continue;

    points.forEach((point, idx) => {
      const icon = buildIconDatum({
        props,
        point,
        coord,
        placeholderImage,
        selectImage,
        layerName: layer.name,
        layerId: layer.id,
        imageOverride: layer.style?.iconImagePath ?? group.icon?.imagePath ?? undefined,
        sizeOverride: {
          width: layer.style?.iconWidth,
          height: layer.style?.iconHeight,
        },
        dimmed: visibility === "dimmed",
        ordinal: idx,
      });
      if (icon) out.push(icon);
    });
  }
  return out;
}

type BuildIconDatumInput = {
  props: FeatureProps;
  point: [number, number];
  coord: CoordinateUtils;
  placeholderImage: string;
  layerName: string;
  layerId: string;
  selectImage: (fallback: string, props: FeatureProps, layerName: string, imageOverride?: string) => string;
  imageOverride?: string;
  sizeOverride?: { width?: number; height?: number };
  dimmed?: boolean;
  ordinal: number;
};

function buildIconDatum({
  props,
  point,
  coord,
  placeholderImage,
  layerName,
  layerId,
  selectImage,
  imageOverride,
  sizeOverride,
  dimmed,
  ordinal,
}: BuildIconDatumInput): IconDatum | null {
  const [px, py] = point;
  if (typeof px !== "number" || typeof py !== "number") return null;

  const position = coord.pixelToLngLat(px, py);

  const baseId = Number(props.id);
  const id = Number.isFinite(baseId) ? baseId * 1000 + ordinal : Number.NaN;
  if (!Number.isFinite(id)) return null;

  const image = selectImage(placeholderImage, props, layerName, imageOverride);

  const entity = props.iconTypeId ? props : { ...props, iconTypeId: layerId };
  return {
    id,
    position,
    image,
    width: sizeOverride?.width ?? props.style?.size,
    height: sizeOverride?.height ?? props.style?.size,
    entity,
    name: props.kind ?? layerName,
    pixelX: px,
    pixelY: py,
    floor: props.floor ?? undefined,
    dimmed,
    iconTypeId: entity.iconTypeId ?? layerId,
  };
}

type ResolveVisibilityInput = {
  isActive?: (props: FeatureProps) => boolean;
  getVisibility?: (props: FeatureProps) => "visible" | "dimmed" | "hidden";
  floorId?: number | string | null;
};

function resolveVisibility(
  props: FeatureProps,
  { isActive, getVisibility, floorId = null }: ResolveVisibilityInput
): "visible" | "dimmed" | "hidden" {
  if (floorId !== null) {
    const leFloor = props.floor ?? null;
    if (leFloor !== null && leFloor !== floorId) return "hidden";
  }

  if (getVisibility) return getVisibility(props);
  if (isActive && !isActive(props)) return "hidden";
  return "visible";
}

function defaultSelectImage(
  placeholder: string,
  props: FeatureProps,
  _layerName: string,
  imageOverride?: string
): string {
  const img = props.image ?? imageOverride ?? props.style?.icon;
  if (typeof img === "string" && img.length > 0) return img;
  return placeholder;
}

function normalizeGeometryPoints(
  geometry: GeoJSON.Geometry,
  mapDoc: MapGeoDocument
): [number, number][] {
  const toPixels = (coord: [number, number]) => {
    if (mapDoc.coordinateSystem.type === "image-normalized") {
      return [coord[0] * mapDoc.raster.width, coord[1] * mapDoc.raster.height] as [number, number];
    }
    return coord;
  };

  if (geometry.type === "Point") {
    return [toPixels(geometry.coordinates as [number, number])];
  }
  if (geometry.type === "MultiPoint") {
    return (geometry.coordinates as [number, number][]).map(toPixels);
  }
  return [];
}