import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { HideoutStationPageBuilder } from "../../../builder/helper/HideoutStationPageBuilder";
import { HideoutStationPageUtils } from "../../../utils/HideoutStationPageUtils";
import { HideoutUtils } from "../../../utils/HideoutUtils";
import { HideoutRequest } from "../../request/HideoutRequest";

export class HideoutStationPageHandler extends AbstractChainHandler {

    handle(request: HideoutRequest) {
        if(request.event === EventConst.HIDEOUT_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.HIDEOUT_STATION_LOGO_LEVEL_CLICK:
                case DataEventConst.HIDEOUT_STATION_CLICK: this.openStationPage(request); break;
            }
        }
        if(request.event === EventConst.HIDEOUT_STATION_PAGE_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.HIDEOUT_STATION_PAGE_CLOSE: this.closeStationPage(); break;
            }
        }
    }
    
    private openStationPage(request: HideoutRequest) {
        if(request.hideoutComponent && request.hideoutComponent.getStation()) {
            HideoutStationPageUtils.openStationPage(request.hideoutComponent.getStation(), request.hideoutLevel)
        } else if(request.hideoutStation) {
            HideoutStationPageUtils.openStationPage(request.hideoutStation, request.hideoutLevel)
        } else if(request.hideoutLevel) {
            const station = HideoutUtils.getStationWithLevelId(request.hideoutLevel.id);
            if(station) {
                HideoutStationPageUtils.openStationPage(station, request.hideoutLevel)
            }
        }
    }

    private closeStationPage() {
        HideoutStationPageBuilder.closeStationPage();
    }
}