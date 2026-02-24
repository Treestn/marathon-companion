import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { NavigationUtils } from "../../../../../../utils/NavigationUtils";
import { QuestRequest } from "../../../../../quests/handlers/request/QuestRequest";
import { SidePageQuestRequest } from "../../../../../side/handlers/request/SidePageQuestRequest";
import { QuestIconComponent } from "../../../../components/impl/QuestIconComponent";
import { MapRequest } from "../../../request/impl/MapRequest";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";

export class NotifyMapHandler extends AbstractMapChainHandler {
    async handle(request: MapRequest) {
        if(request.notifyOthers) {
            if(EventConst.QUEST_SEARCH === request.event) {
                switch(request.subEvent) {
                    case DataEventConst.MOUSE_CLICK: await this.handleQuestSearch(request); break;
                }
            }
            if(EventConst.MAP_SELECTOR_EVENT === request.event) {
                switch(request.subEvent) {
                    case DataEventConst.MOUSE_CLICK: await this.refreshSidePage(request); break;
                }
            }
        }
    }

    private async handleQuestSearch(request:MapRequest) {
        if(request.component instanceof QuestIconComponent) {
            await NavigationUtils.loadQuestPage();
            request.questMediator.update(new QuestRequest(request.questMediator, EventConst.QUEST_SEARCH, 
                DataEventConst.MOUSE_CLICK, request.component.quest, null, null))
        }
    }

    private async refreshSidePage(request:MapRequest) {
        request.sidePageMediator.update(new SidePageQuestRequest(request.questMediator, null, null, EventConst.QUEST_UPDATE, 
            DataEventConst.QUEST_MAP_FILTER, null))
    }
}