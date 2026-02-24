import { MapRecenterComponent } from "../../../../components/impl/MapRecenterComponent";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";

export class BuildMapRecenterComponentHandler extends AbstractChainHandler {

    private static mapDivId = "recenter-resize";

    handle(request: IMapInitRequest) {
        const recenterComponent = new MapRecenterComponent(request.mediator, BuildMapRecenterComponentHandler.mapDivId); 
        request.mapBuilder.addMapRecenter(recenterComponent)
    } 
}