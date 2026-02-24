// import { kHotkeys, kWindowNames } from '../consts';
// import RunningGameInfo = overwolf.games.RunningGameInfo;
// import GetWindowStateResult = overwolf.windows.GetWindowStateResult
// import { WindowControls } from '../WindowControls';
// import WindowState = overwolf.windows.enums.WindowStateEx;
// import { OWHotkeys } from '@overwolf/overwolf-api-ts/dist';
// import { Quest, QuestsObject } from '../escape-from-tarkov/json_element/IQuestsElements';
// import { QuestsReminderCreator } from './QuestsReminderCreator';
// import { QuestsUtils } from '../escape-from-tarkov/page/quests/utils/QuestsUtils';
// import { ItemsElementUtils } from '../escape-from-tarkov/utils/ItemsElementUtils';
// import { SessionUtils } from '../escape-from-tarkov/utils/SessionUtils';
// import { HideoutUtils } from '../escape-from-tarkov/page/hideout/utils/HideoutUtils';
// import { HideoutLevels, HideoutObject, HideoutStations } from '../escape-from-tarkov/json_element/HideoutObject';
// import { PlayerProgressionUtils } from '../escape-from-tarkov/utils/PlayerProgressionUtils';
// import { HelperCreation } from '../escape-from-tarkov/service/MainPageCreator/HelperCreation';
// import { Maps } from '../escape-from-tarkov/constant/MapsConst';
// import { ItemsUtils } from '../escape-from-tarkov/utils/ItemsUtils';
// import { ItemFilterBuilder } from '../escape-from-tarkov/page/items/builder/helper/ItemFilterBuilder';
// import { BackgroundHelper } from '../background/BackgroundHelper';
// import { Hotkeys } from '../hotkeys/Hotkeys';
// import { AppConfigUtils } from '../escape-from-tarkov/utils/AppConfigUtils';
// import { MapAdapter } from '../escape-from-tarkov/adapter/MapAdapter';
// import { I18nHelper } from '../locale/I18nHelper';

// export class QuestsReminder {

//   private windowIsOpen;
//   private gameInFocus:boolean;

//   private static _instance:QuestsReminder;

//   private static questReminderBody:HTMLElement;

//   private activeHideoutMap:Map<HideoutStations, HideoutLevels[]>;
//   private mapSelected:string;
//   private questOnly:boolean = true;
//   private hideoutOnly:boolean = false;

//   private hotkeyFrame:Hotkeys;

//   private constructor() {
//     this.windowIsOpen = false;
//     this.gameInFocus = false;

//     this.hotkeyFrame = Hotkeys.instance();

//     // Background.instance().updateAd(kWindowNames.questsReminder);
//   }

//   public static instance() {
//     if(!QuestsReminder._instance) {
//         QuestsReminder._instance = new QuestsReminder();
//     }
//     return QuestsReminder._instance
//   }


//   async init() {
//     QuestsReminder.questReminderBody = document.getElementById("quests_reminder");
//     //Register close listener
//     // WindowControls.closeWindow(kWindowNames.questsReminder)
//     // WindowControls.moveWindow(kWindowNames.questsReminder)

//     overwolf.games.onGameInfoUpdated.addListener(QuestsReminder._instance.onGameInfoUpdated);
//     overwolf.windows.onStateChanged.addListener(QuestsReminder._instance.onWindowStateChanged);

//     this.setToggleHotkeyBehavior();

//     await I18nHelper.init();

//     // Background.instance().updateAd(kWindowNames.questsReminder);

//     this.registerListeners()

//     await this.setupItemsMap();
//     await this.setupQuestObject();
//     await this.setupHideoutObject();
//     await PlayerProgressionUtils.load();
    
//     this.mapSelected = SessionUtils.getTemporaryMapSelected();
//     if(!this.mapSelected) {
//       this.mapSelected = Maps.DAM_BATTLEGROUNDS.id;
//     }
    
//     this.activeHideoutMap = HideoutUtils.getActiveStationsLevel();

