// deck/types.ts

import { FilterElementsData } from "../../../../model/IFilterElements";
import { MapFloorElementsData } from "../../../../model/floor/IMapFloorElements";
import type { CoordinateUtils } from "../utils/coordinateUtils";
import type { IconAtlas } from "./useIconAtlas";

export type DeckDataContext = {
  filters: FilterElementsData | null;
  floors: MapFloorElementsData | null;
  coord: CoordinateUtils | null;
  atlas: IconAtlas | null;
};

export type DeckUIState = {
  hoveredId: number | null;
  selectedId: number | null;
};
