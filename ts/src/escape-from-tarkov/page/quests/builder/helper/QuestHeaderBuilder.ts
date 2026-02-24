import { I18nHelper } from "../../../../../locale/I18nHelper";
import { TraderMapper } from "../../../../../adapter/TraderMapper";
import { LogoPathConst } from "../../../../constant/ImageConst";
import { QuestType } from "../../../../constant/QuestConst";
import { TraderList } from "../../../../constant/TraderConst";
import { Quest } from "../../../../../model/quest/IQuestsElements";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { OverwolfStatusUtils } from "../../../../utils/OverwolfStatusUtils";
import { PlayerProgressionUtils } from "../../../../utils/PlayerProgressionUtils";
import { QuestEditController } from "../../controller/QuestEditController";
import { QuestHeaderController } from "../../controller/QuestHeaderController";
import { EditableQuest } from "../../edit/EditableQuest";
import { EditSession } from "../../edit/EditSession";
import { QuestHeaderUtils } from "../../utils/QuestHeaderUtils";
import { QuestPageUtils } from "../../utils/QuestPageUtils";
import { QuestsUtils } from "../../utils/QuestsUtils";

export class QuestHeaderBuilder {

    static createEditAddQuestButtonHeader():HTMLElement {

        let questEntityDiv = HelperCreation.createDiv("", "quest-entity", "")

        let headerDiv:HTMLDivElement = HelperCreation.createDiv("", "quest-header quest-header-edit", "");

        const text = HelperCreation.createB("quest-edit-reward-input-text", "Add New Quest");
        headerDiv.appendChild(text);

        let image = new Image();
        image.src = LogoPathConst.ADD_ICON;
        image.classList.add("add-condition-image");
        headerDiv.appendChild(image);

        questEntityDiv.appendChild(headerDiv);

        return questEntityDiv
    }

    static createEditQuestHeader(quest:EditableQuest):HTMLElement {
        let questEntityDiv = HelperCreation.createDiv(quest.quest.id, "quest-entity", "")

        let headerDiv:HTMLDivElement = HelperCreation.createDiv(quest.quest.id, "quest-header", "");

        let questTraderIconDiv = HelperCreation.createDiv("", "quest-type-icon", "")
        let traderImage = new Image();
        traderImage.classList.add("quest-img");
        questTraderIconDiv.appendChild(traderImage)
        headerDiv.appendChild(questTraderIconDiv);

        let questTraderTextDiv = HelperCreation.createDiv("", "quest-trader", "")
        const traderDropdown = document.createElement("select");
        traderDropdown.id = "quest-edit-selector";
        traderDropdown.classList.add("centered");
        traderDropdown.classList.add("quest-edit-dropdown");
        for(const trader of TraderList) {
            if(trader.id === quest.quest.trader.id) {
                traderDropdown.appendChild(new Option(TraderMapper.getLocalizedTraderName(trader.id), trader.id, true, true));
                traderImage.src = TraderMapper.getImageFromTraderId(trader.id);
            } else {
                traderDropdown.appendChild(new Option(TraderMapper.getLocalizedTraderName(trader.id), trader.id, false, false));
            }
        }
        questTraderTextDiv.appendChild(traderDropdown);
        headerDiv.appendChild(questTraderTextDiv);

        let questTitleDiv = HelperCreation.createDiv("", "quest-title quest-edit-title", "")
        let inputText = HelperCreation.createB("quest-edit-objective-description", "Quest Title: ")
        questTitleDiv.appendChild(inputText)
        let questTitleInput:HTMLInputElement = HelperCreation.createInput("", "", "quest-edit-objective-description-input");
        questTitleInput.value = quest?.quest?.locales?.[I18nHelper.currentLocale()] ?? quest?.quest?.name
        questTitleDiv.appendChild(questTitleInput)
        headerDiv.appendChild(questTitleDiv)

        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-reward-image-middle");
        headerDiv.appendChild(removeImage);

        // headerDiv.appendChild(this.createCompletedButton(quest))
        // headerDiv.appendChild(this.createTraderCheckbox(quest, "quest-selector-label", "quest-selector-container"))

        // EVENT LISTENERS
        QuestHeaderController.createHeaderEventListener(headerDiv, quest.quest);
        QuestEditController.registerQuestHeaderTitle(questTitleInput, quest.quest.id);
        QuestEditController.registerQuestHeaderTraderSelector(traderDropdown, quest.quest.id, traderImage);
        QuestEditController.registerRemoveQuest(removeImage, quest.quest.id, questEntityDiv);

        questEntityDiv.appendChild(headerDiv);

        return questEntityDiv;
    }

