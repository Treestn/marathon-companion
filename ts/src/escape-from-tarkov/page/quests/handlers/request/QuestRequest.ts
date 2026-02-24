import { OWQuestEvent } from "../../../../../in_game/handler/IEvents";
import { Quest } from "../../../../../model/quest/IQuestsElements";
import { IMediator } from "../../../../types/IMediator";
import { IRequest } from "../../../../types/IRequest";
import { ItemsPageMediator } from "../../../items/ItemsPageMediator";
import { MapPageMediator } from "../../../map/MapPageMediator";
import { QuestSidePageMediator } from "../../../side/QuestSidePageMediator";
import { QuestPageMediator } from "../../QuestPageMediator";

export class QuestRequest implements IRequest {
    event: string;
    subEvent: string;
    mediator: IMediator;
    pageMediator: QuestPageMediator;
    mapPageMediator:MapPageMediator;
    sidePageMediator:QuestSidePageMediator;
    itemsPageMediator:ItemsPageMediator;
    quest:Quest;
    htmlElement:HTMLElement;
    mouseEvent: MouseEvent;
    id:string;
    notifyOthers:boolean = true;
    itemId:string;
    mapId:string;

    constructor(mediator:IMediator, event:string, subEvent:string, quest:Quest, 
            mouseEvent:MouseEvent, htmlElement:HTMLElement) {
        this.event = event
        this.subEvent = subEvent
        this.mediator = mediator
        this.quest = quest
        this.htmlElement = htmlElement
    }
}