import { useEffect, useMemo, useState } from "react";
import {
  QuestState,
  QuestStateList,
  QuestTypeList,
} from "../../../../escape-from-tarkov/constant/QuestConst";
import { TraderList } from "../../../../escape-from-tarkov/constant/TraderConst";
import { MapsList } from "../../../../escape-from-tarkov/constant/MapsConst";

type QuestFilterOption = { value: string; label: string };

export type QuestFilterState = {
  stateValue: string[];
  typeValue: string[];
  traderValue: string[];
  mapValue: string[];
  setStateValue: (next: string[]) => void;
  setTypeValue: (next: string[]) => void;
  setTraderValue: (next: string[]) => void;
  setMapValue: (next: string[]) => void;
};

export type QuestFilterDefaults = {
  defaultStateValues: string[];
  defaultTypeValues: string[];
  defaultTraderValues: string[];
  defaultMapValues: string[];
};

export type QuestFilterOptions = {
  stateOptions: QuestFilterOption[];
  typeOptions: QuestFilterOption[];
  traderOptions: QuestFilterOption[];
  mapOptions: QuestFilterOption[];
};

export const useQuestFilters = (): QuestFilterState &
  QuestFilterDefaults &
  QuestFilterOptions => {
  const stateOptions = useMemo(
    () => QuestStateList.map((state) => ({ value: state, label: state })),
    [],
  );
  const typeOptions = useMemo(
    () => QuestTypeList.map((type) => ({ value: type, label: type })),
    [],
  );
  const traderOptions = useMemo(
    () =>
      TraderList.map((trader) => ({
        value: trader.id,
        label: trader.name,
      })),
    [],
  );
  const mapOptions = useMemo(
    () =>
      MapsList.map((map) => ({
        value: map.id,
        label: map.name,
      })),
    [],
  );

  const defaultStateValues = useMemo(
    () =>
      QuestStateList.filter(
        (state) => state !== QuestState.COMPLETED && state !== QuestState.NO_TRACKING,
      ),
    [],
  );
  const defaultTypeValues = useMemo(() => QuestTypeList.slice(), []);
  const defaultTraderValues = useMemo(() => TraderList.map((trader) => trader.id), []);
  const defaultMapValues = useMemo(() => MapsList.map((map) => map.id), []);

  const [stateValue, setStateValue] = useState<string[]>(defaultStateValues);
  const [typeValue, setTypeValue] = useState<string[]>(defaultTypeValues);
  const [traderValue, setTraderValue] = useState<string[]>(defaultTraderValues);
  const [mapValue, setMapValue] = useState<string[]>(defaultMapValues);

  useEffect(() => {
    setStateValue(defaultStateValues);
    setTypeValue(defaultTypeValues);
    setTraderValue(defaultTraderValues);
    setMapValue(defaultMapValues);
  }, [defaultStateValues, defaultTypeValues, defaultTraderValues, defaultMapValues]);

  return {
    stateOptions,
    typeOptions,
    traderOptions,
    mapOptions,
    defaultStateValues,
    defaultTypeValues,
    defaultTraderValues,
    defaultMapValues,
    stateValue,
    typeValue,
    traderValue,
    mapValue,
    setStateValue,
    setTypeValue,
    setTraderValue,
    setMapValue,
  };
};
