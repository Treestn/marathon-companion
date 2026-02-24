import { FeatureProps } from "./FeatureProps";

export type GeometryKind =
  | "Point"
  | "MultiPoint"
  | "LineString"
  | "MultiLineString"
  | "Polygon"
  | "MultiPolygon"
  | "GeometryCollection";

  export interface ElementLayer {
    id: string;
    name: string;
    active?: boolean;
  
    /**
     * Layer-wide rendering defaults.
     * Feature-level styles can override this.
     */
    style?: LayerStyle;
  
    /**
     * GeoJSON data for this layer.
     */
    data: GeoJSON.FeatureCollection<GeoJSON.Geometry, FeatureProps>;
}

export interface LayerStyle {
    iconImagePath?: string | null;
    iconWidth?: number;
    iconHeight?: number;

    pointRadius?: number;
    lineWidth?: number;
    fillOpacity?: number;

    /** 
     * Whether icons are billboarded / centered.
     */
    billboard?: boolean;
}