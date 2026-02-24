import { MapBuilderHelper } from "../../../../builder/helper/MapBuilderHelper";
import { IconComponent } from "../../../../components/impl/IconComponent";
import { IconUtils } from "../../../../utils/IconUtils";
import { MapUtils } from "../../../../utils/MapUtils";
import { PopupUtils } from "../../../../utils/PopupUtils";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { AppConfigUtils } from "../../../../../../utils/AppConfigUtils";
import { EditSession } from "../../../../../quests/edit/EditSession";
import { MapAdapter } from "../../../../../../../adapter/MapAdapter";

export class MapInitHandler extends AbstractChainHandler {

    async handle(request: IMapInitRequest) {
        if(this.canBeProcessed(request)) {
            console.log("Processing: " + MapAdapter.getMapFromId(request.mapId));
            const mapDiv = document.getElementById("mapDiv");
            // MapBuilderHelper.addAuthorDiv(mapDiv, request.filters.author);
            if(EditSession.isSessionOpen()) {
                MapBuilderHelper.createEditModeReminder(mapDiv)
            } else {
                MapBuilderHelper.createAddIconReminder(mapDiv)
            }
            MapUtils.resizeToContainer(IconUtils.getIconComponent(request.mediator.getComponentList()), 
                PopupUtils.getPopupFloorComponent(request.mediator.getComponentList()),
                false);
            MapUtils.setScaler(AppConfigUtils.getAppConfig().userSettings.getMapZoomSensitivity());
        }
    }

    private canBeProcessed(request:IMapInitRequest):boolean {
        if(!request.filters.map || !request.filters.mapImagePath) {
            console.log("Map Builder: No Map");
            return false;
        }
        if(!request.filters.author) {
            console.log("Map Builder: No Author");
        }
        if(!request.filters.width || !request.filters.height) {
            console.log("Map Builder: No Width or Height");
        }
        return true;
    }
}