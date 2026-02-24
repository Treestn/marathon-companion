import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { QuestInitRequest } from "../../request/QuestInitRequest";

export class BuildQuestPage extends AbstractChainHandler {

    handle(request: QuestInitRequest) {
        request.builder.build();
    }

}