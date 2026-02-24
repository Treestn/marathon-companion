import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { NavigationUtils } from "../../../../../utils/NavigationUtils";
import { ItemsRequest } from "../../../../items/handlers/request/ItemsRequest";
import { QuestRequest } from "../../request/QuestRequest";

export class NotifyItemsHandler extends AbstractChainHandler {

    async handle(request: QuestRequest) {
        if(request.notifyOthers && request.event === EventConst.ITEM_SEARCH) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: await this.handleItemSearch(request); break;
            }
        }
    }

    private async handleItemSearch(request:QuestRequest) {
        if(request.itemId) {
            await NavigationUtils.loadItemsNeededPage();
            request.itemsPageMediator.update(new ItemsRequest(request.itemsPageMediator, EventConst.ITEM_SEARCH, 
                DataEventConst.MOUSE_CLICK, request.itemId, null, null));
        }
    }
    
}