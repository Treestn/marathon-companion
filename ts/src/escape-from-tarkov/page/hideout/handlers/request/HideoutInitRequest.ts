import { IRequest } from "../../../../types/IRequest";
import { HideoutBuilder } from "../../builder/HideoutBuilder";
import { HideoutMediator } from "../../mediator/HideoutMediator";

export class HideoutInitRequest implements IRequest {

    event: string;
    subEvent: string;
    mediator: HideoutMediator;
    builder: HideoutBuilder;

    constructor(mediator:HideoutMediator) {
        this.mediator = mediator;
        this.builder = new HideoutBuilder();
    }
}