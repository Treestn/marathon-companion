import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { QuestsFiltersUtils } from "../../../utils/QuestsFiltersUtils";
import { QuestInitRequest } from "../../request/QuestInitRequest";

export class QuestFilterInitHandler extends AbstractChainHandler {

    handle(request: QuestInitRequest) {
        QuestsFiltersUtils.resolveOrderState();
        QuestsFiltersUtils.resolveTraderState();
        QuestsFiltersUtils.resolveTypeState();
        QuestsFiltersUtils.resolveQuestStateFilterState();
        QuestsFiltersUtils.resolveMapFilterState();
    }
}