import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { SessionUtils } from "../../../../../utils/SessionUtils";
import { ItemFilterUtils } from "../../../utils/ItemFilterUtils";
import { ItemsInitRequest } from "../../request/ItemsInitRequest";

export class ItemInitFilters extends AbstractChainHandler {

    handle(request: ItemsInitRequest) {
        const itemFilters = SessionUtils.getFilterStates().itemsFilter;
        ItemFilterUtils.setShowMissingOnly(itemFilters.missingOnlyState);
        ItemFilterUtils.setQuest(itemFilters.quest);
        ItemFilterUtils.setHideout(itemFilters.hideout);
    }
    
}