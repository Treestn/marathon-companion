import { QuestsObject } from "../../../../model/quest/IQuestsElements";
import { IChainMediator } from "../../../types/IChainMediator";
import { IMediator } from "../../../types/IMediator";
import { HideoutPageMediator } from "../../hideout/HideoutPageMediator";
import { ItemsPageMediator } from "../../items/ItemsPageMediator";
import { MapPageMediator } from "../../map/MapPageMediator";
import { QuestPageMediator } from "../../quests/QuestPageMediator";
import { SidePageQuestComponent } from "../components/SidePageQuestComponent";
import { SidePageQuestChain } from "../handlers/chain/SidePageQuestChain";
import { SidePageInitChain } from "../handlers/init/SidePageInitChain";
import { SidePageInitQuestRequest } from "../handlers/request/SidePageInitQuestRequest";
import { SidePageQuestRequest } from "../handlers/request/SidePageQuestRequest";

export class SidePageQuestMediator implements IMediator {

    private static chainMediator:IChainMediator;
    private componentList:SidePageQuestComponent[] = []; 
    mapHtmlElement: HTMLElement;
    private mapMediator:MapPageMediator;
    private questPageMediator:QuestPageMediator;
    private hideoutPageMediator:HideoutPageMediator;
    private itemsPageMediator:ItemsPageMediator
    
    constructor(mapPageMediator:MapPageMediator, questPageMediator:QuestPageMediator, hideoutPageMediator:HideoutPageMediator, itemsPageMediator:ItemsPageMediator) {
        this.mapMediator = mapPageMediator;
        this.questPageMediator = questPageMediator;
        this.hideoutPageMediator = hideoutPageMediator;
        this.itemsPageMediator = itemsPageMediator;
    }

    async init() {
        const mapDiv = document.getElementById("mapDiv");
        if(mapDiv) {
            mapDiv.parentElement.remove();
        }
        this.clear();
        SidePageQuestMediator.chainMediator = new SidePageQuestChain()
        await new SidePageInitChain().handle(new SidePageInitQuestRequest(this, this.questPageMediator, this.mapMediator));
    }

    update(request: SidePageQuestRequest) {
        if(!request.mediator) {
            request.mediator = this;
        }
        if(!request.mapMediator) {
            request.mapMediator = this.mapMediator;
        }
        if(!request.questMediator) {
            request.questMediator = this.questPageMediator;
        }
        if(!request.hideoutMediator) {
            request.hideoutMediator = this.hideoutPageMediator;
        }
        if(!request.itemsMediator) {
            request.itemsMediator = this.itemsPageMediator;
        }
        
        SidePageQuestMediator.chainMediator.handle(request);
    }

    add(component:SidePageQuestComponent) {
        this.componentList.push(component)
    }

    clear() {
        this.componentList = [];
    }
}