import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { FilterUtils } from "../../../../utils/FilterUtils";
import { MapRequest } from "../../../request/impl/MapRequest";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";

export class FilterStateHandler extends AbstractMapChainHandler {

    handle(request:MapRequest) {
        if(request.event === EventConst.ICON_UPDATE) {
            switch(request.subEvent) {
                case DataEventConst.ADD_ICON: this.handleFilterStateRefresh(request); this.handleQuestFilterState(request); break;
                case DataEventConst.QUEST_UPDATE: this.handleQuestFilterState(request); break;
            }
        }
        if(request.event === EventConst.ICON_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: {
                    if(request.mouseEvent.ctrlKey && request.mouseEvent.shiftKey) {
                        this.handleFilterStateRefresh(request); this.handleQuestFilterState(request); break;
                    }
                }
            }
        }
    }

    private handleFilterStateRefresh(request:MapRequest) {
        FilterUtils.refreshAllFilterAmount(request.mediator.getFilter())
    }

    private handleQuestFilterState(request:MapRequest) {
        FilterUtils.refreshQuestEntityAmount(request.mediator.getFilter());
    }

}