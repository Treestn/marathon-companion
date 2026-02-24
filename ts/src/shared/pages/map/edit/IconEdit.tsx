import React from "react";

import { MapGeoDocument } from "../../../../model/map/MapGeoDocument";
import { useIconEdit } from "./useIconEdit";
import { EditMapDocument, UpsertGeometryElementPayload, UpsertIconElementPayload } from "./useMapEditSession";
import { IconSelector } from "./IconSelectorSection";
import { DescriptionField } from "./DescriptionFieldSection";
import { ImageSelector } from "./ImageSelectorSection";
import { QuestSelector } from "./QuestSelectorSection";
import { ObjectiveSelector } from "./ObjectiveSelectorSection";
import type { IconDatum } from "../deck/builder/icon.builder";
import type { QuestEditEntry } from "../../../context/QuestSubmissionContext";
import type { Quest } from "../../../../model/quest/IQuestsElements";

const CORRELATION_ITEM_HOVER_EVENT = "map-correlation-item:hover";

type IconEditProps = {
  mapDoc: MapGeoDocument | null;
  editDoc: EditMapDocument;
  onUpsertIconElement: (payload: UpsertIconElementPayload) => string;
  onUpsertGeometryElement: (payload: UpsertGeometryElementPayload) => string;
  onRemoveIconElement: (params: { editFeatureId?: string; originalEntityId: string }) => void;
  upsertQuest?: (quest: Quest) => void;
  removeQuestEntry?: (questId: string) => void;
  questEdits?: QuestEditEntry[];
  editIconRequest?: IconDatum | null;
  onEditIconRequestHandled?: () => void;
};

