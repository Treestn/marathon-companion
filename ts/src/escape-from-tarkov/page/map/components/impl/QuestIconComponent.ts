import { DataEventConst } from "../../../../events/DataEventConst";
import { EventConst } from "../../../../events/EventConst";
import { Elements, HighLevelElement, ListElementEntity } from "../../../../../model/IFilterElements";
import { Quest } from "../../../../../model/quest/IQuestsElements";
import { MapRequest } from "../../handlers/request/impl/MapRequest";
import { IMapMediator } from "../../mediator/IMapMediator";
import { IconComponent } from "./IconComponent";

export class QuestIconComponent extends IconComponent {

    quest:Quest;

    constructor(mediator:IMapMediator, targetType:string, hle:HighLevelElement, 
        element: Elements, entity: ListElementEntity, quest:Quest) {
        super(mediator, targetType, hle, element, entity)
        this.quest = quest
    }

    onclick(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.QUEST_ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_CLICK, new Date().getTime()))
    }

    onhover(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.QUEST_ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_HOVER, new Date().getTime()))
    }

    onmouseleave(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.QUEST_ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_LEAVE, new Date().getTime()))
    }

    onmousedown(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.QUEST_ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_DOWN, new Date().getTime()));
    }

    onmouseup(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.QUEST_ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_UP, new Date().getTime()));
    }

    onmousemove(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.QUEST_ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE, new Date().getTime()));
    }

    onmousemovealpha(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.QUEST_ICON_EVENT, e as MouseEvent, this, DataEventConst.MOUSE_MOVE_ALPHA, new Date().getTime()));
    }

    onwheel(e) {
        this.mediator.update(new MapRequest(this.mediator, EventConst.QUEST_ICON_EVENT, e as WheelEvent, this, DataEventConst.WHEEL, new Date().getTime()));
    }
}