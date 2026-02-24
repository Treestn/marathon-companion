import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { QuestRequest } from "../../request/QuestRequest";

export class QuestEditHandler extends AbstractChainHandler {

    handle(request: QuestRequest) {
        if(EventConst.QUEST_EDIT === request.event) {
            switch(request.subEvent) {
                case DataEventConst.EDIT_LEVEL: this.editLevel(request); break;
                 
            }
        }
    }

    private editLevel(request: QuestRequest) {

    }

}