import { Background } from "../../../../background/background";
import { kWindowNames, progressionTypes } from "../../../../consts";
import { AppConfigUtils } from "../../../utils/AppConfigUtils";
import { NavigationUtils } from "../../../utils/NavigationUtils";
import { SessionUtils } from "../../../utils/SessionUtils";
import { MapPageMediator } from "../../map/MapPageMediator";
import { WindowsService } from "../../../../WindowsService";
import { EditSession } from "../../quests/edit/EditSession";
import { ReviewAndSubmit } from "../../../../setting/submission/ReviewAndSubmit";
import { SubmissionApproval } from "../../../../warning/SubmissionApproval";
import { I18nHelper } from "../../../../locale/I18nHelper";

export class NavigationController {

    private static readonly NAVIGATION_SUFFIX:string = "-navigation";
    private static questMapFilter:HTMLElement;
    static mapPageMediator:MapPageMediator;

    constructor() {
        NavigationUtils.initButtonMap();
    }

    static init() {
        NavigationController.createSideBarEventListener();
        // Page navigation is now handled by React - see src/shared/components/NavigationBar.tsx
        // NavigationController.registerMapPageController();
        // NavigationController.registerQuestPageController();
        // NavigationController.registerHideoutPageController();
        // NavigationController.registerItemsNeededPageController();
        // NavigationController.registerAmmoPageController();
        // NavigationController.registerProgressionButton();
        NavigationController.registerEditHeaderButton();
        NavigationController.registerSidePageFilterButton();
        NavigationController.registerQuestFilterMap();
        NavigationController.registerQuestFilterOrderTrader();
        NavigationController.registerQuestFilterQuestName();
        // NavigationController.registerQuestFilterKappa();
        // NavigationController.registerOpenQuestReminder();
    }

    static registerSidePageFilterButton() {
        const div = document.getElementById("side-page-filter");
        const contentContainer = document.getElementById("side-page-filter-content-wrapper");
        if(div && contentContainer) {
            div.onclick = (e) => {
                if(contentContainer.style.display === "none") {
                    contentContainer.style.display = "";
                } else {
                    contentContainer.style.display = "none";
                }
                e.stopPropagation()
            }
            div.onmouseleave = (e) => {
                contentContainer.style.display = "none";
                e.stopPropagation()
            }
        }
    }

