import { DataEventConst } from "../../../../events/DataEventConst";
import { EventConst } from "../../../../events/EventConst";
import { Building, Floor } from "../../../../../model/floor/IMapFloorElements";
import { MapRequest } from "../../handlers/request/impl/MapRequest";
import { IMapMediator } from "../../mediator/IMapMediator";
import { AbstractMapComponent } from "../AbstractMapComponent";
import { IFloorComponent } from "../type/IFloorComponent";
import { IPopupFloorComponent } from "../type/IPopupFloorComponent";

export class FloorComponent extends AbstractMapComponent implements IFloorComponent {

    building: Building;
    floor: Floor;
    popupComponent:IPopupFloorComponent;
    popupDivRef:HTMLElement;

    constructor(mediator:IMapMediator, targetType:string, floors:Building, floor: Floor) {
        super(mediator, targetType)
        this.building = floors
        this.floor = floor;
    }
    

    onclick(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FLOOR_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_CLICK, new Date().getTime()))
    }

    onhover(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FLOOR_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_HOVER, new Date().getTime()))
    }

    onmouseleave(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FLOOR_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_LEAVE, new Date().getTime()))
    }

    onmousedown(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FLOOR_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_DOWN, new Date().getTime()));
    }

    onmouseup(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FLOOR_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_UP, new Date().getTime()));
    }

    onmousemove(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FLOOR_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE, new Date().getTime()));
    }

    onmousemovealpha(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FLOOR_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE_ALPHA, new Date().getTime()));
    }

    onwheel(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FLOOR_EVENT, e as WheelEvent, this, DataEventConst.WHEEL, new Date().getTime()));
    }
}