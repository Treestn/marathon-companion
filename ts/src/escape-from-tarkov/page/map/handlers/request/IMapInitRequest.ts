
import { IMapBuilder } from "../../builder/IMapBuilder";
import { IRequest } from "../../../../types/IRequest";
import { FilterElementsData } from "../../../../../model/IFilterElements";
import { MapFloorElementsData } from "../../../../../model/floor/IMapFloorElements";
import { QuestsObject } from "../../../../../model/quest/IQuestsElements";
import { IMapMediator } from "../../mediator/IMapMediator";

export interface IMapInitRequest extends IRequest {
    
    mediator:IMapMediator
    mapBuilder:IMapBuilder;
    mapId:string;
    filters: FilterElementsData;
    storedFilters: FilterElementsData;
    floors: MapFloorElementsData;
    storedFloors: MapFloorElementsData;
    quests: QuestsObject;
}