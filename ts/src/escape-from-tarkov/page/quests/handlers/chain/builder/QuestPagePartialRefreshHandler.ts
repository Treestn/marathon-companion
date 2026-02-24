import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { PlayerProgressionUtils } from "../../../../../utils/PlayerProgressionUtils";
import { QuestBodyUtils } from "../../../utils/QuestBodyUtils";
import { QuestRequest } from "../../request/QuestRequest";

export class QuestPagePartialRefreshHandler extends AbstractChainHandler {

    handle(request: QuestRequest) {
        if(EventConst.QUEST_UPDATE === request.event) {
            switch(request.subEvent) {
                case DataEventConst.ITEM_STATE_CHANGED: this.handleItemStateChange(request); break;
            }
        }
        if (EventConst.QUEST_BODY === request.event) {
            switch(request.subEvent) {
                case DataEventConst.QUEST_OBJECTIVE_UPDATE: this.handleQuestObjectiveUpdate(request); break;
            }
        }
    }

    private handleItemStateChange(request:QuestRequest) {
        if(!request.itemId) {
            console.log(`Cannot refresh item for quest page because itemId is null`);
        }
        QuestBodyUtils.refreshAllItemState()
    }

    private handleQuestObjectiveUpdate(request:QuestRequest) {
        for(const obj of request.quest.objectives) {
            const objState = PlayerProgressionUtils.getObjectiveState(request.quest.id, obj.id)
            if(objState && obj.item && obj.item.id) {
                QuestBodyUtils.refreshItemState(obj.item.id, request.quest);
            }
        }  
    }
}