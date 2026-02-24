import { IChainMediator } from "../../../types/IChainMediator";
import { IMediator } from "../../../types/IMediator";
import { ItemsPageMediator } from "../../items/ItemsPageMediator";
import { QuestPageMediator } from "../../quests/QuestPageMediator";
import { HideoutPageMediator } from "../HideoutPageMediator";
import { HideoutComponent } from "../component/HideoutComponent";
import { HideoutChain } from "../handlers/chain/HideoutChain";
import { HideoutInitChain } from "../handlers/init/HideoutInitChain";
import { HideoutInitRequest } from "../handlers/request/HideoutInitRequest";
import { HideoutRequest } from "../handlers/request/HideoutRequest";

export class HideoutMediator implements IMediator {

    private static chainMediator:IChainMediator;
    private componentList:HideoutComponent[] = [];
    private hideoutPageMediator:HideoutPageMediator;
    private itemsPageMediator:ItemsPageMediator;
    private questPageMediator:QuestPageMediator;
    
    constructor(hideoutPageMediator:HideoutPageMediator, 
            itemsPageMediator:ItemsPageMediator, questPageMediator:QuestPageMediator) {
        this.hideoutPageMediator = hideoutPageMediator;
        this.itemsPageMediator = itemsPageMediator;
        this.questPageMediator = questPageMediator
    }

    async init() {
        // const mapDiv = document.getElementById("mapDiv");
        // if(mapDiv) {
        //     mapDiv.parentElement.remove();
        // }
        this.clear();
        HideoutMediator.chainMediator = new HideoutChain()
        await new HideoutInitChain().handle(new HideoutInitRequest(this));
    }

    update(request: HideoutRequest) {
        if(!request.pageMediator) {
            request.pageMediator = this.hideoutPageMediator;
        }
        if(!request.questMediator) {
            request.questMediator = this.questPageMediator;
        }
        if(!request.itemsMediator) {
            request.itemsMediator = this.itemsPageMediator;
        }
        HideoutMediator.chainMediator.handle(request);
    }

    add(component:HideoutComponent) {
        this.componentList.push(component)
    }
     
    clear() {
        this.componentList = [];
    }

    getComponentList():HideoutComponent[] {
        return this.componentList;
    }
}