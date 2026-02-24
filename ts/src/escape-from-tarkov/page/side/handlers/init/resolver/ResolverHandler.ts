import { HideoutObject } from "../../../../../../model/HideoutObject"
import { QuestsObject } from "../../../../../../model/quest/IQuestsElements";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler"
import { PlayerProgressionUtils } from "../../../../../utils/PlayerProgressionUtils"
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest"

export class ResolverHandler extends AbstractChainHandler {

    async handle(request: SidePageInitQuestRequest) {
        await this.loadProgression();
        this.resolveQuests(request.quests, request.storedQuests);
        this.resolveHideout(request.hideoutElement);
        this.resolveItemsNeeded();
    }

    private async loadProgression() {
        await PlayerProgressionUtils.load();
    }

    private resolveHideout(hideoutObject:HideoutObject) {
        PlayerProgressionUtils.resolveHideoutStates(hideoutObject.hideoutStations);
    }

    private resolveQuests(quests:QuestsObject, storedData:QuestsObject) {
        quests.tasks.forEach(quest => {
            PlayerProgressionUtils.resolveQuest(quest, storedData);
        })
    }

    private resolveItemsNeeded() {
        PlayerProgressionUtils.resolveItemsState()
    }
}