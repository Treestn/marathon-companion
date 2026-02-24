import { FilterConst } from "../../../../../../constant/FilterConst";
import { FilterElementsData } from "../../../../../../../model/IFilterElements";
import { Quest } from "../../../../../../../model/quest/IQuestsElements";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { QuestsUtils } from "../../../../../quests/utils/QuestsUtils";
import { PlayerProgressionUtils } from "../../../../../../utils/PlayerProgressionUtils";

export class ResolveQuestIconsHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        if(request.filters) {
            this.disableAllQuestsState(request.filters);
            // Updating
            this.resolve(request.filters)
        }
    }
    
    private resolve(filters:FilterElementsData) {
        const activeQuests:Quest[] = QuestsUtils.getActiveQuests();

        for(const hle of filters.highLevelElements) {
            //If hle is not Quests, we continue
            if(hle.name !== FilterConst.QUESTS.name) {
                continue;
            } 
            // Once we found the quests, we iterate each entity and check if the quest is active
            for(const element of hle.elements) {
                for(const entity of element.listElements) {
                    for(const quest of activeQuests) {
                        if(String(quest.id) === String(entity.questId) || String(quest.oldQuestId) === String(entity.questId)) {
                            if(PlayerProgressionUtils.isQuestObjectiveCompletedByIconId(quest, entity.id.toString()) 
                                && !PlayerProgressionUtils.isQuestCompleted(quest.id)) {
                                console.log(`Quest is active but objective is completed for icon id: ${entity.id}`);
                                continue;
                            }
                            console.log(`Quest is active for icon id: ${entity.id} with quest id: ${quest.id}`);
                            entity.active = true;
                        }
                    }
                }
            }
        }
    }

    private disableAllQuestsState(filters:FilterElementsData) {
        filters.highLevelElements.find(hle => hle.name === FilterConst.QUESTS.name).elements
            .forEach(element => element.listElements.forEach(entity => entity.active = false))
    }
}