import { IChainMediator } from "../../../types/IChainMediator";
import { IMediator } from "../../../types/IMediator";
import { HideoutPageMediator } from "../../hideout/HideoutPageMediator";
import { QuestPageMediator } from "../../quests/QuestPageMediator";
import { ItemsPageMediator } from "../ItemsPageMediator";
import { ItemsComponent } from "../component/ItemsComponent";
import { ItemsChain } from "../handlers/chain/ItemsChain";
import { ItemsInitChain } from "../handlers/init/ItemsInitChain";
import { ItemsInitRequest } from "../handlers/request/ItemsInitRequest";
import { ItemsRequest } from "../handlers/request/ItemsRequest";

export class ItemsMediator implements IMediator {

    private static chainMediator:IChainMediator;
    private componentList:ItemsComponent[] = [];
    private itemsPageMediator:ItemsPageMediator;
    private questPageMediator:QuestPageMediator;
    private hideoutPageMediator:HideoutPageMediator;
    
    constructor(itemsPageMediator:ItemsPageMediator, questPageMediator:QuestPageMediator, 
            hideoutPageMediator:HideoutPageMediator) {
        this.itemsPageMediator = itemsPageMediator;
        this.questPageMediator = questPageMediator;
        this.hideoutPageMediator = hideoutPageMediator;
    }

    async init() {
        this.clear();
        ItemsMediator.chainMediator = new ItemsChain()
        await new ItemsInitChain().handle(new ItemsInitRequest(this));
    }

    update(request: ItemsRequest) {
        if(!request.mediator) {
            request.mediator = this
        }
        if(!request.pageMediator) {
            request.pageMediator = this.itemsPageMediator;
        }
        if(!request.questMediator) {
            request.questMediator = this.questPageMediator;
        }
        if(!request.hideoutMediator) {
            request.hideoutMediator = this.hideoutPageMediator;
        }
        ItemsMediator.chainMediator.handle(request);
    }

    add(component:ItemsComponent) {
        this.componentList.push(component)
    }
     
    getComponentList():ItemsComponent[] {
        return this.componentList;
    }

    clear() {
        this.componentList = [];
    }
}