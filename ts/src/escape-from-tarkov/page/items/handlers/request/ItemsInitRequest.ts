import { IRequest } from "../../../../types/IRequest";
import { ItemsBuilder } from "../../builder/ItemsBuilder";
import { ItemsMediator } from "../../mediator/ItemsMediator";

export class ItemsInitRequest implements IRequest {

    event: string;
    subEvent: string;
    mediator: ItemsMediator;
    builder: ItemsBuilder;

    constructor(mediator:ItemsMediator) {
        this.mediator = mediator;
        this.builder = new ItemsBuilder();
    }
}