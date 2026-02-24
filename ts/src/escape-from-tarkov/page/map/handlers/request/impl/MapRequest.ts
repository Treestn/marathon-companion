import { QuestPageMediator } from "../../../../quests/QuestPageMediator";
import { QuestSidePageMediator } from "../../../../side/QuestSidePageMediator";
import { IMapsComponent } from "../../../components/IMapsComponent";
import { IMapMediator } from "../../../mediator/IMapMediator";
import { IMapRequest } from "../IMapRequest";

export class MapRequest implements IMapRequest {

    mediator: IMapMediator;
    questMediator:QuestPageMediator;
    sidePageMediator:QuestSidePageMediator;
    event: string;
    subEvent: string;
    mouseEvent:MouseEvent;
    component: IMapsComponent;
    time:number
    notifyOthers:boolean = true;

    constructor(mediator:IMapMediator, event:string, mouseEvent, component:IMapsComponent, subEvent:string, time:number) {
        this.mediator = mediator
        this.event = event
        this.mouseEvent = mouseEvent
        this.component = component
        this.subEvent = subEvent
        this.time = time;
    }
}