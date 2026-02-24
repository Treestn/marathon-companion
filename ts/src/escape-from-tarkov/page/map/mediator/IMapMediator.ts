
import { FilterElementsData } from "../../../../model/IFilterElements";
import { MapFloorElementsData } from "../../../../model/floor/IMapFloorElements";
import { IMapsComponent } from "../components/IMapsComponent";
import { MapRequest } from "../handlers/request/impl/MapRequest";

export interface IMapMediator {
    activeMap:string;

    init(mapId:string, forceInit?:boolean);
    // notify();
    update(request:MapRequest);
    add(component:IMapsComponent);
    addAll(component:IMapsComponent[]);
    addMapFilter(mapId:string, filter: FilterElementsData);
    addMapFloors(mapId:string, floors:MapFloorElementsData)
    getComponentList():IMapsComponent[];
    getFilter():FilterElementsData;
    getFiltersMap():Map<string, FilterElementsData>
    getFloors():MapFloorElementsData;
    remove(component:IMapsComponent);
    clear();
}