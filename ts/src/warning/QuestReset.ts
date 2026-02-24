import { IFrame } from "../IFrame";
import { DataEventConst } from "../escape-from-tarkov/events/DataEventConst";
import { EventConst } from "../escape-from-tarkov/events/EventConst";
import { QuestSidePageMediator } from "../escape-from-tarkov/page/side/QuestSidePageMediator";
import { SidePageQuestRequest } from "../escape-from-tarkov/page/side/handlers/request/SidePageQuestRequest";
import { PlayerProgressionUtils } from "../escape-from-tarkov/utils/PlayerProgressionUtils";
import { I18nHelper } from "../locale/I18nHelper";

export class QuestReset extends IFrame {

    constructor(progressionType:string, mediator:QuestSidePageMediator) {
        super("quest-reset-frame", "./questResetWarning.html")
        this.frame.addEventListener("load", () => {
            this.registerListeners(progressionType, mediator);
        })
    }

    async registerListeners(progressionType:string, mediator:QuestSidePageMediator) {
        I18nHelper.init();

        const yesButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("yes") as HTMLButtonElement;
        if(yesButton) {
            yesButton.textContent = I18nHelper.get("pages.questReset.yes")
            yesButton.addEventListener("click", () => {
                PlayerProgressionUtils.wipeQuests(progressionType);
                const request = new SidePageQuestRequest(null, null, null, EventConst.QUEST_UPDATE, DataEventConst.PROGRESSION_CHANGED, null)
                request.notifyOthers = true
                mediator.update(request);
                super.close()
            })
        }


        const noButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("no") as HTMLButtonElement;
        if(noButton) {
            noButton.textContent = I18nHelper.get("pages.questReset.no")
            noButton.addEventListener("click", () => {
                super.close()
            })
        }

    }
}