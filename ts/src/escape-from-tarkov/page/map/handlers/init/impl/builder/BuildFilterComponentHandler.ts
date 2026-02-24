import { FilterComponent } from "../../../../components/impl/FilterComponent";
import { ParentFilterComponent } from "../../../../components/impl/ParentFilterComponent";
import { IMapMediator } from "../../../../mediator/IMapMediator";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { Elements, HighLevelElement } from "../../../../../../../model/IFilterElements";

export class BuildFilterComponentHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        if(request.filters) {
            request.filters.highLevelElements.forEach(hle => {
                
                request.mapBuilder.addParentFilter(this.buildParentFilterComponent(request.mediator, hle.name, hle));
                hle.elements.forEach(element => {
                    request.mapBuilder.addFilter(this.buildFilterComponent(request.mediator, element.name, hle, element));
                })
            })
        }
    }

    private buildParentFilterComponent(mediator:IMapMediator, targetType:string, hle:HighLevelElement):ParentFilterComponent {
        return new ParentFilterComponent(mediator, `${targetType}-filter`, hle)
    }
    
    private buildFilterComponent(mediator:IMapMediator, targetType:string, hle:HighLevelElement, element:Elements):FilterComponent {
        return new FilterComponent(mediator, `${targetType}-filter`, hle, element);
    }
}