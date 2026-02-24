import React from "react";

import { ItemV2 } from "../../../../model/items/IItemsElements";

type ItemSelectorProps = {
  filteredItems: ItemV2[];
  isItemDropdownOpen: boolean;
  isDisabled?: boolean;
  itemDropdownRef: React.RefObject<HTMLDivElement>;
  itemInputValue: string;
  setIsItemDropdownOpen: (isOpen: boolean) => void;
  setItemInputValue: (value: string) => void;
  setItemQuery: (value: string) => void;
  setSelectedItemIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export const ItemSelector: React.FC<ItemSelectorProps> = ({
  filteredItems,
  isItemDropdownOpen,
  isDisabled = false,
  itemDropdownRef,
  itemInputValue,
  setIsItemDropdownOpen,
  setItemInputValue,
  setItemQuery,
  setSelectedItemIds,
}) => (
  <div className="map-edit-item-selector" ref={itemDropdownRef}>
    <div className="map-edit-item-selector-input-wrapper">
      <input
        type="text"
        value={itemInputValue}
        disabled={isDisabled}
        onChange={(event) => {
          if (isDisabled) return;
          setItemInputValue(event.target.value);
          setItemQuery(event.target.value);
          setIsItemDropdownOpen(true);
        }}
        onFocus={() => {
          if (isDisabled) return;
          setIsItemDropdownOpen(true);
          setItemQuery("");
        }}
        onKeyDown={(event) => {
          if (isDisabled) return;
          if (event.key === "Escape") {
            setIsItemDropdownOpen(false);
          }
        }}
        placeholder="Search items..."
        className="map-edit-item-selector-input"
      />
    </div>
    {!isDisabled && isItemDropdownOpen && filteredItems.length > 0 && (
      <div className="map-edit-item-selector-dropdown scroll-div">
        {filteredItems.slice(0, 10).map((item) => (
          <button
            key={item.id}
            type="button"
            className="map-edit-item-selector-option"
            onClick={() => {
              setSelectedItemIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
              setItemInputValue("");
              setItemQuery("");
              setIsItemDropdownOpen(true);
            }}
          >
            {item.imageLink && (
              <img
                src={item.imageLink}
                alt={item.name}
                className="map-edit-item-selector-option-image"
                onError={(event) => {
                  (event.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="map-edit-item-selector-option-name">{item.name}</span>
          </button>
        ))}
        {filteredItems.length > 10 && (
          <div className="map-edit-item-selector-more">
            Showing first 10 of {filteredItems.length} results
          </div>
        )}
      </div>
    )}
    {!isDisabled && isItemDropdownOpen && itemInputValue && filteredItems.length === 0 && (
      <div className="map-edit-item-selector-dropdown scroll-div">
        <div className="map-edit-item-selector-no-results">
          No items found matching "{itemInputValue}"
        </div>
      </div>
    )}
  </div>
);
