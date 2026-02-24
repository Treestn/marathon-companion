import { Quest } from "../../../../../model/quest/IQuestsElements";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { QuestComponent } from "../../components/QuestComponent";
import { EditSession } from "../../edit/EditSession";
import { QuestPageUtils } from "../../utils/QuestPageUtils";
import { QuestsFiltersUtils } from "../../utils/QuestsFiltersUtils";
import { IQuestBuilder } from "../IQuestBuilder";
import { QuestBodyBuilder } from "../helper/QuestBodyBuilder";
import { QuestHeaderBuilder } from "../helper/QuestHeaderBuilder";
import { QuestPageBuilder } from "../helper/QuestPageBuilder";
import { QuestFilterBuilder } from "../helper/QuestsFilterBuilder";

export class QuestBuilder implements IQuestBuilder {

    questComponentList:QuestComponent[] = [];

    addQuest(component:QuestComponent) {
        this.questComponentList.push(component);
    }

    build() {
        QuestPageBuilder.createQuestRunner();
        const runner = document.getElementById("quests-runner");
        if(runner) {
            QuestFilterBuilder.createQuestsFilteringElementsDiv(runner);
            QuestsFiltersUtils.updateQuestCounter();
        }

        const wrapper = document.getElementById("quests-entity-parent")
        const questToDisplay:Quest[] = []

        QuestPageUtils.addEditQuestHeaders();

        for(const component of this.questComponentList) {
            if(QuestsFiltersUtils.isQuestAllowed(component.quest)) {
                questToDisplay.push(component.quest);
            }
        }

        const orderedQuests = QuestsFiltersUtils.orderQuests(questToDisplay);
        for(const quest of orderedQuests) {
            QuestBodyBuilder.addQuestEntity(wrapper, quest);
        }
    }
}