import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { PlayerProgressionUtils } from "../../../../../utils/PlayerProgressionUtils";
import { HideoutMediator } from "../../../mediator/HideoutMediator";
import { HideoutMapUtils } from "../../../utils/HideoutMapUtils";
import { HideoutRequest } from "../../request/HideoutRequest";

export class HideoutMapHandler extends AbstractChainHandler {

    handle(request: HideoutRequest) {
        if(request.event === EventConst.HIDEOUT_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.HIDEOUT_STATION_LOGO_HOVER: this.handleLogoHover(request);
                case DataEventConst.HIDEOUT_STATION_LAYOUT_HOVER: this.handleHover(request); break;
                case DataEventConst.HIDEOUT_STATION_LOGO_HOVER_OUT: this.handleLogoHoverOut(request);
                case DataEventConst.HIDEOUT_STATION_LAYOUT_HOVER_OUT: this.handleHoverOut(request); break;
                case DataEventConst.WINDOW_RESIZE: this.resizeMap(request); break;
            }
        }
    }

    private resizeMap(request:HideoutRequest) {
        HideoutMapUtils.resizeMap(request.mediator as HideoutMediator);
    }
    
    private handleHover(request:HideoutRequest) {
        if(request.hideoutComponent && request.hideoutComponent.getCanvasElement()) {
            const state = PlayerProgressionUtils.getHideoutStationState(request.hideoutComponent.getStation().id);
            if(state.active && !state.completed) {
                HideoutMapUtils.addGlow(HideoutMapUtils.HOVER_ACTIVE_COLOR, request.hideoutComponent.getCanvasElement());
            } else if(state.completed) {
                HideoutMapUtils.addGlow(HideoutMapUtils.HOVER_COMPLETED_COLOR, request.hideoutComponent.getCanvasElement());
            } else {
                HideoutMapUtils.addGlow(HideoutMapUtils.HOVER_INACTIVE_COLOR, request.hideoutComponent.getCanvasElement());
            }
            if(request.hideoutComponent.getLogoWrapperElement()) {
                HideoutMapUtils.logoActive(request.hideoutComponent.getLogoWrapperElement());
            }
        }
    }

    private handleHoverOut(request:HideoutRequest) {
        if(request.hideoutComponent && request.hideoutComponent.getCanvasElement()) {
            HideoutMapUtils.removeGlow(request.hideoutComponent.getCanvasElement());
            this.handleLogoHoverOut(request);
        }
    }

    private handleLogoHover(request:HideoutRequest) {
        HideoutMapUtils.topMostPopup(request.hideoutComponent.getLogoWrapperElement());
        HideoutMapUtils.logoHovering(request.hideoutComponent.getLogoWrapperElement());
        // Set gradient background on popup when hovering hexagon
        HideoutMapUtils.logoActive(request.hideoutComponent.getLogoWrapperElement());
        request.hideoutComponent.getStation().levels.forEach(stationLevel => {
            const state = PlayerProgressionUtils.getStationLevelState(request.hideoutComponent.getStation().id, stationLevel.id);
            if(state) {
                if(state.active && !state.completed) {
                    HideoutMapUtils.setLogoLevelColor(HideoutMapUtils.ACTIVE_COLOR, stationLevel);
                } else if(state.completed) {
                    HideoutMapUtils.setLogoLevelColor(HideoutMapUtils.COMPLETED_COLOR, stationLevel);
                } else {
                    HideoutMapUtils.setLogoLevelColor(HideoutMapUtils.INACTIVE_COLOR, stationLevel);
                }
            }
        })
    }

    private handleLogoHoverOut(request:HideoutRequest) {
        if(request.hideoutComponent && request.hideoutComponent.getLogoWrapperElement()) {
            const state = PlayerProgressionUtils.getHideoutStationState(request.hideoutComponent.getStation().id);
            if(state.active && !state.completed) {
                HideoutMapUtils.logoHoverOut(HideoutMapUtils.ACTIVE_COLOR, request.hideoutComponent.getLogoWrapperElement());
            } else if(state.completed) {
                HideoutMapUtils.logoHoverOut(HideoutMapUtils.COMPLETED_COLOR, request.hideoutComponent.getLogoWrapperElement());
            } else {
                HideoutMapUtils.logoHoverOut(HideoutMapUtils.INACTIVE_COLOR, request.hideoutComponent.getLogoWrapperElement());
            }

        }
    }
}