import { map } from "lodash";
import { IChainMediator } from "../../../types/IChainMediator";
import { IMediator } from "../../../types/IMediator";
import { MapPageMediator } from "../../map/MapPageMediator";
import { QuestSidePageMediator } from "../../side/QuestSidePageMediator";
import { QuestPageMediator } from "../QuestPageMediator";
import { QuestComponent } from "../components/QuestComponent";
import { QuestChain } from "../handlers/chain/QuestChain";
import { QuestInitChain } from "../handlers/init/QuestInitChain";
import { QuestInitRequest } from "../handlers/request/QuestInitRequest";
import { QuestRequest } from "../handlers/request/QuestRequest";
import { ItemsPageMediator } from "../../items/ItemsPageMediator";

export class QuestMediator implements IMediator {

    private static chainMediator:IChainMediator;
    private componentList:QuestComponent[] = []; 
    private questPageMediator: QuestPageMediator;
    private mapPageMediator: MapPageMediator;
    private sideQuestPageMediator: QuestSidePageMediator;
    private itemsPageMediator:ItemsPageMediator;
    
    constructor(questPageMediator:QuestPageMediator, sideQuestPageMediator:QuestSidePageMediator, 
            mapPageMeditor:MapPageMediator, itemsPageMediator:ItemsPageMediator) {
        this.questPageMediator = questPageMediator;
        this.sideQuestPageMediator = sideQuestPageMediator;
        this.mapPageMediator = mapPageMeditor;
        this.itemsPageMediator = itemsPageMediator;
    }

    async init() {
        // const mapDiv = document.getElementById("mapDiv");
        // if(mapDiv) {
        //     mapDiv.parentElement.remove();
        // }
        this.clear();
        // MapUtils.reset();
        QuestMediator.chainMediator = new QuestChain()
        await new QuestInitChain().handle(new QuestInitRequest(this));
    }

    update(request: QuestRequest) {
        if(!request.pageMediator) {
            request.pageMediator = this.questPageMediator;
        }
        if(!request.mapPageMediator) {
            request.mapPageMediator = this.mapPageMediator;
        }
        if(!request.sidePageMediator) {
            request.sidePageMediator = this.sideQuestPageMediator;
        }
        if(!request.itemsPageMediator) {
            request.itemsPageMediator = this.itemsPageMediator;
        }
        QuestMediator.chainMediator.handle(request);
    }

    add(component:QuestComponent) {
        this.componentList.push(component)
    }
     
    clear() {
        this.componentList = [];
    }
}