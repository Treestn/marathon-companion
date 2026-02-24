import { DataEventConst } from "../../../../events/DataEventConst";
import { EventConst } from "../../../../events/EventConst";
import { MapRequest } from "../../handlers/request/impl/MapRequest";
import { IMapMediator } from "../../mediator/IMapMediator";
import { AbstractMapComponent } from "../AbstractMapComponent";
import { IMapComponent } from "../type/IMapComponent";

export class MapComponent extends AbstractMapComponent implements IMapComponent {

    src: string;
    width: number;
    height: number;

    constructor(mediator:IMapMediator, targetType:string, src:string, width:number, height:number) {
        super(mediator, targetType)
        this.src = src
        this.width = width
        this.height = height
    }

    onclick(e) {
        //nothing to do when map itself is clicked
        // let request:IMapRequest = new MapRequest(this.mediator, EventConst.MAP_CLICK, );

        // this.mediator.update(request)
    }

    onhover(e) {
        //nothing to do
        this.mediator.update(new MapRequest(this.mediator, EventConst.MAP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_HOVER, new Date().getTime()));
    }

    onmousedown(e) {
        // let request = new MapRequest(this.mediator, EventConst.MOUSE_DOWN, e, "");
        this.mediator.update(new MapRequest(this.mediator, EventConst.MAP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_DOWN, new Date().getTime()));
    }

    onmouseup(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.MAP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_UP, new Date().getTime()));
    }

    onmousemove(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.MAP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE, new Date().getTime()));
    }

    onmouseleave(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.MAP_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_LEAVE, new Date().getTime()));
    }

    onwheel(e) {
        console.log(`Handling map mouse wheel event at:  ${performance.now()}`);
        this.mediator.update(new MapRequest(this.mediator, EventConst.MAP_EVENT, e as WheelEvent, this, DataEventConst.WHEEL, new Date().getTime()));
    }
}