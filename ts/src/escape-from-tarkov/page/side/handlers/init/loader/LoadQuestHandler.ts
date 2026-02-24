import { QuestsObject } from "../../../../../../model/quest/IQuestsElements";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { IMapInitRequest } from "../../../../map/handlers/request/IMapInitRequest";
import { QuestsUtils } from "../../../../quests/utils/QuestsUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class LoadQuestHandler  extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        const storedQuests = QuestsUtils.getStoredData();
        if(storedQuests) {
            let data:QuestsObject = JSON.parse(storedQuests)
            if(data) {
                request.storedQuests = data;
            }
        }
    }

}