import { MapSelectorUtils } from "../../../../utils/MapSelectorUtils";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";

export class MapSelectorInitHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        const mapDiv = document.getElementById(`mapDiv`);
        if(mapDiv) {
            MapSelectorUtils.disableCurrentlySelectedMap(request.mapId)
        }
    }
}