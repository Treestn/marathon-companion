import { MapFloorElementsData } from "../../../../../../../model/floor/IMapFloorElements";
import { FloorUtils } from "../../../../utils/FloorUtils";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { MapAdapter } from "../../../../../../../adapter/MapAdapter";

export class LoadFloorElementHandler extends AbstractChainHandler {
    
    handle(request: IMapInitRequest) {
        const storedData = FloorUtils.getStoredData(request.mapId);
        if(storedData) {
            let data:MapFloorElementsData = JSON.parse(storedData)
            if(data) {
                request.storedFloors = data;
            }
        }
    }
}