import { settingsKeys } from "../../../../consts"
import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { Quest } from "../../../../model/quest/IQuestsElements";
import { StorageHelper } from "../../../service/helper/StorageHelper"
import { AppConfigUtils } from "../../../utils/AppConfigUtils";
import { SidePageQuestController } from "../../controller/SidePageQuestController";
import { QuestsUtils } from "../../quests/utils/QuestsUtils";
import { NavigationController } from "../../side-bar-menu/controller/NavigationController";
import { SidePageQuestRequest } from "../handlers/request/SidePageQuestRequest";
import { SidePageQuestMediator } from "../mediator/SidePageQuestMediator"

export class SidePageQuestsController {

    private static mediator:SidePageQuestMediator;

    static setMediator(mediator:SidePageQuestMediator) {
        this.mediator = mediator;
    }


    static createButtonEventListener(button: HTMLElement) {
        button.addEventListener('dblclick', async(e) => {
            const clickPref = AppConfigUtils.getAppConfig().userSettings.getDoubleClickCompleteQuest()
            if(clickPref === "true") {
                this.handleQuestCompleted(e)
            }
        })

        button.addEventListener('click', async(e) => {
            const clickPref = AppConfigUtils.getAppConfig().userSettings.getDoubleClickCompleteQuest()
            if(!clickPref || clickPref === "false") {
                this.handleQuestCompleted(e)
            }
        })
    }

    static handleQuestCompleted(e:MouseEvent) {
        if(e.target instanceof HTMLElement) {
            const quest = QuestsUtils.getQuestFromID(e.target.id);
            this.mediator.update(new SidePageQuestRequest(this.mediator, null, null,
                EventConst.SIDE_PAGE_QUEST_UPDATE, DataEventConst.QUEST_COMPLETED, quest))
        }
    }

    static createTitleEventListener(questTitleB:HTMLElement, quest:Quest) {
        questTitleB.addEventListener('click', e => {
            this.mediator.update(new SidePageQuestRequest(this.mediator, null, null, 
                EventConst.QUEST_SEARCH, DataEventConst.MOUSE_CLICK, quest));
            NavigationController.disableQuestMapFilter()
            SidePageQuestController.searchBarClicked();
        })
    }
}