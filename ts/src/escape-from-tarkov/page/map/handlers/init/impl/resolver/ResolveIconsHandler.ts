import { PopupHelper } from "../../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../../constant/AppPopupMessages";
import { Elements, FilterElementsData, ListElementEntity } from "../../../../../../../model/IFilterElements";
import { FilterUtils } from "../../../../utils/FilterUtils";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { MapAdapter } from "../../../../../../../adapter/MapAdapter";

export class ResolveIconsHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        // Set to protected
        // this.resolve(request.storedFilters, request.storedFilters);
        // FilterUtils.save(request.storedFilters)

        if(request.filters && request.storedFilters) {
            // Updating
            this.resolve(request.filters, request.storedFilters)
            FilterUtils.save(request.filters)

        } else if(request.filters && !request.storedFilters) {
            // First time or just deleted the stored data
            FilterUtils.save(request.filters)

        } else if(!request.filters && request.storedFilters) {
            // Version did not change
            request.filters = request.storedFilters

        } else {
            //Server is down and nothing is stored
            PopupHelper.addFatalPopup(AppPopupMessagesConst.FATAL_ERROR_NO_CONFIG, 
                "FilterElements config is missing for " + MapAdapter.getMapFromId(request.mapId))
        }
        request.mediator.addMapFilter(request.mapId, request.filters);
    }

    private resolve(fetchedData:FilterElementsData, storedData:FilterElementsData) {
        fetchedData.highLevelElements.forEach(newElement => {
            let element = storedData.highLevelElements.find(element => element.name === newElement.name)
            if(element != undefined) {
                newElement.active = element.active
                this.resolveElements(newElement.elements, element.elements)
            }
        })
    }

    private resolveElements(newElementList:Elements[], storedElementList:Elements[]) {
        newElementList.forEach(newElement => {
            let storedElement = storedElementList.find(oldElement => oldElement.name === newElement.name)
            if(storedElement != undefined) {
                newElement.active = storedElement.active
                this.resolveListElementsEntity(newElement.listElements, storedElement.listElements)
            }
        })
    }

    
    private resolveListElementsEntity(newElementList:ListElementEntity[], storedElementList:ListElementEntity[]) {
        newElementList.forEach(newElement => {
            let storedElement = storedElementList.find(oldElement => oldElement.id === newElement.id)
            if(storedElement != undefined) {
                newElement.active = storedElement.active
                // Set to protected
                // newElement.protectedEntity = true;
            }
        })
        storedElementList.forEach(storedElement => {
            let element = newElementList.find(element => element.id === storedElement.id)
            if(!element && !storedElement.protectedEntity) {
                newElementList.push(storedElement)
            }
        })
        // this.offsetPosition(newElementList, 100, 0)
    }

    private multiplyPosition(newElementList:ListElementEntity[], multiplier:number) {
        newElementList.forEach(element => {
            element.x *= multiplier
            element.y *= multiplier
        })
    }

    private offsetPosition(newElementList:ListElementEntity[], offsetX:number, offsetY:number) {
        newElementList.forEach(element => {
            element.x += offsetX
            element.y += offsetY
        })
    }

}