/**
 * Utility functions for coordinate conversion between pixel and geographic coordinates
 * Uses Mercator projection to match MapView's coordinate system
 */
import { MercatorCoordinate } from 'maplibre-gl';
import { FilterElementsData } from '../../../../model/IFilterElements';
import { MapGeoDocument } from '../../../../model/map/MapGeoDocument';

export class CoordinateUtils {
  private mapWidth: number;
  private mapHeight: number;
  private originMercator: MercatorCoordinate;
  private mercatorSize: number;
  private mercatorWidth: number;
  private mercatorHeight: number;

  constructor(source: FilterElementsData | MapGeoDocument) {
    const dimensions = "raster" in source
      ? { width: source.raster.width, height: source.raster.height }
      : { width: source.width, height: source.height };
    this.mapWidth = dimensions.width;
    this.mapHeight = dimensions.height;

    if (!this.mapWidth || !this.mapHeight || this.mapWidth <= 0 || this.mapHeight <= 0) {
      throw new Error(`Invalid map dimensions: ${this.mapWidth}x${this.mapHeight}`);
    }

    // Use the same origin and Mercator size as MapView
    const originLng = 0;
    const originLat = 0;
    this.originMercator = MercatorCoordinate.fromLngLat([originLng, originLat]);
    
    // Use the same mercatorSize as MapView (0.1)
    this.mercatorSize = 0.1;
    
    // Calculate aspect ratio
    const aspectRatio = this.mapWidth / this.mapHeight;
    
    // Calculate Mercator dimensions matching MapView's logic
    if (aspectRatio >= 1) {
      // Wider than tall - use full width, scale height proportionally
      this.mercatorWidth = this.mercatorSize;
      this.mercatorHeight = this.mercatorSize / aspectRatio;
    } else {
      // Taller than wide - use full height, scale width proportionally
      this.mercatorHeight = this.mercatorSize;
      this.mercatorWidth = this.mercatorSize * aspectRatio;
    }
  }

  pixelToLngLat(x: number, y: number): [number, number] {
    // Convert pixel coordinates (0,0 at top-left) to normalized coordinates (0-1)
    const normalizedX = x / this.mapWidth;
    const normalizedY = y / this.mapHeight;
    
    // Convert normalized coordinates to Mercator space
    // In Mercator space: (0,0) is top-left, (1,1) is bottom-right
    // We need to map: pixel (0,0) -> Mercator top-left, pixel (width,height) -> Mercator bottom-right
    const mercatorX = this.originMercator.x - (this.mercatorWidth / 2) + (normalizedX * this.mercatorWidth);
    const mercatorY = this.originMercator.y - (this.mercatorHeight / 2) + (normalizedY * this.mercatorHeight);
    
    // Create Mercator coordinate and convert to lng/lat
    const mercatorCoord = new MercatorCoordinate(
      mercatorX,
      mercatorY,
      this.originMercator.z || 0
    );
    
    const lngLat = mercatorCoord.toLngLat();
    return [lngLat.lng, lngLat.lat];
  }

  lngLatToPixel(lng: number, lat: number): [number, number] {
    const mercatorCoord = MercatorCoordinate.fromLngLat([lng, lat]);
    const normalizedX =
      (mercatorCoord.x - (this.originMercator.x - this.mercatorWidth / 2)) / this.mercatorWidth;
    const normalizedY =
      (mercatorCoord.y - (this.originMercator.y - this.mercatorHeight / 2)) / this.mercatorHeight;
    return [normalizedX * this.mapWidth, normalizedY * this.mapHeight];
  }
}

