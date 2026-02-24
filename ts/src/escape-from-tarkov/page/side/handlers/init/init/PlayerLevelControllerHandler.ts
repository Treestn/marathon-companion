import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler"
import { AppConfigUtils } from "../../../../../utils/AppConfigUtils";
import { PlayerLevelController } from "../../../controller/PlayerLevelController";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest"

export class PlayerLevelControllerHandler extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        const levelDomEl = document.getElementById("level-navigation");
        if(levelDomEl) {
            if(AppConfigUtils.getAppConfig().userSettings.isLevelRequired()) {
                console.log("Levels are required to unlock quests");
                levelDomEl.style.display = ""
            } else {
                console.log("Levels are not required to unlock quests");
                levelDomEl.style.display = "none"
            }
        }

        const levelUpElement = document.getElementById("level-up-arrow");
        if(levelUpElement) {
            PlayerLevelController.createLevelUpController(levelUpElement);
        } else {
            console.log("Level up arrow could not be found in the DOM");
        }
        
        const levelDownElement = document.getElementById("level-down-arrow");
        if(levelDownElement) {
            PlayerLevelController.createLevelDownController(levelDownElement);
        } else {
            console.log("Level down arrow could not be found in the DOM");
        }
    }

}