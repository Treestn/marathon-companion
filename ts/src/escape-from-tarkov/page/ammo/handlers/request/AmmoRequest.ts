import { IMediator } from "../../../../types/IMediator";
import { IRequest } from "../../../../types/IRequest";
import { AmmoPageMediator } from "../../AmmoPageMediator";

export class AmmoRequest implements IRequest {
    event: string;
    subEvent: string;
    mediator: IMediator;
    pageMediator: AmmoPageMediator;
    mouseEvent: MouseEvent;
    htmlElement:HTMLElement;
    notifyOthers:boolean = true;

    constructor(mediator:IMediator, event:string, subEvent:string, mouseEvent:MouseEvent, htmlElement:HTMLElement) {
        this.event = event
        this.subEvent = subEvent
        this.mediator = mediator
        this.htmlElement = htmlElement
        this.mouseEvent = mouseEvent
    }
}