import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { Objectives } from "../../../../../../model/quest/IQuestsElements";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { ItemsUtils } from "../../../../../utils/ItemsUtils";
import { PlayerProgressionUtils } from "../../../../../utils/PlayerProgressionUtils";
import { ItemUtils } from "../../../../items/utils/ItemUtils";
import { QuestBodyBuilder } from "../../../builder/helper/QuestBodyBuilder";
import { QuestBodyUtils } from "../../../utils/QuestBodyUtils";
import { QuestHeaderUtils } from "../../../utils/QuestHeaderUtils";
import { QuestsUtils } from "../../../utils/QuestsUtils";
import { QuestRequest } from "../../request/QuestRequest";

export class QuestBodyHandler extends AbstractChainHandler {

    handle(request: QuestRequest) {
        if(EventConst.QUEST_HEADER === request.event) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleHeaderClick(request); break;
            }
        } else if (EventConst.QUEST_BODY === request.event) {
            switch(request.subEvent) {
                case DataEventConst.QUEST_OBJECTIVE_UPDATE: this.handleQuestObjectiveUpdate(request); break;
            }
        }
    }

    private handleHeaderClick(request:QuestRequest) {
        let header = document.getElementById(request.htmlElement.id);
        if(header && header.getElementsByClassName('quest-dropdown-container').length == 0) {
            // this.mediator.update(new QuestRequest(this.mediator, EventConst.QUEST_HEADER, 
            //     DataEventConst.MOUSE_CLICK, quest, null, null))
            QuestBodyBuilder.updateQuestBodyEntity(true, request.quest)
            QuestBodyUtils.refreshAllItemState();
        } else {
            QuestBodyBuilder.removeQuestBodyFromPage(request.htmlElement.id)
        }
    }

    private handleQuestObjectiveUpdate(request:QuestRequest) {
        if(request.quest && request.quest.objectives && request.quest.objectives.length > 0 && request.htmlElement) {
            const objectiveId = request.htmlElement.id;
            if(objectiveId) {
                const objective = QuestsUtils.getObjectiveFromId(request.quest, objectiveId);
                if(!objective) {
                    console.log(`Could not find objective with id: ${objectiveId}`);
                    return;
                }
                if(!PlayerProgressionUtils.isQuestTracked(request.quest.id)) {
                    return;
                }
                // It was just clicked, so if it is currently completed, we set it to not completed
                if(PlayerProgressionUtils.isQuestObjectiveCompleted(request.quest, objectiveId)) {
                    PlayerProgressionUtils.setQuestObjectiveState(request.quest.id, objective, false);
                    QuestBodyUtils.changeQuestGoalState(request.htmlElement, false);
                    this.refreshLocationImageState(objective, false);
                    if(PlayerProgressionUtils.isQuestActive(request.quest.id)) {
                        this.refreshFindOnMap(objective, "block")
                    }
                } else {
                    // It was just clicked, so if it is currently not completed, we set it to completed
                    PlayerProgressionUtils.setQuestObjectiveState(request.quest.id, objective, true);
                    QuestBodyUtils.changeQuestGoalState(request.htmlElement, true);
                    this.refreshLocationImageState(objective, true);
                    this.refreshFindOnMap(objective, "none");
                }
                const questContainer = document.getElementById(request.quest.id);
                if(questContainer) {
                    const completeButton = questContainer.getElementsByClassName("complete-button");
                    if(completeButton && completeButton.length > 0 && completeButton[0] instanceof HTMLElement) {
                        QuestHeaderUtils.refreshCompletedButtonAnimation(completeButton[0] as HTMLElement, request.quest)
                    }
                }
                
            }
        }
    }

    private refreshLocationImageState(objective:Objectives, state:boolean) {
        if(objective.questImages && objective.questImages.length > 0) {
            objective.questImages.forEach(img => {
                QuestBodyUtils.changeQuestObjectiveLocationState(img.id, state);
            })
        }
    }

    private refreshFindOnMap(objective:Objectives, displayType:string) {
        const findOnMapElList = document.getElementsByClassName("quest-image-find-on-map-container");
        if(objective.questImages && objective.questImages.length > 0) {
            objective.questImages.forEach(img => {
                for(const element of findOnMapElList) {
                    if(element.id.toString() === img.id.toString()) {
                        (element as HTMLElement).style.display = displayType;
                    }
                }
            })
        }
    }
}