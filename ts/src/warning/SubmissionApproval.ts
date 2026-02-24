import { IFrame } from "../IFrame";
import { NavigationController } from "../escape-from-tarkov/page/side-bar-menu/controller/NavigationController";
import { AppConfigUtils } from "../escape-from-tarkov/utils/AppConfigUtils";
import { I18nHelper } from "../locale/I18nHelper";

export class SubmissionApproval extends IFrame {


    constructor(editButton:HTMLElement, reviewButton:HTMLButtonElement) {
        super("submission-rules-guidelines-frame", "./submissionApproval.html")
        this.frame.addEventListener("load", () => {
            this.registerListeners(editButton, reviewButton);
        })
    }

    async registerListeners(editButton:HTMLElement, reviewButton:HTMLButtonElement) {
        
        I18nHelper.init();

        const rulesContainer = this.frame.contentWindow.document.getElementById("submissions-terms-rules-container");
        if(rulesContainer) {
            const rules = this.frame.contentWindow.document.getElementById("submissions-terms-rules-guideline");
            rules.innerHTML = I18nHelper.get("pages.submissions.rules.title")

            const rule1 = this.frame.contentWindow.document.getElementById("submissions-terms-text-1");
            rule1.innerHTML = I18nHelper.get("pages.submissions.rules.1")
            const rule2 = this.frame.contentWindow.document.getElementById("submissions-terms-text-2");
            rule2.innerHTML = I18nHelper.get("pages.submissions.rules.2")
            const rule3 = this.frame.contentWindow.document.getElementById("submissions-terms-text-3");
            rule3.innerHTML = I18nHelper.get("pages.submissions.rules.3")
            const rule4 = this.frame.contentWindow.document.getElementById("submissions-terms-text-4");
            rule4.innerHTML = I18nHelper.get("pages.submissions.rules.4")
            const rule5 = this.frame.contentWindow.document.getElementById("submissions-terms-text-5");
            rule5.innerHTML = I18nHelper.get("pages.submissions.rules.5")
            const rule6 = this.frame.contentWindow.document.getElementById("submissions-terms-text-6");
            rule6.innerHTML = I18nHelper.get("pages.submissions.rules.6")
            const rule7 = this.frame.contentWindow.document.getElementById("submissions-terms-text-7");
            rule7.innerHTML = I18nHelper.get("pages.submissions.rules.7")
            const rule8 = this.frame.contentWindow.document.getElementById("submissions-terms-text-8");
            rule8.innerHTML = I18nHelper.get("pages.submissions.rules.8")
            const rule9 = this.frame.contentWindow.document.getElementById("submissions-terms-text-9");
            rule9.innerHTML = I18nHelper.get("pages.submissions.rules.9")

            const notice = this.frame.contentWindow.document.getElementById("submissions-terms-notice");
            notice.innerHTML = I18nHelper.get("pages.submissions.notice")
        }

        const yesButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("yes") as HTMLButtonElement;
        if(yesButton) {
            yesButton.textContent = I18nHelper.get("pages.submissions.yes")
            yesButton.addEventListener("click", () => {
                NavigationController.editSessionApproved(editButton, reviewButton);
                this.close()
            })
        }


        const noButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("no") as HTMLButtonElement;
        if(noButton) {
            noButton.addEventListener("click", () => {
                super.close()
            })
        }
    }
}