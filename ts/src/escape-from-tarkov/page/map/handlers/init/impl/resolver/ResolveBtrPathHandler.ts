import { FilterConst } from "../../../../../../constant/FilterConst";
import { FilterElementsData } from "../../../../../../../model/IFilterElements";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";

export class ResolveBtrPathHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        if(request.filters) {
            this.resolve(request.filters)
        }
    }
    
    private resolve(filters:FilterElementsData) {
        const btrPathImage = document.getElementById("btrPathImage");
        if(btrPathImage) {
            for(const hle of filters.highLevelElements) {
                if(hle.active) {
                    btrPathImage.style.display = "";
                } else {
                    btrPathImage.style.display = "none";
                }
            }
        }

    }
}