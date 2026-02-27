import { BackgroundHelper } from "../../../../../../background/BackgroundHelper";
import { apiState } from "../../../../../../consts";
import { PopupHelper } from "../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../constant/AppPopupMessages";
import { ItemsModel } from "../../../../../../model/items/IItemsElements";
import endpoints from "../../../../../service/tarkov-companion-api/config/endpoint";
import { TarkovCompanionService } from "../../../../../service/tarkov-companion-api/handler/TarkovCompanionService";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { AppConfigUtils } from "../../../../../utils/AppConfigUtils";
import { SessionUtils } from "../../../../../utils/SessionUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class FetchItemsElementHandler extends AbstractChainHandler {

    async handle(request: SidePageInitQuestRequest) {
        if(!request.itemsElement) {
            const version = request.storedItemsElement != null ? request.storedItemsElement.version : null;
            await this.getConfig(request.storedItemsElement?.locale, version).then(response => {

                if(response === "Error" || response === null) {
                    PopupHelper.addPopup("Server Error", AppPopupMessagesConst.COULD_NOT_FETCH_CONFIG, PopupHelper.ERROR_BORDER_COLOR)
                    PopupHelper.start();
                    return;
                }
                        
                if(response.length > 0) {
                    let data:ItemsModel = JSON.parse(response)
                    if(data) {
                        request.itemsElement = data;
                        // // request.itemsElement.items = new Map(Object.entries(JSON.parse(JSON.stringify(request.itemsElement.items))))
                        // request.itemsElement.items = new Map(Object.entries(request.itemsElement.items))
                    }
                }
            })
        }
    }

    private async getConfig(currentLocale:string, version?:string, searchParams?: { [key: string]: string | undefined }):Promise<string> {
        // if(BackgroundHelper.getUtilityApiState() === apiState.down) {
        //     return "Error"
        // }
        const locale = AppConfigUtils.getAppConfig().userSettings.getLocalePreference()
        if(version === null || version === undefined) {
            version = "0.0.0";
        }
        let data = await TarkovCompanionService.getConfig(
            endpoints.items_v2_config(locale, version),
            searchParams,
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