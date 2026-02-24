import { settingsKeys } from "../../../../consts"
import { DataEventConst } from "../../../events/DataEventConst"
import { EventConst } from "../../../events/EventConst"
import { ApplicationConfiguration } from "../../../../model/IApplicationConfiguration"
import { Quest } from "../../../../model/quest/IQuestsElements"
import { StorageHelper } from "../../../service/helper/StorageHelper"
import { AppConfigUtils } from "../../../utils/AppConfigUtils"
import { QuestHeaderBuilder } from "../builder/helper/QuestHeaderBuilder"
import { EditableQuest } from "../edit/EditableQuest"
import { EditSession } from "../edit/EditSession"
import { QuestRequest } from "../handlers/request/QuestRequest"
import { QuestMediator } from "../mediator/QuestMediator"

export class QuestHeaderController {

    private static mediator:QuestMediator;

    static setMediator(mediator:QuestMediator) {
        this.mediator = mediator;
    }

    static createEditAddQuest(target:HTMLElement) {
        target.onclick = (e) => {
            const newQuest = new EditableQuest();
            EditSession.addModifiedQuest(newQuest);

            let newQuestDiv = QuestHeaderBuilder.createEditQuestHeader(newQuest);

            target.parentElement.insertBefore(newQuestDiv, target.nextSibling);

            e.stopPropagation();
        }
    }

    static createHeaderEventListener(div:HTMLElement, quest:Quest) {
        div.addEventListener('click', event => {

            let eventClass = (event.target as HTMLElement).className
            if(!(eventClass.includes('quest-selector') 
                || eventClass.includes('quest-checkmark') 
                || eventClass.includes('complete-button')
                || eventClass.includes("quest-edit-objective-description-input")
                || eventClass.includes("quest-edit-dropdown")
                || eventClass.includes("activate-button")
                || eventClass.includes("no-tracking-button")
                || eventClass.includes("failed-button")
            )) {
                if(EditSession.isSessionOpen()) {
                    const editedQuest = EditSession.getModifiedQuest(quest.id)?.quest;
                    if(editedQuest) { quest = editedQuest };
                }

                if(document.getElementsByClassName("quest-header").length === 1) {
                    // We only have one quest displayed
                    this.mediator.update(new QuestRequest(this.mediator, EventConst.QUEST_HEADER, 
                        DataEventConst.QUEST_PAGE_REFRESH, quest, null, div))

                } else {
                    // We have multiple quests displayed, usual click
                    this.mediator.update(new QuestRequest(this.mediator, EventConst.QUEST_HEADER, 
                        DataEventConst.MOUSE_CLICK, quest, null, div))
                }
            } 
        })
    }

    static createQuestCheckmarkEventListener(button: HTMLElement, quest:Quest) {
        button.addEventListener('click', e => {
            this.handleCheckmarkQuestActivation(e, quest)
        })
    }

    private static handleCheckmarkQuestActivation(e:MouseEvent, quest:Quest) {
        if(e.target instanceof HTMLInputElement) {
            this.mediator.update(new QuestRequest(this.mediator, EventConst.QUEST_UPDATE, 
                DataEventConst.QUEST_ACTIVATION, quest, null, e.target))
        }
    }

    static addActiveQuestEventListener(button:HTMLButtonElement, quest:Quest) {
        button.onclick = () => {
            this.mediator.update(new QuestRequest(this.mediator, EventConst.QUEST_UPDATE, 
                DataEventConst.QUEST_ACTIVATION, quest, null, button))
        }
    }

    static addButtonCompletedEventListener(button:HTMLButtonElement, quest:Quest) {
        
        button.addEventListener('dblclick', e => {
            const clickPref = AppConfigUtils.getAppConfig().userSettings.getDoubleClickCompleteQuest()
            if(clickPref === "true") {
                this.handleQuestCompleted(button, e, quest);
            }
        })

        button.addEventListener('click', e => {
            const clickPref = AppConfigUtils.getAppConfig().userSettings.getDoubleClickCompleteQuest()
            if(!clickPref || clickPref === "false") {
                this.handleQuestCompleted(button, e, quest)
            }
        })
    }

    static addButtonFailedEventListener(button:HTMLButtonElement, quest:Quest) {
        button.onclick = (e) => {
            this.handleQuestFailed(button, e, quest);
        }
    }

    static addButtonTrackingEventListener(button:HTMLButtonElement, quest:Quest) {
        button.onclick = (e) => {
            this.handleQuestTracking(button, e, quest);
        }
    }

    private static handleQuestCompleted(button:HTMLButtonElement, e:MouseEvent, quest:Quest) {
        this.mediator.update(new QuestRequest(this.mediator, EventConst.QUEST_UPDATE, 
            DataEventConst.QUEST_COMPLETED, quest, e, button))
    }

    private static handleQuestFailed(button:HTMLButtonElement, e:MouseEvent, quest:Quest) {
        this.mediator.update(new QuestRequest(this.mediator, EventConst.QUEST_UPDATE, 
            DataEventConst.QUEST_FAILED, quest, e, button))
    }

    private static handleQuestTracking(button:HTMLButtonElement, e:MouseEvent, quest:Quest) {
        this.mediator.update(new QuestRequest(this.mediator, EventConst.QUEST_UPDATE, 
            DataEventConst.QUEST_TRACKING, quest, e, button))
    }
}