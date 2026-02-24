import { HideoutPageMediator } from "../hideout/HideoutPageMediator";
import { ItemsPageMediator } from "../items/ItemsPageMediator";
import { MapPageMediator } from "../map/MapPageMediator";
import { AbstractPageMediator } from "../mediator/impl/AbstractPageMediator";
import { QuestPageMediator } from "../quests/QuestPageMediator";
import { SidePageQuestRequest } from "./handlers/request/SidePageQuestRequest";
import { SidePageQuestMediator } from "./mediator/SidePageQuestMediator";

export class QuestSidePageMediator extends AbstractPageMediator {
    
    private mediator:SidePageQuestMediator;
    mapPageMediator:MapPageMediator;
    questPageMediator:QuestPageMediator;
    hideoutPageMediator:HideoutPageMediator;
    itemsPageMediator:ItemsPageMediator;

    async load() {

        if(!this.savedPage) {
            if(!this.mediator) {
                this.mediator = new SidePageQuestMediator(this.mapPageMediator, this.questPageMediator, this.hideoutPageMediator, this.itemsPageMediator);
            }
            await this.mediator.init();
            
        } else {
            await super.loadSavePage("Could not load Quests side page");
        }
    }

    async update(request:SidePageQuestRequest) {
        if(!request.notifyOthers) {
            request.notifyOthers = false;
        }
        this.mediator.update(request);
    }
}