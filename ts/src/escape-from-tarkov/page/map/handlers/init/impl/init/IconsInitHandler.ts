import { FloorUtils } from "../../../../utils/FloorUtils";
import { IconUtils } from "../../../../utils/IconUtils";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { EditSession } from "../../../../../quests/edit/EditSession";
import { FilterConst } from "../../../../../../constant/FilterConst";
import { IndexConst } from "../../../../const/IndexConst";

export class IconsInitHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        request.filters.highLevelElements.forEach(hle => {
            if(hle.active) {
                hle.elements.forEach(element => {
                    if(element.active) {
                        element.listElements.forEach(entity => {
                            if(entity.active) {
                                if(hle.name === FilterConst.LABEL.name) {
                                    IconUtils.unhideIcon(String(entity.id), request.filters.map, String(IndexConst.LABEL))
                                } else {
                                    if(entity.floor) {
                                        if(FloorUtils.isFloorActive(request.floors, entity.floor)) {
                                            IconUtils.unhideIcon(String(entity.id), request.filters.map)
                                        }
                                    } else {
                                        IconUtils.unhideIcon(String(entity.id), request.filters.map)
                                    }
                                }
                            } else if(EditSession.isSessionOpen() && EditSession.doesMapFilterIconExist(request.filters.map, entity.id)) {
                                entity.active = true;
                                IconUtils.unhideIcon(String(entity.id), request.filters.map);
                            }
                        })
                    }
                })
            }
        })
    }
}