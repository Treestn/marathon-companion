import { apiState } from "../../../../../../consts";
import { PopupHelper } from "../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../constant/AppPopupMessages";
import { HideoutObject } from "../../../../../../model/HideoutObject";
import endpoints from "../../../../../service/tarkov-companion-api/config/endpoint";
import { TarkovCompanionService } from "../../../../../service/tarkov-companion-api/handler/TarkovCompanionService";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { SessionUtils } from "../../../../../utils/SessionUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class FetchHideoutElementHandler extends AbstractChainHandler {

    async handle(request: SidePageInitQuestRequest) {
        if(!request.hideoutElement) {
            const version = request.storedHideoutElement != null ? request.storedHideoutElement.version : null;
            await this.getConfig(version).then(response => {

                if(response === "Error" || response === null) {
                    PopupHelper.addPopup("Server Error", AppPopupMessagesConst.COULD_NOT_FETCH_CONFIG, PopupHelper.ERROR_BORDER_COLOR)
                    PopupHelper.start();
                    return;
                }
                        
                if(response.length > 0) {
                    let data:HideoutObject = JSON.parse(response)
                    if(data) {
                        request.hideoutElement = data;
                    }
                }
            })
        }
    }

    private async getConfig(version?:string, searchParams?: { [key: string]: string | undefined }):Promise<string> {
        // if(BackgroundHelper.getUtilityApiState() === apiState.down) {
        //     return "Error"
        // }
        if(version === null || version === undefined) {
            version = "0.0.0";
        }
        let data = await TarkovCompanionService.getConfig(endpoints.hideout_config(version), searchParams)
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