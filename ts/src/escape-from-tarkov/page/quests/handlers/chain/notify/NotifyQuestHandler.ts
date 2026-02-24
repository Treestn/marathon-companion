import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { SidePageQuestRequest } from "../../../../side/handlers/request/SidePageQuestRequest";
import { QuestRequest } from "../../request/QuestRequest";

export class NotifyQuestHandler extends AbstractChainHandler {

    handle(request: QuestRequest) {
        if(request.notifyOthers) { 
            if(EventConst.QUEST_UPDATE === request.event) {
                switch(request.subEvent) {
                    case DataEventConst.QUEST_ACTIVATION:
                    case DataEventConst.QUEST_TRACKING:
                    case DataEventConst.QUEST_FAILED:
                    case DataEventConst.QUEST_COMPLETED: this.notifyQuestActivation(request); break;
                }
            }
            if(EventConst.QUEST_HEADER === request.event) {
                switch(request.subEvent) {
                    case DataEventConst.QUEST_PAGE_REFRESH: this.notifyQuestRefresh(request); break;
                }
            }
        }
    }
    
    private notifyQuestActivation(request:QuestRequest) {
        request.sidePageMediator.update(new SidePageQuestRequest(null, null, null, request.event, 
            request.subEvent, request.quest))
    }

    private notifyQuestRefresh(request:QuestRequest) { 
        let sidePageRequest = new SidePageQuestRequest(null, null, null, EventConst.QUEST_FILTER, 
            DataEventConst.QUEST_SEARCH_BAR, request.quest)
        const questSearchInput = document.getElementById("quest-search-input")
        sidePageRequest.htmlElement = questSearchInput;

        request.sidePageMediator.update(sidePageRequest)
    }
}