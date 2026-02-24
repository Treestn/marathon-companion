import { Elements } from "../../../../../../../model/IFilterElements";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";

export class ResolveFilterBoxStateHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        request.filters.highLevelElements.forEach(hle => {
            hle.elements.forEach(element => {
                this.resolveElement(element)
            })
            let allElementsInactive = true;
            for(let element of hle.elements) {
                if(element.active) {
                    allElementsInactive = false;
                    break;
                }
            }
            if(allElementsInactive) {
                hle.active = false;
            } else {
                hle.active = true
            }
        })
    }

    private resolveElement(element:Elements) {
        if(element.active) {
            this.changeAllEntityState(element, true);
        } else {
            this.changeAllEntityState(element, false);
        }
    }

    private changeAllEntityState(element:Elements, state:boolean) {
        element.listElements.forEach(entity => {
            entity.active = state;
        })
    }
}