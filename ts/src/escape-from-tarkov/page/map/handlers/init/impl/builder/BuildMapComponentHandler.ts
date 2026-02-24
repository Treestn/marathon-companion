import { MapComponent } from "../../../../components/impl/MapComponent";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";

export class BuildMapComponentHandler extends AbstractChainHandler {

    private static mapDivId = "mapImage";

    handle(request: IMapInitRequest) {
        if(request.filters) {
            const mapComponent = new MapComponent(request.mediator, BuildMapComponentHandler.mapDivId, request.filters.mapImagePath, 
                request.filters.width, request.filters.height);
            request.mapBuilder.addCompass(request.filters.north);
            request.mapBuilder.addMap(mapComponent)
        }
    } 
}