export const IconEdit: React.FC<IconEditProps> = ({
  mapDoc,
  editDoc,
  onUpsertIconElement,
  onUpsertGeometryElement,
  onRemoveIconElement,
  upsertQuest,
  removeQuestEntry,
  questEdits,
  editIconRequest,
  onEditIconRequestHandled,
}) => {
  const isIconSelectionEnabled = true;
  const isDisabled = false;
  const isDescriptionEnabled = true;
  const isImageSelectionEnabled = true;
  const isMoveEnabled = true;
  const {
    groupedIconOptions,
    iconDescription,
    iconDropdownRef,
    iconInputValue,
    isIconDropdownOpen,
    selectedIcon,
    selectedImages,
    imageSelectionError,
    isPlacing,
    hoverLocation,
    placedLocation,
    draftFeature,
    currentFeatureId,
    updateDescription,
    setIconInputValue,
    setIconQuery,
    setIsIconDropdownOpen,
    setSelectedIconId,
    removeImagePath,
    moveImagePath,
    selectImage,
    togglePlacement,
    submitIconElement,
    resetCurrentEdit,
    deleteCurrentIcon,
    // Quest-specific
    isQuestIcon,
    questOptions,
    objectiveOptions,
    selectedQuestId,
    selectedObjectiveId,
    handleSelectQuest,
    handleSelectObjective,
    correlationList,
    correlationItems,
    isCorrelationPicking,
    updateCorrelationTrigger,
    updateCorrelationLineColor,
    updateCorrelationLineWidth,
    beginCorrelationPick,
    removeCorrelation,
  } = useIconEdit({
    mapDoc,
    editDoc,
    onUpsertIconElement,
    onUpsertGeometryElement,
    onRemoveIconElement,
    upsertQuest,
    removeQuestEntry,
    questEdits,
    editIconRequest,
    onEditIconRequestHandled,
  });

  const locationForDisplay =
    isPlacing && hoverLocation ? hoverLocation : placedLocation ?? hoverLocation;
  const locationText = locationForDisplay
    ? `${Math.round(locationForDisplay.x)}, ${Math.round(locationForDisplay.y)}`
    : "0, 0";
  const showEditDetails = Boolean(selectedIcon) && (Boolean(placedLocation) || isPlacing);
  let placeButtonText = "Place on map";
  if (isPlacing) {
    placeButtonText = "Cancel";
  } else if (placedLocation) {
    placeButtonText = "Move Icon";
  }

  // For quest icons: quest, objective, description, and at least one image are mandatory
  const isQuestFieldsMissing =
    isQuestIcon && (!selectedQuestId || !selectedObjectiveId || !iconDescription.trim() || selectedImages.length === 0);
  const isSubmitDisabled =
    isDisabled || !selectedIcon || !placedLocation || Boolean(isQuestFieldsMissing);

  return (
    <>
      <div className="map-edit-field">
        <div className="map-edit-field-label">Icon</div>
        <IconSelector
          groupedIconOptions={groupedIconOptions}
          iconDropdownRef={iconDropdownRef}
          iconInputValue={iconInputValue}
          isIconDropdownOpen={isIconDropdownOpen}
          isDisabled={!isIconSelectionEnabled}
          selectedIcon={selectedIcon}
          setIconInputValue={setIconInputValue}
          setIconQuery={setIconQuery}
          setIsIconDropdownOpen={setIsIconDropdownOpen}
          setSelectedIconId={setSelectedIconId}
        />
      </div>
      {selectedIcon && draftFeature && !placedLocation && !isPlacing && (
        <div className="map-edit-location map-edit-location-callout">Place on map</div>
      )}
      {showEditDetails && (
        <>
          <div className="map-edit-location">Location: {locationText}</div>
          <button
            type="button"
            className="map-edit-secondary-button"
            onClick={togglePlacement}
            disabled={!isMoveEnabled}
          >
            {placeButtonText}
          </button>
        </>
      )}
      {showEditDetails && (
        <div className="map-edit-body scroll-div">
          {isQuestIcon && (
            <>
              <QuestSelector
                questOptions={questOptions}
                selectedQuestId={selectedQuestId}
                onSelectQuest={handleSelectQuest}
              />
              {selectedQuestId && (
                <ObjectiveSelector
                  objectiveOptions={objectiveOptions}
                  selectedObjectiveId={selectedObjectiveId}
                  onSelectObjective={handleSelectObjective}
                />
              )}
            </>
          )}
          <DescriptionField
            value={iconDescription}
            onChange={updateDescription}
            isDisabled={!isDescriptionEnabled}
          />
          {isQuestIcon && !iconDescription.trim() && (
            <div className="map-edit-field-hint">Description is required for quest icons.</div>
          )}
          <div className="map-edit-field">
            <ImageSelector
              selectedImages={selectedImages}
              imageSelectionError={imageSelectionError}
              isDisabled={!isImageSelectionEnabled}
              onSelectImage={selectImage}
              onRemoveImage={removeImagePath}
              onMoveImageUp={(path) => moveImagePath(path, "up")}
              onMoveImageDown={(path) => moveImagePath(path, "down")}
            />
            {isQuestIcon && selectedImages.length === 0 && (
              <div className="map-edit-field-hint">At least one image is required for quest icons.</div>
            )}
          </div>
          <div className="map-edit-field">
            <div className="map-edit-field-label">Correlation</div>
            {correlationItems.length > 0 && (
              <div className="map-edit-correlation-list">
                {correlationItems.map((item) => (
                  <div
                    key={item.correlationId}
                    className="map-edit-correlation-item"
                    onMouseEnter={() => {
                      if (typeof globalThis.dispatchEvent !== "function") return;
                      globalThis.dispatchEvent(
                        new CustomEvent(CORRELATION_ITEM_HOVER_EVENT, {
                          detail: { featureId: item.targetFeatureId },
                        }),
                      );
                    }}
                    onMouseLeave={() => {
                      if (typeof globalThis.dispatchEvent !== "function") return;
                      globalThis.dispatchEvent(
                        new CustomEvent(CORRELATION_ITEM_HOVER_EVENT, {
                          detail: { featureId: null },
                        }),
                      );
                    }}
                  >
                    <div className="map-edit-correlation-main">
                      <div className="map-edit-correlation-type">{item.targetLabel}</div>
                      <div className="map-edit-correlation-kind">
                        {item.targetKind === "polygon" ? "Polygon" : "Icon"}
                      </div>
                    </div>
                    <div className="map-edit-correlation-controls">
                      <select
                        className="map-edit-correlation-trigger"
                        value={item.trigger}
                        onChange={(e) =>
                          updateCorrelationTrigger(
                            item.correlationId,
                            e.target.value as "hover" | "click" | "always",
                          )
                        }
                      >
                        <option value="hover">Hover</option>
                        <option value="click">Click</option>
                        <option value="always">Always</option>
                      </select>
                      <input
                        type="color"
                        className="map-edit-correlation-color"
                        value={item.lineColorHex}
                        onChange={(e) =>
                          updateCorrelationLineColor(item.correlationId, e.target.value)
                        }
                        aria-label={`Line color for ${item.targetLabel}`}
                      />
                      <input
                        type="number"
                        className="map-edit-correlation-width"
                        min={1}
                        max={16}
                        step={0.5}
                        value={item.lineWidth}
                        onChange={(e) =>
                          updateCorrelationLineWidth(item.correlationId, Number(e.target.value))
                        }
                        aria-label={`Line width for ${item.targetLabel}`}
                      />
                    </div>
                    <button
                      type="button"
                      className="map-edit-correlation-remove"
                      onClick={() => removeCorrelation(item.correlationId)}
                      aria-label={`Remove correlation ${item.targetLabel}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" className="map-edit-secondary-button" onClick={beginCorrelationPick}>
              {isCorrelationPicking ? "Click target on map..." : "Add correlated element"}
            </button>
          </div>
        </div>
      )}
      {showEditDetails && (
      <div className="map-edit-footer">
        <button
            type="button"
            className="map-edit-secondary-button map-edit-cancel-button"
            onClick={resetCurrentEdit}
        >
            Cancel
        </button>
        {currentFeatureId && (
          <button
            type="button"
            className="map-edit-danger-button"
            onClick={deleteCurrentIcon}
          >
            Delete
          </button>
        )}
        <button
          type="button"
          className="map-edit-primary-button"
          disabled={isSubmitDisabled}
          onClick={submitIconElement}
        >
          {currentFeatureId ? "Save Icon Element" : "Add Icon Element"}
        </button>
      </div>
      )}
    </>
  );
};
