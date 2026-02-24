import { HideoutPageMediator } from "../hideout/HideoutPageMediator";
import { AbstractPageMediator } from "../mediator/impl/AbstractPageMediator";
import { QuestPageMediator } from "../quests/QuestPageMediator";
import { ItemsRequest } from "./handlers/request/ItemsRequest";
import { ItemsMediator } from "./mediator/ItemsMediator";
import { ItemFilterUtils } from "./utils/ItemFilterUtils";
import { ItemsBodyUtils } from "./utils/ItemsBodyUtils";
import { ItemsHeaderUtils } from "./utils/ItemsHeaderUtils";

export class ItemsPageMediator extends AbstractPageMediator {

    savedPage: HTMLElement;

    private mediator:ItemsMediator;
    
    questPageMediator:QuestPageMediator;
    hideoutPageMediator:HideoutPageMediator;

    async load() {

        super.removePreviousRunner();

        if(!this.savedPage) {
            if(!this.mediator) {
                this.mediator = new ItemsMediator(this, this.questPageMediator, this.hideoutPageMediator);
            }
            await this.mediator.init();
        } else {
            await super.loadSavePage("Could not load Quest Page");
            ItemsHeaderUtils.resolveAllHeaderState();
            ItemsBodyUtils.refreshAllBodies();
        }
        ItemFilterUtils.grabSearchBarFocus();
    }

    async update(request: ItemsRequest) {
        if(!this.isPageLoaded()) {
            await this.load();
        }
        request.notifyOthers = false;
        this.mediator.update(request)
    }

    private isPageLoaded():boolean {
        const runner = document.getElementById("itemsDiv")
        if(runner) {
            return true;
        }
        return false;
    }
}