import { IFrame } from "../IFrame";
import { WindowsService } from "../WindowsService";
import { BackgroundHelper } from "../background/BackgroundHelper";
import { Background } from "../background/background";
import { kHotkeys, kWindowNames, progressionTypes } from "../consts";
import { MapAdapter } from "../adapter/MapAdapter";
import { MapsList } from "../escape-from-tarkov/constant/MapsConst";
import { DataEventConst } from "../escape-from-tarkov/events/DataEventConst";
import { EventConst } from "../escape-from-tarkov/events/EventConst";
import { MapUtils } from "../escape-from-tarkov/page/map/utils/MapUtils";
import { QuestsUtils } from "../escape-from-tarkov/page/quests/utils/QuestsUtils";
import { QuestSidePageMediator } from "../escape-from-tarkov/page/side/QuestSidePageMediator";
import { SidePageQuestRequest } from "../escape-from-tarkov/page/side/handlers/request/SidePageQuestRequest";
import { HelperCreation } from "../escape-from-tarkov/service/MainPageCreator/HelperCreation";
import { AppConfigUtils } from "../escape-from-tarkov/utils/AppConfigUtils";
import { InRaidTimerUtils } from "../escape-from-tarkov/utils/InRaidTimerUtils";
import { NavigationUtils } from "../escape-from-tarkov/utils/NavigationUtils";
import { OverwolfStatusUtils } from "../escape-from-tarkov/utils/OverwolfStatusUtils";
import { Hotkeys } from "../hotkeys/Hotkeys";
import { I18nHelper } from "../locale/I18nHelper";
import { Locales } from "../locale/I18nStore";
import { PopupHelper } from "../popup/PopupHelper";
import { QuestCompletionAutomation } from "../warning/QuestCompletionAutomation";
import { QuestReset } from "../warning/QuestReset";
import { FileImport } from "./FileImport";
import { FileSaver } from "./FileSaver";
import { SettingsPageCreator } from "./SettingsPageCreator";

export class Settings extends IFrame {

    private static _instance:Settings;

    private static readonly APP_PAGE = "app_page";
    private static readonly PROGRESSION_PAGE = "progression_page";
    private static readonly MAP_PAGE = "map_page";

    private sidePageMediator:QuestSidePageMediator;

    private constructor() {
        super("settings-frame", "./setting.html")
        this.frame.addEventListener("load", () => {
            this.init()
        })
    }

    setSidePageMediator(mediator:QuestSidePageMediator) {
        this.sidePageMediator = mediator;
    }

    public static instance() {
        if(!Settings._instance) {
            Settings._instance = new Settings();
        }
        return Settings._instance
    }

    async init() {
        this.initPageButtons();
        this.loadAppPage();
    }

