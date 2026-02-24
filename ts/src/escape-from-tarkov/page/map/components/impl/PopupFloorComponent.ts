import { DataEventConst } from "../../../../events/DataEventConst";
import { EventConst } from "../../../../events/EventConst";
import { Building } from "../../../../../model/floor/IMapFloorElements";
import { MapRequest } from "../../handlers/request/impl/MapRequest";
import { IMapMediator } from "../../mediator/IMapMediator";
import { AbstractMapComponent } from "../AbstractMapComponent";
import { IFloorComponent } from "../type/IFloorComponent";
import { IPopupFloorComponent } from "../type/IPopupFloorComponent";

export class PopupFloorComponent extends AbstractMapComponent implements IPopupFloorComponent {

    floorsComponent:IFloorComponent[] = [];
    building: Building;
    id:string;
    isDisplayed:boolean = false;
  
    constructor(mediator:IMapMediator, targetType:string, building:Building) {
        super(mediator, targetType)
        this.building = building;
        this.id = targetType;
    }

    onclick(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.POPUP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_CLICK, new Date().getTime()));
    }
    
    onhover(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.POPUP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_HOVER, new Date().getTime()));
    }

    onmousedown(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.POPUP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_DOWN, new Date().getTime()));
    }

    onmouseup(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.POPUP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_UP, new Date().getTime()));
    }

    onmousemove(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.POPUP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE, new Date().getTime()));
    }

    onmouseleave(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.POPUP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_LEAVE, new Date().getTime()));
    }

    onwheel(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.POPUP_EVENT, e as MouseEvent, this, DataEventConst.WHEEL, new Date().getTime()));
    }
}