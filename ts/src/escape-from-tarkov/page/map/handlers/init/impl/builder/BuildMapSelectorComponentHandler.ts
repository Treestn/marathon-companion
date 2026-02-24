import { MapSelectorComponent } from "../../../../components/impl/MapSelectorComponent";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { MapsList } from "../../../../../../constant/MapsConst";

export class BuildMapSelectorComponentHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        for(let map of MapsList) {
            const selectorComponent = new MapSelectorComponent(request.mediator, map.id);
            request.mapBuilder.addMapSelector(selectorComponent) 
        }
    } 
}