import { PopupHelper } from "../../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../../constant/AppPopupMessages";
import { Floor, MapFloorElementsData } from "../../../../../../../model/floor/IMapFloorElements";
import { FloorUtils } from "../../../../utils/FloorUtils";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { MapAdapter } from "../../../../../../../adapter/MapAdapter";

export class ResolveFloorsHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        if(request.floors && request.storedFloors) {
            // Updating
            this.resolve(request.floors, request.storedFloors)
            FloorUtils.save(request.floors)

        } else if(request.floors && !request.storedFloors) {
            // First time or just deleted the stored data
            FloorUtils.save(request.floors)

        } else if(!request.floors && request.storedFloors) {
            // Version did not change
            request.floors = request.storedFloors

        } else {
            //Server is down and nothing is stored
            PopupHelper.addFatalPopup(AppPopupMessagesConst.FATAL_ERROR_NO_CONFIG, 
                "FilterElements config is missing for " + MapAdapter.getMapFromId(request.mapId))
        }
        request.mediator.addMapFloors(request.mapId, request.floors)
    }

    private resolve(fetchedData:MapFloorElementsData, storedData:MapFloorElementsData) {
        fetchedData.elements.forEach(newElement => {
            let storedElement = storedData.elements.find(element => element.UUID === newElement.UUID)
            if(storedElement != undefined) {
                this.resolveFloors(newElement.floors, storedElement.floors)
            }
        })
    }

    private resolveFloors(newElement:Floor[], storedElement:Floor[]) {
        newElement.forEach(newFloor => {
            let storedFloor = storedElement.find(storedFloor => storedFloor.UUID === newFloor.UUID)
            if(storedFloor !== undefined) {
                newFloor.active = storedFloor.active
            }
        })
    }
}