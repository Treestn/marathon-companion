import { I18nHelper } from "../../../../../locale/I18nHelper";
import { TraderMapper } from "../../../../../adapter/TraderMapper";
import { Quest } from "../../../../../model/quest/IQuestsElements";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { OverwolfStatusUtils } from "../../../../utils/OverwolfStatusUtils";
import { QuestHeaderBuilder } from "../../../quests/builder/helper/QuestHeaderBuilder";
import { SidePageQuestsController } from "../../controller/SidePageQuestsController";

export class SidePageQuestsBuilder {

    static addQuestElement(quest:Quest) {
        let entity:HTMLElement = HelperCreation.createDiv(quest.id.toString(), "side-page-quest-entity", "")

        entity.appendChild(QuestHeaderBuilder.createTraderIcon(TraderMapper.getImageFromTraderId(quest.trader.id)))
        
        let questTitleDiv:HTMLElement = HelperCreation.createDiv("", "side-page-quest-title", "");
        let questTitleB = HelperCreation.createB("quest-text side-quest-text", quest.locales?.[I18nHelper.currentLocale()] ?? quest.name)
        questTitleDiv.appendChild(questTitleB)

        SidePageQuestsController.createTitleEventListener(questTitleB, quest);
        
        entity.appendChild(questTitleDiv)

        let button:HTMLElement = QuestHeaderBuilder.createDoneButton(quest.id.toString(), "side-page-done-button","side-page-quest-button-container");
        if(OverwolfStatusUtils.isQuestAutomationEnabled()) {
            button.style.display = "none";
        }
        // checkbox.getElementsByClassName('quest-checkmark')[0].setAttribute('style', "text-decoration:none;opacity:100%;");
        // (checkbox.getElementsByClassName('quest-selector')[0] as HTMLInputElement).setAttribute('checked', "false");
        SidePageQuestsController.createButtonEventListener(button)
        entity.appendChild(button)

        const domContainer:HTMLElement = document.getElementById('side-page-quests-container')
        domContainer.appendChild(entity)
    }

}