    static registerQuestFilterMap() {
        NavigationController.questMapFilter = document.getElementById("side-page-map-filter-label");
        const label = document.getElementById("side-page-map-filter-label");
        const input = document.getElementById("side-page-map-filter-input") as HTMLInputElement;
        if(this.questMapFilter && input && label) {
            label.normalize();
            const textNode = Array.from(label.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
            if (textNode) {
                textNode.textContent = I18nHelper.get("pages.sidePanel.filters.map")
            }
            input.checked = NavigationUtils.isMapFilterEnabled();
            this.questMapFilter.onclick = (e) => {
                NavigationUtils.handleQuestMapFilterClick(input)
                e.stopPropagation()
            }
        }
    }

    static registerQuestFilterOrderTrader() {
        const label = document.getElementById("side-page-order-trader-filter-label");
        const input = document.getElementById("side-page-order-trader-filter-input") as HTMLInputElement;
        if(label && input) {
            const textNode = Array.from(label.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
            if (textNode) {
                textNode.textContent = I18nHelper.get("pages.sidePanel.filters.order.trader");
            }
            input.checked = NavigationUtils.isOrderTraderFilterEnabled();
            label.onclick = (e) => {
                NavigationUtils.handleOrderTraderFilterClick(input)
                e.stopPropagation()
            }
        }
    }

    static registerQuestFilterQuestName() {
        const label = document.getElementById("side-page-order-quest-name-filter-label");
        const input = document.getElementById("side-page-order-quest-name-filter-input") as HTMLInputElement;
        if(label && input) {
            const textNode = Array.from(label.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
            if (textNode) {
                textNode.textContent = I18nHelper.get("pages.sidePanel.filters.order.quest")
            }
            input.checked = NavigationUtils.isQuestNameFilterEnabled();
            label.onclick = (e) => {
                NavigationUtils.handleOrderQuestNameFilterClick(input)
                e.stopPropagation()
            }
        }
    }

    static registerQuestFilterKappa() {
        const label = document.getElementById("side-page-kappa-filter-label");
        const input = document.getElementById("side-page-kappa-filter-input") as HTMLInputElement;
        if(label && input) {
            const textNode = Array.from(label.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
            if (textNode) {
                textNode.textContent = I18nHelper.get("pages.sidePanel.filters.kappa")
            }
            input.checked = NavigationUtils.isKappaFilterEnabled();
            label.onclick = (e) => {
                NavigationUtils.handleKappaOnlyFilterClick(input)
                e.stopPropagation()
            }
        }
    }

    static registerOpenQuestReminder() {
        const questReminderButton = document.getElementById("side-page-map-quest-reminder-label");
        if(questReminderButton) {
            questReminderButton.onclick = (e) => {
                if(Background.isGameRunning()) {
                    overwolf.windows.getWindowState(kWindowNames.questsReminder, async () => {
                        console.log("Opening quest reminder");
                        SessionUtils.setTemporaryMapSelected(this.mapPageMediator.getActiveMap());
                        // await WindowsService.close(kWindowNames.questsReminder)
                        console.log("Active quests: Opening Quests Reminder Window");
                        Background.instance().openQuestsReminderWindow();
                    });
                }
                e.stopPropagation()
            }
        }
    }

    static hideQuestReminderButton() {
        const questReminderButton = document.getElementById("side-page-map-quest-reminder-label")
        if(questReminderButton) {
            questReminderButton.style.display = "none";
            questReminderButton.style.visibility = "hidden";
        }
    }

    static showQuestReminderButton() {
        const questReminderButton = document.getElementById("side-page-map-quest-reminder-label")
        if(questReminderButton) {
            questReminderButton.style.display = "";
            questReminderButton.style.visibility = "";
        }
    }

    static registerMapPageController() {
        const navigation = document.getElementById(`maps${this.NAVIGATION_SUFFIX}`)
        if(navigation) {
            navigation.addEventListener("click", () => {
                this.enableQuestMapFilter();
                NavigationUtils.handleNavigationButtonClick(navigation)
                NavigationUtils.loadMapPage();
            });
        }
    }

    static registerQuestPageController() {
        const navigation = document.getElementById(`quests${this.NAVIGATION_SUFFIX}`)
        if(navigation) {
            navigation.addEventListener("click", () => {
                this.disableQuestMapFilter();
                NavigationUtils.handleNavigationButtonClick(navigation)
                NavigationUtils.loadQuestPage();
            });
        }
    }

    static registerHideoutPageController() {
        const navigation = document.getElementById(`hideout${this.NAVIGATION_SUFFIX}`)
        if(navigation) {
            navigation.addEventListener("click", () => {
                this.disableQuestMapFilter();
                NavigationUtils.handleNavigationButtonClick(navigation)
                NavigationUtils.loadHideoutPage();
            });
        }
    }

    static registerItemsNeededPageController() {
        const navigation = document.getElementById(`items-needed${this.NAVIGATION_SUFFIX}`)
        if(navigation) {
            navigation.addEventListener("click", () => {
                this.disableQuestMapFilter();
                NavigationUtils.handleNavigationButtonClick(navigation)
                NavigationUtils.loadItemsNeededPage();
            });
        }
    }

    static registerAmmoPageController() {
        const navigation = document.getElementById(`ammoChart${this.NAVIGATION_SUFFIX}`)
        if(navigation) {
            navigation.addEventListener("click", () => {
                this.disableQuestMapFilter();
                NavigationUtils.handleNavigationButtonClick(navigation)
                NavigationUtils.loadAmmoPage();
                // TODO: Implement
                // this.ammoPageMediator.load();
            });
        }
    }

    static enableQuestMapFilter() {
        if(this.questMapFilter) {
            this.questMapFilter.style.display = "";
        }
    }

    static disableQuestMapFilter() {
        if(this.questMapFilter) {
            this.questMapFilter.style.display = "none";
        }
    }

    static createSideBarEventListener() {
        // Sidebar toggle is now handled by React - see src/shared/components/NavigationBar.tsx
        // The event listener is no longer needed as React handles the onClick event
    }

    static createEventListener(button: HTMLElement) {
        button.addEventListener('click', () => {
            NavigationUtils.handleNavigationButtonClick(button)
        })
    }

    // static registerProgressionButton() {
    //     let progressionButton = document.getElementById("progressionButton")
    //     if(progressionButton) {
    //       const progressiontType = AppConfigUtils.getAppConfig().userSettings.getProgressionType();
    //       if(progressiontType === progressionTypes.pvp) {
    //         progressionButton.setAttribute("class", "window-control progression-control-pvp")
    //       } else if(progressiontType === progressionTypes.pve) {
    //         progressionButton.setAttribute("class", "window-control progression-control-pve")
    //       }
    //       progressionButton.onclick = () => {
    //         this.clickProgressionButton(progressionButton);
    //       }
    //     }
    // }

    static registerEditHeaderButton() {
        overwolf.profile.getCurrentUser(info => {
            if(info.success) {
                let editButton = document.getElementById("editHeaderButton");
                let reviewButton:HTMLButtonElement = document.getElementById("editReviewButton") as HTMLButtonElement;
                if(editButton && reviewButton) {
                    editButton.style.display = "";
                    reviewButton.style.display = "none";
                    EditSession.closeSession();
                    editButton.onclick = (e) => {
                        NavigationUtils.removeiFrames()
                        if(EditSession.isSessionOpen()) {
                            this.disableEditMode(editButton);
                        } else {
                            new SubmissionApproval(editButton, reviewButton).open();
                        }
                        e.stopPropagation()
                    }
                    reviewButton.onclick = (e) => {
                        if(EditSession.isAllowedToSubmit()) {
                            ReviewAndSubmit.instance().open();
                        }
                    }
                }
            }
        });
    }

    static editSessionApproved(editButton:HTMLElement, reviewButton:HTMLButtonElement) {
        this.enableEditMode(editButton, reviewButton);
    }

    static enableEditMode(editButton?:HTMLElement, reviewButton?:HTMLButtonElement) {
        if(!editButton || !reviewButton) {
            editButton = document.getElementById("editHeaderButton");
            reviewButton = document.getElementById("editReviewButton") as HTMLButtonElement;
        }
        if(reviewButton && editButton) {
            EditSession.openSession();
            editButton.style.backgroundColor = "red";
            reviewButton.style.display = "";
            this.disableReviewButton(reviewButton);
            this.refreshPage();
        }
    }

    static disableEditMode(editButton?:HTMLElement, reviewButton?:HTMLButtonElement) {
        if(!editButton || !reviewButton) {
            editButton = document.getElementById("editHeaderButton");
            reviewButton = document.getElementById("editReviewButton") as HTMLButtonElement;
        }
        if(reviewButton && editButton) {
            EditSession.closeSession();
            this.mapPageMediator.reloadFilters();
            editButton.style.backgroundColor = "";
            reviewButton.style.display = "none";
            this.refreshPage();
        }
    }

    static disableReviewButton(reviewButton?:HTMLButtonElement) {
        if(!reviewButton) {
            reviewButton = document.getElementById("editReviewButton") as HTMLButtonElement;
        }
        if(reviewButton) {
            reviewButton.disabled = true;
            reviewButton.style.backgroundColor = "#752d2d";
        }
    }

    static refreshPage() {
        const progressionType = AppConfigUtils.getAppConfig().userSettings.getProgressionType();
        NavigationUtils.handleProgressionTypeClick(progressionType);
    } 

    // private static clickProgressionButton(progressionButton:HTMLElement) {
    //     const progressiontType = AppConfigUtils.getAppConfig().userSettings.getProgressionType();
    //     if(progressiontType === progressionTypes.pvp) {
    //         AppConfigUtils.getAppConfig().userSettings.setProgressionType(progressionTypes.pve)
    //         progressionButton.setAttribute("class", "window-control progression-control-pve")
    //         NavigationUtils.handleProgressionTypeClick(progressionTypes.pve)
    //     } else if(progressiontType === progressionTypes.pve) {
    //         AppConfigUtils.getAppConfig().userSettings.setProgressionType(progressionTypes.pvp)
    //         progressionButton.setAttribute("class", "window-control progression-control-pvp")
    //         NavigationUtils.handleProgressionTypeClick(progressionTypes.pvp)
    //     }
    // }
}