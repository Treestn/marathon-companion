import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";
import { initSidePanelTrades } from "../../../../../../shared/pages/trading/initSidePanelTrades";

export class BuildSidePageQuests extends AbstractChainHandler {
    handle(request: SidePageInitQuestRequest) {
        request.builder.build();
        // Initialize side panel trades
        initSidePanelTrades();
    }    
}