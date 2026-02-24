import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { IconUtils } from "../../../../utils/IconUtils";
import { MapUtils } from "../../../../utils/MapUtils";
import { PopupUtils } from "../../../../utils/PopupUtils";
import { MapRequest } from "../../../request/impl/MapRequest";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";

export class RecenterMapHandler extends AbstractMapChainHandler {

    handle(request: MapRequest) {
        if(request.event === EventConst.MAP_RECENTER_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleMouseClick(request); break;
            }
        }
        if(request.event === EventConst.WINDOW_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.WINDOW_RESIZE: this.handleMouseClick(request); break;
            }
        }

    }

    private handleMouseClick(request: MapRequest) {
        MapUtils.resizeToContainer(IconUtils.getIconComponent(request.mediator.getComponentList()), 
            PopupUtils.getPopupFloorComponent(request.mediator.getComponentList()), 
            true)
    }

}