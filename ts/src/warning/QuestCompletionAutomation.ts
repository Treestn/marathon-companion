import { IFrame } from "../IFrame";
import { DataEventConst } from "../escape-from-tarkov/events/DataEventConst";
import { EventConst } from "../escape-from-tarkov/events/EventConst";
import { QuestSidePageMediator } from "../escape-from-tarkov/page/side/QuestSidePageMediator";
import { SidePageQuestRequest } from "../escape-from-tarkov/page/side/handlers/request/SidePageQuestRequest";
import { PlayerProgressionUtils } from "../escape-from-tarkov/utils/PlayerProgressionUtils";
import { I18nHelper } from "../locale/I18nHelper";

export class QuestCompletionAutomation extends IFrame {

    constructor(mediator:QuestSidePageMediator) {
        super("quest-completion-automation-frame", "./quest_completion_automation.html")
        this.frame.addEventListener("load", () => {
            this.registerListeners(mediator);
        })
    }

    async registerListeners(mediator:QuestSidePageMediator) {
        await I18nHelper.init();

        const yesButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("yes") as HTMLButtonElement;
        if(yesButton) {
            yesButton.textContent = I18nHelper.get("pages.questCompletedAutomation.yes")
            yesButton.addEventListener("click", () => {
                PlayerProgressionUtils.completeQuestsAutomatically();
                const request = new SidePageQuestRequest(null, null, null, EventConst.QUEST_UPDATE, DataEventConst.PROGRESSION_CHANGED, null)
                request.notifyOthers = true
                mediator.update(request);
                super.close();
            })
        }


        const noButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("no") as HTMLButtonElement;
        if(noButton) {
            yesButton.textContent = I18nHelper.get("pages.questCompletedAutomation.yes")
            noButton.addEventListener("click", () => {
                super.close()
            })
        }
 
    }
}