    private async initPageButtons() {
        const appButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("app-settings-button") as HTMLButtonElement;
        appButton.textContent = I18nHelper.get("pages.settings.app.label")
        const progressionButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("progression-settings-button") as HTMLButtonElement;
        appButton.textContent = I18nHelper.get("pages.settings.progression.label")
        const mapButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("map-settings-button") as HTMLButtonElement;
        appButton.textContent = I18nHelper.get("pages.settings.map.label")

        const buttonsList:HTMLButtonElement[] = [];
        buttonsList.push(appButton);
        buttonsList.push(progressionButton);
        buttonsList.push(mapButton)

        if(appButton && progressionButton && mapButton) {
            this.pageButtonEventListener(appButton, Settings.APP_PAGE, buttonsList);
            this.pageButtonEventListener(progressionButton, Settings.PROGRESSION_PAGE, buttonsList);
            this.pageButtonEventListener(mapButton, Settings.MAP_PAGE, buttonsList);
        }

        const close = this.frame.contentWindow.document.getElementById("apply")
        close.onclick = () => {
            this.close();
        }

        this.frame.contentWindow.onkeydown = (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                this.close()
            }
        }
    }

    private async resetButtonsEvent(buttons:HTMLButtonElement[]) {
        buttons.forEach(button => {
            button.classList.remove("setting-page-button-active")
        })
    }

    private async removeContent() {
        const container = this.frame.contentWindow.document.getElementById("settings-content") 
        this.removeChildNodes(container)
    }

    private async removeChildNodes(parent: HTMLElement) {
        let _childs = parent.children
        Array.from(_childs).forEach(child => {
            child.remove()
        })
    }  

    async pageButtonEventListener(button:HTMLButtonElement, id:string, buttons:HTMLButtonElement[]) {
        button.onclick = () => {
            this.resetButtonsEvent(buttons);
            button.classList.add("setting-page-button-active");
            this.removeContent();
            this.loadSettingPage(id);
        }
    }

    private async loadSettingPage(id:string) {
        switch(id) {
            case Settings.APP_PAGE: this.loadAppPage(); break;
            case Settings.PROGRESSION_PAGE: this.loadProgressionPage(); break;
            case Settings.MAP_PAGE: this.loadMapPage(); break;
        }
    }

    private async loadAppPage() {
        const wrapper = this.frame.contentWindow.document.getElementById("settings-content") 

        // wrapper.appendChild(SettingsPageCreator.createDropwdown(I18nHelper.get("pages.settings.app.locale"), "localePreferenceDropdown"))
        wrapper.appendChild(SettingsPageCreator.createDropwdown(I18nHelper.get("pages.settings.app.monitor"), "monitorDropdown"))
        wrapper.appendChild(SettingsPageCreator.createSlider(I18nHelper.get("pages.settings.app.opacity"),  "opacity-slider-text", "", "opacity-slider", 40, 100, 100))

        wrapper.appendChild(SettingsPageCreator.createHotkeyButton("side-page-quest-setting", I18nHelper.get("pages.settings.app.sidePanelHotkey"), "side-page-quest-hotkey"))
        wrapper.appendChild(SettingsPageCreator.createHotkeyButton("in-game-hotkey-setting",  I18nHelper.get("pages.settings.app.inGameHotkey.text"), "in-game-hotkey"))
        wrapper.appendChild(SettingsPageCreator.createHotkeyButton("in-game-desktop-hotkey-setting",  I18nHelper.get("pages.settings.app.ingameDesktopHotkey.text"), "in-game-desktop-hotkey"))
        // wrapper.appendChild(SettingsPageCreator.createHotkeyButton("quest-reminder-hotkey-setting",  I18nHelper.get("pages.settings.app.questReminderHotkey.text"), "quest-reminder-hotkey"))

        // wrapper.appendChild(SettingsPageCreator.createButtonSlider(I18nHelper.get("pages.settings.app.enableQuestReminder"), "openQuestReminderPreferenceLabel", "openQuestReminderPreference"))
        wrapper.appendChild(SettingsPageCreator.createButtonSlider(I18nHelper.get("pages.settings.app.onMatchmaking"), "openWindowOnMatchmakingLabel", "openWindowOnMatchmaking"))
        wrapper.appendChild(SettingsPageCreator.createButtonSlider(I18nHelper.get("pages.settings.app.desktopOnly"), "desktopOnlyLabel", "desktopOnly"))
        wrapper.appendChild(SettingsPageCreator.createButtonSlider(I18nHelper.get("pages.settings.app.appCloseOnGameClose"), "minimizeOnGameCloseLabel", "minimizeOnGameClose"))
        wrapper.appendChild(SettingsPageCreator.createButtonSlider(I18nHelper.get("pages.settings.app.externalLinkWarning"), "externalLinkWarningLabel", "externalLinkWarning"))
        // wrapper.appendChild(SettingsPageCreator.createButton(I18nHelper.get("pages.settings.app.inRaidTimer.text"), "timerButton", I18nHelper.get("pages.settings.app.inRaidTimer.button")));

        wrapper.appendChild(SettingsPageCreator.createButton(I18nHelper.get("pages.settings.app.uploadLogs.text"), "uploadLogs", I18nHelper.get("pages.settings.app.uploadLogs.button")))

        this.initAppPage();
        this.registerAppPageListeners();
    }

    private async loadProgressionPage() {
        const wrapper = this.frame.contentWindow.document.getElementById("settings-content") 

        // wrapper.appendChild(SettingsPageCreator.createButtonSlider(I18nHelper.get("pages.settings.progression.automate"), "automateQuestsLabel", "automateQuests"))

        wrapper.appendChild(SettingsPageCreator.createButtonSlider(I18nHelper.get("pages.settings.progression.level"), "levelRequiredLabel", "levelRequired"))
        wrapper.appendChild(SettingsPageCreator.createButtonSlider(I18nHelper.get("pages.settings.progression.completedButton"), "doubleClickQuestCompleteLabel", "doubleClickQuestComplete"))

        wrapper.appendChild(SettingsPageCreator.createButton(I18nHelper.get("pages.settings.progression.wipe.text"), "reset-pvp-quests", I18nHelper.get("pages.settings.progression.wipe.button.1")))
        // wrapper.appendChild(SettingsPageCreator.createDoubleButtonOption(I18nHelper.get("pages.settings.progression.kappa.text"), "disable-non-kappa-button", I18nHelper.get("pages.settings.progression.kappa.button.1"), "enable-non-kappa-button", I18nHelper.get("pages.settings.progression.kappa.button.2")))
        // wrapper.appendChild(SettingsPageCreator.createButton("Disable non-kappa quests", "disable-non-kappa-button", "Double-click"))
        wrapper.appendChild(SettingsPageCreator.createButton(I18nHelper.get("pages.settings.progression.save.text"), "save-progression-button", I18nHelper.get("pages.settings.progression.save.button")))
        wrapper.appendChild(SettingsPageCreator.createButton(I18nHelper.get("pages.settings.progression.import.text"), "import-progression-button", I18nHelper.get("pages.settings.progression.import.button")))

        wrapper.appendChild(SettingsPageCreator.createButton(I18nHelper.get("pages.settings.progression.questCompletedAutomation.text"), "quest-completion-automation", I18nHelper.get("pages.settings.progression.questCompletedAutomation.button")))

        this.initProgressionPage();
        this.registerProgressionPageListeners();
    }

    private async loadMapPage() {
        const wrapper = this.frame.contentWindow.document.getElementById("settings-content") 

        wrapper.appendChild(SettingsPageCreator.createDropwdown(I18nHelper.get("pages.settings.map.default"), "mapPreferenceDropdown"))
        wrapper.appendChild(SettingsPageCreator.createSlider(I18nHelper.get("pages.settings.map.zoom"),  "map-zoom-sensitivity-slider-text", "", "map-zoom-sensitivity", 1, 8, 4))

        this.initMapPage();
        this.registerMapPageListeners();
    }

    private async initAppPage() {
        // const localePreferenceDropdown = this.frame.contentWindow.document.getElementById("localePreferenceDropdown");
        // const localePreference = AppConfigUtils.getAppConfig().userSettings.getLocalePreference()
        // if(localePreferenceDropdown) {
        //     Locales.forEach(locale => {
        //         if(localePreference === locale) {
        //             localePreferenceDropdown.appendChild(new Option(locale, locale, true, true));
        //         } else {
        //             localePreferenceDropdown.appendChild(new Option(locale, locale));
        //         }
        //     });
        // }


        const monitorPreferenceDropdown = this.frame.contentWindow.document.getElementById("monitorDropdown");
        const monitors = await WindowsService.getMonitorsList();
        const secondMonitorPreference = AppConfigUtils.getAppConfig().userSettings.getSecondMonitorPreference()
        if(monitors && monitors.length > 1 && monitorPreferenceDropdown) {
            monitors.forEach(monitor => {
                if(!monitor.is_primary) {
                    if(secondMonitorPreference !== undefined && secondMonitorPreference === monitor.id) {
                        monitorPreferenceDropdown.appendChild(new Option(monitor.name, monitor.id, true, true));
                    } else {
                        monitorPreferenceDropdown.appendChild(new Option(monitor.name, monitor.id));
                    }
                }
            });
        }

        const opacitySlider = this.frame.contentWindow.document.getElementById("opacity-slider")
        const opacityText = this.frame.contentWindow.document.getElementById("opacity-slider-text")
        if(opacitySlider && opacityText) {
            const opacity = AppConfigUtils.getAppConfig().userSettings.getInGameWindowOpacity();
            if(opacity) {
                (opacitySlider as HTMLInputElement).value = String(opacity*100);
                opacityText.textContent = String(opacity*100)+"%";;
            } else {
                (opacitySlider as HTMLInputElement).value = String(100);
                opacityText.textContent = "100%";
            }
        }

        const sidePageQuestHotkey = this.frame.contentWindow.document.getElementById("side-page-quest-hotkey");
        if(sidePageQuestHotkey) {
            const hotkey = AppConfigUtils.getAppConfig().userSettings.getSidePageQuestHotkey();
            sidePageQuestHotkey.textContent = hotkey;
            sidePageQuestHotkey.onclick = (e) => {
                Hotkeys.setSidePageQuestHotkey(true);
                Hotkeys.addElementReference(sidePageQuestHotkey)
                Hotkeys.instance().open();
                e.stopPropagation()
            }
        }

        WindowsService.getCurrentWindow().then(result => {
            if(result.success && result.window.name !== kWindowNames.desktop) {
                const inGameButton = this.frame.contentWindow.document.getElementById("in-game-hotkey")
                if(inGameButton) {
                    BackgroundHelper.getHotkey(kHotkeys.toggle).then(result => {
                        inGameButton.textContent = result
                    })
                    inGameButton.onclick = () => {
                        const hotkey = Hotkeys.instance();
                        console.log("Clicked hotkey");
                        Hotkeys.setHotkey(kHotkeys.toggle)
                        Hotkeys.addElementReference(inGameButton)
                        const windowEl = window.document.getElementById("hotkey");
                        if(windowEl) {
                            Hotkeys.addElementReference(windowEl)
                        }
                        hotkey.open();
                    }
                }
        
                const inGameDesktopButton = this.frame.contentWindow.document.getElementById("in-game-desktop-hotkey")
                if(inGameDesktopButton) {
                    BackgroundHelper.getHotkey(kHotkeys.switchScreenToggle).then(result => {
                        console.log(result);
                        
                        inGameDesktopButton.textContent = result
                    })
                    inGameDesktopButton.onclick = () => {
                        const hotkey = Hotkeys.instance();
                        console.log("Clicked hotkey");
                        Hotkeys.setHotkey(kHotkeys.switchScreenToggle)
                        Hotkeys.addElementReference(inGameDesktopButton)
                        const windowEl = window.document.getElementById("screenHotkey");
                        if(windowEl) {
                            Hotkeys.addElementReference(windowEl)
                        }
                        hotkey.open();
                    }
                }
        
                // const questReminderButton = this.frame.contentWindow.document.getElementById("quest-reminder-hotkey")
                // if(questReminderButton) {
                //     BackgroundHelper.getHotkey(kHotkeys.toggleQuestReminder).then(result => {
                //         questReminderButton.textContent = result
                //     })
                //     questReminderButton.onclick = () => {
                //         const hotkey = Hotkeys.instance();
                //         console.log("Clicked hotkey");
                //         Hotkeys.setHotkey(kHotkeys.toggleQuestReminder)
                //         Hotkeys.addElementReference(questReminderButton)
                //         const windowEl = window.document.getElementById("hotkeyQuestReminder");
                //         if(windowEl) {
                //             Hotkeys.addElementReference(windowEl)
                //         }
                //         hotkey.open();
                //     }
                // }
            } else {
                const inGameSetting = this.frame.contentWindow.document.getElementById("in-game-hotkey-setting")
                const inGameDesktopSetting = this.frame.contentWindow.document.getElementById("in-game-desktop-hotkey-setting")
                // const questReminderSetting = this.frame.contentWindow.document.getElementById("quest-reminder-hotkey-setting")
                if(inGameSetting) {
                    inGameSetting.remove();
                }
                if(inGameDesktopSetting) {
                    inGameDesktopSetting.remove();
                }
                // if(questReminderSetting) {
                //     questReminderSetting.remove();
                // }
            }
        })

        // const openQuestReminder:HTMLInputElement = this.frame.contentWindow.document.getElementById('openQuestReminderPreference') as HTMLInputElement
        // const openQuestReminderPreference = AppConfigUtils.getAppConfig().userSettings.getOpenQuestReminderPreference();
        // if(openQuestReminder) {
        //     if(openQuestReminderPreference === "true") {
        //         openQuestReminder.checked = true
        //     } else {
        //         openQuestReminder.checked = false
        //     }
        // }


        const openWindowOnMatchmaking:HTMLInputElement = this.frame.contentWindow.document.getElementById('openWindowOnMatchmaking') as HTMLInputElement
        const openWindowOnMatchmakingPref = AppConfigUtils.getAppConfig().userSettings.getOpenWindowOnMatchmaking();
        if(openWindowOnMatchmaking) {
            if(openWindowOnMatchmakingPref === "true") {
                openWindowOnMatchmaking.checked = true
            } else {
                openWindowOnMatchmaking.checked = false
            }
        }


        const desktopOnly:HTMLInputElement = this.frame.contentWindow.document.getElementById('desktopOnly') as HTMLInputElement
        const desktopOnlyPreference = AppConfigUtils.getAppConfig().userSettings.isDesktopOnly()
        if(desktopOnly) {
            if(desktopOnlyPreference) {
                desktopOnly.checked = true
            } else {
                desktopOnly.checked = false
            }
        }

        const minimizeOnGameClose:HTMLInputElement = this.frame.contentWindow.document.getElementById('minimizeOnGameClose') as HTMLInputElement
        const minimizeOnGameClosePreference = AppConfigUtils.getAppConfig().userSettings.getMinimizeOnGameClose();
        if(minimizeOnGameClose) {
            if(minimizeOnGameClosePreference === "true") {
                minimizeOnGameClose.checked = true
            } else {
                minimizeOnGameClose.checked = false
            }
        }

        const externalLinkWarning:HTMLInputElement = this.frame.contentWindow.document.getElementById("externalLinkWarning") as HTMLInputElement;
        const externalLinkWarningPreference = AppConfigUtils.getAppConfig().userSettings.getExternalLinkWarning();
        if(externalLinkWarning) {
            if(externalLinkWarningPreference === "true") {
                externalLinkWarning.checked = true;
            } else {
                externalLinkWarning.checked = false;
            }
        }
    }

    private async registerAppPageListeners() {
        // const localeDropdown = this.frame.contentWindow.document.getElementById("localePreferenceDropdown");
        // const localePreferenceSelect:HTMLSelectElement = this.frame.contentWindow.document.getElementById("localePreferenceDropdown") as HTMLSelectElement;
        // if(localeDropdown && localePreferenceSelect) {
        //     localePreferenceSelect.onchange = async () => {
        //         AppConfigUtils.getAppConfig().userSettings.setLocalePreference(localePreferenceSelect.value);
        //         AppConfigUtils.save();
        //         const text = this.frame.contentWindow.document.getElementById("setting-restart-app-text");
        //         await I18nHelper.loadLocale(localePreferenceSelect.value)                
        //         if(text) {
        //             text.textContent = I18nHelper.get("pages.settings.app.restart", localePreferenceSelect.value)
        //         } else {
        //             const b = HelperCreation.createB("setting-restart-app-text", I18nHelper.get("pages.settings.app.restart", localePreferenceSelect.value))
        //             b.id = "setting-restart-app-text"
        //             localeDropdown.parentElement.appendChild(b);
                
        //         }
        //         console.log(`Changed Locale to ${localePreferenceSelect.value}`);
        //     }
        // }

        const monitorPreferenceSelect:HTMLSelectElement = this.frame.contentWindow.document.getElementById("monitorDropdown") as HTMLSelectElement;
        if(monitorPreferenceSelect) {
            monitorPreferenceSelect.onchange = () => {
                AppConfigUtils.getAppConfig().userSettings.setSecondMonitorPreference(monitorPreferenceSelect.value);
                AppConfigUtils.save();
                console.log(`Changed Second Monitor Preference to ${monitorPreferenceSelect.value}`);
            }
        }

        const opacitySlider = this.frame.contentWindow.document.getElementById("opacity-slider")
        const opacityText = this.frame.contentWindow.document.getElementById("opacity-slider-text")
        WindowsService.getCurrentWindow().then(window => {
            if(window.success) {
                if(opacitySlider && opacityText) {
                    opacitySlider.onmousemove = (e) => {
                        const valueString:string = (opacitySlider as HTMLInputElement).value
                        const value:number = Number(valueString);
                        if(value) {
                            if(window.window.name === kWindowNames.inGame) {
                                Background.setOpacity(value/100);
                            }
                            opacityText.textContent = String(value)+"%";;
                        }
                    }
                    opacitySlider.onmouseup = () => {
                        const valueString:string = (opacitySlider as HTMLInputElement).value
                        const value:number = Number(valueString);
                        if(value) {
                            AppConfigUtils.getAppConfig().userSettings.setInGameWindowOpacity(value/100);
                            AppConfigUtils.save();
                        }
                    }
                }
            }
        })

        // const openQuestReminder:HTMLInputElement = this.frame.contentWindow.document.getElementById('openQuestReminderPreference') as HTMLInputElement
        // const openQuestReminderLabel:HTMLLabelElement = this.frame.contentWindow.document.getElementById("openQuestReminderPreferenceLabel") as HTMLLabelElement
        // if(openQuestReminderLabel && openQuestReminder) {
        //     openQuestReminderLabel.onclick = (e) => {
        //         if(openQuestReminder.checked) {
        //             openQuestReminder.checked = false;
        //         } else {
        //             openQuestReminder.checked = true;
        //         }
        //         AppConfigUtils.getAppConfig().userSettings.setOpenQuestReminderPreference(openQuestReminder.checked ? "true" : "false");
        //         AppConfigUtils.save();
        //         e.preventDefault();
        //     }
        // }

        const openWindowOnMatchmaking:HTMLInputElement = this.frame.contentWindow.document.getElementById('openWindowOnMatchmaking') as HTMLInputElement
        const openWindowOnMatchmakingLabel:HTMLLabelElement = this.frame.contentWindow.document.getElementById("openWindowOnMatchmakingLabel") as HTMLLabelElement
        if(openWindowOnMatchmakingLabel && openWindowOnMatchmaking) {
            openWindowOnMatchmakingLabel.onclick = (e) => {
                if(openWindowOnMatchmaking.checked) {
                    openWindowOnMatchmaking.checked = false;
                } else {
                    openWindowOnMatchmaking.checked = true;
                }
                AppConfigUtils.getAppConfig().userSettings.setOpenWindowOnMatchmaking(openWindowOnMatchmaking.checked ? "true" : "false");
                AppConfigUtils.save();
                e.preventDefault();
            }
        }

        const desktopOnly:HTMLInputElement = this.frame.contentWindow.document.getElementById('desktopOnly') as HTMLInputElement
        const desktopOnlyLabel:HTMLLabelElement = this.frame.contentWindow.document.getElementById("desktopOnlyLabel") as HTMLLabelElement
        if(desktopOnlyLabel && desktopOnly) {
            desktopOnlyLabel.onclick = (e) => {
                if(desktopOnly.checked) {
                    desktopOnly.checked = false;
                } else {
                    desktopOnly.checked = true;
                }
                AppConfigUtils.getAppConfig().userSettings.setDesktopOnly(desktopOnly.checked ? "true" : "false");
                AppConfigUtils.save();
                e.preventDefault();
            }
        }

        const minimizeOnGameClose:HTMLInputElement = this.frame.contentWindow.document.getElementById('minimizeOnGameClose') as HTMLInputElement
        const minimizeOnGameCloseLabel:HTMLLabelElement = this.frame.contentWindow.document.getElementById("minimizeOnGameCloseLabel") as HTMLLabelElement
        if(minimizeOnGameCloseLabel && minimizeOnGameClose) {
            minimizeOnGameCloseLabel.onclick = (e) => {
                if(minimizeOnGameClose.checked) {
                    minimizeOnGameClose.checked = false;
                } else {
                    minimizeOnGameClose.checked = true;
                }
                AppConfigUtils.getAppConfig().userSettings.setMinimizeOnGameClose(minimizeOnGameClose.checked ? "true" : "false");
                AppConfigUtils.save();
                e.preventDefault();
            }
        }

        const externalLinkWarning:HTMLInputElement = this.frame.contentWindow.document.getElementById("externalLinkWarning") as HTMLInputElement;
        const externalLinkWarningLabel:HTMLLabelElement = this.frame.contentWindow.document.getElementById("externalLinkWarningLabel") as HTMLLabelElement
        if(externalLinkWarningLabel && externalLinkWarning) {
            externalLinkWarningLabel.onclick = (e) => {
                if(externalLinkWarning.checked) {
                    externalLinkWarning.checked = false;
                } else {
                    externalLinkWarning.checked = true;
                }
                AppConfigUtils.getAppConfig().userSettings.setExternalLinkWarning(externalLinkWarning.checked ? "true": "false");
                AppConfigUtils.save();
                console.log(`Changed External Warning to ${externalLinkWarning.checked}`);
                e.preventDefault();
            }
        }

        // const timerButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("timerButton") as HTMLButtonElement
        // if(timerButton) {
        //     timerButton.onclick = (e) => {
        //         const switchedState = !AppConfigUtils.getAppConfig().userSettings.isTimerOn();
        //         AppConfigUtils.getAppConfig().userSettings.setTimerOn(switchedState);
        //         AppConfigUtils.save();
        //         if(switchedState) {
        //             InRaidTimerUtils.show();
        //         } else {
        //             InRaidTimerUtils.hide();
        //         }
        //         e.stopPropagation()
        //     }
        // }

        const uploadLogsButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("uploadLogs") as HTMLButtonElement
        if(uploadLogsButton) {
            uploadLogsButton.onclick = (e) => {
                overwolf.utils.uploadClientLogs(callback => {
                    if(callback.success) {
                        PopupHelper.addPopup("Logs Upload", "Logs successfully uploaded, make sure to join our discord to explain the issue you were having so we can fix it.", PopupHelper.SUCCESS_BORDER_COLOR);
                    } else {
                        PopupHelper.addPopup("Logs Upload", "Logs failed to upload, try again later or reach out to us on Discord for further assistance", PopupHelper.ERROR_BORDER_COLOR);
                    }
                    PopupHelper.start();
                })
                e.stopPropagation()
            }
        } 
    } 

    private async initProgressionPage() {
        
        const levelRequired:HTMLInputElement = this.frame.contentWindow.document.getElementById('levelRequired') as HTMLInputElement
        const levelRequiredPreference = AppConfigUtils.getAppConfig().userSettings.isLevelRequired();
        if(levelRequired) {
            levelRequired.checked = levelRequiredPreference;
        }

        // const automatedQuestsInput:HTMLInputElement = this.frame.contentWindow.document.getElementById('automateQuests') as HTMLInputElement
        // const automateQuestsPref:boolean = AppConfigUtils.getAppConfig().userSettings.getQuestAutomationFlag();
        // if(automatedQuestsInput) {
        //     automatedQuestsInput.checked = automateQuestsPref;
        // }

        const doubleClickCompleteQuest:HTMLInputElement = this.frame.contentWindow.document.getElementById('doubleClickQuestComplete') as HTMLInputElement
        const doubleClickQuestCompletePreference = AppConfigUtils.getAppConfig().userSettings.getDoubleClickCompleteQuest();
        if(doubleClickCompleteQuest) {
            if(doubleClickQuestCompletePreference === "true") {
                doubleClickCompleteQuest.checked = true
            } else {
                doubleClickCompleteQuest.checked = false
            }
        }

    }

    private async registerProgressionPageListeners() {

        const levelRequired:HTMLInputElement = this.frame.contentWindow.document.getElementById("levelRequired") as HTMLInputElement
        const levelRequiredLabel:HTMLLabelElement = this.frame.contentWindow.document.getElementById("levelRequiredLabel") as HTMLLabelElement
        if(levelRequiredLabel && levelRequired) {
            levelRequiredLabel.onclick = (e) => {
                if(levelRequired.checked) {
                    levelRequired.checked = false;
                } else {
                    levelRequired.checked = true;
                }
                AppConfigUtils.getAppConfig().userSettings.setLevelRequired(levelRequired.checked ? "true" : "false");
                AppConfigUtils.save();
                const levelDomEl = document.getElementById("level-navigation");
                if(levelDomEl) {
                    if(levelRequired.checked) {
                        console.log("Levels are required to unlock quests");
                        levelDomEl.style.display = ""
                    } else {
                        console.log("Levels are not required to unlock quests");
                        levelDomEl.style.display = "none"
                    }
                }
                console.log(`Changed Level Required to ${levelRequired.checked}`);
                e.preventDefault();
            }
        }

        // const automatedQuestsInput:HTMLInputElement = this.frame.contentWindow.document.getElementById('automateQuests') as HTMLInputElement
        // const automatedQuestsLabel:HTMLLabelElement = this.frame.contentWindow.document.getElementById("automateQuestsLabel") as HTMLLabelElement
        // if(automatedQuestsInput && automatedQuestsLabel) {
        //     automatedQuestsLabel.onclick = (e) => {
        //         automatedQuestsInput.checked = !automatedQuestsInput.checked
        //         if(levelRequired && OverwolfStatusUtils.isQuestAutomationEnabled()) {
        //             levelRequired.checked = !automatedQuestsInput.checked;
        //         }
        //         AppConfigUtils.getAppConfig().userSettings.setQuestAutomationFlag(automatedQuestsInput.checked);
        //         AppConfigUtils.save();
        //         NavigationUtils.questAutomationChanged();
        //         e.preventDefault()
        //     }
        // }

        const doubleClickCompleteQuest:HTMLInputElement = this.frame.contentWindow.document.getElementById('doubleClickQuestComplete') as HTMLInputElement
        const doubleClickCompleteQuestLabel:HTMLLabelElement = this.frame.contentWindow.document.getElementById("doubleClickQuestCompleteLabel") as HTMLLabelElement
        if(doubleClickCompleteQuestLabel && doubleClickCompleteQuest) {
            doubleClickCompleteQuestLabel.onclick = (e) => {
                if(doubleClickCompleteQuest.checked) {
                    doubleClickCompleteQuest.checked = false;
                } else {
                    doubleClickCompleteQuest.checked = true;
                }
                AppConfigUtils.getAppConfig().userSettings.setDoubleClickCompleteQuest(doubleClickCompleteQuest.checked ? "true" : "false");
                AppConfigUtils.save();
                console.log(`Changed Double click quests to ${doubleClickCompleteQuest.checked}`);
                e.preventDefault();
            }
        }

        const resetPvpQuestButton = this.frame.contentWindow.document.getElementById("reset-pvp-quests");
        if(resetPvpQuestButton) {
            resetPvpQuestButton.addEventListener("click", () => {
                (new QuestReset(progressionTypes.pvp, this.sidePageMediator)).open();
            })
        }
        const resetPveQuestButton = this.frame.contentWindow.document.getElementById("reset-pve-quests");
        if(resetPveQuestButton) {
            resetPveQuestButton.addEventListener("click", () => {
                (new QuestReset(progressionTypes.pve, this.sidePageMediator)).open();
            })
        }

        const disableNonKappa = this.frame.contentWindow.document.getElementById("disable-non-kappa-button");
        if(disableNonKappa) {
            disableNonKappa.onclick = () => {
                QuestsUtils.disableNonKappaQuests();
                const request = new SidePageQuestRequest(this.sidePageMediator, null, null, EventConst.QUEST_HEADER, DataEventConst.QUEST_PAGE_REFRESH, null);
                this.sidePageMediator.update(request);
            }
        }

        const enableNonKappa = this.frame.contentWindow.document.getElementById("enable-non-kappa-button");
        if(enableNonKappa) {
            enableNonKappa.onclick = () => {
                QuestsUtils.enableNonKappaQuests();
                const request = new SidePageQuestRequest(this.sidePageMediator, null, null, EventConst.QUEST_HEADER, DataEventConst.QUEST_PAGE_REFRESH, null);
                this.sidePageMediator.update(request);
            }
        }

        const saveFile = this.frame.contentWindow.document.getElementById("save-progression-button");
        if(saveFile) {
            saveFile.addEventListener("click", () => {
                FileSaver.instance().open();
            })
        }

        const importProgression = this.frame.contentWindow.document.getElementById("import-progression-button");
        if(importProgression) {
            importProgression.addEventListener("click", () => {
                FileImport.instance().open();
            })
        }

        const autoCompleteQuest = this.frame.contentWindow.document.getElementById("quest-completion-automation");
        if(autoCompleteQuest) {
            autoCompleteQuest.addEventListener("click", () => {
                (new QuestCompletionAutomation(this.sidePageMediator)).open();
            })
        }
    }

    private async initMapPage() {
        const mapDefaultPreferenceDropdown = this.frame.contentWindow.document.getElementById("mapPreferenceDropdown");
        let mapId = AppConfigUtils.getAppConfig().userSettings.getMapDefaultPreference();
        if(mapId && mapDefaultPreferenceDropdown) {
            for(let map of MapsList) {
                if(map.id == mapId) {
                    mapDefaultPreferenceDropdown.appendChild(new Option(MapAdapter.getLocalizedMap(map.id), map.id, true, true));
                } else {
                    mapDefaultPreferenceDropdown.appendChild(new Option(MapAdapter.getLocalizedMap(map.id), map.id));
                }
            }
        }

        const mapSensitivitySlider = this.frame.contentWindow.document.getElementById("map-zoom-sensitivity")
        const mapSensitivityText = this.frame.contentWindow.document.getElementById("map-zoom-sensitivity-slider-text")
        if(mapSensitivitySlider && mapSensitivityText) {
            const scaler = AppConfigUtils.getAppConfig().userSettings.getMapZoomSensitivity();
            if(scaler) {
                (mapSensitivitySlider as HTMLInputElement).value = String(MapUtils.getSensitivityFromScaler(scaler));
                mapSensitivityText.textContent = String(MapUtils.getSensitivityFromScaler(scaler));
            } else {
                (mapSensitivitySlider as HTMLInputElement).value = String(MapUtils.getSensitivityFromScaler(MapUtils.getScaler()));
                mapSensitivityText.textContent = String(MapUtils.getSensitivityFromScaler(MapUtils.getScaler()));
            }
        }
    }

    private async registerMapPageListeners() {

        const mapPreferenceSelect:HTMLSelectElement = this.frame.contentWindow.document.getElementById("mapPreferenceDropdown") as HTMLSelectElement;
        if(mapPreferenceSelect) {
            mapPreferenceSelect.onchange = () => {
                AppConfigUtils.getAppConfig().userSettings.setMapDefaultPreference(mapPreferenceSelect.value);
                AppConfigUtils.save();
                console.log(`Changed Map Default to ${mapPreferenceSelect.value}`);
            }
        }

        const mapSensitivitySlider = this.frame.contentWindow.document.getElementById("map-zoom-sensitivity")
        const mapSensitivityText = this.frame.contentWindow.document.getElementById("map-zoom-sensitivity-slider-text")
        WindowsService.getCurrentWindow().then(window => {
            if(window.success) {
                if(mapSensitivitySlider && mapSensitivityText) {
                    mapSensitivitySlider.onmousemove = (e) => {
                        const valueString:string = (mapSensitivitySlider as HTMLInputElement).value
                        const value:number = Number(valueString);
                        if(value) {
                            mapSensitivityText.textContent = String(value);
                        }
                    }
                    mapSensitivitySlider.onmouseup = () => {
                        const valueString:string = (mapSensitivitySlider as HTMLInputElement).value
                        const value:number = Number(valueString);
                        if(value) {
                            AppConfigUtils.getAppConfig().userSettings.setMapZoomSensitivity(MapUtils.getScalerFromSensitivity(value));
                            AppConfigUtils.save();
                            MapUtils.setScaler(AppConfigUtils.getAppConfig().userSettings.getMapZoomSensitivity());
                        }
                    }
                }
            }
        })

    }
}