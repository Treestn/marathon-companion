import { HighLevelGroup } from "./HighLevelGroup";
import { MapCoordinateSystem } from "./MapCoordinateSystem";
import { MapRaster } from "./MapRaster";

export interface MapGeoDocument {
  schemaVersion: "2.0";

  id: string;
  mapId:string;
  name: string;
  author: string;
  version: string;

  /** 
   * Defines how GeoJSON coordinates map onto the background image.
   * This is critical for converting image <-> mercator <-> lat/lon.
   */
  coordinateSystem: MapCoordinateSystem;

  /** 
   * Background raster used as the map image.
   * Coordinates in GeoJSON are relative to this image.
   */
  raster: MapRaster;

  /** 
   * High-level UI groupings (POIs, Quests, Correlations, etc.)
   */
  groups: HighLevelGroup[];
}