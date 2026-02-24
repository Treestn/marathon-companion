import { PopupHelper } from "../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../constant/AppPopupMessages";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { HideoutUtils } from "../../../../hideout/utils/HideoutUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class ResolveHideoutElementHandler extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        if(request.hideoutElement && request.storedItemsElement) {
            // Updating
            HideoutUtils.save(request.hideoutElement)

        } else if(request.hideoutElement && !request.storedHideoutElement) {
            // First time or just deleted the stored data
            HideoutUtils.save(request.hideoutElement)

        } else if(!request.hideoutElement && request.storedHideoutElement) {
            // Version did not change
            request.hideoutElement = request.storedHideoutElement
        } else {
            //Server is down and nothing is stored
            PopupHelper.addFatalPopup(AppPopupMessagesConst.FATAL_ERROR_NO_CONFIG, 
                "Items config is missing")
        }

        for(const station of request.hideoutElement.hideoutStations) {
            for(const stationLevel of station.levels) {
                if(!stationLevel.itemPveRequirements && stationLevel.itemRequirements) {
                    stationLevel.itemPveRequirements = JSON.parse(JSON.stringify(stationLevel.itemRequirements));
                    for(const requirement of stationLevel.itemPveRequirements) {
                        requirement.quantity = requirement.quantity / 2;
                    }
                    console.log("WRONNNNNGGGG");
                    
                }
            }
        }
        HideoutUtils.save(request.hideoutElement)

        HideoutUtils.setHideoutObject(request.hideoutElement)
    }
}