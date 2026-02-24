import { kGamesEventKey } from "../../../../../../consts";
import { PopupHelper } from "../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../constant/AppPopupMessages";
import { OverwolfStates } from "../../../../../../model/OverwolfResponse";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { IRequest } from "../../../../../types/IRequest";
import { AppConfigUtils } from "../../../../../utils/AppConfigUtils";
import { OverwolfStatusUtils } from "../../../../../utils/OverwolfStatusUtils";

export class AutomationInitHandler extends AbstractChainHandler {

    async handle(request: IRequest) {
        // await OverwolfStatusUtils.refreshOverwolfEventStatus();
        // OverwolfStatusUtils.startOverwolfEventCron();
        // OverwolfStatusUtils.eventStatus.forEach((status, event) => {
        //     if(status === OverwolfStates.DOWN.status) {
        //         if(event === kGamesEventKey.questsList) {
        //             PopupHelper.addPopup("Automation Down", AppPopupMessagesConst.QUEST_AUTOMATION_DOWN, PopupHelper.ERROR_BORDER_COLOR)
        //         }
        //         if(event === kGamesEventKey.map) {
        //             PopupHelper.addPopup("Map Selection Down", AppPopupMessagesConst.MAP_SELECTION_DOWN, PopupHelper.ERROR_BORDER_COLOR)
        //         }
        //         if(event === kGamesEventKey.sessionType) {
        //             PopupHelper.addPopup("Game Mode Selection Down", AppPopupMessagesConst.SESSION_TYPE_DOWN, PopupHelper.ERROR_BORDER_COLOR)
        //         }
        //     }
        //     if(status === OverwolfStates.PARTIALLY_UP.status) {
        //         if(event === kGamesEventKey.questsList) {
        //             PopupHelper.addPopup("Automation Partially Down", AppPopupMessagesConst.QUEST_AUTOMATION_PARTIALLY_DOWN, PopupHelper.WARNING_BORDER_COLOR)
        //         }
        //         if(event === kGamesEventKey.map) {
        //             PopupHelper.addPopup("Map Selection Partially Down", AppPopupMessagesConst.MAP_SELECTION_PARTIALLY_DOWN, PopupHelper.WARNING_BORDER_COLOR)
        //         }
        //         if(event === kGamesEventKey.sessionType) {
        //             PopupHelper.addPopup("Game Mode Selection Partially Down", AppPopupMessagesConst.SESSION_TYPE_PARTIALLY_DOWN, PopupHelper.WARNING_BORDER_COLOR)
        //         }
        //     }
        // })
        // PopupHelper.start();
        // const automationEnabled = AppConfigUtils.getAppConfig().userSettings.getQuestAutomationFlag()
        // AppConfigUtils.getAppConfig().userSettings.setLevelRequired(automationEnabled ? "false" : "true");
        // AppConfigUtils.save();
        // const levelDomEl = document.getElementById("level-navigation");
        // if(levelDomEl) {
        //     if(!automationEnabled) {
        //         console.log("Levels are required to unlock quests");
        //         levelDomEl.style.display = ""
        //     } else {
        //         console.log("Levels are not required to unlock quests");
        //         levelDomEl.style.display = "none"
        //     }
        // }
    }
} 