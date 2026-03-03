import { SidePageQuestController } from "../../escape-from-tarkov/page/controller/SidePageQuestController";
import { WindowsService } from "../../WindowsService";
import { Background } from "../background";
import { SubscriptionPageHandler } from "./SubscriptionPageHandler";

export class SubscriptionHelper {

    static isSubscribed() {
        // return false;
        let status = Background.instance().getSubscriptionStatus();
        if(status && (status.state === 'ACTIVE' || status.state === 'PENDING_CANCELLATION')) {
            return true;
        }
        return false;
    }

    static isSubscribedHandler() {
        // this.isNotSubscribeHandler();
        // console.log("Subscribed: Removing ads");
        
        // const adScript = document.getElementById("owad-script")
        // if(adScript) { adScript.remove() }
        
        // const adsContainer = document.getElementById("ads-container")
        // if(adsContainer) { adsContainer.remove() }

        // Background.instance().killAdInstance()
        // SidePageQuestController.subsriptionChanged();
    }

    static isNotSubscribeHandler() {
        console.log("Not Subscribed: Reloading ads");
        const adRunnerContainer = document.getElementById("ad-runner-container")
        if(adRunnerContainer?.children.length === 0) {
            document.getElementById("ad-runner-container").innerHTML = '<div id="ads-container"><div id="show-hide-side-page-quests" class="ads-quest-button-container"><img class="ads-quest-image" src="../../icons/logo-256x256.png"></img><b id="ads-quest-text">View Active Quests | Hotkey F1</b></div><div class="ads-wrapper"><div class="remove-ads-text-container"><b id="adRemover" class="remove-ads-text">Remove ads</b></div><div class="ads-runner-container"><img class="ads-background-image" src="../../icons/logo-256x256.png"><div id="ad-runner"></div></div></div></div>'
            SidePageQuestController.registerEventListeners();
        }
        WindowsService.getCurrentWindow().then(result => {
            if(result.success) {
                // Background.instance().load()
                Background.instance().updateAd(result.window.name)
            }
        })
        const element = document.getElementById("adRemover")
        if(element) {
            element.onclick = () => {
                SubscriptionPageHandler.openPage();
            };
        }
    }
}