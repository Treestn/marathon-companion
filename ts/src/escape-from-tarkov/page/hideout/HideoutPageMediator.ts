import { ItemsPageMediator } from "../items/ItemsPageMediator";
import { AbstractPageMediator } from "../mediator/impl/AbstractPageMediator";
import { QuestPageMediator } from "../quests/QuestPageMediator";
import { HideoutRequest } from "./handlers/request/HideoutRequest";
import { HideoutMediator } from "./mediator/HideoutMediator";

export class HideoutPageMediator extends AbstractPageMediator {

    savedPage: HTMLElement;

    private mediator:HideoutMediator;
    itemsPageMediator:ItemsPageMediator;
    questPageMediator:QuestPageMediator;

    async load() {

        super.removePreviousRunner();

        if(!this.savedPage) {
            if(!this.mediator) {
                this.mediator = new HideoutMediator(this, this.itemsPageMediator, this.questPageMediator);
            }
            await this.mediator.init();
        } else {
            await super.loadSavePage("Could not load Quest Page");
        }
    }

    async update(request: HideoutRequest) {
        if(!this.isPageLoaded()) {
            await this.load();
        }
        request.notifyOthers = false;
        this.mediator.update(request)
    }

    private isPageLoaded():boolean {
        const runner = document.getElementById("hideoutDiv")
        if(runner) {
            return true;
        }
        return false;
    }
}