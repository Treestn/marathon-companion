import { FilterUtils } from "../../../../utils/FilterUtils";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { FilterConst } from "../../../../../../constant/FilterConst";
import { Elements, HighLevelElement } from "../../../../../../../model/IFilterElements";
import { NavigationUtils } from "../../../../../../utils/NavigationUtils";

export class FilterInitHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        // Handle filter states
        request.filters.highLevelElements.forEach(hle => {
            this.resolveHle(hle);
            hle.elements.forEach(element => {
                this.resolveElement(element);
            })
        })

        // Handle filter amount for quests
        FilterUtils.refreshQuestEntityAmount(request.filters);
    }

    private resolveHle(hle:HighLevelElement) {
        const filter = FilterUtils.getFilterWrapper(hle.name);
        if(hle.active) {
            FilterUtils.activateFilter(filter);
        } else {
            FilterUtils.deactivateFilter(filter);
        }
    }

    private resolveElement(element:Elements) {
        const filter = FilterUtils.getFilterWrapper(element.name);
        if(element.active) {
            FilterUtils.activateFilter(filter);
        } else {
            FilterUtils.deactivateFilter(filter);
        }
    }
}