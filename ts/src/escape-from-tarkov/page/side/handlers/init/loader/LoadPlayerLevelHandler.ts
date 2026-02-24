import { BackgroundHelper } from "../../../../../../background/BackgroundHelper";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { PlayerProgressionUtils } from "../../../../../utils/PlayerProgressionUtils";
import { QuestsUtils } from "../../../../quests/utils/QuestsUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class LoadPlayerLevelHandler extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        let playerLevel = PlayerProgressionUtils.getPlayerLevel();
        if(!playerLevel) {
            PlayerProgressionUtils.setPlayerLevel("1");
        }
        const levelTextElement = document.getElementById("player-level-text");
        if(levelTextElement) {
            levelTextElement.textContent = ""+playerLevel
            QuestsUtils.refreshLevel();
        } 
    }

}