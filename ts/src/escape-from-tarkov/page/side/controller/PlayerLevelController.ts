import { BackgroundHelper } from "../../../../background/BackgroundHelper";
import { Background } from "../../../../background/background";
import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { AppConfigUtils } from "../../../utils/AppConfigUtils";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { SidePageQuestRequest } from "../handlers/request/SidePageQuestRequest";
import { SidePageQuestMediator } from "../mediator/SidePageQuestMediator";

export class PlayerLevelController {
    
    private static mediator:SidePageQuestMediator;

    static setMediator(mediator:SidePageQuestMediator) {
        this.mediator = mediator;
    }

    private static readonly TRIGGER_DELAY:number = 200;
    private static readonly TRIGGER_INTERVAL_DELAY:number = 200;
    private static inUse:boolean = false;

    static createLevelUpController(element:HTMLElement) {
        element.onclick = () => {
            this.levelUpEvent(element);
        }
    }

    static createLevelDownController(element:HTMLElement) {
        element.onclick = () => {
            this.levelDownEvent();
        }
    }

    private static async levelUpEvent(element:HTMLElement) {
        let levelElement = document.getElementById("player-level-text")
        if(!levelElement) {
            levelElement = document.getElementById("player-level-text")
        }
        if(!AppConfigUtils.getAppConfig().userSettings.getLevelReminderFlag()) {
            levelElement.classList.remove("level-up-animation")
            element.classList.remove("level-up-animation")
            AppConfigUtils.getAppConfig().userSettings.setLevelReminderFlag(true);
        }
        const newLevel = "" + (Number.parseInt(levelElement.textContent) + 1)
        PlayerProgressionUtils.setPlayerLevel(newLevel);
        levelElement.textContent = newLevel
        this.mediator.update(new SidePageQuestRequest(this.mediator, null, null,
            EventConst.SIDE_PAGE_QUEST_UPDATE, DataEventConst.LEVEL_CHANGE, null))
    }

    private static async levelDownEvent() {
        let levelElement = document.getElementById("player-level-text")

        if(!levelElement) {
            levelElement = document.getElementById("player-level-text")
        }

        let newLevel = "" + (Number.parseInt(levelElement.textContent) - 1)

        if(Number.parseInt(levelElement.textContent) <= 1) {
            newLevel = "1";
        }
        
        PlayerProgressionUtils.setPlayerLevel(newLevel);
        levelElement.textContent = newLevel
    }


    private static notifyChain() {
        this.mediator.update(new SidePageQuestRequest(this.mediator, null, null,
            EventConst.SIDE_PAGE_QUEST_UPDATE, DataEventConst.LEVEL_CHANGE, null))
    }
}