import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { ItemsRequest } from "../../request/ItemsRequest";

export class ItemStateChangeHandler extends AbstractChainHandler {
    
    handle(request: ItemsRequest) {
        if(request.event === EventConst.ITEMS_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.ITEM_STATE_CHANGED: this.handleItemStateChange(request); break;
            }
        }
    }

    private handleItemStateChange(request: ItemsRequest) {
        if(!request.itemId) {
            console.log(`Cannot handle item state change because the item id was not provided`);
            return;
        }

    }
}