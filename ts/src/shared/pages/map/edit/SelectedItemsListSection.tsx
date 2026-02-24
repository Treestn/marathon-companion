import React from "react";

import { ItemV2 } from "../../../../model/items/IItemsElements";

type SelectedItemsListProps = {
  selectedItems: ItemV2[];
  isDisabled?: boolean;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
};

export const SelectedItemsList: React.FC<SelectedItemsListProps> = ({
  selectedItems,
  isDisabled = false,
  onRemove,
  onMoveUp,
  onMoveDown,
}) => (
  <div className="map-edit-selected-items">
    {selectedItems.map((item, index) => (
      <div key={item.id} className="map-edit-selected-item">
        {item.imageLink && (
          <img
            src={item.imageLink}
            alt={item.name}
            className="map-edit-selected-item-image"
            onError={(event) => {
              (event.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <span className="map-edit-selected-item-name">{item.name}</span>
        <div className="map-edit-selected-item-controls">
          {index > 0 && (
            <button
              type="button"
              className="map-edit-selected-item-move"
              disabled={isDisabled}
              onClick={() => onMoveUp(item.id)}
              aria-label={`Move ${item.name} up`}
            >
              ▲
            </button>
          )}
          {index < selectedItems.length - 1 && (
            <button
              type="button"
              className="map-edit-selected-item-move"
              disabled={isDisabled}
              onClick={() => onMoveDown(item.id)}
              aria-label={`Move ${item.name} down`}
            >
              ▼
            </button>
          )}
          <button
            type="button"
            className="map-edit-selected-item-remove"
            disabled={isDisabled}
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.name}`}
          >
            ×
          </button>
        </div>
      </div>
    ))}
  </div>
);