//     // BackgroundHelper.getHotkey(kHotkeys.toggleQuestReminder).then(result =>  {
//     //   const scHotkeyElem = document.getElementById("hotkeyQuestReminder");
//     //   if(scHotkeyElem) {
//     //     scHotkeyElem.textContent = result;
//     //   }
//     //   const textNode = Array.from(scHotkeyElem.parentElement.childNodes).find(n => n.nodeType === Node.TEXT_NODE) as Text | undefined;
//     //   textNode.textContent = I18nHelper.get("header.hotkey.showHide") + ": ";
//     // })

//     // const schotkey = document.getElementById("hotkeyQuestReminder") as HTMLElement;
//     // schotkey.addEventListener("click", () => {
//     //     console.log("Clicked hotkey");
//     //     Hotkeys.setHotkey(kHotkeys.toggleQuestReminder)
//     //     Hotkeys.setDomHotkeyId("hotkeyQuestReminder")
//     //     this.hotkeyFrame.open();
//     //     this.hotkeyFrame.overridePosition();
//     // })
//     QuestsReminder.setOpacity();
//     this.buildPage();
//   }

//   private async setupQuestObject() {
//     const quests = await QuestsUtils.getStoredData();
//     if(quests) {
//         let data:QuestsObject = JSON.parse(quests)
//         if(data) {
//             QuestsUtils.setQuestsObject(data);
//         }
//     } else {
//       console.log("There are no quests stored to create the quests reminder ...");
//     }
//   }

//   private async setupHideoutObject() {
//     const hideout = await HideoutUtils.getStoredData();
//     if(hideout) {
//         let data:HideoutObject = JSON.parse(hideout)
//         if(data) {
//           HideoutUtils.setHideoutObject(data);
//         }
//     } else {
//       console.log("There are no hideout stored to create the quests reminder ...");
//     }
//   }

//   private async setupItemsMap() {
//     const data = await ItemsElementUtils.getStoredData();
//     if(data) {
//       const itemsData = JSON.parse(data)
//       ItemsElementUtils.setItemsMap(itemsData);
//     } else {
//         console.log("No items elements saved");
//     }
//   }

//   private buildPage() {
//     this.registerButtons();
//     this.buildQuestPage();
//   }

//   private buildQuestPage() {
//     let activeQuests:Quest[] = QuestsUtils.getActiveQuestsForMap(this.mapSelected);

//     const runner = this.clearRunner();

//     const activeMapWrapper = HelperCreation.createDiv("", "active-quest-map-wrapper", "");
//     const activeMapText = HelperCreation.createB("active-quest-map-text", `${I18nHelper.get("pages.questReminder.map")}: `);
//     const mapSelector = QuestsReminderCreator.createMapSelectionDropdown(this.mapSelected);
//     activeMapWrapper.appendChild(activeMapText);
//     activeMapWrapper.appendChild(mapSelector);

//     const scroll = HelperCreation.createDiv("scroll", "scroll-div", "")
//     if(activeQuests.length > 0) {
//       activeQuests.forEach(quest => {
//         const reminderContainer = QuestsReminderCreator.createReminder(quest, this.mapSelected)
//         if(reminderContainer) {
//           scroll.appendChild(reminderContainer);
//         }
//       })
//     }

//     runner.appendChild(activeMapWrapper);
//     runner.appendChild(scroll);

//     const mapSelect = document.getElementById("quest-reminder-map-selector") as HTMLSelectElement;
//     this.registerMapSelect(mapSelect);
//   }

//   private buildItemsPage() {
//     let activeItemsList:Map<string, string[]>;
//     if(this.questOnly) {
//       activeItemsList = ItemsUtils.getAllQuestItemsActive(true, true);
//     } else {
//       activeItemsList = ItemsUtils.getAllHideoutItemsActive(true);
//     }

