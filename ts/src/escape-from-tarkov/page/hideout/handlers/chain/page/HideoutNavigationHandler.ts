import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { HideoutStationPageBuilder } from "../../../builder/helper/HideoutStationPageBuilder";
import { HideoutNavigationUtils } from "../../../utils/HideoutNavigationUtils";
import { HideoutStationPageUtils } from "../../../utils/HideoutStationPageUtils";
import { HideoutUtils } from "../../../utils/HideoutUtils";
import { HideoutRequest } from "../../request/HideoutRequest";

export class HideoutNavigationHandler extends AbstractChainHandler {

    handle(request: HideoutRequest) {
        if(request.event === EventConst.HIDEOUT_NAVIGATION) {
            switch(request.subEvent) {
                case DataEventConst.HIDEOUT_STATION_NAVIGATION: this.handleStationNavigation(request); break;
                case DataEventConst.HIDEOUT_STATION_LEVEL_NAVIGATION: this.handleStationLevelNavigation(request); break;
                case DataEventConst.HIDEOUT_STATION_LEVEL_REQUIREMENT_NAVIGATION: this.handleStationLevelRequirementNavigation(request); break;
                case DataEventConst.HIDEOUT_STATION_LEVEL_CRAFT_NAVIGATION: this.handleStationLevelCraftNavigation(request); break;
            }
        }
        if(request.event === EventConst.HIDEOUT_SEARCH) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleStationLevelRequirementNavigation(request);
            }
        }
    }
    
    private handleStationNavigation(request:HideoutRequest) {
        if(!request.hideoutComponent) {
            console.log(`Cannot navigation to station because the component is null`);
            return;
        }
        HideoutNavigationUtils.navigateToStation(request.hideoutComponent.getStation().id, true)
    }

    private handleStationLevelNavigation(request:HideoutRequest) {
        if(!request.hideoutLevel) {
            console.log(`Cannot navigation to station level because the station or the level is null`);
            return;
        }
        const station = HideoutUtils.getStationWithLevelId(request.hideoutLevel.id);
        if(station) {
            HideoutNavigationUtils.navigateToStationLevel(station.id, request.hideoutLevel.id, true)
        }
    }

    private handleStationLevelRequirementNavigation(request:HideoutRequest) {
        if(!request.hideoutLevel) {
            console.log(`Cannot navigation to station level because the station or the level is null`);
            return;
        }
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

    private handleStationLevelCraftNavigation(request:HideoutRequest) {
        if(!request.hideoutLevel || !request.id) {
            console.log(`Cannot navigation to station level because the station or the level or the target craft id is null`);
            return;
        }
        const station = HideoutUtils.getStationWithLevelId(request.hideoutLevel.id);
        if(station) {
            HideoutNavigationUtils.navigateToStationLevelCraft(station.id, request.hideoutLevel.id, request.id, true)
        }
    }
}