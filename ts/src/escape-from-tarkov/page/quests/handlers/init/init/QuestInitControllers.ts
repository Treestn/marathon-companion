import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { SearchBarController } from "../../../../controller/SearchBarController";
import { ItemController } from "../../../../items/controller/ItemController";
import { QuestBodyController } from "../../../controller/QuestBodyController";
import { QuestFilterController } from "../../../controller/QuestFilterController";
import { QuestHeaderController } from "../../../controller/QuestHeaderController";
import { QuestImageController } from "../../../controller/QuestImageController";
import { QuestSearchController } from "../../../controller/QuestSearchController";
import { QuestInitRequest } from "../../request/QuestInitRequest";

export class QuestInitControllers extends AbstractChainHandler {

    handle(request: QuestInitRequest) {
        QuestFilterController.setMediator(request.mediator);
        QuestHeaderController.setMediator(request.mediator);
        QuestBodyController.setMediator(request.mediator);
        QuestImageController.setMediator(request.mediator);
        QuestSearchController.setMediator(request.mediator);
        SearchBarController.setQuestMediator(request.mediator);
        ItemController.setQuestMediator(request.mediator);
    }
}