import { PopupHelper } from "../../../../../../popup/PopupHelper";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { IRequest } from "../../../../../types/IRequest";
import { AppConfigUtils } from "../../../../../utils/AppConfigUtils";

export class FirstTimePlayingHandler extends AbstractChainHandler {

    handle(request: IRequest) {
        if(AppConfigUtils.getAppConfig().userSettings.isFirstTimePlaying()) {
            let htmlTextContent = "";
            htmlTextContent += `<p class=popup-content-paragraph>We are glad to see you join the Companion family</p>`;
            htmlTextContent += `<p class=popup-content-paragraph>Here is a quick overview of how the app works</p>`;
            // htmlTextContent += `<p class=popup-content-paragraph>Quests are automated by default and will sync with the game by opening the trader tab</p>`;
            htmlTextContent += `<p class=popup-content-paragraph>The interactive maps display the currently active quests and more</p>`;
            htmlTextContent += `<p class=popup-content-paragraph>The maps have floors that you can cycle through with left click</p>`;
            htmlTextContent += `<p class=popup-content-paragraph>Hideout progression tracking is manual</p>`;
            htmlTextContent += `<p class=popup-content-paragraph>Items progression tracking is manual</p>`;
            htmlTextContent += `<p class=popup-content-paragraph>For any questions, join our discord!</p>`;
            PopupHelper.addPopup("Welcome to Marathon Companion", htmlTextContent, PopupHelper.INFO_BORDER_COLOR);
            PopupHelper.start();
            AppConfigUtils.getAppConfig().userSettings.setFirstTimePlaying();
            AppConfigUtils.save()
        }
    }

}