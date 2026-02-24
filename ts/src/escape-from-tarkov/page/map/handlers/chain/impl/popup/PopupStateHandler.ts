import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { IMapRequest } from "../../../request/IMapRequest";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";

export class PopupStateHandler extends AbstractMapChainHandler {

    handle(request: IMapRequest) {
        if(request.event === EventConst.ICON_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleMouseClick(request); break;
                case DataEventConst.MOUSE_HOVER: this.handleHoveringIcon(request); break;
                case DataEventConst.MOUSE_MOVE_ALPHA: this.handleNotHoveringAnymore(request); break;
                case DataEventConst.MOUSE_LEAVE: this.handleNotHoveringAnymore(request); break;
            }
        }
    }
    
    private handleMouseClick(request:IMapRequest) {
        console.log("Clicked an icon");
    }

    private handleHoveringIcon(request:IMapRequest) {
        console.log("Hovering an icon");
    }

    private handleNotHoveringAnymore(request:IMapRequest) {
        console.log("Not hovering the icon");
    }
}