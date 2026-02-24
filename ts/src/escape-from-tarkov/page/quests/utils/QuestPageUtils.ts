import { progressionTypes } from "../../../../consts";
import { Quest } from "../../../../model/quest/IQuestsElements";
import { AppConfigUtils } from "../../../utils/AppConfigUtils";
import { NavigationUtils } from "../../../utils/NavigationUtils";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { QuestBodyBuilder } from "../builder/helper/QuestBodyBuilder";
import { QuestHeaderBuilder } from "../builder/helper/QuestHeaderBuilder";
import { QuestHeaderController } from "../controller/QuestHeaderController";
import { EditSession } from "../edit/EditSession";
import { QuestBodyUtils } from "./QuestBodyUtils";
import { QuestsFiltersUtils } from "./QuestsFiltersUtils";
import { QuestsUtils } from "./QuestsUtils";

export class QuestPageUtils {

    static readonly activeBoxShadow = "rgba(108, 183, 178, 0.4) 49px -13px 35px -7px inset"
    static readonly noTrackingBoxShadow = "rgb(190 190 190 / 37%) 49px -13px 35px -7px inset"
    static readonly failedBoxShadow = "rgb(195 162 24 / 74%) 49px -13px 35px -7px inset"
    static readonly completedBoxShadow = "rgb(109 85 133) 49px -13px 35px -7px inset"
    static readonly blockedBoxShadow = "rgba(251, 47, 54, 0.3) 49px -13px 35px -7px inset"

    static displayQuestOnly(quest:Quest) {
        const questContainer = document.getElementById('quests-entity-parent')
        const runner = document.getElementById("quests-runner");
        if(runner && questContainer) {
            this.removeAllQuestsFromPage(runner);
            this.addQuest(questContainer, quest)
            QuestBodyBuilder.updateQuestBodyEntity(true, quest)
        }
    }

    static updateQuestByTitle(text:string) {
        let questContainer = document.getElementById('quests-entity-parent')
        const questRunner = document.getElementById("quests-runner");
        if(!questContainer || !questRunner) {
            return;
        } 
        
        this.removeAllQuestsFromPage(questRunner);

        let questList: Quest[] = QuestsFiltersUtils.filterByQuestsTitle(text, QuestsUtils.getQuestsObject().tasks);
        questList = QuestsFiltersUtils.orderQuests(questList);
        this.addQuests(questContainer, questList);

        if(questList != null && questList.length === 1) {
            QuestBodyBuilder.updateQuestBodyEntity(true, questList[0])
        }
        QuestBodyUtils.refreshAllItemState();
    }

    static updateQuestsPage(filter:boolean) {
        let questContainer = document.getElementById('quests-entity-parent')
        const questRunner = document.getElementById("quests-runner");
        if(!questContainer || !questRunner) {
            return;
        } 
        
        this.removeAllQuestsFromPage(questRunner);

        let questList: Quest[] = [];
        if(filter) {
            questList = QuestsFiltersUtils.filterQuests(QuestsUtils.getQuestsObject());
        } else {
            if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
                questList = QuestsFiltersUtils.filterPveQuests(QuestsUtils.getQuestsObject());
            } else {
                questList = QuestsUtils.getQuestsObject().tasks;
            }
        }
        this.addEditQuestHeaders();
        questList = QuestsFiltersUtils.orderQuests(questList);
        this.addQuests(questContainer, questList);
        
