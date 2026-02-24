import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { HideoutLevels, HideoutStations } from "../../../../model/HideoutObject";
import { HideoutRequest } from "../handlers/request/HideoutRequest";
import { HideoutMediator } from "../mediator/HideoutMediator";

export class HideoutLevelStateController {

    private static hideoutMediator:HideoutMediator;
    
    static setHideoutMeditor(mediator:HideoutMediator) {
        this.hideoutMediator = mediator;
    }

    static registerBlockedButton(element:HTMLElement, station:HideoutStations, stationLevel:HideoutLevels) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_STATE_EVENT, 
                DataEventConst.HIDEOUT_LEVEL_INACTIVE, null, null, element, stationLevel, null, station)
            )
            e.stopPropagation();
        }
    }

    static registerActivateButton(element:HTMLElement, station:HideoutStations, stationLevel:HideoutLevels) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_STATE_EVENT, 
                DataEventConst.HIDEOUT_LEVEL_ACTIVE, null, null, element, stationLevel, null, station)
            )
            e.stopPropagation();
        }
    }

    static registerBuildButton(element:HTMLElement, station:HideoutStations, stationLevel:HideoutLevels) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_STATE_EVENT, 
                DataEventConst.HIDEOUT_LEVEL_COMPLETED, null, null, element, stationLevel, null, station)
            )
            e.stopPropagation();
        }
    }

}