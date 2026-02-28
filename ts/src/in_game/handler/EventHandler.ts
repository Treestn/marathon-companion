import { EventInfo, IOwEvent, OwEventImpl, OWQuestEvent } from "./IEvents";
import { kGameInfo, kGames, kGamesEventKey, kGamesFeature, kGamesFeatures, kWindowNames, progressionTypes } from "../../consts";
import { WindowsService } from "../../WindowsService";
import { Maps } from "../../escape-from-tarkov/constant/MapsConst";
import { Background } from "../../background/background";
import WindowState = overwolf.windows.enums.WindowStateEx;
import { QuestsUtils } from "../../escape-from-tarkov/page/quests/utils/QuestsUtils";
import { NavigationUtils } from "../../escape-from-tarkov/utils/NavigationUtils";
import { AppConfigUtils } from "../../escape-from-tarkov/utils/AppConfigUtils";
import { SessionUtils } from "../../escape-from-tarkov/utils/SessionUtils";
import { OwEventMapper, ProgressionType, ProgressionTypes, QuestStates } from "../../escape-from-tarkov/constant/ProgressionConst";
import { PlayerProgressionUtils } from "../../escape-from-tarkov/utils/PlayerProgressionUtils";
import { QuestSidePageMediator } from "../../escape-from-tarkov/page/side/QuestSidePageMediator";
import { SidePageQuestRequest } from "../../escape-from-tarkov/page/side/handlers/request/SidePageQuestRequest";
import { EventConst } from "../../escape-from-tarkov/events/EventConst";
import { DataEventConst } from "../../escape-from-tarkov/events/DataEventConst";
import { OverwolfStatusUtils } from "../../escape-from-tarkov/utils/OverwolfStatusUtils";
import { PopupUtils } from "../../escape-from-tarkov/page/map/utils/PopupUtils";
import { PopupHelper } from "../../popup/PopupHelper";
import { ApplicationConfiguration } from "../../model/IApplicationConfiguration";

export class EventHandler {

    private static sidePageMediator:QuestSidePageMediator;

    static setSidePageMediator(mediator:QuestSidePageMediator) {
        this.sidePageMediator = mediator;
    }

    private static instance:EventHandler
    private static isRegistered = false;
    private static eventTriggered = false;
    private static featuresSet = false;

    private onInfoUpdates2Listener; 
    private onNewEvents;
    private runningGameInfo;

    private constructor() {
        this.onInfoUpdates2Listener = (info) => {
            EventHandler.eventTriggered = true;
            EventHandler.handleEvent(new OwEventImpl(JSON.stringify(info)))
        }
        this.onNewEvents = (info) => {
            // console.log(info);
            // handleEvent(new OwEventImpl(JSON.stringify(info)))
        }
        this.runningGameInfo = (info) => {
            // console.log(info);
            if(info) {
                if(info.success) {
                    EventHandler.isRegistered = true;
                    this.registerRunningGame();
                    this.registerGameInfo();
                }
            }
        }
    }

    static getInstance():EventHandler {
        this.instance = new EventHandler()
        return this.instance
    }

    async registerGameEvents(wait:boolean) {
        this.registerEvents();
        // The features need to be successfully set for the events to work
        // There is a loop to set the features until it is properly set otherwise event won't work
        // Sometimes, the call to setFeatures does nothing, therefore I made the loop until it does get called
        setTimeout(this.setFeatures, 1000);
    }

    private unregisterGameEvents() {
        overwolf.games.events.onInfoUpdates2.removeListener(this.onInfoUpdates2Listener);
        overwolf.games.events.onNewEvents.removeListener(this.onNewEvents);
    }

