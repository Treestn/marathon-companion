import { Background } from "../../../../../../background/background";
import { BackgroundHelper } from "../../../../../../background/BackgroundHelper";
import { apiState } from "../../../../../../consts";
import { PopupHelper } from "../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../constant/AppPopupMessages";
import { MessageTypes } from "../../../../../constant/MessageConst";
import { MessageInfoData } from "../../../../../../model/message/IMessageInfo";
import endpoints from "../../../../../service/tarkov-companion-api/config/endpoint";
import { TarkovCompanionService } from "../../../../../service/tarkov-companion-api/handler/TarkovCompanionService";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { AppConfigUtils } from "../../../../../utils/AppConfigUtils";
import { SessionUtils } from "../../../../../utils/SessionUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class FetchMessagesInfoHandler extends AbstractChainHandler {

    async handle(request: SidePageInitQuestRequest) {
        await this.getConfig().then(response => {

            // if(response === "Error" || response === null) {
            //     PopupHelper.addPopup("Server Error", AppPopupMessagesConst.COULD_NOT_FETCH_CONFIG, PopupHelper.ERROR_BORDER_COLOR)
            //     PopupHelper.start();
            //     return;
            // }
                    
            if(response && response.length > 0) {
                let data:MessageInfoData = JSON.parse(response)
                if(data && data.messages && data.messages.length > 0) {
                    data.messages.forEach(messageInfo => {
                        if(AppConfigUtils.getAppConfig().userSettings.getPopupDisplayedIdList().messagesDisplayed.includes(messageInfo.id)) {
                            return;
                        }
                        if(!messageInfo.minimumVersion || this.isVersionGreaterOrEqual(Background.appVersion, messageInfo.minimumVersion)) {
                            if((!messageInfo.startDate || new Date() >= new Date(messageInfo.startDate))
                                && (!messageInfo.endDate || new Date() <= new Date(messageInfo.endDate))) {
                                    let htmlTextContent = "";
                                    messageInfo.messageList.forEach(message => {
                                        htmlTextContent += `<p class=popup-content-paragraph>${message}</p>`;
                                    })
                                    let popupColor:string = "";
                                    switch(messageInfo.type) {
                                        case MessageTypes.info: popupColor = PopupHelper.INFO_BORDER_COLOR; break;
                                        case MessageTypes.green: popupColor = PopupHelper.SUCCESS_BORDER_COLOR; break;
                                        case MessageTypes.warning: popupColor = PopupHelper.WARNING_BORDER_COLOR; break;
                                        case MessageTypes.error: popupColor = PopupHelper.ERROR_BORDER_COLOR; break;
                                        case MessageTypes.twitch: popupColor = PopupHelper.TWITCH_BORDER_COLOR; break; 
                                    }
                                    PopupHelper.addPopup(messageInfo.title, htmlTextContent, popupColor);
                                    PopupHelper.start();
                                    AppConfigUtils.getAppConfig().userSettings.addDisplayedPopupList(messageInfo.id);
                            }
                        }
                    });
                    // request. = data;
                    // // request.itemsElement.items = new Map(Object.entries(JSON.parse(JSON.stringify(request.itemsElement.items))))
                    // request.itemsElement.items = new Map(Object.entries(request.itemsElement.items))
                }
            }
        })
    }

    private async getConfig(searchParams?: { [key: string]: string | undefined }):Promise<string> {
        let data = await TarkovCompanionService.getConfig(endpoints.messages_info, searchParams)
            .then(response => {
                // if(!response.ok) {
                //     return "Error"
                // }
                if(SessionUtils.getUtilityApiState() === apiState.down) {
                    SessionUtils.setUtilityApiState(apiState.up)
                    PopupHelper.addPopup("Server is back online", AppPopupMessagesConst.API_IS_BACK_ONLINE, PopupHelper.SUCCESS_BORDER_COLOR);
                    PopupHelper.start();
                }
                return response.text();
            })
            .catch(error => {
                // BackgroundHelper.setUtilityApiState(apiState.down)
                // return "Error"
            })
        if(data || data === "") {
            return data;
        }
        return null
    }

    private isVersionGreaterOrEqual(versionA:string, versionB:string): boolean {
        const splitA = versionA.split('.').map(Number);
        const splitB = versionB.split('.').map(Number);
    
        for (let i = 0; i < 3; i++) {
            const numA = splitA[i] || 0; // Default to 0 if missing
            const numB = splitB[i] || 0;
    
            if (numA > numB) return true;  // versionA is greater
            if (numA < numB) return false; // versionA is smaller
        }
    
        return true; // Equal versions
    }
}