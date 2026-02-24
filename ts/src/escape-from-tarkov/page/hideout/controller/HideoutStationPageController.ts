import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { HideoutLevels, HideoutStations } from "../../../../model/HideoutObject";
import { HideoutRequest } from "../handlers/request/HideoutRequest";
import { HideoutMediator } from "../mediator/HideoutMediator";

export class HideoutStationPageController {

    private static hideoutMediator:HideoutMediator;
    
    static setHideoutMeditor(mediator:HideoutMediator) {
        this.hideoutMediator = mediator;
    }

    static registerCloseStationPage(element:HTMLElement) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_STATION_PAGE_EVENT, 
                DataEventConst.HIDEOUT_STATION_PAGE_CLOSE, null, null, element
            ))
            e.stopPropagation();
        }
    }

    static registerShowRequirementButton(element:HTMLElement, station:HideoutStations, stationLevel:HideoutLevels) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_LEVEL_REQUIREMENT_CLICK, null, null, element, stationLevel, null, station
            ))
            e.stopPropagation();
        }
    }

    static registerShowCraftsButton(element:HTMLElement, station:HideoutStations, stationLevel:HideoutLevels) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_LEVEL_CRAFT_CLICK, null, null, element, stationLevel, null, station
            ))
            e.stopPropagation();
        }
    }

}