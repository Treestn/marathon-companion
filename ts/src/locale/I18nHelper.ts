import { AppConfigUtils } from "../escape-from-tarkov/utils/AppConfigUtils";
import { I18nStore } from "./I18nStore";

export class I18nHelper {

    static readonly defaultLocale = 'en';

    private static readonly uiEl:Map<string, string> = new Map([
        ["overwolf-status-title", "header.overwolf.status.overall"],
        ["overwolf-status-quest-automation", "header.overwolf.status.quest_automation"],
        ["overwolf-status-game-mode", "header.overwolf.status.game_mode"],
        ["overwolf-status-map-selection", "header.overwolf.status.map_selection"],
        ["navbar-selection-maps", "nav.maps"],
        ["navbar-selection-quests", "nav.quests"],
        ["navbar-selection-hideout", "nav.hideout"],
        ["navbar-selection-items-needed", "pages.questReminder.items.button"],
        ["navbar-selection-ammo-chart", "nav.ammo"],
        ["navbar-progression-level", "nav.progression.level"],
        ["navbar-subscription", "nav.subscription"],
        ["navbar-settings", "nav.settings"],
        ["navbar-support", "nav.support"],
        ["subscriptionPerkTitle", "pages.subscription.info.title"],
        ["unlockBetterControlPerkTitle", "pages.subscription.info.description"],
        ["removeAdsPoint", "pages.subscription.info.perks.1"],
        ["betterControlPoint", "pages.subscription.info.perks.2"],
        ["supportAppPoint", "pages.subscription.info.perks.3"],
        // ["sub-header", "pages.subscription.state.notSubscribed"],
        ["currentlyLoggedInAs", "pages.subscription.state.loggedInAs"],
        ["subscriptionStatusText", "pages.subscription.state.status.title"],
        ["manage-subscription-button", "pages.subscription.buttons.manage"],
        ["refresh-subscription-button", "pages.subscription.buttons.refresh"],
        ["subscribe-button", "pages.subscription.buttons.subscribe"],
        ["adRemover", "pages.sidePanel.ads.remove"],
        // ["ads-quest-text", "pages.sidePanel.button.quest.view"],
        ["quest-search-input", "pages.sidePanel.search.placeholder"],
        ["sidePageFilterDropdown", "pages.sidePanel.filters.label"],
        ["side-page-map-filter-input", "pages.sidePanel.filters.map"],
        ["side-page-order-trader-filter-input", "pages.sidePanel.filters.order.trader"],
        ["side-page-order-quest-name-filter-input", "pages.sidePanel.filters.order.quest"],
        ["side-page-kappa-filter-input", "pages.sidePanel.filters.kappa"],
        ["openQuestReminderInput", "pages.sidePanel.button.reminder"],
        // ["showHideAppHotkey", "header.hotkey.showHide"],
        // ["switchScreenHotkey", "header.hotkey.switch"],
        ["hotkey-frame-title", "pages.hotkeys.title"],
        ["hotkey-input", "pages.hotkeys.placeholder"],
        ["apply-hotkey", "pages.hotkeys.apply"],
        ["marker-frame-title", "pages.maps.popup.title"],
        ["marker-icon-type", "pages.maps.popup.type"],
        ["marker-select-quest", "pages.maps.popup.quest"],
        ["marker-select-quest-objective", "pages.maps.popup.questObjective"],
        ["marker-add-icon-description", "pages.maps.popup.description"],
        ["marker-attach-screenshot", "pages.maps.popup.screenshot.text"],
        ["icon-screenshot-button", "pages.maps.popup.screenshot.button"],
        ["quest-reminder-title", "pages.questReminder.title"],
        ["quest-runner-button", "pages.questReminder.quests.button"],
        ["items-runner-button", "pages.questReminder.items.button"],
        ["activeMap", "pages.questReminder.map"],
        ["review-and-submit-frame-title", "pages.reviewAndSubmit.title"],
        ["file-import-frame-title", "pages.file.import.title"],
        ["file-import-file-path", "pages.file.import.file"],
        ["file-import-folder-selector-button", "pages.file.import.select"],
        ["file-import-warning-1", "pages.file.import.warning.1"],
        ["file-import-warning-2", "pages.file.import.warning.2"],
        ["file-saver-frame-title", "pages.file.save.title"],
        ["file-saver-folder-path", "pages.file.save.folder"],
        ["file-saver-folder-selector-button", "pages.file.save.change"],
        ["file-saver-file-name", "pages.file.save.filename"],
        ["external-link-warning-frame-title", "pages.externalLinkWarning.title"],
        ["external-link-warning-disclaimer", "pages.externalLinkWarning.disclaimer"],
        ["external-link-warning-dont-show-again", "pages.externalLinkWarning.dontShow"],
        ["quests-reset-frame-title", "pages.questReset.title"],
        ["quests-reset-warning-1", "pages.questReset.warning.1"],
        ["quests-reset-warning-2", "pages.questReset.warning.2"],
        ["automate-quest-completion-frame-title", "pages.questCompletedAutomation.title"],
        ["automate-quest-completion-warning-1", "pages.questCompletedAutomation.warning.1"],
        ["automate-quest-completion-warning-2", "pages.questCompletedAutomation.warning.2"],
        ["automate-quest-completion-warning-3", "pages.questCompletedAutomation.warning.3"],
        ["submissions-terms-frame-title", "pages.submissions.title"],
        ["submissions-terms-rules-guideline", "pages.submissions.rules.title"],
        ["submissions-terms-notice", "pages.submissions.notice"],
        // ["", ""],
        // ["", ""],
        // ["", ""],
        // ["", ""],
        // ["", ""],
        // ["", ""],
    ]);

    static readonly store = new I18nStore();

    static currentLocale():string {
        return this.store.getCurrent()
    }

    static async init() {
        const pref = AppConfigUtils.getAppConfig().userSettings.getLocalePreference()
        await this.store.load(pref);
        for(const [elementId, localePath] of this.uiEl) {
            const element = document.getElementById(elementId)
            if(element) {
                element.textContent = this.store.t(localePath);
            }
        }
    }

    static async loadLocale(locale:string) {
        await this.store.load(locale)
    }

    static get(localePath:string, locale?:string):string {
        return this.store.t(localePath, null, locale);
    }

}