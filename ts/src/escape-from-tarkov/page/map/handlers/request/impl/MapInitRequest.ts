import { FilterElementsData } from "../../../../../../model/IFilterElements";
import { MapFloorElementsData } from "../../../../../../model/floor/IMapFloorElements";
import { QuestsObject } from "../../../../../../model/quest/IQuestsElements";
import { IMapBuilder } from "../../../builder/IMapBuilder";
import { MapBuilder } from "../../../builder/impl/MapBuilder";
import { IMapMediator } from "../../../mediator/IMapMediator";
import { IMapInitRequest } from "../IMapInitRequest";

export class MapInitRequest implements IMapInitRequest {
    
    event:string;
    subEvent:string;
    mediator: IMapMediator;
    mapId:string;
    mapBuilder: IMapBuilder;
    filters: FilterElementsData;
    storedFilters: FilterElementsData;
    floors: MapFloorElementsData;
    storedFloors: MapFloorElementsData;
    quests: QuestsObject;

    constructor(mapId:string, mediator: IMapMediator) {
        this.mediator = mediator
        this.mapId = mapId;
        this.mapBuilder = new MapBuilder();
    }
}