import React, { useEffect, useRef, useState } from "react";

export type ObjectiveOption = {
  id: string;
  description: string;
};

type ObjectiveSelectorProps = {
  objectiveOptions: ObjectiveOption[];
  selectedObjectiveId: string | null;
  isDisabled?: boolean;
  onSelectObjective: (objectiveId: string) => void;
};

export const ObjectiveSelector: React.FC<ObjectiveSelectorProps> = ({
  objectiveOptions,
  selectedObjectiveId,
  isDisabled = false,
  onSelectObjective,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedObjective = objectiveOptions.find((o) => o.id === selectedObjectiveId) ?? null;

  // Sync the input display when selection changes externally
  useEffect(() => {
    if (selectedObjective) {
      setInputValue(selectedObjective.description);
    } else {
      setInputValue("");
    }
  }, [selectedObjective]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = inputValue.toLowerCase();
  const filteredOptions = isOpen
    ? objectiveOptions.filter((o) => {
        if (!query || query === selectedObjective?.description.toLowerCase()) return true;
        return o.description.toLowerCase().includes(query);
      })
    : [];

  return (
    <div className="map-edit-field">
      <div className="map-edit-field-label">Objective *</div>
      <div className="map-edit-item-selector" ref={dropdownRef}>
        <div className="map-edit-item-selector-input-wrapper">
          <input
            type="text"
            value={inputValue}
            disabled={isDisabled}
            onChange={(event) => {
              setInputValue(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (!isDisabled) setIsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsOpen(false);
            }}
            placeholder="Search objectives..."
            className="map-edit-item-selector-input"
          />
        </div>
        {!isDisabled && isOpen && filteredOptions.length > 0 && (
          <div className="map-edit-item-selector-dropdown scroll-div">
            {filteredOptions.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`map-edit-item-selector-option ${
                  selectedObjectiveId === o.id ? "selected" : ""
                }`}
                onClick={() => {
                  onSelectObjective(o.id);
                  setInputValue(o.description);
                  setIsOpen(false);
                }}
              >
                <span className="map-edit-item-selector-option-name">{o.description}</span>
              </button>
            ))}
          </div>
        )}
        {!isDisabled && isOpen && inputValue && filteredOptions.length === 0 && (
          <div className="map-edit-item-selector-dropdown scroll-div">
            <div className="map-edit-item-selector-no-results">
              No objectives found matching &quot;{inputValue}&quot;
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
