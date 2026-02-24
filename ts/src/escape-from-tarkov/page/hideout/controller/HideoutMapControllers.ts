import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { HideoutLevels } from "../../../../model/HideoutObject";
import { HideoutComponent } from "../component/HideoutComponent";
import { HideoutRequest } from "../handlers/request/HideoutRequest";
import { HideoutMediator } from "../mediator/HideoutMediator";

export class HideoutMapControllers {

    private static hideoutMediator:HideoutMediator;
    
    static setHideoutMeditor(mediator:HideoutMediator) {
        this.hideoutMediator = mediator;
    }

    static registerWindowResize(mediator:HideoutMediator) {
        window.addEventListener('resize', (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.WINDOW_RESIZE, null, null, null
            ))
            e.stopPropagation();
        })
    }

    static registerHideoutStationClick(component:HideoutComponent, element:HTMLElement) {
        element.onclick = (e) => {
            //Do not send an update when the level is clicked, otherwise it will trigger twice
            if((e.target as HTMLElement).classList.contains("hideout-logo-popup-level")) {
                return;
            }
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_STATION_CLICK, component, null, element
            ))
            e.stopPropagation();
        }
    }

    static registerHideoutStationHover(component:HideoutComponent, element:HTMLElement) {
        element.onmousemove = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_STATION_LAYOUT_HOVER, component, null, element
            ))
            e.stopPropagation();
        }
        element.onmouseout = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_STATION_LAYOUT_HOVER_OUT, component, null, element
            ))
            e.stopPropagation();
        }
    }

    static registerHideoutLogoHover(component:HideoutComponent, element:HTMLElement) {
        element.onmousemove = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_STATION_LOGO_HOVER, component, null, element
            ))
            e.stopPropagation();
        }
        element.onmouseout = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_STATION_LOGO_HOVER_OUT, component, null, element
            ))
            e.stopPropagation();
        }
    }
    
    static registerLevelLogo(component:HideoutComponent, stationLevel:HideoutLevels, element:HTMLElement) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_STATION_LOGO_LEVEL_CLICK, component, null, element, stationLevel
            ))
            e.stopPropagation();
        }
    }
}