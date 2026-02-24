import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { OverwolfStatusUtils } from "../../../../../utils/OverwolfStatusUtils";
import { PlayerProgressionUtils } from "../../../../../utils/PlayerProgressionUtils";
import { QuestsUtils } from "../../../utils/QuestsUtils";
import { QuestRequest } from "../../request/QuestRequest";

export class QuestUpdateHandler extends AbstractChainHandler {

    handle(request: QuestRequest) {
        if(EventConst.QUEST_UPDATE === request.event) {
            switch(request.subEvent) {
                case DataEventConst.QUEST_ACTIVATION: this.handleQuestActivation(request); break;
                case DataEventConst.QUEST_COMPLETED: this.handleQuestCompleted(request); break;
                case DataEventConst.QUEST_TRACKING: this.handleQuestTracking(request); break;
                case DataEventConst.QUEST_FAILED: this.handleQuestFailed(request); break;
                case DataEventConst.QUEST_AUTOMATION: this.handleQuestAutomation(request); break;
                // case DataEventConst.LEVEL_CHANGE: this.handleLevelChange(request); break;
            }
        }
    }

    private async handleQuestAutomation(request:QuestRequest) {
        const automation = OverwolfStatusUtils.isQuestAutomationEnabled();
        let display = automation ? "none" : "";

        this.changeButtonsDisplay(document.getElementsByClassName("complete-button"), display);
        this.changeButtonsDisplay(document.getElementsByClassName("failed-button"), display);
    }

    private changeButtonsDisplay(list:HTMLCollectionOf<Element>, display:string) {
        for(const button of list) {
            if(button instanceof HTMLElement) {
                button.parentElement.style.display = display;
            }
        }
    }

    private handleQuestActivation(request: QuestRequest) {
        let questUUID = request.quest.id;
        let questState = !PlayerProgressionUtils.isQuestActive(questUUID);
        QuestsUtils.setActiveQuest(questUUID, questState, true);
        if(questState) {
            QuestsUtils.setNextQuestsActive(questUUID);
        }
        request.htmlElement?.classList.remove("activate-button-active")
        if(questState) {
            this.refreshFindOnMap(request, "block");
            request.htmlElement?.classList.add("activate-button-active");
        } else {
            this.refreshFindOnMap(request, "none");
        }
    }

    private refreshFindOnMap(request:QuestRequest, displayType:string) {
        const findOnMapElList = document.getElementsByClassName("quest-image-find-on-map-container");
        request.quest.objectives.forEach(obj => {
            if(obj.questImages && obj.questImages.length > 0) {
                obj.questImages.forEach(img => {
                    for(const element of findOnMapElList) {
                        if(element.id.toString() === img.id.toString()) {
                            (element as HTMLElement).style.display = displayType;
                        }
                    }
                })
            }
        })
    }

    private handleQuestCompleted(request: QuestRequest) {
        if(request.htmlElement instanceof HTMLButtonElement) {
            const questId = request.htmlElement.getAttribute("id");
            if(PlayerProgressionUtils.isQuestTracked(questId)) {
                if(request.htmlElement.getAttribute("style") === "") {
                    request.htmlElement.style.backgroundColor = "var(--main-btn-active-color)"
                    request.htmlElement.style.borderColor = "var(--main-btn-active-color)"
                    request.htmlElement.style.color = "black"
                    QuestsUtils.setCompletedQuestState(questId, true);
                    QuestsUtils.setActiveQuest(questId, false);
                    QuestsUtils.setNextQuestsActive(request.quest.id);
                } else {
                    request.htmlElement.setAttribute('style', "");
                    QuestsUtils.setCompletedQuestState(questId, false);
                    QuestsUtils.setActiveQuest(questId, true);
                }
            }
        }
    }

    private handleQuestFailed(request: QuestRequest) {
        const newState = !PlayerProgressionUtils.isQuestFailed(request.quest.id);
        QuestsUtils.setFailedQuest(request.quest.id, newState);
        request.htmlElement?.classList.remove("failed-button-active")
        if(newState) {
            request.htmlElement?.classList.add("failed-button-active")
            QuestsUtils.setNextQuestsActive(request.quest.id);
        }
    }

    private handleQuestTracking(request: QuestRequest) {
        const isTracked = PlayerProgressionUtils.isQuestTracked(request.quest.id);
        QuestsUtils.setTrackingQuest(request.quest.id, !isTracked);
        request.htmlElement?.classList.remove("no-tracking-button-active")
        if(isTracked) {
            request.htmlElement?.classList.add("no-tracking-button-active")
        }
    }
}