        if(questList != null && questList.length === 1) {
            QuestBodyBuilder.updateQuestBodyEntity(true, questList[0])
        }
        QuestBodyUtils.refreshAllItemState();
        QuestsFiltersUtils.updateQuestCounter();
    }

    static addEditQuestHeaders() {
        if(EditSession.isSessionOpen()) {
            let questContainer = document.getElementById('quests-entity-parent')
            const questRunner = document.getElementById("quests-runner");
            if(!questContainer || !questRunner) {
                return;
            }
            const addQuestButton = QuestHeaderBuilder.createEditAddQuestButtonHeader();
            QuestHeaderController.createEditAddQuest(addQuestButton);
            questContainer.appendChild(addQuestButton);

            for(const editableQuest of EditSession.getNewQuests()) {
                const questHeader = QuestHeaderBuilder.createEditQuestHeader(editableQuest);
                questContainer.appendChild(questHeader);
            }
        }
    }

    static removeQuestFromPage(questId:string) {
        const questEntity = document.getElementById(questId);
        if(questEntity) {
            questEntity.remove();
        }
    }


    private static removeAllQuestsFromPage(questRunner:HTMLElement) {
        if(questRunner !== undefined) {
            [...questRunner.getElementsByClassName('quest-entity')].map(n => n && n.remove());
        }
    }

    private static addQuests(questContainer:HTMLElement, questList:Quest[]) {
        questList.forEach(quest => {
            this.addQuest(questContainer, quest)
        })
    }

    private static addActiveQuestsFirst(questContainer:HTMLElement, questList:Quest[]) {
        questList.forEach(quest => {
            if(PlayerProgressionUtils.isQuestActive(quest.id)) {
                this.addQuest(questContainer, quest)
            }
        })
    }

    private static addInactiveQuestsAfter(questContainer:HTMLElement, questList:Quest[]) {
        questList.forEach(quest => {
            if(!PlayerProgressionUtils.isQuestActive(quest.id)) {
                this.addQuest(questContainer, quest)
            }
        })
    }

    private static addQuest(questContainer, quest:Quest) {
        QuestBodyBuilder.addQuestEntity(questContainer, quest)
    }

    static resolveQuestGlow(quest:Quest) {
        if(NavigationUtils.getActivePageRunner() !== NavigationUtils.QUEST_RUNNER) {
            return;
        }
        const questWrapper = document.getElementById(quest.id)
        const active = PlayerProgressionUtils.isQuestActive(quest.id)
        const completed = PlayerProgressionUtils.isQuestCompleted(quest.id)
        const isTracked = PlayerProgressionUtils.isQuestTracked(quest.id);
        const failed = PlayerProgressionUtils.isQuestFailed(quest.id);
        if(questWrapper) {
            if(!isTracked) {
                (questWrapper.firstChild as HTMLDivElement).style.boxShadow = this.noTrackingBoxShadow;
                return;
            }
            if(failed) {
                (questWrapper.firstChild as HTMLDivElement).style.boxShadow = this.failedBoxShadow;
                return;
            }
            if(active) {
                (questWrapper.firstChild as HTMLDivElement).style.boxShadow = this.activeBoxShadow;
            }
            if(completed) {
                (questWrapper.firstChild as HTMLDivElement).style.boxShadow = this.completedBoxShadow;
            }
            if(!active && !completed) {
                (questWrapper.firstChild as HTMLDivElement).style.boxShadow = this.blockedBoxShadow;
            }
        }
    }

    static resolveActiveButtonText(quest:Quest) {
        if(NavigationUtils.getActivePageRunner() !== NavigationUtils.QUEST_RUNNER) {
            return;
        }
        const questWrapper = document.getElementById(quest.id)
        if(questWrapper) {
            const activateButton = questWrapper.getElementsByClassName("activate-button")
            if(activateButton && activateButton.length > 0 && activateButton[0] instanceof HTMLButtonElement) {
                const manuallyActive = PlayerProgressionUtils.isQuestManuallyActivated(quest.id);
                if(manuallyActive) {
                    activateButton[0].textContent = "MANUALLY ACTIVATED"
                } else {
                    activateButton[0].textContent = "Active"
                }
            }
        }
    }

    static resolveQuestActiveButton(questId:string) {
        if(NavigationUtils.getActivePageRunner() !== NavigationUtils.QUEST_RUNNER) {
            return;
        }        
        const questWrapper = document.getElementById(questId)
        if(questWrapper) {
            const activateButton = questWrapper.getElementsByClassName("activate-button")
            if(activateButton && activateButton.length > 0 && activateButton[0] instanceof HTMLButtonElement) {
                const active = PlayerProgressionUtils.isQuestActive(questId);
                activateButton[0].classList.remove("activate-button-active");
                if(active) {
                    activateButton[0].classList.add("activate-button-active")
                }
            }
        }
    }

    static resolveQuestFailedButton(questId:string) {
        if(NavigationUtils.getActivePageRunner() !== NavigationUtils.QUEST_RUNNER) {
            return;
        }        
        const questWrapper = document.getElementById(questId)
        if(questWrapper) {
            const failedButton = questWrapper.getElementsByClassName("failed-button")
            if(failedButton && failedButton.length > 0 && failedButton[0] instanceof HTMLButtonElement) {
                const failed = PlayerProgressionUtils.isQuestFailed(questId);
                failedButton[0].classList.remove("failed-button-active");
                if(failed) {
                    failedButton[0].classList.add("failed-button-active")
                }
            }
        }
    }

    static resolveQuestTrackingButton(questId:string) {
        if(NavigationUtils.getActivePageRunner() !== NavigationUtils.QUEST_RUNNER) {
            return;
        }        
        const questWrapper = document.getElementById(questId)
        if(questWrapper) {
            const trackingButton = questWrapper.getElementsByClassName("no-tracking-button")
            if(trackingButton && trackingButton.length > 0 && trackingButton[0] instanceof HTMLButtonElement) {
                const tracking = PlayerProgressionUtils.isQuestTracked(questId);
                trackingButton[0].classList.remove("no-tracking-button-active");
                if(!tracking) {
                    trackingButton[0].classList.add("no-tracking-button-active")
                }
            }
        }
    }
}