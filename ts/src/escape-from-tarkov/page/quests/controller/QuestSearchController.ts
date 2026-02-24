import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { Quest } from "../../../../model/quest/IQuestsElements";
import { QuestRequest } from "../handlers/request/QuestRequest";
import { QuestMediator } from "../mediator/QuestMediator";

export class QuestSearchController {

    private static mediator:QuestMediator;

    static setMediator(mediator:QuestMediator) {
        this.mediator = mediator;
    }

    static addQuestEventListener(questTitleB:HTMLElement, quest:Quest) {
        questTitleB.addEventListener('click', e => {
            this.mediator.update(new QuestRequest(this.mediator, EventConst.QUEST_SEARCH, 
                DataEventConst.MOUSE_CLICK, quest, e, questTitleB))
        })
    }


}