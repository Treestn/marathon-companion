import { PolygonLayer } from "@deck.gl/layers";
import type { MapGeoDocument } from "../../../../../model/map/MapGeoDocument";
import type { CoordinateUtils } from "../../utils/coordinateUtils";
import type { CorrelationMeta, FeatureProps } from "../../../../../model/map/FeatureProps";

type PolygonLayerInput = {
  id: string;
  mapDoc: MapGeoDocument | null;
  coord: CoordinateUtils | null;
  activeCorrelationId?: string | null;
  extraPolygons?: Array<{
    id: string;
    coordinates: Array<[number, number]>; // image-pixels or image-normalized
    correlation?: CorrelationMeta;
  }>;
};

type PolygonDatum = {
  id: string;
  polygon: [number, number][];
  correlation?: CorrelationMeta;
  correlations?: CorrelationMeta[];
};

const normalizeCoord = (
  coord: [number, number],
  mapDoc: MapGeoDocument
): [number, number] => {
  if (mapDoc.coordinateSystem.type === "image-normalized") {
    return [coord[0] * mapDoc.raster.width, coord[1] * mapDoc.raster.height];
  }
  return coord;
};

const toPolygon = (
  ring: [number, number][],
  mapDoc: MapGeoDocument,
  coord: CoordinateUtils
): [number, number][] =>
  ring.map((point) => {
    const [px, py] = normalizeCoord(point, mapDoc);
    return coord.pixelToLngLat(px, py);
  });

const pushPolygon = (
  out: PolygonDatum[],
  idPrefix: string,
  ring: [number, number][],
  mapDoc: MapGeoDocument,
  coord: CoordinateUtils,
  correlation?: CorrelationMeta,
  correlations?: CorrelationMeta[],
) => {
  if (!ring || ring.length === 0) return;
  out.push({
    id: `${idPrefix}:${out.length}`,
    polygon: toPolygon(ring, mapDoc, coord),
    correlation,
    correlations,
  });
};

const appendFeaturePolygons = (
  out: PolygonDatum[],
  idPrefix: string,
  geometry: GeoJSON.Geometry,
  mapDoc: MapGeoDocument,
  coord: CoordinateUtils,
  correlation?: CorrelationMeta,
  correlations?: CorrelationMeta[],
) => {
  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates?.[0] as [number, number][];
    pushPolygon(out, idPrefix, ring, mapDoc, coord, correlation, correlations);
    return;
  }
  if (geometry.type === "MultiPolygon") {
    const polys = geometry.coordinates as [number, number][][][];
    polys.forEach((poly) => {
      const ring = poly?.[0];
      pushPolygon(out, idPrefix, ring, mapDoc, coord, correlation, correlations);
    });
  }
};

const buildPolygonData = (
  mapDoc: MapGeoDocument,
  coord: CoordinateUtils
): PolygonDatum[] => {
  const out: PolygonDatum[] = [];

  for (const group of mapDoc.groups ?? []) {
    for (const layer of group.layers ?? []) {
      for (const feature of layer.data?.features ?? []) {
        const props = feature.properties as FeatureProps | undefined;
        appendFeaturePolygons(
          out,
          layer.id,
          feature.geometry,
          mapDoc,
          coord,
          props?.correlation,
          props?.correlations,
        );
      }
    }
  }

  return out;
};

const isCorrelationVisible = (
  correlation: CorrelationMeta | undefined,
  correlations: CorrelationMeta[] | undefined,
  activeCorrelationId: string | null
) => {
  const list =
    correlations && correlations.length > 0 ? correlations : correlation ? [correlation] : [];
  if (list.length === 0) {
    return true;
  }
  if (list.some((c) => c.trigger === "always")) {
    return true;
  }
  if (!activeCorrelationId) {
    return false;
  }
  return list.some((c) => c.correlationId === activeCorrelationId);
};

export const buildPolygonLayer = ({
  id,
  mapDoc,
  coord,
  activeCorrelationId = null,
  extraPolygons = [],
}: PolygonLayerInput) => {
  if (!mapDoc || !coord) {
    return null;
  }

  const basePolygons = buildPolygonData(mapDoc, coord);
  const extra = extraPolygons.map((item) => ({
    id: item.id,
    polygon: item.coordinates.map((point) => {
      const [px, py] = normalizeCoord(point, mapDoc);
      return coord.pixelToLngLat(px, py);
    }),
    correlation: item.correlation,
  }));

  const data = [...basePolygons, ...extra].filter((polygon) =>
    isCorrelationVisible(polygon.correlation, polygon.correlations, activeCorrelationId)
  );
  if (data.length === 0) {
    return null;
  }

  return new PolygonLayer({
    id,
    data,
    pickable: false,
    stroked: true,
    filled: true,
    getPolygon: (d: PolygonDatum) => d.polygon,
    getFillColor: [90, 140, 160, 90],
    getLineColor: [90, 200, 200, 200],
    lineWidthMinPixels: 1,
    parameters: { depthTest: false, depthMask: false },
  });
};