//     const activeMapWrapper = HelperCreation.createDiv("", "active-quest-map-wrapper", "");
//     const questButton = ItemFilterBuilder.createQuestButton();
//     const hideoutButton = ItemFilterBuilder.createHideoutButton();
//     activeMapWrapper.appendChild(questButton);
//     activeMapWrapper.appendChild(hideoutButton);

//     this.registerItemQuestButton(questButton, questButton.children[0] as HTMLInputElement, hideoutButton.children[0] as HTMLInputElement)
//     this.registerItemHideoutButton(hideoutButton, hideoutButton.children[0] as HTMLInputElement, questButton.children[0] as HTMLInputElement)

//     const runner = this.clearRunner();

//     if(this.questOnly) {
//       (questButton.children[0] as HTMLInputElement).checked = true
//     } else {
//       (hideoutButton.children[0] as HTMLInputElement).checked = true
//     }

//     // const activeMapWrapper = HelperCreation.createDiv("", "", "");
//     // const activeMapText = HelperCreation.createB("active-quest-map-text", "Active Quests for: ");
//     // const mapSelector = this.buildMapSelector();
//     // activeMapWrapper.appendChild(activeMapText);
//     // activeMapWrapper.appendChild(mapSelector);

//     const scroll = HelperCreation.createDiv("scroll", "scroll-div", "")
//     if(activeItemsList.size > 0) {
//       activeItemsList.forEach((idList, itemId) => {
//         scroll.appendChild(QuestsReminderCreator.createItemReminder(itemId, idList));
//       })
//     }

//     runner.appendChild(activeMapWrapper);
//     runner.appendChild(scroll);
//   }

//   private registerMapSelect(mapSelect:HTMLSelectElement) {
//     mapSelect.addEventListener("change", (e) => {
//       const target = e.target as HTMLSelectElement;
//       this.mapSelected = target.id;
//       this.buildQuestPage();
//     })
//   }

//   private registerItemQuestButton(label:HTMLElement, input:HTMLInputElement, hideoutInput:HTMLInputElement) {
//     label.onclick = () => {
//       if(this.hideoutOnly) {
//           hideoutInput.checked = false;
//           this.hideoutOnly = false;
//       }
//       this.questOnly = input.checked
//       this.buildItemsPage();
//     }
//   }

//   private registerItemHideoutButton(label:HTMLElement, input:HTMLInputElement, questInput:HTMLInputElement) {
//     label.onclick = () => {
//       if(this.questOnly) {
//         questInput.checked = false;
//           this.questOnly = false;
//       }
//       this.hideoutOnly = input.checked
//       this.buildItemsPage();
//     }
//   }

//   private registerButtons() {
//     const questButton = document.getElementById("quest-runner-button") as HTMLButtonElement;
//     const itemsButton = document.getElementById("items-runner-button") as HTMLButtonElement;
//     if(questButton && itemsButton) {
//       questButton.classList.add("quest-button-active");
//       questButton.onclick = (e) => {
//         if(questButton.classList.contains("quest-button-active")) {
//           e.stopPropagation();
//           return;
//         }
//         this.clearButton(questButton);
//         this.clearButton(itemsButton);
//         questButton.classList.add("quest-button-active");
//         this.buildQuestPage();
//       }
//       itemsButton.onclick = (e) => {
//         if(itemsButton.classList.contains("quest-button-active")) {
//           e.stopPropagation();
//           return;
//         }
//         this.clearButton(questButton);
//         this.clearButton(itemsButton);
//         itemsButton.classList.add("quest-button-active");
//         this.buildItemsPage();
//       }
//     } else {
//       console.log("One of the buttons were not found");
//     }
//   }

//   private clearButton(button:HTMLButtonElement) {
//     button.classList.forEach(class_ => {
//       if(class_ === "quest-button-active") {
//         button.classList.remove("quest-button-active");
//       }
//     })
//   }

//   private clearRunner():HTMLElement {
//     const runner = document.getElementById("runner");
//     if(runner) {
//       for(let i = runner.children.length - 1; i >= 0; i--) {
//         runner.children[i].remove()
//       }
//       return runner;
//     }
//   }

