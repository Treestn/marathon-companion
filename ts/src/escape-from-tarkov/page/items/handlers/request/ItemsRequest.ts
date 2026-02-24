import { HideoutLevels, HideoutStations } from "../../../../../model/HideoutObject";
import { Quest } from "../../../../../model/quest/IQuestsElements";
import { IMediator } from "../../../../types/IMediator";
import { IRequest } from "../../../../types/IRequest";
import { HideoutPageMediator } from "../../../hideout/HideoutPageMediator";
import { QuestPageMediator } from "../../../quests/QuestPageMediator";
import { ItemsPageMediator } from "../../ItemsPageMediator";
import { ItemsComponent } from "../../component/ItemsComponent";

export class ItemsRequest implements IRequest {
    event: string;
    subEvent: string;
    mediator: IMediator;
    questMediator: QuestPageMediator;
    hideoutMediator: HideoutPageMediator;
    pageMediator: ItemsPageMediator;
    htmlElement:HTMLElement;
    mouseEvent: MouseEvent;
    id:string;
    notifyOthers:boolean = true;

    itemComponent:ItemsComponent;
    itemId: string;
    quest:Quest;
    hideoutStation:HideoutStations;
    hideoutLevel:HideoutLevels;

    constructor(mediator:IMediator, event:string, subEvent:string, itemId:string, 
            mouseEvent:MouseEvent, htmlElement:HTMLElement, itemComponent?: ItemsComponent) {
        this.event = event
        this.mouseEvent = mouseEvent;
        this.subEvent = subEvent
        this.mediator = mediator
        this.itemId = itemId
        this.htmlElement = htmlElement
        this.itemComponent = itemComponent
    }
}