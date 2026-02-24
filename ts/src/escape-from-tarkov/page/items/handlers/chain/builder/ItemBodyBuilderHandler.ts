import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { ItemsBodyUtils } from "../../../utils/ItemsBodyUtils";
import { ItemsRequest } from "../../request/ItemsRequest";

export class ItemBodyBuilderHandler extends AbstractChainHandler {
    
    handle(request: ItemsRequest) {
        if(request.event === EventConst.ITEMS_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.ITEM_CLICK: this.handleItemClick(request); break;
            }
        }
    }

    private handleItemClick(request: ItemsRequest) {
        if(!request.itemComponent || !request.htmlElement) {
            console.log(`Cannot handle item click because the item component was not provided`);
            return;
        }
        const body = ItemsBodyUtils.getItemBody(request.itemComponent.itemId);
        if(body) {
            ItemsBodyUtils.removeItemBodyWithId(request.itemComponent.itemId);
        } else {
            ItemsBodyUtils.addItemBody(request.itemComponent);
        }
    }
}