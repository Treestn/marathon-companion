import { IFrame } from "../IFrame";
import { AppConfigUtils } from "../escape-from-tarkov/utils/AppConfigUtils";
import { I18nHelper } from "../locale/I18nHelper";

export class ExternalLink extends IFrame {

    private link:string;

    constructor(link) {
        super("external-link-frame", "./ExternalLinkWarning.html")
        this.frame.addEventListener("load", () => {
            this.registerListeners();
        })
        this.link = link;
    }

    async registerListeners() {
        I18nHelper.init();
        const checkboxContainer:HTMLElement = this.frame.contentWindow.document.getElementById("do-not-show-again") as HTMLElement;
        const checkbox:HTMLInputElement = this.frame.contentWindow.document.getElementsByClassName("show-again-input")[0] as HTMLInputElement;
        if(checkbox && checkboxContainer) {
            checkboxContainer.addEventListener("click", (e) => {
                if((e.target as HTMLInputElement).getAttribute("class") === "show-again-input") {
                    return;
                }
                if(checkbox.checked) {
                    checkbox.checked = false
                } else {
                    checkbox.checked = true
                }
            })    
        }

        const yesButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("yes") as HTMLButtonElement;
        if(yesButton) {
            yesButton.textContent = I18nHelper.get("pages.externalLinkWarning.yes")
            yesButton.addEventListener("click", () => {
                AppConfigUtils.getAppConfig().userSettings.setExternalLinkWarning(checkbox.checked ? "false" : "true")
                window.open(this.link, '_blank');
                super.close()
            })
        }


        const noButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("no") as HTMLButtonElement;
        if(noButton) {
            noButton.textContent = I18nHelper.get("pages.externalLinkWarning.no")
            noButton.addEventListener("click", () => {
                super.close()
            })
        }
    }
}