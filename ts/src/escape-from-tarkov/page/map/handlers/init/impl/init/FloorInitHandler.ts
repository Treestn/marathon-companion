import { IndexConst } from "../../../../const/IndexConst";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";

export class FloorInitHandler extends AbstractChainHandler {

    async handle(request: IMapInitRequest) {
        request.floors.elements.forEach(floorElement => {
            floorElement.floors.forEach(floor => {
                if(floor.active) {
                    const floorDiv = document.getElementById(String(floor.UUID));
                    if(floorDiv) {
                        floorDiv.style.visibility = '';
                        floorDiv.style.zIndex = floor.z_index ? String(floor.z_index) : IndexConst.FLOOR;
                    }
                }
            })
        })
    }
    
}