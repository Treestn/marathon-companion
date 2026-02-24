import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { NavigationUtils } from "../../../../../utils/NavigationUtils";
import { HideoutRequest } from "../../../../hideout/handlers/request/HideoutRequest";
import { QuestRequest } from "../../../../quests/handlers/request/QuestRequest";
import { ItemsRequest } from "../../request/ItemsRequest";

export class NotifyItemHandler extends AbstractChainHandler {

    async handle(request: ItemsRequest) {
        if(request.notifyOthers && request.event === EventConst.QUEST_SEARCH) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: await this.handleQuestSearch(request); break;
            }
        }
        if(request.notifyOthers && request.event === EventConst.HIDEOUT_SEARCH) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: await this.handleHideoutSearch(request); break;
            }
        }
    }

    private async handleQuestSearch(request:ItemsRequest) {
        if(request.quest) {
            await NavigationUtils.loadQuestPage();
            request.questMediator.update(new QuestRequest(request.questMediator, EventConst.QUEST_SEARCH, 
                DataEventConst.MOUSE_CLICK, request.quest, null, null))
        }
    }

    private async handleHideoutSearch(request:ItemsRequest) {
        if(request.hideoutStation && request.hideoutLevel) {
            await NavigationUtils.loadHideoutPage();
            request.hideoutMediator.update(new HideoutRequest(request.hideoutMediator, EventConst.HIDEOUT_SEARCH, 
                DataEventConst.MOUSE_CLICK, null, null, null, request.hideoutLevel, null, request.hideoutStation));
        }
    }
}