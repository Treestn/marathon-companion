import { DataEventConst } from "../../../../events/DataEventConst";
import { EventConst } from "../../../../events/EventConst";
import { MapRequest } from "../../handlers/request/impl/MapRequest";
import { IMapMediator } from "../../mediator/IMapMediator";
import { AbstractMapComponent } from "../AbstractMapComponent";
import { IPopupIconComponent } from "../type/IPopupIconComponent";
import { IconComponent } from "./IconComponent";

export class PopupIconComponent extends AbstractMapComponent implements IPopupIconComponent {

    icon: IconComponent;
    id:string;
    isDisplayed:boolean = false;
    imageEventListenersLoaded = false;
    nextImage:number = 0;
  
    constructor(mediator:IMapMediator, targetType:string, icon:IconComponent) {
        super(mediator, targetType)
        this.icon = icon;
        this.icon.popupComponent = this;
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