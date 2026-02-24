import { IRequest } from "../../../../types/IRequest";
import { QuestSidePageMediator } from "../../../side/QuestSidePageMediator";
import { QuestBuilder } from "../../builder/impl/QuestBuilder";
import { QuestMediator } from "../../mediator/QuestMediator";

export class QuestInitRequest implements IRequest {

    event: string;
    subEvent: string;
    mediator: QuestMediator;
    sidePageQuestsMediator:QuestSidePageMediator;
    builder:QuestBuilder;

    constructor(mediator:QuestMediator) {
        this.mediator = mediator;
        this.builder = new QuestBuilder();
    }
}