    static createQuestHeader(wrapper:HTMLElement, quest:Quest) {
        let headerDiv:HTMLDivElement;
        if(QuestType.EVENT_QUEST === quest.questType) {
            headerDiv = HelperCreation.createDiv(quest.id, "quest-header quest-header-event", "")
        } else if(QuestType.MAIN_QUEST === quest.questType) {
            headerDiv = HelperCreation.createDiv(quest.id, "quest-header quest-header-main", "")
        } else {
            headerDiv = HelperCreation.createDiv(quest.id, "quest-header", "")
        }
        const active = PlayerProgressionUtils.isQuestActive(quest.id);
        const manuallyActivated = PlayerProgressionUtils.isQuestManuallyActivated(quest.id);
        const completed = PlayerProgressionUtils.isQuestCompleted(quest.id);
        const isTracked = PlayerProgressionUtils.isQuestTracked(quest.id);
        const failed = PlayerProgressionUtils.isQuestFailed(quest.id);
        if(active || manuallyActivated) {
            headerDiv.style.boxShadow = QuestPageUtils.activeBoxShadow;
        }
        if(completed) {
            headerDiv.style.boxShadow = QuestPageUtils.completedBoxShadow;
        }
        if((!active && !manuallyActivated) && !completed) {
            headerDiv.style.boxShadow = QuestPageUtils.blockedBoxShadow;
        }
        if(failed) {
            headerDiv.style.boxShadow = QuestPageUtils.failedBoxShadow;
        }
        if(!isTracked) {
            headerDiv.style.boxShadow = QuestPageUtils.noTrackingBoxShadow;
        }

        headerDiv.appendChild(this.createTraderIcon(TraderMapper.getImageFromTraderId(quest.trader.id)))

        let questTraderTextDiv = HelperCreation.createDiv("", "quest-trader", "")
        let questTraderB = HelperCreation.createB("quest-text", TraderMapper.getLocalizedTraderName(quest.trader.id))
        questTraderTextDiv.appendChild(questTraderB)
        headerDiv.appendChild(questTraderTextDiv)

        let questTitleDiv = HelperCreation.createDiv("", "quest-title", "")
        let questTitleB = HelperCreation.createB("quest-text", quest.locales?.[I18nHelper.currentLocale()] ?? quest.name)
        questTitleDiv.appendChild(questTitleB)
        headerDiv.appendChild(questTitleDiv)

        const activateButton = this.createActiveButton(quest)
        headerDiv.appendChild(activateButton);
        const completedButton = this.createCompletedButton(quest)
        headerDiv.appendChild(completedButton);
        const failedButton = this.createFailedButton(quest)
        if(QuestsUtils.isQuestFailable(quest.id)) {
            headerDiv.appendChild(failedButton);
        }

        if(OverwolfStatusUtils.isQuestAutomationEnabled()) {
            completedButton.style.display = "none";
            failedButton.style.display = "none";
        }

        headerDiv.appendChild(this.createNoTrackingButton(quest));

        if(EditSession.isSessionOpen()) {
            const removeImage = new Image();
            removeImage.src = LogoPathConst.REMOVE_ICON;
            removeImage.classList.add("remove-reward-image-middle");
            headerDiv.appendChild(removeImage);

            QuestEditController.registerRemoveQuest(removeImage, quest.id, wrapper);
        }

        // EVENT LISTENERS
        QuestHeaderController.createHeaderEventListener(headerDiv, quest);

        wrapper.appendChild(headerDiv)
    }

