import { Quest } from "../../../../../../model/quest/IQuestsElements";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { SidePageQuestComponent } from "../../../components/SidePageQuestComponent";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class BuildSidePageQuestsComponents extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        request.quests.tasks.forEach(quest => {
            const component = this.createQuestComponent(quest);
            request.builder.addQuest(component);
            request.mediator.add(component);
        })
        request.builder.addMapPageMediator(request.mapMediator)
    }

    private createQuestComponent(quest:Quest):SidePageQuestComponent {
        return new SidePageQuestComponent(quest);
    }
}