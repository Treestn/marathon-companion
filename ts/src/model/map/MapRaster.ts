export interface MapRaster {
    imagePath: string;
    width: number;
    height: number;
  
    offsetX?: number;
    offsetY?: number;
  
    /**
     * Rotation of the map relative to true north, in degrees.
     * Required for correct lat/lon alignment.
     */
    northDegrees?: number;
  }