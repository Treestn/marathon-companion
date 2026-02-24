import { kGamesEventKey, kGamesFeature } from "../../consts";
import { PopupHelper } from "../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../constant/AppPopupMessages";
import { DataEventConst } from "../events/DataEventConst";
import { EventConst } from "../events/EventConst";
import { OverwolfEventStatusResponse } from "../../model/OverwolfResponse";
import { SidePageQuestRequest } from "../page/side/handlers/request/SidePageQuestRequest";
import { QuestSidePageMediator } from "../page/side/QuestSidePageMediator";
import { AppConfigUtils } from "./AppConfigUtils";

export class OverwolfStatusUtils {

    private static sidePageMediator:QuestSidePageMediator;

    static setSidePageMediator(mediator:QuestSidePageMediator) {
        this.sidePageMediator = mediator;
    }

    private static readonly redDotColor = "#8f1515"
    private static readonly redDotGlowColor = "drop-shadow(0 0 2px red)"
    private static readonly greenDotColor = "#1c6117"
    private static readonly greenDotGlowColor = "drop-shadow(0 0 2px green)"
    private static readonly yellowDotColor = "#616117"
    private static readonly yellowDotGlowColor = "drop-shadow(0 0 2px #616117)"
    private static readonly greyDotColor = "#b3a7a7"
    private static readonly greyDotGlowColor = "drop-shadow(0 0 2px #adadad)"

    private static readonly statusMap:Map<string, boolean> = new Map();
    
    static readonly eventStatus:Map<string, number> = new Map();
    private static started:boolean = false;
    private static timeoutId:number;
    private static readonly timerDuration = 15 * 60 * 1000;
    private static automationEnabled:boolean = null;

    static isQuestAutomationEnabled():boolean {
        const automation = AppConfigUtils.getAppConfig().userSettings.getQuestAutomationFlag();
        if(this.automationEnabled === null) {
            this.automationEnabled = automation
        }
        const overwolfQuestEvent = this.eventStatus.get(kGamesEventKey.questsList);
        const newQuestState = overwolfQuestEvent === 1 || overwolfQuestEvent === 2;
        const overwolfGameModeEvent = this.eventStatus.get(kGamesEventKey.sessionType);
        const newGameModeState = overwolfGameModeEvent === 1 || overwolfGameModeEvent === 2;

        const state = automation && newQuestState && newGameModeState
        if(state !== this.automationEnabled) {
            this.automationEnabled = state
            this.handleAutomationChanged();
        }
        return state
    }

    private static handleAutomationChanged() {
        AppConfigUtils.getAppConfig().userSettings.setLevelRequired(this.automationEnabled ? "false" : "true");
        AppConfigUtils.save();
        const levelDomEl = document.getElementById("level-navigation");
        if(levelDomEl) {
            if(!this.automationEnabled) {
                console.log("Levels are required to unlock quests");
                levelDomEl.style.display = ""
            } else {
                console.log("Levels are not required to unlock quests");
                levelDomEl.style.display = "none"
            }
        }
        if(AppConfigUtils.getAppConfig().userSettings.getQuestAutomationFlag() && !this.automationEnabled) {
            PopupHelper.addPopup("Automation Down", AppPopupMessagesConst.QUEST_AUTOMATION_DOWN, PopupHelper.ERROR_BORDER_COLOR);
            PopupHelper.start();
        }
        if(AppConfigUtils.getAppConfig().userSettings.getQuestAutomationFlag() && this.automationEnabled) {
            PopupHelper.addPopup("Automation Back Up", AppPopupMessagesConst.QUEST_AUTOMATION_BACK_UP, PopupHelper.SUCCESS_BORDER_COLOR);
            PopupHelper.start();
        }
    }

    static async eventTriggered(eventKey:string) {
        if(this.statusMap.has(eventKey) && this.eventStatus.get(eventKey) === 1) {
            this.statusMap.set(eventKey, true);
        }
        for(const [key, triggered] of this.statusMap) {
            if(!triggered) {
                return;
            }
        }
        this.resetCron(60 * 60 * 1000);
    }

    static startOverwolfEventCron(duration?:number) {
        if(!this.started) {
            this.started = true;
            // Triggers every 15 minutes by default
            this.statusMap.set(kGamesFeature.gameInfo, false);
            this.statusMap.set(kGamesEventKey.questsList, false);
            // this.statusMap.set(kGamesEventKey.sessionType, false);
            this.statusMap.set(kGamesEventKey.map, false);
            this.timeoutId = setTimeout(() => {
                this.started = false;
                this.refreshOverwolfEventStatus(true);
                this.startOverwolfEventCron();
            }, duration ? duration : this.timerDuration);
        }
    }

    static resetCron(duration?:number) {
        if(this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.started = false;
        }
        this.startOverwolfEventCron(duration)
    }

    static stopCron() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.started = false;
            this.timeoutId = null;
        }
    }

    static async refreshOverwolfEventStatus(refreshPage?:boolean) {
        const overwolfEventsStatus = await fetch("https://game-events-status.overwolf.com/27168_prod.json", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if(overwolfEventsStatus.ok) {
            this.resolveData(JSON.parse(await overwolfEventsStatus.text()));
            this.refreshUI();
            if(refreshPage) {
                const request:SidePageQuestRequest = new SidePageQuestRequest(this.sidePageMediator, null, null, EventConst.QUEST_UPDATE, DataEventConst.QUEST_AUTOMATION, null)
                request.notifyOthers = true;
                this.sidePageMediator.update(request)
            }
        }
    }

    private static resolveData(response:OverwolfEventStatusResponse) {
        response.features.forEach(feature => {
            feature.keys.forEach(key => {
                if(key.name === kGamesEventKey.map 
                    || key.name === kGamesEventKey.questsList 
                    || key.name === kGamesEventKey.questsListv2 
                    || key.name === kGamesEventKey.sessionType
                ) {
                    this.eventStatus.set(key.name, key.state);
                }
            })
        })
    }

    private static refreshUI() {
        const overall = document.getElementById("overallOverwolfStatus");
        const questsList = document.getElementById("questsListGlowDot");
        const gameMode = document.getElementById("gameModeGlowDot");
        const mapSelection = document.getElementById("mapSelectionGlowDot");

        if(questsList) {
            this.handleGlow(questsList, this.eventStatus.get(kGamesEventKey.questsList))
        }
        if(gameMode) {
            this.handleGlow(gameMode, this.eventStatus.get(kGamesEventKey.sessionType))
        }
        if(mapSelection) {
            this.handleGlow(mapSelection, this.eventStatus.get(kGamesEventKey.map))
        }
        if(overall) {
            let finalStatus = 0;
            for(const [key, status] of this.eventStatus) {
                finalStatus += status;
                if(status === 0) {
                    finalStatus += 3;
                }
            }
            finalStatus /= this.eventStatus.size;
            this.handleGlow(overall, Math.round(finalStatus));
        }
    }

    private static handleGlow(glowingDot:HTMLElement, status:number) {
        if(status === 1) {
            glowingDot.style.backgroundColor = this.greenDotColor;
            glowingDot.style.filter = this.greenDotGlowColor;
        } else if(status === 2) {
            glowingDot.style.backgroundColor = this.yellowDotColor;
            glowingDot.style.filter = this.yellowDotGlowColor;
        } else if(status === 0) {
            glowingDot.style.backgroundColor = this.greyDotColor;
            glowingDot.style.filter = this.greyDotGlowColor;
        } else {
            glowingDot.style.backgroundColor = this.redDotColor;
            glowingDot.style.filter = this.redDotGlowColor;
        }
    }

}