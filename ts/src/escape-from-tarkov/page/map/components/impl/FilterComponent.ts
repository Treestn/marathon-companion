import { DataEventConst } from "../../../../events/DataEventConst";
import { EventConst } from "../../../../events/EventConst";
import { Elements, HighLevelElement } from "../../../../../model/IFilterElements";
import { MapRequest } from "../../handlers/request/impl/MapRequest";
import { IMapMediator } from "../../mediator/IMapMediator";
import { AbstractMapComponent } from "../AbstractMapComponent";
import { IFilterComponent } from "../type/IFIlterComponent";

export class FilterComponent extends AbstractMapComponent implements IFilterComponent {

    parentFilter: HighLevelElement;
    filter: Elements;

    constructor(mediator:IMapMediator, targetType:string, hle:HighLevelElement, filter:Elements) {
        super(mediator, targetType)
        this.parentFilter = hle
        this.filter = filter
    }

    onclick(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_CLICK, new Date().getTime()));
    }
    
    onhover(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_HOVER, new Date().getTime()));
    }

    onmousedown(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_DOWN, new Date().getTime()));
    }

    onmouseup(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_UP, new Date().getTime()));
    }

    onmousemove(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE, new Date().getTime()));
    }

    onmouseleave(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_LEAVE, new Date().getTime()));
    }

    onwheel(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.FILTER_EVENT, e as MouseEvent, this, DataEventConst.WHEEL, new Date().getTime()));
    }
}