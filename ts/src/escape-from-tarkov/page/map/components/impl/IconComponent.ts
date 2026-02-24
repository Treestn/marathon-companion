import { DataEventConst } from "../../../../events/DataEventConst";
import { EventConst } from "../../../../events/EventConst";
import { Elements, HighLevelElement, ListElementEntity } from "../../../../../model/IFilterElements";
import { Dimension } from "../../../../utils/Dimension";
import { MapRequest } from "../../handlers/request/impl/MapRequest";
import { IMapMediator } from "../../mediator/IMapMediator";
import { AbstractMapComponent } from "../AbstractMapComponent";
import { IIconComponent } from "../type/IIconComponent";
import { PopupIconComponent } from "./PopupIconComponent";

export class IconComponent extends AbstractMapComponent implements IIconComponent {

    hle: HighLevelElement;
    element:Elements;
    entity:ListElementEntity;
    iconDivRef:HTMLDivElement;
    popupComponent:PopupIconComponent;
    computedStyle;
    x:number;
    y:number;
    isActive:boolean = false;

    constructor(mediator:IMapMediator, targetType:string, hle:HighLevelElement, 
            element: Elements, entity: ListElementEntity) {
        super(mediator, targetType)
        this.hle = hle;
        this.element = element;
        this.entity = entity;
    }

    isCentered() {
        return this.element.centered;
    }

    getDimension() {
        return new Dimension(this.element.width, this.element.height);
    }

    onclick(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_CLICK, new Date().getTime()));
    }
    
    onhover(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_HOVER, new Date().getTime()));
    }

    onmousedown(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_DOWN, new Date().getTime()));
    }

    onmouseup(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_UP, new Date().getTime()));
    }

    onmousemove(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE, new Date().getTime()));
    }

    onmouseleave(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_LEAVE, new Date().getTime()));
    }

    onwheel(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.ICON_EVENT, e as MouseEvent, this, DataEventConst.WHEEL, new Date().getTime()));
    }
}