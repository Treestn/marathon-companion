import React, { useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapGeoDocument } from '../../../../model/map/MapGeoDocument';
import { useMapImageLayer, type OriginalMapState } from './hooks/mapView/useMapImageLayer';
import { useMapImageUpdates } from './hooks/mapView/useMapImageUpdates';
import { useMapInitialization } from './hooks/mapView/useMapInitialization';
import { useMapStatePersistence } from './hooks/mapView/useMapStatePersistence';
import '../map.css';

interface MapViewProps {
  mapDoc: MapGeoDocument | null;
  className?: string;
  style?: React.CSSProperties;
  onMapReady?: (map: maplibregl.Map) => void;
}

export const MapView: React.FC<MapViewProps> = ({ mapDoc, className, style, onMapReady }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [initError, setInitError] = useState<Error | null>(null);
  
  // Store original map state for reset functionality
  const originalState = useRef<OriginalMapState | null>(null);

  // Storage key for map state persistence
  const MAP_STATE_STORAGE_KEY = 'interactive-map-state';
  const { saveMapState, loadMapState } = useMapStatePersistence(map, MAP_STATE_STORAGE_KEY);
  const { updateMapImage } = useMapImageLayer(map, originalState, loadMapState);

  useMapInitialization({
    mapContainer,
    map,
    mapDoc,
    setMapLoaded,
    setBearing,
    onMapReady,
    saveMapState,
    loadMapState,
    updateMapImage,
    originalState,
    onInitError: setInitError,
  });

  useMapImageUpdates(map, mapDoc, mapLoaded, updateMapImage);

  if (initError) {
    const isWebGL = initError.message?.includes("WebGL");
    return (
      <div className={className} style={style}>
        <div className="map-error-container">
          <div className="map-error-icon">⚠</div>
          <div className="map-error-title">
            {isWebGL ? "WebGL is not available" : "Map failed to load"}
          </div>
          <div className="map-error-message">
            {isWebGL
              ? "The interactive map requires WebGL which appears to be disabled or unsupported on this device. This can happen due to enterprise policies, driver issues, or browser settings."
              : initError.message || "An unexpected error occurred while loading the map."}
          </div>
          <div className="map-error-hints">
            <div className="map-error-hint">Try updating your graphics drivers</div>
            <div className="map-error-hint">Check that WebGL is not blocked by an enterprise policy</div>
            <div className="map-error-hint">Restart the application</div>
          </div>
        </div>
      </div>
    );
  }

  if (!mapDoc) {
    return (
      <div className={className} style={style}>
        <div className="map-loading-message">
          Loading map data...
        </div>
      </div>
    );
  }

  // Calculate compass rotation (bearing + north offset if available)
  const northOffset = mapDoc?.raster?.northDegrees || 0;
  const compassRotation = bearing + northOffset;

  return (
    <div
      className={`${className} map-view-container`}
      style={style}
    >
      <div
        ref={mapContainer}
        className="map-container"
      />
      {/* Compass at the bottom */}
      {mapLoaded && (
        <>
          {/* Reset button */}
          <div
            className="map-reset-button"
            onClick={() => {
              if (!map.current || !originalState.current) return;
              
              // Animate back to original state
              if (originalState.current.bounds) {
                map.current.fitBounds(originalState.current.bounds, {
                  padding: originalState.current.padding || 20,
                  maxZoom: 10,
                  duration: 1000, // Animate over 1 second
                  bearing: originalState.current.bearing,
                  pitch: originalState.current.pitch
                });
              } else if (originalState.current.center) {
                // Fallback to center/zoom if bounds not available
                map.current.easeTo({
                  center: originalState.current.center,
                  zoom: originalState.current.zoom || 0,
                  bearing: originalState.current.bearing,
                  pitch: originalState.current.pitch,
                  duration: 1000
                });
              }
            }}
            title="Reset map to original view"
          >
            <img
              src="../../img/icons/target.png"
              alt="Reset"
              className="map-reset-icon"
            />
          </div>

          {/* Compass */}
          <div className="map-compass-container">
            <div
              className="map-compass"
              style={{
                transform: `rotate(${-compassRotation}deg)`, // Negative to rotate compass, not the map
                backgroundImage: 'url(../../img/compass.png)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `rotate(${-compassRotation}deg) scale(1.1)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `rotate(${-compassRotation}deg) scale(1)`;
              }}
              onClick={() => {
                if (!map.current) return;
                
                // Animate bearing to 0 degrees and pitch to 0
                map.current.easeTo({
                  bearing: 0,
                  pitch: 0,
                  duration: 1000 // Animate over 1 second
                });
              }}
              title="Reset map rotation to north (0°) and pitch to 0°"
            />
            <div className="map-compass-label">
              {Math.round(bearing)}°
            </div>
          </div>
        </>
      )}
    </div>
  );
};

