import { HideoutObject } from "../../../../../../model/HideoutObject";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { HideoutUtils } from "../../../../hideout/utils/HideoutUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class LoadHideoutElementHandler extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        const storedHideout = HideoutUtils.getStoredData();
        if(storedHideout) {
            let data:HideoutObject = JSON.parse(storedHideout)
            if(data) {
                request.storedHideoutElement = data;
            }
        }
    }

}