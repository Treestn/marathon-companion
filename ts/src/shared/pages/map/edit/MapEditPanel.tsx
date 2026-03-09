import React, { useEffect } from "react";

import { MapGeoDocument } from "../../../../model/map/MapGeoDocument";
import { useMapEditPanel } from "./useMapEditPanel";
import { useMapEditSession } from "./useMapEditSession";
import { IconEdit } from "./IconEdit";
import { useOptionalQuestSubmissionContext } from "../../../context/QuestSubmissionContext";
import { useOptionalMapSubmissionContext } from "../../../context/MapSubmissionContext";
import { useOptionalMapEditPlacementContext } from "../../../context/MapEditPlacementContext";
import { PolygonEdit } from "./PolygonEdit";
import type { IconDatum } from "../deck/builder/icon.builder";

type MapEditPanelProps = {
  mapDoc: MapGeoDocument | null;
  editSession: ReturnType<typeof useMapEditSession>;
  editIconRequest?: IconDatum | null;
  onEditIconRequestHandled?: () => void;
};

export const MapEditPanel: React.FC<MapEditPanelProps> = ({
  mapDoc,
  editSession,
  editIconRequest,
  onEditIconRequestHandled,
}) => {
  const { selectedTool, setSelectedTool } = useMapEditPanel();
  const { questEdits, upsertQuest, removeQuestEntry } = useOptionalQuestSubmissionContext();
  const { addRemovedMapIcon } = useOptionalMapSubmissionContext();
  const { setActiveTool } = useOptionalMapEditPlacementContext();

  // Auto-switch to icon tool when an icon edit request comes in
  useEffect(() => {
    setActiveTool(
      selectedTool === "polygon" ? "polygon" : selectedTool === "icon" ? "icon" : null,
    );
  }, [selectedTool, setActiveTool]);

  useEffect(() => {
    if (!editIconRequest) return;
    if (selectedTool !== "icon") {
      setSelectedTool("icon");
    }
  }, [editIconRequest, selectedTool, setSelectedTool]);

  return (
    <div className="map-edit-panel">
      <div className="map-edit-tools">
        <button
          type="button"
          className={`map-edit-tool-button ${selectedTool === "overview" ? "is-active" : ""}`}
          title="Overview"
          onClick={() => setSelectedTool("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          className={`map-edit-tool-button ${selectedTool === "icon" ? "is-active" : ""}`}
          title="Icon tool"
          onClick={() => setSelectedTool("icon")}
        >
          Icon
        </button>
        <button
          type="button"
          className={`map-edit-tool-button ${selectedTool === "polygon" ? "is-active" : ""}`}
          title="Polygon tool"
          onClick={() => setSelectedTool("polygon")}
        >
          Polygon
        </button>
      </div>
      {selectedTool === "overview" && (
        <div className="map-edit-body scroll-div">
          {editSession.editDoc.groups.length === 0 && editSession.editDoc.removedFeatureIds.length === 0 && (
            <div className="map-edit-field-label">No edits yet.</div>
          )}
          {editSession.editDoc.groups.map((group) => (
            <div key={group.id} className="map-edit-field">
              <div className="map-edit-field-label">{group.name}</div>
              {group.layers.map((layer) => (
                <div key={layer.id} className="map-edit-field">
                  <div className="map-edit-location">
                    {layer.name} ({layer.data.features.length})
                  </div>
                  {layer.data.features.map((feature) => (
                    <div key={feature.id} className="map-edit-overview-item">
                      <div className="map-edit-overview-image">
                        <img src={layer.iconPath} alt={layer.name} />
                      </div>
                      <div className="map-edit-overview-meta">
                        <div className="map-edit-overview-title">
                          {feature.properties.description ?? `Feature #${feature.properties.id}`}
                        </div>
                        <div className="map-edit-overview-badges">
                          <span
                            className={`map-edit-overview-badge ${
                              layer.addedFeatureIds.includes(String(feature.properties.id)) ? "is-added" : "is-edited"
                            }`}
                          >
                            {layer.addedFeatureIds.includes(String(feature.properties.id)) ? "Added" : "Edited"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          {editSession.editDoc.removedFeatureIds.length > 0 && (
            <div className="map-edit-field">
              <div className="map-edit-field-label">Removed Icons</div>
              {editSession.editDoc.removedFeatureIds.map((id) => (
                <div key={id} className="map-edit-overview-item">
                  <div className="map-edit-overview-meta">
                    <div className="map-edit-overview-title">Icon #{id}</div>
                    <div className="map-edit-overview-badges">
                      <span className="map-edit-overview-badge is-removed">Removed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {selectedTool === "icon" && (
        <IconEdit
          mapDoc={mapDoc}
          editDoc={editSession.editDoc}
          onUpsertIconElement={editSession.upsertIconElement}
          onUpsertGeometryElement={editSession.upsertGeometryElement}
          onRemoveIconElement={editSession.removeIconElement}
          upsertQuest={upsertQuest}
          removeQuestEntry={removeQuestEntry}
          addRemovedMapIcon={addRemovedMapIcon}
          questEdits={questEdits}
          editIconRequest={editIconRequest}
          onEditIconRequestHandled={onEditIconRequestHandled}
        />
      )}
      {selectedTool === "polygon" && (
        <PolygonEdit
          mapDoc={mapDoc}
          onUpsertPolygonElement={editSession.upsertPolygonElement}
          onRemoveGeometryElement={editSession.removeGeometryElement}
        />
      )}
    </div>
  );
};
