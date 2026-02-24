import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { SearchBarController } from "../../../../controller/SearchBarController";
import { QuestsFiltersUtils } from "../../../../quests/utils/QuestsFiltersUtils";
import { PlayerLevelController } from "../../../controller/PlayerLevelController";
import { SidePageQuestsController } from "../../../controller/SidePageQuestsController";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class SidePageQuestInitControllersHandler extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        QuestsFiltersUtils.init()
        SidePageQuestsController.setMediator(request.mediator)
        PlayerLevelController.setMediator(request.mediator)
        SearchBarController.setSidePageQuestMediator(request.mediator)
    }

}