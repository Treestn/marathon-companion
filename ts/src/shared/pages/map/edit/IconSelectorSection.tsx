import React from "react";

export type IconGroup = Array<{
  groupId: string;
  name: string;
  options: Array<{
    id: string;
    label: string;
    iconPath: string;
    groupId: string;
    groupName: string;
    layerId: string;
    layerName: string;
  }>;
}>;

type IconSelectorProps = {
  groupedIconOptions: IconGroup;
  iconDropdownRef: React.RefObject<HTMLDivElement>;
  iconInputValue: string;
  isIconDropdownOpen: boolean;
  isDisabled?: boolean;
  selectedIcon: {
    id: string;
    label: string;
    iconPath: string;
    groupId: string;
    groupName: string;
    layerId: string;
    layerName: string;
  } | null;
  setIconInputValue: (value: string) => void;
  setIconQuery: (value: string) => void;
  setIsIconDropdownOpen: (isOpen: boolean) => void;
  setSelectedIconId: (id: string) => void;
};

export const IconSelector: React.FC<IconSelectorProps> = ({
  groupedIconOptions,
  iconDropdownRef,
  iconInputValue,
  isIconDropdownOpen,
  isDisabled = false,
  selectedIcon,
  setIconInputValue,
  setIconQuery,
  setIsIconDropdownOpen,
  setSelectedIconId,
}) => (
  <div className="map-edit-icon-selector">
    <div className="map-edit-item-selector" ref={iconDropdownRef}>
      <div className="map-edit-item-selector-input-wrapper">
        {selectedIcon?.iconPath && (
          <div className="map-edit-item-selector-container">
            <img
              src={selectedIcon.iconPath}
              alt={selectedIcon.label}
              className="map-edit-item-selector-image"
              onError={(event) => {
                (event.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <input
          type="text"
          value={iconInputValue}
          disabled={isDisabled}
          onChange={(event) => {
            if (isDisabled) return;
            setIconInputValue(event.target.value);
            setIconQuery(event.target.value);
            setIsIconDropdownOpen(true);
          }}
          onFocus={() => {
            if (isDisabled) return;
            setIsIconDropdownOpen(true);
            setIconQuery("");
          }}
          onKeyDown={(event) => {
            if (isDisabled) return;
            if (event.key === "Escape") {
              setIsIconDropdownOpen(false);
            }
          }}
          placeholder="Search icons..."
          className="map-edit-item-selector-input"
        />
      </div>
      {!isDisabled && isIconDropdownOpen && groupedIconOptions.length > 0 && (
        <div className="map-edit-item-selector-dropdown scroll-div">
          {groupedIconOptions.map((group) => (
            <div key={group.groupId}>
              <div className="map-edit-item-selector-group">{group.name}</div>
              {group.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`map-edit-item-selector-option ${
                    selectedIcon?.id === option.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedIconId(option.id);
                    setIconInputValue(option.label);
                    setIconQuery(option.label);
                    setIsIconDropdownOpen(false);
                  }}
                >
                  <img
                    src={option.iconPath}
                    alt={option.label}
                    className="map-edit-item-selector-option-image"
                    onError={(event) => {
                      (event.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="map-edit-item-selector-option-name">{option.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      {!isDisabled && isIconDropdownOpen && iconInputValue && groupedIconOptions.length === 0 && (
        <div className="map-edit-item-selector-dropdown scroll-div">
          <div className="map-edit-item-selector-no-results">
            No icons found matching "{iconInputValue}"
          </div>
        </div>
      )}
    </div>
  </div>
);
