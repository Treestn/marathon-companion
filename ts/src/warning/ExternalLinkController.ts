import { settingsKeys } from "../consts";
import { AppConfigUtils } from "../escape-from-tarkov/utils/AppConfigUtils";
import { ExternalLink } from "./ExternalLink";

export class ExternalLinkController {

    public static openExternalLinkEventListener(htmlElement:HTMLElement,link:string) {
        htmlElement.addEventListener("click", () => {
            const warning:string = AppConfigUtils.getAppConfig().userSettings.getExternalLinkWarning()
            if(warning === undefined || warning === null || warning === "true") {
                new ExternalLink(link).open();
            } else {
                window.open(link, '_blank');
            }
        });
    }

    public static openExternalLink(link:string) {
        const warning:string = AppConfigUtils.getAppConfig().userSettings.getExternalLinkWarning()
        if(warning === undefined || warning === null || warning === "true") {
            new ExternalLink(link).open();
        } else {
            window.open(link, '_blank');
        }
    }
}