import { Position } from "../../../../../../../WindowsService";
import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { EditSession } from "../../../../../quests/edit/EditSession";
import { MapBuilderHelper } from "../../../../builder/helper/MapBuilderHelper";
import { MapUtils } from "../../../../utils/MapUtils";
import { IMapRequest } from "../../../request/IMapRequest";
import { MapRequest } from "../../../request/impl/MapRequest";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";

export class MapHandler extends AbstractMapChainHandler {

    private mapInformation: MapInformation = new MapInformation();

    constructor() {
        super();
        this.mapInformation.position = new Position(0,0);
    }

    handle(request: IMapRequest) {
        if(this.eventAccepted(request.event) && request.subEvent) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_DOWN: this.handleMouseDown(request); break;
                case DataEventConst.MOUSE_UP: this.handleMouseUp(request); break;
                case DataEventConst.MOUSE_MOVE: this.handleMouseMove(request); break;
                case DataEventConst.WHEEL: this.handleWheel(request); break;
                case DataEventConst.EDIT_MODE_CHANGED: this.handleEditModeChanged(request); break;
            }
        }
    }

    private eventAccepted(event) {
        return event === EventConst.MAP_EVENT 
            || event === EventConst.FLOOR_EVENT 
            || EventConst.ICON_EVENT
            || EventConst.POPUP_EVENT
    }

    private handleMouseDown(request: IMapRequest) {
        MapUtils.mouseDown(request.mouseEvent)
    }

    private handleMouseUp(request: IMapRequest) {
        MapUtils.mouseUp(request.mouseEvent)
    }

    private handleMouseMove(request: IMapRequest) {
        MapUtils.mouseMove(request.mouseEvent)
    }

    private handleWheel(request: IMapRequest) {
        if(MapUtils.isZoomBlocked(request.mouseEvent)) {
            return;
        }
        let zoom = document.getElementById("zoom")
        if(zoom) {
            console.log(`Handling mouse wheel event in MapHandler at:  ${performance.now()}`);
            MapUtils.zoom(request.mouseEvent, zoom)
        }
    }

    private handleEditModeChanged(request:IMapRequest) {
        const reminderContainer = document.getElementById("icon-reminder");
        const mapDiv = document.getElementById("mapDiv");
        if(reminderContainer && mapDiv) {
            reminderContainer.remove();
            if(EditSession.isSessionOpen()) {
                MapBuilderHelper.createEditModeReminder(mapDiv);
            } else {
                MapBuilderHelper.createAddIconReminder(mapDiv);
            }
        }
    }
}

class MapInformation {
    scale:number;
    modifier:number;
    position:Position;
}