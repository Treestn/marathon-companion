import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { PlayerProgressionUtils } from "../../../../../../utils/PlayerProgressionUtils";
import { EditSession } from "../../../../../quests/edit/EditSession";
import { QuestsUtils } from "../../../../../quests/utils/QuestsUtils";
import { PopupIconComponent } from "../../../../components/impl/PopupIconComponent";
import { QuestIconComponent } from "../../../../components/impl/QuestIconComponent";
import { IconUtils } from "../../../../utils/IconUtils";
import { IMapRequest } from "../../../request/IMapRequest";
import { MapRequest } from "../../../request/impl/MapRequest";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";

export class QuestIconHandler extends AbstractMapChainHandler {

    handle(request: MapRequest) {
        if(request.event === EventConst.QUEST_UPDATE) {
            switch(request.subEvent) {        
                case DataEventConst.QUEST_OBJECTIVE_UPDATE: this.handleObjectiveUpdate(request); break;
            }
        }
    }

    private handleObjectiveUpdate(request: MapRequest) {
        if(request.component instanceof PopupIconComponent && request.component.icon instanceof QuestIconComponent) {
            const objective = QuestsUtils.getObjectiveFromIconId(request.component.icon.quest.objectives, request.component.icon.entity.id.toString())
            if(objective) {
                const objectiveState = PlayerProgressionUtils.getQuestState(request.component.icon.entity.questId);
                if(objectiveState) {
                    if(objectiveState.completed) {
                        PlayerProgressionUtils.setQuestObjectiveCompletedStateFromIconId(request.component.icon.quest, request.component.icon.entity.id.toString(), false);
                        objective.questImages.forEach(questImage => {
                            IconUtils.unhideIcon(String(questImage.id), request.mediator.getFilter().map)
                        })
                    } else {
                        PlayerProgressionUtils.setQuestObjectiveCompletedStateFromIconId(request.component.icon.quest, request.component.icon.entity.id.toString(), true);
                        objective.questImages.forEach(questImage => {
                            IconUtils.hideIcon(String(questImage.id))
                        })
                    }
                }
            }
        }
    }
    
}