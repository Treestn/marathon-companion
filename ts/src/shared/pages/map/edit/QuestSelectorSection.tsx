import React, { useEffect, useRef, useState } from "react";

export type QuestOption = {
  id: string;
  name: string;
  traderName?: string;
};

type QuestSelectorProps = {
  questOptions: QuestOption[];
  selectedQuestId: string | null;
  isDisabled?: boolean;
  onSelectQuest: (questId: string) => void;
};

export const QuestSelector: React.FC<QuestSelectorProps> = ({
  questOptions,
  selectedQuestId,
  isDisabled = false,
  onSelectQuest,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedQuest = questOptions.find((q) => q.id === selectedQuestId) ?? null;

  // Sync the input display when selection changes externally
  useEffect(() => {
    if (selectedQuest) {
      setInputValue(selectedQuest.name);
    } else {
      setInputValue("");
    }
  }, [selectedQuest]);

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
    ? questOptions.filter((q) => {
        if (!query || query === selectedQuest?.name.toLowerCase()) return true;
        return q.name.toLowerCase().includes(query);
      })
    : [];

  // Group by trader name for nicer display
  const grouped = filteredOptions.reduce<Record<string, QuestOption[]>>((acc, q) => {
    const key = q.traderName ?? "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {});

  return (
    <div className="map-edit-field">
      <div className="map-edit-field-label">Quest *</div>
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
            placeholder="Search quests..."
            className="map-edit-item-selector-input"
          />
        </div>
        {!isDisabled && isOpen && filteredOptions.length > 0 && (
          <div className="map-edit-item-selector-dropdown scroll-div">
            {Object.entries(grouped).map(([traderName, quests]) => (
              <div key={traderName}>
                <div className="map-edit-item-selector-group">{traderName}</div>
                {quests.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    className={`map-edit-item-selector-option ${
                      selectedQuestId === q.id ? "selected" : ""
                    }`}
                    onClick={() => {
                      onSelectQuest(q.id);
                      setInputValue(q.name);
                      setIsOpen(false);
                    }}
                  >
                    <span className="map-edit-item-selector-option-name">{q.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
        {!isDisabled && isOpen && inputValue && filteredOptions.length === 0 && (
          <div className="map-edit-item-selector-dropdown scroll-div">
            <div className="map-edit-item-selector-no-results">
              No quests found matching &quot;{inputValue}&quot;
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
