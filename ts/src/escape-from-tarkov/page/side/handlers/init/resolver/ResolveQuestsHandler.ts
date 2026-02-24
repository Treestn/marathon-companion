import { PopupHelper } from "../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../constant/AppPopupMessages";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { QuestsUtils } from "../../../../quests/utils/QuestsUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class ResolveQuestsHandler extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        // If you want all the quests active, uncomment line 12 and 44
        // this.resolve(request.storedQuests, request.storedQuests)
        if(request.quests && request.storedQuests) {
            // Updating
            // this.resolveQuestState()
            // this.resolve(request.quests, request.storedQuests)
            QuestsUtils.save(request.quests)

        } else if(request.quests && !request.storedQuests) {
            // First time or just deleted the stored data
            QuestsUtils.save(request.quests)

        } else if(!request.quests && request.storedQuests) {
            // Version did not change
            request.quests = request.storedQuests

        } else {
            //Server is down and nothing is stored
            PopupHelper.addFatalPopup(AppPopupMessagesConst.FATAL_ERROR_NO_CONFIG, 
                "Quests config is missing")
        }
        
        QuestsUtils.setQuestsObject(request.quests)
    }
}