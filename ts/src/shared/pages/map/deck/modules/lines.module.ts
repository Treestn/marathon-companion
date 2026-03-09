import { LineLayer } from "@deck.gl/layers";
import type { CoordinateUtils } from "../../utils/coordinateUtils";
import type { CorrelationMeta } from "../../../../../model/map/FeatureProps";

type LineLayerInput = {
  id: string;
  coord: CoordinateUtils | null;
  activeCorrelationId?: string | null;
  lines: Array<{
    id: string;
    source: [number, number]; // image-pixels
    target: [number, number]; // image-pixels
    correlation?: CorrelationMeta;
  }>;
};

type LineDatum = {
  id: string;
  source: [number, number];
  target: [number, number];
  correlation?: CorrelationMeta;
};

const DEFAULT_LINE_COLOR: [number, number, number, number] = [120, 210, 210, 200];
const DEFAULT_LINE_WIDTH = 2;

const isCorrelationVisible = (
  correlation: CorrelationMeta | undefined,
  activeCorrelationId: string | null
) => {
  if (!correlation) {
    return true;
  }
  if (correlation.trigger === "always") {
    return true;
  }
  if (!activeCorrelationId) {
    return false;
  }
  return correlation.correlationId === activeCorrelationId;
};

export const buildLineLayer = ({
  id,
  coord,
  activeCorrelationId = null,
  lines,
}: LineLayerInput) => {
  if (!coord || lines.length === 0) {
    return null;
  }

  const data: LineDatum[] = lines
    .filter((line) => isCorrelationVisible(line.correlation, activeCorrelationId))
    .map((line) => ({
      id: line.id,
      source: coord.pixelToLngLat(line.source[0], line.source[1]),
      target: coord.pixelToLngLat(line.target[0], line.target[1]),
      correlation: line.correlation,
    }));

  if (data.length === 0) {
    return null;
  }

  return new LineLayer({
    id,
    data,
    getSourcePosition: (d: LineDatum) => d.source,
    getTargetPosition: (d: LineDatum) => d.target,
    getColor: (d: LineDatum) => d.correlation?.lineColor ?? DEFAULT_LINE_COLOR,
    getWidth: (d: LineDatum) =>
      typeof d.correlation?.lineWidth === "number" && d.correlation.lineWidth > 0
        ? d.correlation.lineWidth
        : DEFAULT_LINE_WIDTH,
    widthUnits: "pixels",
    pickable: false,
    parameters: { depthTest: false, depthMask: false },
  });
};
