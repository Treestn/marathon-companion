import { PopupHelper } from "../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../constant/AppPopupMessages";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { ItemsElementUtils } from "../../../../../utils/ItemsElementUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class ResolveItemsElementHandler extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        if(request.itemsElement && request.storedItemsElement) {
            // Updating
            // this.resolve(request.itemsElement, request.storedItemsElement)
            ItemsElementUtils.setItemsMap(request.itemsElement)
            ItemsElementUtils.save()

        } else if(request.itemsElement && !request.storedItemsElement) {
            // First time or just deleted the stored data
            ItemsElementUtils.setItemsMap(request.itemsElement)
            ItemsElementUtils.save()

        } else if(!request.itemsElement && request.storedItemsElement) {
            // Version did not change
            ItemsElementUtils.setItemsMap(request.storedItemsElement)
            request.itemsElement = request.storedItemsElement

        } else {
            //Server is down and nothing is stored
            PopupHelper.addFatalPopup(AppPopupMessagesConst.FATAL_ERROR_NO_CONFIG, 
                "Items config is missing")
        }
    }

    // private resolve(itemsObject:ItemsV2Object, stored:ItemsV2Object) {
    //     for(let [key, storedValue] of stored.items) {
    //         if(key.includes("imageLink")) {
    //             const value = itemsObject.items.get(key)
    //             if(!value) {
    //                 ItemsElementUtils.setItemToJson(key.replace(" imageLink", ""), storedValue, " imageLink")
    //             }
    //         }
    //     }
    // }
}