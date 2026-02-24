import { FilterUtils } from "../../../../utils/FilterUtils";
import { FloorUtils } from "../../../../utils/FloorUtils";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { FilterConst } from "../../../../../../constant/FilterConst";

export class FloorGlowInitHandler extends AbstractChainHandler {
    handle(request: IMapInitRequest) {
        if(FilterUtils.isFilterActive(request.filters, FilterConst.QUESTS.name)) {
            FloorUtils.resolveQuestFloorGlow(FilterUtils.getQuestFromFilter(request.filters), request.floors)
        }
    }
}