import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { ItemsElementUtils } from "../../../../../utils/ItemsElementUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class LoadItemsElementHandler extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        const data = ItemsElementUtils.getStoredData();
        if(data && data !== "undefined") {
            const itemsData = JSON.parse(data)
            // itemsData.items = new Map(Object.entries(JSON.parse(JSON.stringify(itemsData.items))))
            // itemsData.items = new Map(Object.entries(JSON.parse(JSON.stringify(itemsData.items))))
            request.storedItemsElement = itemsData;
        } else {
            console.log("No items elements saved");
        }
    }

}