    private async registerEvents() {
        if(EventHandler.eventTriggered) {
            console.log("Events mounted");
            return;
        }
        this.unregisterGameEvents();
        console.log("Trying to mount events");
        this.registerRunningGameInfo();
        await this.delay(2000);
        if(!EventHandler.featuresSet) {
            this.setFeatures()
        }
        if(EventHandler.eventTriggered) {
            return;
        }
        this.registerEvents();
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private registerRunningGameInfo() {
        overwolf.games.getRunningGameInfo(this.runningGameInfo);
    }

    private registerGameInfo() {
        overwolf.games.events.onInfoUpdates2.addListener(this.onInfoUpdates2Listener);
    }

    private registerRunningGame() {
        overwolf.games.events.onNewEvents.addListener(this.onNewEvents)
    }


    private setFeatures() {
        overwolf.games.events.setRequiredFeatures(kGamesFeatures.get(kGames.marathon), info => {
            if (info.error){
              window.setTimeout(this.setFeatures, 2000);
              return;
            }
            if(EventHandler.featuresSet) {
                console.log("Features are already set");
                return;
            }
            console.log("Features have been set with success");
            EventHandler.featuresSet = true;
          });
    }

    private static handleEvent(event:IOwEvent) {
        this.logEvent(event)
        overwolf.games.events.getInfo(async (info) => {
            console.log(info);
        });
        
        EventHandler.eventTriggered = true;
        switch (event.getFeature()) {
            case kGamesFeature.matchInfo: this.handleMatchInfoEvent(event); break;
            case kGamesFeature.gameInfo: this.handleGameInfoEvent(event); break;
        }
    }

    private static logEvent(event:IOwEvent) {
        if(event.getGameInfo()) {
            console.log("EVENT Info: " + event.getFeature() + ", Scene: " + event.getGameInfo());
        } else if(event.getMap()) {
            console.log("EVENT Info: " + event.getFeature() + ", Map Selected: " + event.getMap());
        } else if(event.getRaidType()) {
            console.log("EVENT Info: " + event.getFeature() + ", Raid Type Selected: " + event.getRaidType());
        } else if(event.getSessionType()) {
            console.log("EVENT Info: " + event.getFeature() + ", Progression loaded to: " + event.getSessionType());
        } else if(event.getQuestsList()) {
            console.log("EVENT Info: " + event.getFeature() + ", Quests update received");
        }
        else if(event.getQuestsListv2()) {
            console.log("EVENT Info: " + event.getFeature() + ", Quests update received");
        }
    }

    private static handleMatchInfoEvent(event:IOwEvent) {
        if(event.getMap()) {
            OverwolfStatusUtils.eventTriggered(kGamesEventKey.map);
            SessionUtils.setTemporaryMapSelected(this.getIdFromMapEvent(event.getMap()));
        } else if(event.getRaidType()) {
            // TODO
            OverwolfStatusUtils.eventTriggered(kGamesEventKey.raid_type);
            SessionUtils.setTemporaryRaidTypeSelected(event.getRaidType());
        } else if(event.getSessionType()) {
            OverwolfStatusUtils.eventTriggered(kGamesEventKey.sessionType);
            this.handleSessionTypeChange(event.getSessionType());
        }
    }

    private static async handleGameInfoEvent(event:IOwEvent) {
        if((event.getQuestsList() || event.getQuestsListv2()) && AppConfigUtils.getAppConfig().userSettings.getQuestAutomationFlag()) {
            this.logQuestLists(event);
            overwolf.games.events.getInfo(async (info) => {
                if(info.success && this.isSessionTypeValid(info.res?.match_info?.session_type)) {
                    console.log(info.res?.match_info?.session_type);
                    this.handleSessionTypeChange(info.res?.match_info?.session_type);
                    let eventList = event.getQuestsList();
                    if(!eventList || eventList.length === 0) {
                        eventList = event.getQuestsListv2()
                    }
                    await PlayerProgressionUtils.handleOwQuestEvent(eventList, info.res.match_info.session_type);
                    const request:SidePageQuestRequest = new SidePageQuestRequest(this.sidePageMediator, null, null, EventConst.QUEST_UPDATE, DataEventConst.QUEST_UPDATE_OW_EVENT, null)
                    request.notifyOthers = true;
                    this.sidePageMediator.update(request)
                } else {
                    console.log(`Could not automate quest, the session type is invalid: ${info.res?.match_info?.session_type}`);
                    PopupHelper.addPopup("Automation Failed", "Failed to load progression type. Therefore the progression was not updated. Try restarting the game or changing or changing to PvE or PvP and back.", PopupHelper.ERROR_BORDER_COLOR);
                    PopupHelper.start();
                }
            });
        } else {
            if(event.getGameInfo()) {
                OverwolfStatusUtils.eventTriggered(kGamesFeature.gameInfo);
                switch (event.getGameInfo()) {
                    case kGameInfo.matchmaking: await this.handleMatchmakingEvent(); break;
                    case kGameInfo.loadToRaid: await this.handleLoadToRaidEvent(); break;
                    case kGameInfo.trader: await this.handleFirstTraderScene(); break;
                }
                SessionUtils.setPreviousGameInfoEvent(event.getGameInfo())
            }
        }
    }

    private static handleSessionTypeChange(sessionType:string) {
        // const progressionType:ProgressionType = OwEventMapper.getProgressionType(sessionType)
        // let progressionButton = document.getElementById("progressionButton");

        // if(progressionType && progressionButton) {
        //     if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() !== progressionType.storedString) {
        //         AppConfigUtils.getAppConfig().userSettings.setProgressionType(progressionType.storedString)
        //         if(progressionType.storedString === progressionTypes.pvp) {
        //             progressionButton.setAttribute("class", "window-control progression-control-pvp")
        //         }
        //         if(progressionType.storedString === progressionTypes.pve) {
        //             progressionButton.setAttribute("class", "window-control progression-control-pve")
        //         }
        //         NavigationUtils.handleProgressionTypeClick(progressionType.storedString)
        //     }
        // } else {
        //     console.log("Error loading the progression type for event");
        // }
    }

    private static isSessionTypeValid(session_type:string): boolean {
        return ProgressionTypes.PVE.owEvent === session_type || ProgressionTypes.PVP.owEvent === session_type
    }

    private static logQuestLists(event:IOwEvent) {
        let list = event.getQuestsList();
        if(!list || list.length === 0) {
            list = event.getQuestsListv2()
        }
        console.log("********UNHANDLED QUEST STATES*********");
        list.forEach(quest => {
            if(QuestStates.READY_TO_START.owEvent !== quest.quest_status 
                && QuestStates.AVAILABLE_FOR_FINISH.owEvent !== quest.quest_status
                && QuestStates.FAILED.owEvent !== quest.quest_status 
                && QuestStates.STARTED.owEvent !== quest.quest_status
                && QuestStates.COMPLETED.owEvent !== quest.quest_status) {
                console.log(`Quest: ${quest.quest} & id: ${quest.quest_id} & state: ${quest.quest_status}`);
            }
        })
        
        console.log("********READY TO START QUESTS*********");
        list.forEach(quest => {
            if(QuestStates.READY_TO_START.owEvent === quest.quest_status) {
                console.log(`Quest: ${quest.quest} & id: ${quest.quest_id} & trader: ${quest.trader} & location: ${quest.location} & type: ${quest.quest_type} & level: ${quest.level}`);
            }
        })
        console.log("*****AVAILABLE FOR FINISH QUESTS*****");
        list.forEach(quest => {
            if(QuestStates.AVAILABLE_FOR_FINISH.owEvent === quest.quest_status) {
                console.log(`Quest: ${quest.quest} & id: ${quest.quest_id} & trader: ${quest.trader} & location: ${quest.location} & type: ${quest.quest_type} & level: ${quest.level}`);
            }
        })
        console.log("***********FAILED QUESTS************");
        list.forEach(quest => {
            if(QuestStates.FAILED.owEvent === quest.quest_status) {
                console.log(`Quest: ${quest.quest} & id: ${quest.quest_id} & trader: ${quest.trader} & location: ${quest.location} & type: ${quest.quest_type} & level: ${quest.level}`);
            }
        })
        console.log("***********ACTIVE QUESTS************");
        list.forEach(quest => {
            if(QuestStates.STARTED.owEvent === quest.quest_status) {
                console.log(`Quest: ${quest.quest} & id: ${quest.quest_id} & trader: ${quest.trader} & location: ${quest.location} & type: ${quest.quest_type} & level: ${quest.level}`);
            }
        })
        console.log("***********COMPLETED QUESTS************");
        list.forEach(quest => {
            if(QuestStates.COMPLETED.owEvent === quest.quest_status) {
                console.log(`Quest: ${quest.quest} & id: ${quest.quest_id} & trader: ${quest.trader} & location: ${quest.location} & type: ${quest.quest_type} & level: ${quest.level}`);
            }
        })
    }

    private static async handleFirstTraderScene() {
        if(AppConfigUtils.getAppConfig().userSettings.getIsFirstTraderScene()) {
            overwolf.games.events.getInfo(async (info) => {
                const eventInfo:EventInfo = info.res as EventInfo
                if(info.success && this.isSessionTypeValid(eventInfo?.match_info?.session_type)) {
                    
                    console.log(eventInfo);
                    this.handleSessionTypeChange(eventInfo?.match_info?.session_type);
                    let list:OWQuestEvent[] = []
                    if(eventInfo?.game_info?.quests_list) {
                        list = JSON.parse(eventInfo?.game_info?.quests_list);
                    } 
                    if(eventInfo?.game_info?.quests_list_0) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_0))
                    }
                    if(eventInfo?.game_info?.quests_list_1) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_1))
                    }
                    if(eventInfo?.game_info?.quests_list_2) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_2))
                    }
                    if(eventInfo?.game_info?.quests_list_3) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_3))
                    }
                    if(eventInfo?.game_info?.quests_list_4) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_4))
                    }
                    if(eventInfo?.game_info?.quests_list_5) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_5))
                    }
                    if(eventInfo?.game_info?.quests_list_6) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_6))
                    }
                    if(eventInfo?.game_info?.quests_list_7) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_7))
                    }
                    if(eventInfo?.game_info?.quests_list_8) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_8))
                    }
                    if(eventInfo?.game_info?.quests_list_9) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_9))
                    }
                    if(eventInfo?.game_info?.quests_list_10) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_10))
                    }
                    if(eventInfo?.game_info?.quests_list_11) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_11))
                    }
                    if(eventInfo?.game_info?.quests_list_12) {
                        list.push(...JSON.parse(eventInfo.game_info.quests_list_12))
                    }
                    if(list.length > 0) {
                        await PlayerProgressionUtils.handleOwQuestEvent(list, info.res.match_info.session_type);
                        const request:SidePageQuestRequest = new SidePageQuestRequest(this.sidePageMediator, null, null, EventConst.QUEST_UPDATE, DataEventConst.QUEST_UPDATE_OW_EVENT, null)
                        request.notifyOthers = true;
                        this.sidePageMediator.update(request);
                        AppConfigUtils.getAppConfig().userSettings.setFirstTraderScene();
                    }
                } else {
                    console.log(`Could not automate quest, the session type is invalid: ${info.res?.match_info?.session_type}`);
                    PopupHelper.addPopup("Automation Failed", "Failed to load progression type. Therefore the progression was not updated. Try restarting the game or changing or changing to PvE or PvP and back.", PopupHelper.ERROR_BORDER_COLOR);
                    PopupHelper.start();
                }
            });
        }
    }

    private static async handleLoadToRaidEvent() {
        const currentWindow = await WindowsService.getCurrentWindow()
        if(SessionUtils.getTemporaryMapSelected()) {
            if(currentWindow.success) {
                console.log(`Matchmaking, loading map: ${SessionUtils.getTemporaryMapSelected()}`);
                WindowsService.getCurrentWindow().then(window => {
                    console.log(`Current window is: ${window}`);
                    if(window.success && window.window.name === kWindowNames.inGame) {
                        if(AppConfigUtils.getAppConfig().userSettings.getOpenWindowOnMatchmaking() === "false") {
                            console.log("Not opening the app, open window on matchmaking is off");
                            return;
                        }
                        if(window.window.isVisible) {
                            WindowsService.bringToFront(kWindowNames.inGame);
                        } else {
                            WindowsService.restore(kWindowNames.inGame).then(() => {
                                console.log(`In Game Window restored`);
                                WindowsService.bringToFront(kWindowNames.inGame);
                            })
                        }
                    } else if(window.success && window.window.name === kWindowNames.desktop) {
                        if(AppConfigUtils.getAppConfig().userSettings.getOpenWindowOnMatchmaking() === "true") {
                            WindowsService.bringToFront(kWindowNames.desktop, false);
                        }
                    }
                })
                // overwolf.windows.getWindowState(kWindowNames.questsReminder, state => {
                //     if(state.success && state.window_state_ex === WindowState.minimized) {
                //         console.log("Opening quest reminder");
                //         Background.instance().openQuestsReminderWindow();
                //     }
                // });
                
                if(SessionUtils.getPreviousGameInfoEvent() !== kGameInfo.matchmaking) {
                    console.log(SessionUtils.getPreviousGameInfoEvent());
                    // this.handleMatchmakingEvent();
                }
                await NavigationUtils.loadMapPage(SessionUtils.getTemporaryMapSelected());
            } else {
                console.log(`Load to raid error: ${currentWindow.error}`);
            }
        }
    }

    private static async handleMatchmakingEvent() {
        console.log("Handle Matchmaking event");
        // if(AppConfigUtils.getAppConfig().userSettings.getOpenQuestReminderPreference() === "true") {
        //     await WindowsService.close(kWindowNames.questsReminder)
        //     console.log("Active quests: Opening Quests Reminder Window");
        //     Background.instance().openQuestsReminderWindow();
        // }
    }

    private static getIdFromMapEvent(map):string {
        switch(map) {
            // case "": return Maps.ACERRA_SPACEPORT.id;
            // case "" : return Maps.BURIED_CITY.id;
            // case "" : return Maps.DAM_BATTLEGROUNDS.id;
            // case "" : return Maps.PRACTICE_RANGE.id;
            // case "" : return Maps.BLUE_GATE.id;
            default: return null;
        }
    }
}