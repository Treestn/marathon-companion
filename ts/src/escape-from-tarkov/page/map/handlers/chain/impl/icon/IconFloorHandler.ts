import { FilterComponent } from "../../../../components/impl/FilterComponent";
import { FloorComponent } from "../../../../components/impl/FloorComponent";
import { IconComponent } from "../../../../components/impl/IconComponent";
import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { IndexConst } from "../../../../const/IndexConst";
import { FilterUtils } from "../../../../utils/FilterUtils";
import { IconUtils } from "../../../../utils/IconUtils";
import { MapUtils } from "../../../../utils/MapUtils";
import { IMapRequest } from "../../../request/IMapRequest";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";

export class IconFloorHandler extends AbstractMapChainHandler {

    // Will hide the icons that are related to a floor
    handle(request: IMapRequest) {
        // if(request.event === EventConst.FILTER_EVENT) {
        //     switch(request.subEvent) {        
        //         case DataEventConst.MOUSE_CLICK: this.handleFilterClick(request); break;
        //     }
        // }
        // if(request.event === EventConst.PARENT_FILTER_EVENT) {
        //     switch(request.subEvent) {        
        //         case DataEventConst.MOUSE_CLICK: this.handleParentFilterClick(request); break;
        //     }
        // }
    }


    private handleParentFilterClick(request:IMapRequest) {
        if(request.component instanceof FilterComponent) {
            const isActive = request.component.filter.active;
            IconUtils.getAllIconsByType(request.component.filter.name).forEach(iconDiv => {
                if(isActive) {
                    iconDiv.style.visibility = '';
                    iconDiv.style.zIndex = IndexConst.ICON;
                } else {
                    iconDiv.style.visibility = 'hidden';
                    iconDiv.style.zIndex = IndexConst.HIDDEN;
                }
            })
        }
    }

    private handleFilterClick(request:IMapRequest) {

    }
}