import React from "react";

import type { MapGeoDocument } from "../../../../model/map/MapGeoDocument";
import type { UpsertPolygonElementPayload } from "./useMapEditSession";
import { usePolygonEdit } from "./usePolygonEdit";

type PolygonEditProps = {
  mapDoc: MapGeoDocument | null;
  onUpsertPolygonElement: (payload: UpsertPolygonElementPayload) => string;
  onRemoveGeometryElement: (params: { editFeatureId?: string; originalEntityId: string }) => void;
};

export const PolygonEdit: React.FC<PolygonEditProps> = ({
  mapDoc,
  onUpsertPolygonElement,
  onRemoveGeometryElement,
}) => {
  const {
    groupedLayerOptions,
    layerDropdownRef,
    layerInputValue,
    setLayerInputValue,
    setLayerQuery,
    isLayerDropdownOpen,
    setIsLayerDropdownOpen,
    setSelectedLayerId,
    vertices,
    isDrawing,
    isPolygon,
    hasActiveGeometry,
    activeEditFeatureId,
    polygonFillColor,
    polygonOutlineColor,
    colorPresets,
    selectedPresetId,
    applyColorPreset,
    setPolygonFillColor,
    setPolygonOutlineColor,
    startPolygon,
    completePolygon,
    savePolygon,
    resetPolygonEdit,
    deletePolygon,
  } = usePolygonEdit({
    mapDoc,
    onUpsertPolygonElement,
    onRemoveGeometryElement,
  });

  return (
    <>
      <div className="map-edit-field">
        <div className="map-edit-field-label">Polygon Layer</div>
        <div className="map-edit-icon-selector">
          <div className="map-edit-item-selector" ref={layerDropdownRef}>
            <div className="map-edit-item-selector-input-wrapper">
              <input
                type="text"
                value={layerInputValue}
                onChange={(event) => {
                  setLayerInputValue(event.target.value);
                  setLayerQuery(event.target.value);
                  setIsLayerDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsLayerDropdownOpen(true);
                  setLayerQuery("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsLayerDropdownOpen(false);
                  }
                }}
                placeholder="Search polygon layers..."
                className="map-edit-item-selector-input"
              />
            </div>
            {isLayerDropdownOpen && groupedLayerOptions.length > 0 && (
              <div className="map-edit-item-selector-dropdown scroll-div">
                {groupedLayerOptions.map((group) => (
                  <div key={group.groupId}>
                    <div className="map-edit-item-selector-group">{group.name}</div>
                    {group.options.map((option) => (
                      <button
                        key={`${option.groupId}:${option.layerId}`}
                        type="button"
                        className="map-edit-item-selector-option"
                        onClick={() => {
                          setSelectedLayerId(option.layerId);
                          setLayerInputValue(option.layerName);
                          setLayerQuery(option.layerName);
                          setIsLayerDropdownOpen(false);
                        }}
                      >
                        <span className="map-edit-item-selector-option-name">{option.layerName}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {isLayerDropdownOpen && layerInputValue && groupedLayerOptions.length === 0 && (
              <div className="map-edit-item-selector-dropdown scroll-div">
                <div className="map-edit-item-selector-no-results">
                  No polygon layers found matching "{layerInputValue}"
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="map-edit-actions-inline">
        {!hasActiveGeometry && (
          <button type="button" className="map-edit-secondary-button" onClick={startPolygon}>
            Start Polygon
          </button>
        )}
        {isDrawing && (
          <button
            type="button"
            className="map-edit-secondary-button"
            onClick={completePolygon}
            disabled={vertices.length < 3}
          >
            Complete Polygon
          </button>
        )}
        {hasActiveGeometry && (
          <button type="button" className="map-edit-secondary-button map-edit-cancel-button" onClick={resetPolygonEdit}>
            Cancel
          </button>
        )}
      </div>
      {hasActiveGeometry && (
        <div className="map-edit-location">Vertices: {vertices.length}</div>
      )}
      {isPolygon && (
        <div className="map-edit-field">
          <div className="map-edit-field-label">Polygon Colors</div>
          <select
            className="map-edit-input map-edit-polygon-preset-select"
            value={selectedPresetId}
            onChange={(e) => applyColorPreset(e.target.value)}
          >
            {colorPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          <div className="map-edit-polygon-color-row">
            <label className="map-edit-polygon-color-control">
              <span className="map-edit-polygon-color-label">Fill</span>
              <input
                type="color"
                className="map-edit-color-input"
                value={polygonFillColor}
                onChange={(e) => setPolygonFillColor(e.target.value)}
              />
              <span className="map-edit-polygon-color-value">{polygonFillColor.toUpperCase()}</span>
            </label>
            <label className="map-edit-polygon-color-control">
              <span className="map-edit-polygon-color-label">Outline</span>
              <input
                type="color"
                className="map-edit-color-input"
                value={polygonOutlineColor}
                onChange={(e) => setPolygonOutlineColor(e.target.value)}
              />
              <span className="map-edit-polygon-color-value">{polygonOutlineColor.toUpperCase()}</span>
            </label>
          </div>
        </div>
      )}
      {isPolygon && (
        <div className="map-edit-footer">
          {activeEditFeatureId && (
            <button type="button" className="map-edit-danger-button" onClick={deletePolygon}>
              Delete
            </button>
          )}
          <button type="button" className="map-edit-primary-button" onClick={savePolygon}>
            {activeEditFeatureId ? "Save Polygon" : "Add Polygon"}
          </button>
        </div>
      )}
    </>
  );
};

