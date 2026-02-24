import { HideoutStations, HideoutLevels } from "../../../../../model/HideoutObject";
import { Quest } from "../../../../../model/quest/IQuestsElements";
import { IMediator } from "../../../../types/IMediator";
import { IRequest } from "../../../../types/IRequest";
import { ItemsPageMediator } from "../../../items/ItemsPageMediator";
import { QuestPageMediator } from "../../../quests/QuestPageMediator";
import { HideoutPageMediator } from "../../HideoutPageMediator";
import { HideoutComponent } from "../../component/HideoutComponent";

export class HideoutRequest implements IRequest {
    event: string;
    subEvent: string;
    mediator: IMediator;
    questMediator:QuestPageMediator;
    itemsMediator:ItemsPageMediator;
    pageMediator: HideoutPageMediator;
    htmlElement:HTMLElement;
    mouseEvent: MouseEvent;
    id:string;
    notifyOthers:boolean = true;

    quest:Quest

    itemId:string;
        
    hideoutComponent: HideoutComponent;
    hideoutStation:HideoutStations;
    hideoutLevel:HideoutLevels;

    constructor(mediator:IMediator, event:string, subEvent:string, component:HideoutComponent, 
            mouseEvent:MouseEvent, htmlElement:HTMLElement, level?:HideoutLevels, id?:string, station?:HideoutStations) {
        this.event = event
        this.mouseEvent = mouseEvent;
        this.subEvent = subEvent
        this.mediator = mediator
        this.hideoutComponent = component
        this.htmlElement = htmlElement
        this.hideoutStation = station;
        this.hideoutLevel = level;
        this.id = id;
    }
}