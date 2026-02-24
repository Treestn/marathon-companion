import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { NavigationUtils } from "../../../../../utils/NavigationUtils";
import { HideoutRequest } from "../../../../hideout/handlers/request/HideoutRequest";
import { ItemsRequest } from "../../../../items/handlers/request/ItemsRequest";
import { QuestRequest } from "../../../../quests/handlers/request/QuestRequest";

export class HideoutNotifyHandler extends AbstractChainHandler {

    async handle(request: HideoutRequest) {
        if(request.notifyOthers && request.event === EventConst.QUEST_SEARCH) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: await this.handleQuestSearch(request); break;
            }
        }
        if(request.notifyOthers && request.event === EventConst.ITEM_SEARCH) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: await this.handleItemSearch(request); break;
            }
        }
    }

    private async handleQuestSearch(request:HideoutRequest) {
        if(request.quest) {
            await NavigationUtils.loadQuestPage();
            request.questMediator.update(new QuestRequest(request.questMediator, EventConst.QUEST_SEARCH, 
                DataEventConst.MOUSE_CLICK, request.quest, null, null))
        }
    }

    private async handleItemSearch(request:HideoutRequest) {
        if(request.itemId) {
            await NavigationUtils.loadItemsNeededPage();
            request.itemsMediator.update(new ItemsRequest(request.itemsMediator, EventConst.ITEM_SEARCH, 
                DataEventConst.MOUSE_CLICK, request.itemId, null, null));
        }
    }
}