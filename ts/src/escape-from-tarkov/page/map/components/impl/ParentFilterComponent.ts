import { DataEventConst } from "../../../../events/DataEventConst";
import { EventConst } from "../../../../events/EventConst";
import { HighLevelElement } from "../../../../../model/IFilterElements";
import { MapRequest } from "../../handlers/request/impl/MapRequest";
import { IMapMediator } from "../../mediator/IMapMediator";
import { AbstractMapComponent } from "../AbstractMapComponent";
import { IParentFilterComponent } from "../type/IParentFilterComponent";

export class ParentFilterComponent extends AbstractMapComponent implements IParentFilterComponent {

    parentFilter: HighLevelElement;

    constructor(mediator:IMapMediator, targetType:string, hle:HighLevelElement) {
        super(mediator, targetType)
        this.parentFilter = hle
    }

    onclick(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.PARENT_FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_CLICK, new Date().getTime()));
    }
    
    onhover(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.PARENT_FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_HOVER, new Date().getTime()));
    }

    onmousedown(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.PARENT_FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_DOWN, new Date().getTime()));
    }

    onmouseup(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.PARENT_FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_UP, new Date().getTime()));
    }

    onmousemove(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.PARENT_FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE, new Date().getTime()));
    }

    onmouseleave(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.PARENT_FILTER_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_LEAVE, new Date().getTime()));
    }

    onwheel(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.PARENT_FILTER_EVENT, e as MouseEvent, this, DataEventConst.WHEEL, new Date().getTime()));
    }
}