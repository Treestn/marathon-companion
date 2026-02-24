import { FloorComponent } from "../../../../components/impl/FloorComponent";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";

export class BuildFloorComponentHandler extends AbstractChainHandler {

    private static floorDiv = "floor-div";

    handle(request: IMapInitRequest) {
        if(request.floors) {
            request.floors.elements.forEach(floorElement => {
                floorElement.floors.forEach(floor => {
                    const floorComponent = new FloorComponent(request.mediator, String(floor.UUID), floorElement, floor);
                    request.mapBuilder.addFloor(floorComponent)
                })
            })
        }
    } 
    
}