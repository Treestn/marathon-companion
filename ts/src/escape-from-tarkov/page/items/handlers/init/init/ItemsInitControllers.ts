import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { AppConfigUtils } from "../../../../../utils/AppConfigUtils";
import { SessionUtils } from "../../../../../utils/SessionUtils";
import { ItemController } from "../../../controller/ItemController";
import { ItemFilterController } from "../../../controller/ItemFilterController";
import { ItemFilterUtils } from "../../../utils/ItemFilterUtils";
import { ItemsInitRequest } from "../../request/ItemsInitRequest";

export class ItemsInitControllers extends AbstractChainHandler {

    handle(request: ItemsInitRequest) {
        ItemController.setItemsMediator(request.mediator);
        ItemFilterController.setItemsMediator(request.mediator);
        const itemFilters = SessionUtils.getFilterStates().itemsFilter;
        ItemFilterUtils.setShowMissingOnly(itemFilters.missingOnlyState);
        ItemFilterUtils.setQuest(itemFilters.quest);
        ItemFilterUtils.setHideout(itemFilters.hideout);
    }

}