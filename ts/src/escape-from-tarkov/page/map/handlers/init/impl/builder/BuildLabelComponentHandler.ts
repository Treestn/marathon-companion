import { FilterConst } from "../../../../../../constant/FilterConst";
import { Elements, HighLevelElement, ListElementEntity } from "../../../../../../../model/IFilterElements";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { LabelComponent } from "../../../../components/impl/LabelComponent";
import { IMapMediator } from "../../../../mediator/IMapMediator";
import { IMapInitRequest } from "../../../request/IMapInitRequest";

export class BuildLabelComponentHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        if(request.filters) {
            for(const hle of request.filters.highLevelElements) {
                if(hle.name === FilterConst.LABEL.name) {
                    for(const element of hle.elements) {
                        for(const entity of element.listElements) {
                            request.mapBuilder.addLabel(this.buildLabelComponent(request.mediator, hle, element, entity));
                        }
                    }
                    return;
                }
            }
        }
    }

        
    private buildLabelComponent(mediator:IMapMediator, hle:HighLevelElement, element:Elements, entity: ListElementEntity):LabelComponent {
        return new LabelComponent(mediator, String(entity.id), hle, element, entity);
    }
}