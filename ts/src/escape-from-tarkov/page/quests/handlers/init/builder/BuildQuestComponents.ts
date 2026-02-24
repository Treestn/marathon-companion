import { Quest } from "../../../../../../model/quest/IQuestsElements";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { QuestComponent } from "../../../components/QuestComponent";
import { QuestsUtils } from "../../../utils/QuestsUtils";
import { QuestInitRequest } from "../../request/QuestInitRequest";

export class BuildQuestComponents extends AbstractChainHandler {

    handle(request: QuestInitRequest) {
        QuestsUtils.getQuestsObject().tasks.forEach(quest => {
            const component = this.createQuestComponent(quest);
            request.builder.addQuest(component);
            request.mediator.add(component);
        })
    }

    private createQuestComponent(quest:Quest):QuestComponent {
        return new QuestComponent(quest);
    }
}