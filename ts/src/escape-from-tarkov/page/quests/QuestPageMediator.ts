import { ItemsPageMediator } from "../items/ItemsPageMediator";
import { MapPageMediator } from "../map/MapPageMediator";
import { AbstractPageMediator } from "../mediator/impl/AbstractPageMediator";
import { QuestSidePageMediator } from "../side/QuestSidePageMediator";
import { QuestRequest } from "./handlers/request/QuestRequest";
import { QuestMediator } from "./mediator/QuestMediator";

export class QuestPageMediator extends AbstractPageMediator {

    savedPage: HTMLElement;

    private mediator:QuestMediator;
    mapPageMediator:MapPageMediator;
    sidePageQuestMediator:QuestSidePageMediator;
    itemsPageMediator:ItemsPageMediator;

    async load() {

        super.removePreviousRunner();

        if(!this.savedPage) {
            if(!this.mediator) {
                this.mediator = new QuestMediator(this, this.sidePageQuestMediator, this.mapPageMediator, this.itemsPageMediator);
            }
            await this.mediator.init();
        } else {
            await super.loadSavePage("Could not load Quest Page");
        }
    }

    async update(request: QuestRequest) {
        if(!this.isPageLoaded()) {
            await this.load();
        }
        request.notifyOthers = false;
        this.mediator.update(request)
    }

    private isPageLoaded():boolean {
        const runner = document.getElementById("questsDiv")
        if(runner) {
            return true;
        }
        return false;
    }
}