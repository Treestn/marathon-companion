import React, { startTransition, useState } from "react";
import { QuestFilterSelect } from "./QuestFilterSelect";
import "./quest-filters.css";

type QuestFilterOption = {
  value: string;
  label: string;
};

type QuestFiltersProps = {
  stateOptions?: QuestFilterOption[];
  typeOptions?: QuestFilterOption[];
  traderOptions?: QuestFilterOption[];
  mapOptions?: QuestFilterOption[];
  initialStateValues?: string[];
  initialTypeValues?: string[];
  initialTraderValues?: string[];
  initialMapValues?: string[];
  stateValue?: string[];
  typeValue?: string[];
  traderValue?: string[];
  mapValue?: string[];
  onStateChange?: (value: string[]) => void;
  onTypeChange?: (value: string[]) => void;
  onTraderChange?: (value: string[]) => void;
  onMapChange?: (value: string[]) => void;
};

export const QuestFilters: React.FC<QuestFiltersProps> = ({
  stateOptions = [],
  typeOptions = [],
  traderOptions = [],
  mapOptions = [],
  initialStateValues = [],
  initialTypeValues = [],
  initialTraderValues = [],
  initialMapValues = [],
  stateValue: controlledStateValue,
  typeValue: controlledTypeValue,
  traderValue: controlledTraderValue,
  mapValue: controlledMapValue,
  onStateChange,
  onTypeChange,
  onTraderChange,
  onMapChange,
}) => {
  const [stateValue, setStateValue] = useState<string[]>(initialStateValues);
  const [traderValue, setTraderValue] = useState<string[]>(initialTraderValues);
  const [mapValue, setMapValue] = useState<string[]>(initialMapValues);

  const resolvedStateValue = controlledStateValue ?? stateValue;
  const resolvedTraderValue = controlledTraderValue ?? traderValue;
  const resolvedMapValue = controlledMapValue ?? mapValue;

  const handleStateChange = (next: string[]) => {
    setStateValue(next);
    if (onStateChange) {
      startTransition(() => onStateChange(next));
    }
  };
  const handleTraderChange = (next: string[]) => {
    setTraderValue(next);
    if (onTraderChange) {
      startTransition(() => onTraderChange(next));
    }
  };
  const handleMapChange = (next: string[]) => {
    setMapValue(next);
    if (onMapChange) {
      startTransition(() => onMapChange(next));
    }
  };

  return (
    <div className="quest-filters">
      <QuestFilterSelect
        id="quest-filter-state"
        label="State"
        value={resolvedStateValue}
        options={stateOptions}
        onChange={handleStateChange}
        iconSrc="../../img/icons/filter_list.svg"
      />
      {/* <QuestFilterSelect
        id="quest-filter-type"
        label="Type"
        value={resolvedTypeValue}
        options={typeOptions}
        onChange={handleTypeChange}
      /> */}
      <QuestFilterSelect
        id="quest-filter-trader"
        label="Traders"
        value={resolvedTraderValue}
        options={traderOptions}
        onChange={handleTraderChange}
        iconSrc="../../img/icons/person_alert.svg"
      />
      <QuestFilterSelect
        id="quest-filter-map"
        label="Map"
        value={resolvedMapValue}
        options={mapOptions}
        onChange={handleMapChange}
        iconSrc="../../img/icons/map.svg"
      />
    </div>
  );
};
