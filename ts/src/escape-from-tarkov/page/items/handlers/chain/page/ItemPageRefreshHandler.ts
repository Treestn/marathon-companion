import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { ItemsMediator } from "../../../mediator/ItemsMediator";
import { ItemsBodyUtils } from "../../../utils/ItemsBodyUtils";
import { ItemsHeaderUtils } from "../../../utils/ItemsHeaderUtils";
import { ItemsRequest } from "../../request/ItemsRequest";

export class ItemPageRefreshHandler extends AbstractChainHandler {
    
    handle(request: ItemsRequest) {
        if(request.event === EventConst.ITEMS_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.ITEM_STATE_CHANGED: this.handleItemStateChange(request); break;
                case DataEventConst.PROGRESSION_CHANGED:
                case DataEventConst.QUEST_UPDATE:
                case DataEventConst.ITEM_PAGE_REFRESH: this.refreshPage(request); break;
            }
        }
        if(request.event === EventConst.ITEM_SEARCH) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.refreshWithoutFilters(request); break;
            }
        }
    }

    private handleItemStateChange(request: ItemsRequest) {
        if(!request.itemId || !request.htmlElement) {
            console.log(`Cannot handle item state change because the item id was not provided`);
            return;
        }
        ItemsHeaderUtils.resolveAllHeaderState();
        // ItemsHeaderUtils.resolveHeaderState(request.itemId, request.htmlElement, null, true);
    }

    private refreshWithoutFilters(request:ItemsRequest) {
        ItemsBodyUtils.refreshAllBodies();
    }

    private refreshPage(request:ItemsRequest) {
        ItemsBodyUtils.refreshBodyWithFilter((request.mediator as ItemsMediator).getComponentList());
        ItemsHeaderUtils.resolveAllHeaderState();
        ItemsBodyUtils.refreshAllBodies();
    }
}