//   private async setToggleHotkeyBehavior() {
//     const toggleInGameWindow = async (
//         hotkeyResult: overwolf.settings.hotkeys.OnPressedEvent
//     ): Promise<void> => {
//         console.log(`pressed hotkey for ${hotkeyResult.name}`);
//         // const inGameState = await this.getWindowState();
//         overwolf.windows.getWindowState(kWindowNames.questsReminder, state => {
//             if (state.success && state.window_state_ex !== WindowState.closed) {
//                 overwolf.windows.obtainDeclaredWindow(kWindowNames.questsReminder, (result) => {
//                     if(result.success && result.window && result.window.id) {
//                         if (
//                             state.window_state === WindowState.normal ||
//                             state.window_state === WindowState.maximized
//                         ) {
//                             overwolf.windows.minimize(result.window.id);
//                         } else if (
//                             state.window_state === WindowState.minimized ||
//                             state.window_state === WindowState.closed
//                         ) {
//                             overwolf.windows.restore(result.window.id);
//                         }
//                     }
//                 })
//             }
//           });
//     };
//     // OWHotkeys.onHotkeyDown(kHotkeys.toggleQuestReminder, toggleInGameWindow);
//   }

//   static setOpacity(opacity?:number) {
//     if(this.questReminderBody) {
//       if(!opacity) {
//         opacity = AppConfigUtils.getAppConfig().userSettings.getInGameWindowOpacity();
//       }
//       if(opacity) {
//         this.questReminderBody.style.opacity = String(opacity)
//       } else {
//         this.questReminderBody.style.opacity = "1"
//       }
//     }
//   }


//   recenterMapOnWindowOpen() {
//     const recenterButton:HTMLDivElement = document.getElementsByClassName("recenter-resize-container")[0] as HTMLDivElement;
//     recenterButton.click();
//   }

//   async getGameInFocus() {
//     const gameInfo:RunningGameInfo = await new Promise(resolve => {
//       overwolf.games.getRunningGameInfo(resolve);
//     });

//     const inFocus = Boolean(gameInfo && gameInfo.isRunning && gameInfo.isInFocus);

//     console.log(`getGameInFocus():`, gameInfo, inFocus);

//     return inFocus;
//   }

//   onGameInfoUpdated(e) {
//     const inFocus = (
//       e &&
//       e.gameInfo &&
//       e.gameInfo.isRunning &&
//       e.gameInfo.isInFocus
//     );

//     console.log(`onGameInfoUpdated:`, e);

//     if (this.gameInFocus !== inFocus) {
//       this.gameInFocus = inFocus;
//       // Background.instance().updateAd(kWindowNames.questsReminder);
//     }
//   }

//   async getWindowIsOpen() {    
//     const state:GetWindowStateResult = await new Promise(resolve => {
//       overwolf.windows.getWindowState(kWindowNames.inGame, resolve);
//     });

//     if (state && state.success && state.window_state_ex) {
//       const isOpen = (
//         state.window_state_ex === 'normal' ||
//         state.window_state_ex === 'maximized'
//       );

//       console.log(`getWindowIsOpen():`, state.window_state_ex, isOpen);
//       // EftMain.recenterMapOnLoad();
//       return isOpen;
//     }

//     return false;
//   }

//   onWindowStateChanged(state) {
//     if (state && state.window_state_ex && state.window_name === kWindowNames.inGame) {
//       const isOpen = (
//         state.window_state_ex === 'normal' ||
//         state.window_state_ex === 'maximized'
//       );

//       console.log(`onWindowStateChanged:`, state.window_state_ex, isOpen);

//       if (this.windowIsOpen !== isOpen) {
//         this.windowIsOpen = isOpen;
//         // Background.instance().updateAd(kWindowNames.questsReminder);
//       }
//     }
//   }

//   registerListeners() {

//   }
// }
// QuestsReminder.instance().init();
