import { FilterElementsData } from "../../../../../model/IFilterElements";
import { MapFloorElementsData } from "../../../../../model/floor/IMapFloorElements";
import { IMapsComponent } from "../../components/IMapsComponent";
import { IChainMediator } from "../../../../types/IChainMediator";
import { MapChain } from "../../handlers/chain/MapChain";
import { MapInitChain } from "../../handlers/init/MapInitChain";
import { MapInitRequest } from "../../handlers/request/impl/MapInitRequest";
import { MapUtils } from "../../utils/MapUtils";
import { IMapMediator } from "../IMapMediator";
import { MapRequest } from "../../handlers/request/impl/MapRequest";
import { QuestPageMediator } from "../../../quests/QuestPageMediator";
import { QuestSidePageMediator } from "../../../side/QuestSidePageMediator";
import { NavigationUtils } from "../../../../utils/NavigationUtils";
import { SidePageQuestRequest } from "../../../side/handlers/request/SidePageQuestRequest";
import { EventConst } from "../../../../events/EventConst";
import { DataEventConst } from "../../../../events/DataEventConst";

export class MapMediator implements IMapMediator {

    private static filters:Map<string, FilterElementsData> = new Map();
    private static floors:Map<string, MapFloorElementsData> = new Map();
    private static chainMediator:IChainMediator;
    private componentList:IMapsComponent[] = []; 
    activeMap:string;
    private questPageMediator: QuestPageMediator;
    private sidePageMediator: QuestSidePageMediator;
    mapHtmlElement: HTMLElement;
    
    constructor(questPageMediator:QuestPageMediator, sidePageQuestMediator:QuestSidePageMediator) {
        this.questPageMediator = questPageMediator;
        this.sidePageMediator = sidePageQuestMediator
    }

    async init(mapId: string, forceInit?:boolean) {
        if(this.activeMap === mapId && !forceInit) {
            return;
        }
        const mapDiv = document.getElementById("mapDiv");
        if(mapDiv) {
            mapDiv.parentElement.remove();
        }
        this.activeMap = mapId
        this.clear();
        MapUtils.reset();
        await new MapInitChain().handle(new MapInitRequest(this.activeMap, this));
        MapMediator.chainMediator = new MapChain();
        
        if(NavigationUtils.isMapFilterEnabled()) {
            this.sidePageMediator.update(new SidePageQuestRequest(this.questPageMediator, null, null, EventConst.QUEST_UPDATE, 
            DataEventConst.QUEST_MAP_FILTER, null))
        }
    }

    update(request: MapRequest) {
        if(!request.mediator) {
            request.mediator = this;
        }
        if(!request.questMediator) {
            request.questMediator = this.questPageMediator;
        }
        if(!request.sidePageMediator) {
            request.sidePageMediator = this.sidePageMediator
        }
        MapMediator.chainMediator.handle(request)
    }

    add(component: IMapsComponent) {
        this.componentList.push(component);
    }

    addAll(components:IMapsComponent[]) {
        this.componentList.push(...components);
    }

    addMapFilter(map:string, filter: FilterElementsData) {
        MapMediator.filters.set(map, filter)
    }

    getFilter():FilterElementsData {
        return MapMediator.filters.get(this.activeMap);
    }

    getFiltersMap():Map<string, FilterElementsData> {
        return MapMediator.filters;
    }

    getFloors():MapFloorElementsData {
        return MapMediator.floors.get(this.activeMap);
    }

    addMapFloors(map:string, floors: MapFloorElementsData) {
        MapMediator.floors.set(map, floors)
    }

    getComponentList():IMapsComponent[] {
        return this.componentList;
    }

    remove(component: IMapsComponent) {
        let list = this.componentList.filter(comp => comp.targetType !== component.targetType);
        this.componentList = list;
    }

    clear() {
        this.componentList = [];
    }
}