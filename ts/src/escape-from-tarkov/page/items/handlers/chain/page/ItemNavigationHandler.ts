import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { ItemFilterUtils } from "../../../utils/ItemFilterUtils";
import { ItemsHeaderUtils } from "../../../utils/ItemsHeaderUtils";
import { ItemsNavigationUtils } from "../../../utils/ItemsNavigationUtils";
import { ItemsRequest } from "../../request/ItemsRequest";

export class ItemNavigationHandler extends AbstractChainHandler {
    
    handle(request: ItemsRequest) {
        if(request.event === EventConst.ITEM_SEARCH) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleNavigationToItem(request); break;
            }
        }
    }

    private handleNavigationToItem(request: ItemsRequest) {
        if(!request.itemId) {
            console.log(`Cannot navigation to item because the item id was not provided`);
            return;
        }
        ItemsNavigationUtils.navigateToItems(request.itemId);
    }
}