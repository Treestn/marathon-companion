import { SubscriptionHelper } from "../../../background/subscription/SubscriptionHelper";
import { I18nHelper } from "../../../locale/I18nHelper";
import { AppConfigUtils } from "../../utils/AppConfigUtils";

export class SidePageQuestController {

    static registerEventListeners() {

        this.updateHotkeyText();
        const container = document.getElementById("side-page-quests-wrapper");
        const button = document.getElementById("show-hide-side-page-quests");
        const subscribedFoldButton = document.getElementById("side-page-quest-fold");

        if(container && button && subscribedFoldButton) {
            button.onclick = (e) => {
                if(container.classList.contains("hidden")) {
                    this.show(container);
                } else {
                    this.hide(container);
                }
                e.stopPropagation()
            }
            document.onkeyup = (e) => {
                if(e.key.toUpperCase() === AppConfigUtils.getAppConfig().userSettings.getSidePageQuestHotkey().toUpperCase()) {
                    if(container.classList.contains("hidden")) {
                        this.show(container);
                    } else {
                        this.hide(container);
                    }
                }
                e.stopPropagation()
            }
            subscribedFoldButton.onclick = (e) => {
                if(container.classList.contains("hidden")) {
                    this.show(container);
                } else {
                    this.hide(container);
                }
                e.stopPropagation()
            }
        }
        this.subsriptionChanged();
    }

    static subsriptionChanged() {
        const container = document.getElementById("side-page-quests-wrapper");
        const wrapper = document.getElementById("side-page-container");
        if(container && wrapper) {
            if(SubscriptionHelper.isSubscribed()) {
                container.classList.remove("hidden");
                container.classList.remove("notSubscribed");
                if(!container.classList.contains("subscribed")) {
                    container.classList.add("subscribed");
                }

                wrapper.classList.remove("notSubscribed");
                if(!wrapper.classList.contains("subscribed")) {
                    wrapper.classList.add("subscribed");
                }
                if(!wrapper.classList.contains("visible")) {
                    wrapper.classList.add("visible");
                }
            } else {
                container.classList.remove("subscribed");
                container.classList.remove("visible");
                if(!container.classList.contains("hidden")) {
                    container.classList.add("hidden");
                }
                if(!container.classList.contains("notSubscribed")) {
                    container.classList.add("notSubscribed");
                }
                //Remove them all
                wrapper.classList.remove("subscribed");
                wrapper.classList.remove("visible");
                wrapper.classList.remove("hidden");
                if(!wrapper.classList.contains("notSubscribed")) {
                    wrapper.classList.add("notSubscribed");
                }
            }
        }
    }

    static searchBarClicked() {
        if(!SubscriptionHelper.isSubscribed()) {
            const container = document.getElementById("side-page-quests-wrapper");
            this.hide(container);
        }
    }

    private static show(container:HTMLElement) {
        container.classList.remove("hidden");
        if(!container.classList.contains("visible")) {
            container.classList.add("visible");
        }
        if(SubscriptionHelper.isSubscribed()) {
            const wrapper = document.getElementById("side-page-container");
            if(wrapper) {
                wrapper.classList.remove("hidden");
                if(!wrapper.classList.contains("visible")) {
                    wrapper.classList.add("visible");
                }
            }
        }
    }

    private static hide(container:HTMLElement) {
        container.classList.remove("visible");
        if(!container.classList.contains("hidden")) {
            container.classList.add("hidden");
        }
        if(SubscriptionHelper.isSubscribed()) {
            const wrapper = document.getElementById("side-page-container");
            if(wrapper) {
                wrapper.classList.remove("visible");
                if(!wrapper.classList.contains("hidden")) {
                    wrapper.classList.add("hidden");
                }
            }
        }
    }

    static updateHotkeyText() {
        const text = document.getElementById("ads-quest-text");
        const hotkey = AppConfigUtils.getAppConfig().userSettings.getSidePageQuestHotkey();
        if(text) {
            const textContent = I18nHelper.get("pages.sidePanel.button.quest.view");
            console.log(textContent);
            
            if(!textContent?.includes("pages.sidePanel.button.quest.view")) {
                text.textContent = textContent + hotkey;
            }
        }

        const foldText = document.getElementById("side-page-quest-arrow-text");
        if(foldText) {
            foldText.textContent = hotkey
        }
    }

}