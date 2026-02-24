import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { NavigationUtils } from "../../../../../utils/NavigationUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class MapFilterInitHandler extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {      
        NavigationUtils.initMapFilterEnabled();
    }

}