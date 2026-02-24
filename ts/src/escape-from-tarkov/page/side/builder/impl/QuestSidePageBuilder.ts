import { Quest } from "../../../../../model/quest/IQuestsElements";
import { PlayerProgressionUtils } from "../../../../utils/PlayerProgressionUtils";
import { MapPageMediator } from "../../../map/MapPageMediator";
import { SidePageQuestComponent } from "../../components/SidePageQuestComponent";
import { SidePageQuestUtils } from "../../utils/SidePageQuestUtils";
import { IQuestSidePageBuilder } from "../IQuestSidePageBuilder";
import { SidePageQuestsBuilder } from "../helper/SidePageQuestsBuilder";

export class QuestSidePageBuilder implements IQuestSidePageBuilder {

    private mapPageMediator:MapPageMediator;
    questComponentList:SidePageQuestComponent[] = [];

    addMapPageMediator(mediator:MapPageMediator) {
        this.mapPageMediator = mediator;
    }

    addQuest(component:SidePageQuestComponent) {
        this.questComponentList.push(component);
    }

    build() {
        const activeQuests:Quest[] = []
        for(const component of this.questComponentList) {
            // // Build HTMLElements
            if(PlayerProgressionUtils.isQuestActive(component.quest.id)) {
                activeQuests.push(component.quest);
            }
        }
        SidePageQuestUtils.updateQuests(activeQuests);
    }
}