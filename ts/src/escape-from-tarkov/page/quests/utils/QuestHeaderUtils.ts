import { Quest } from "../../../../model/quest/IQuestsElements";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";

export class QuestHeaderUtils {

    static refreshCompletedButtonAnimation(completedButton:HTMLElement, quest:Quest) {
        let questObjectivesCompleted = true;
        let questState = PlayerProgressionUtils.getQuestState(quest.id);
        if(questState.completed) {}
        for(const state of questState.objectivesState) {
            if(!state.completed) {
                questObjectivesCompleted = false;
            }
        }
        if(questState.completed || !questObjectivesCompleted) {
            this.removeCompletedButtonAnimation(completedButton)
        } else {
            this.addCompletedButtonAnimation(completedButton);
        }
    }

    private static removeCompletedButtonAnimation(completedButton:HTMLElement) {
        completedButton.classList.remove("completed-button-animation");
    }

    private static addCompletedButtonAnimation(completedButton:HTMLElement) {
        completedButton.classList.add("completed-button-animation");
    }
}