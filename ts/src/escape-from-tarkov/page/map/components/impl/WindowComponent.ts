import { DataEventConst } from "../../../../events/DataEventConst";
import { EventConst } from "../../../../events/EventConst";
import { MapRequest } from "../../handlers/request/impl/MapRequest";
import { IMapMediator } from "../../mediator/IMapMediator";
import { AbstractMapComponent } from "../AbstractMapComponent";

export class WindowComponent extends AbstractMapComponent {

    constructor(mediator:IMapMediator, targetType:string) {
        super(mediator, targetType)
    }

    onwindowresize(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.WINDOW_EVENT, e as MouseEvent, this, DataEventConst.WINDOW_RESIZE, new Date().getTime()))
    }

    onclick(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.WINDOW_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_CLICK, new Date().getTime()))
    }

    onhover(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.WINDOW_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_HOVER, new Date().getTime()))
    }

    onmouseleave(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.WINDOW_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_LEAVE, new Date().getTime()))
    }

    onmousedown(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.WINDOW_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_DOWN, new Date().getTime()));
    }

    onmouseup(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.WINDOW_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_UP, new Date().getTime()));
    }

    onmousemove(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.WINDOW_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE, new Date().getTime()));
    }

    onmousemovealpha(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.WINDOW_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE_ALPHA, new Date().getTime()));
    }

    onwheel(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.WINDOW_EVENT, e as WheelEvent, this, DataEventConst.WHEEL, new Date().getTime()));
    }
}