    static createTraderIcon(traderImgPath:string):HTMLElement {
        let questTraderIconDiv = HelperCreation.createDiv("", "quest-type-icon", "")
        let traderImg = HelperCreation.createImage("", "quest-img", traderImgPath, "")
        questTraderIconDiv.appendChild(traderImg)
        return questTraderIconDiv
    }

    static createDoneButton(questId:string, buttonClass:string, containerClass:string):HTMLElement {
        let div = HelperCreation.createDiv("", containerClass, "");
        let button = HelperCreation.createButton(questId, "button", "", buttonClass, I18nHelper.get("pages.quests.quest.button.done"))
        div.appendChild(button);
        return div
    }

    private static createCompletedButton(quest:Quest):HTMLElement {
        let container = HelperCreation.createDiv(quest.id, "complete-button-container","")
        let button:HTMLButtonElement = HelperCreation.createButton(quest.id, "button", "", "btn btn-primary complete-button", I18nHelper.get("pages.quests.quest.button.completed"));
        container.appendChild(button)

        QuestHeaderUtils.refreshCompletedButtonAnimation(button, quest);

        if(PlayerProgressionUtils.isQuestCompleted(quest.id)) {
            button.style.backgroundColor = "var(--main-btn-active-color)"
            button.style.borderColor = "var(--main-btn-active-color)"
            button.style.color = "black"
        }

        QuestHeaderController.addButtonCompletedEventListener(button, quest)

        return container
    }

    private static createFailedButton(quest:Quest):HTMLElement {
        let container = HelperCreation.createDiv(quest.id, "complete-button-container","")
        let button:HTMLButtonElement = HelperCreation.createButton(quest.id, "button", "", "btn btn-primary failed-button", I18nHelper.get("pages.quests.quest.button.failed"));
        container.appendChild(button)

        if(PlayerProgressionUtils.isQuestFailed(quest.id)) {
            button.classList.add("failed-button-active");
        }

        QuestHeaderController.addButtonFailedEventListener(button, quest)

        return container
    }

    private static createNoTrackingButton(quest:Quest):HTMLElement {
        let container = HelperCreation.createDiv(quest.id, "complete-button-container","")
        let button:HTMLButtonElement = HelperCreation.createButton(quest.id, "button", "", "btn btn-primary no-tracking-button", I18nHelper.get("pages.quests.quest.button.noTracking"));
        container.appendChild(button)

        if(!PlayerProgressionUtils.isQuestTracked(quest.id)) {
            button.classList.add("no-tracking-button-active");
        }

        QuestHeaderController.addButtonTrackingEventListener(button, quest)

        return container
    }

    private static createActiveButton(quest:Quest):HTMLElement {
        let container = HelperCreation.createDiv(quest.id, "complete-button-container","")
        let text =  I18nHelper.get("pages.quests.quest.button.active");
        if(PlayerProgressionUtils.isQuestManuallyActivated(quest.id)) {
            text = I18nHelper.get("pages.quests.quest.button.manualTracking");
            
        }
        let button:HTMLButtonElement = HelperCreation.createButton(quest.id, "button", "", "btn btn-primary activate-button", text);
        container.appendChild(button)

        if(PlayerProgressionUtils.isQuestActive(quest.id) || PlayerProgressionUtils.isQuestManuallyActivated(quest.id)) {
            button.classList.add("activate-button-active");
        }

        QuestHeaderController.addActiveQuestEventListener(button, quest)

        return container
    }

    // static createTraderCheckbox(quest:Quest, labelClass:string, containerClass:string):HTMLElement {

    //     let label = HelperCreation.createLabel(quest.id, labelClass)
    //     let labelDiv = HelperCreation.createDiv("",containerClass, "")
    //     QuestHeaderController.createQuestCheckmarkEventListener(labelDiv, quest)

    //     let labelInput = HelperCreation.createInput(quest.id, "checkbox", "quest-selector")
    //     if(PlayerProgressionUtils.isQuestActive(quest.id)) {
    //         labelInput.checked = true;
    //     }

    //     let labelSpan = HelperCreation.createSpan("quest-checkmark")
    //     labelDiv.appendChild(labelInput)
    //     labelDiv.appendChild(labelSpan)
    //     label.appendChild(labelDiv)
    //     return label
    // }

}