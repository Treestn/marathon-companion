import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { PlayerProgressionUtils } from "../../../../../utils/PlayerProgressionUtils";
import { HideoutBodyBuilder } from "../../../builder/helper/HideoutBodyBuilder";
import { HideoutBodyUtils } from "../../../utils/HideoutBodyUtils";
import { HideoutHeaderUtils } from "../../../utils/HideoutHeaderUtils";
import { HideoutRequest } from "../../request/HideoutRequest";

export class HideoutPageRefreshHandler extends AbstractChainHandler {
    
    handle(request: HideoutRequest) {
        // if(request.event === EventConst.HIDEOUT_EVENT) {
        //     switch(request.subEvent) {
        //         case DataEventConst.HIDEOUT_LEVEL_ACTIVE:
        //         case DataEventConst.HIDEOUT_ACTIVE:
        //         case DataEventConst.HIDEOUT_COMPLETED:
        //         case DataEventConst.HIDEOUT_PAGE_STATE_REFRESH:
        //         case DataEventConst.PROGRESSION_CHANGED:
        //         case DataEventConst.HIDEOUT_LEVEL_COMPLETED: this.refreshPageState(request); break;
        //     }
        // }
    }
    
    private handleStationActivation(request: HideoutRequest) {
        if(!request.hideoutComponent) {
            return;
        }
        const stationState = PlayerProgressionUtils.getHideoutStationState(request.hideoutComponent.getStation().id);
        if(stationState) {
            if(stationState.active) {

            } else {
                request.htmlElement.remove();
            }
        }
    }

    private handleStationLevelActivation(request: HideoutRequest) {
        if(!request.hideoutComponent || !request.hideoutLevel) {
            return;
        }
        const levelState = PlayerProgressionUtils.getStationLevelState(request.hideoutComponent.getStation().id, request.hideoutLevel.id);
        if(levelState) {
            if(levelState.active) {
                HideoutBodyBuilder.createBody
            } else {
                request.htmlElement.remove();
            }
        }
    }

    private refreshPageState(request: HideoutRequest) {
        HideoutHeaderUtils.refreshAllPageStates();
        HideoutBodyUtils.resolveRequirements();
    }
}