import { FilterElementsData } from "../../../../../../../model/IFilterElements";
import { FilterUtils } from "../../../../utils/FilterUtils";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { MapAdapter } from "../../../../../../../adapter/MapAdapter";

export class LoadFilterElementHandler extends AbstractChainHandler {
    
    handle(request: IMapInitRequest) {
        const storedData = FilterUtils.getStoredData(request.mapId)
        if(storedData) {
            let data:FilterElementsData = JSON.parse(storedData)
            if(data) {
                request.storedFilters = data;
            }
        }
    }
}