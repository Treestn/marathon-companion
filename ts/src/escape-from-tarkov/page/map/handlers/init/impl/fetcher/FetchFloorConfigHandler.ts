import { apiState } from "../../../../../../../consts";
import { PopupHelper } from "../../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../../constant/AppPopupMessages";
import { MapFloorElementsData } from "../../../../../../../model/floor/IMapFloorElements";
import endpoints from "../../../../../../service/tarkov-companion-api/config/endpoint";
import { TarkovCompanionService } from "../../../../../../service/tarkov-companion-api/handler/TarkovCompanionService";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { SessionUtils } from "../../../../../../utils/SessionUtils";

export class FetchFloorConfigHandler extends AbstractChainHandler {

    async handle(request: IMapInitRequest) {
        if(!request.floors) {
            const version = request.storedFloors != null ? request.storedFloors.version : null;
            await this.getConfig(version, request.mapId).then(response => {
                if(response === "Error" || response === null) {
                    "Adding popup"
                    PopupHelper.addPopup("Server Error", AppPopupMessagesConst.COULD_NOT_FETCH_CONFIG, PopupHelper.ERROR_BORDER_COLOR)
                    PopupHelper.start();
                    return;
                }
                        
                if(response.length > 0) {
                    let data:MapFloorElementsData = JSON.parse(response)
                    if(data) {
                        request.floors = data;
                    }
                }
            })
        }
    }
    

    private async getConfig(version?:string, mapId?:string):Promise<string> {
        // if(BackgroundHelper.getUtilityApiState() === apiState.down) {
        //     return "Error"
        // }
        if(version === null || version === undefined) {
            version = "0.0.0";
        }
        let data:string = await TarkovCompanionService.getConfig(
            endpoints.map_floor_config_v2(mapId, version),
        )
            .then(response => {
                if(!response.ok) {
                    return "Error"
                }
                if(SessionUtils.getUtilityApiState() === apiState.down) {
                    SessionUtils.setUtilityApiState(apiState.up)
                    PopupHelper.addPopup("Server is back online", AppPopupMessagesConst.API_IS_BACK_ONLINE, PopupHelper.SUCCESS_BORDER_COLOR);
                    PopupHelper.start();
                }
                return response.text();
            })
            .catch(error => {
                SessionUtils.setUtilityApiState(apiState.down)
                return "Error"
            })
        if(data || data === "") {
            return data;
        }
        return null
    }
}