import { ScatterplotLayer } from "@deck.gl/layers";
import { COORDINATE_SYSTEM } from "@deck.gl/core";

export type DotDatum = {
  id: number | string;
  position: [number, number]; // [lng, lat]
  color?: [number, number, number, number];
  radiusPx?: number;
};

export function buildDotsLayer({
  id,
  data,
  hoveredId,
  pickable = true,
}: {
  id: string;
  data: DotDatum[];
  hoveredId?: number | string | null;
  pickable?: boolean;
}) {
  return new ScatterplotLayer<DotDatum>({
    id,
    data,
    pickable,
    coordinateSystem: COORDINATE_SYSTEM.LNGLAT,

    getPosition: (d) => d.position,

    // radius in pixels (screen space)
    radiusUnits: "pixels",
    getRadius: (d) => (d.id === hoveredId ? (d.radiusPx ?? 10) * 1.4 : d.radiusPx ?? 10),

    getFillColor: (d) => d.color ?? [255, 0, 0, 200],
    getLineColor: [0, 0, 0, 200],
    lineWidthUnits: "pixels",
    getLineWidth: 1,

    // parameters: { depthTest: false },

    updateTriggers: {
      getRadius: hoveredId,
    },
  });
}
