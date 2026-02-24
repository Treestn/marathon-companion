import { IFrame } from "../IFrame";
import { ExternalLinkController } from "../warning/ExternalLinkController";
import { AboutUs } from "../legal/AboutUs";
import { PrivacyPolicy } from "../legal/PrivacyPolicy";
import { TermsOfServices } from "../legal/TermsOfServices";

export class Support extends IFrame {

    private static _instance:Support;

    private constructor() {
        super("support-frame", "./support.html")
        this.frame.addEventListener("load", () => {
            this.registerListeners();
        })
    }

    public static instance() {
        if(!Support._instance) {
            Support._instance = new Support();
        }
        return Support._instance
    }

    registerListeners() {
        let faqList = this.frame.contentWindow.document.getElementsByClassName("faq-header-button")
        if(faqList) {
            for(let i = 0; i < faqList.length; i++) {
                faqList[i].addEventListener("click", () => {
                    const content = (faqList[i].parentNode as HTMLDivElement).getElementsByClassName("dropdown-content")[0] as HTMLDivElement
                    if(content.style.display === "none") {
                        content.style.display = "flex";
                    } else {
                        content.style.display = "none";
                    }
                })
                const content = (faqList[i].parentNode as HTMLDivElement).getElementsByClassName("dropdown-content")[0] as HTMLDivElement
                content.style.display = "none";
            }
        }

        let tarkovDevLink = this.frame.contentWindow.document.getElementById("tarkovDev-link")
        ExternalLinkController.openExternalLinkEventListener(tarkovDevLink, "https://tarkov.dev/");

        let checkmarkLink = this.frame.contentWindow.document.getElementById("checkmark-link")
        ExternalLinkController.openExternalLinkEventListener(checkmarkLink, "https://icons8.com/icon/VFaz7MkjAiu0/done");

        let checkmarkWebsiteLink = this.frame.contentWindow.document.getElementById("checkmark-website")
        ExternalLinkController.openExternalLinkEventListener(checkmarkWebsiteLink, "https://icons8.com");

        let reshotLink = this.frame.contentWindow.document.getElementById("reshot-link")
        ExternalLinkController.openExternalLinkEventListener(reshotLink, "https://www.reshot.com/");
        
        let termsOfServices = this.frame.contentWindow.document.getElementById("terms-of-services")
        if(termsOfServices) {
            termsOfServices.addEventListener("click", () => {
                TermsOfServices.instance().open()
            })
        }

        let privacyPolicy = this.frame.contentWindow.document.getElementById("privacy-policy")
        if(privacyPolicy) {
            privacyPolicy.addEventListener("click", () => {
                PrivacyPolicy.instance().open()
            })
        }

        let aboutUs = this.frame.contentWindow.document.getElementById("about-us")
        if(aboutUs) {
            aboutUs.addEventListener("click", () => {
                AboutUs.instance().open()
            })
        }
    }
}