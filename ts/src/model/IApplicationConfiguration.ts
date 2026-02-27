import { progressionTypes, settingsKeys } from "../consts";
import { I18nHelper } from "../locale/I18nHelper";
import { Maps, MapsList } from "../escape-from-tarkov/constant/MapsConst";
import { AppConfigUtils } from "../escape-from-tarkov/utils/AppConfigUtils";
import { MessageStoredImpl, MessageStoredObject } from "./message/IMessageStored";

export interface IApplicationConfiguration {
    userSettings: IUserSettings;
    mapSettings: IMapSettings;

    resolve():void;
}

export interface IUserSettings {
    resolve():void;

    setLocalePreference(locale:string)
    setQuestAutomationFlag(pref:boolean):void;
    setLevelReminderFlag(pref:boolean):void
    setSecondMonitorPreference(pref:string):void;
    setEnableSecondScreenWindow(pref:string):void;
    setProgressionType(pref:string):void;
    setLevelRequired(pref:string):void;
    setMapDefaultPreference(pref:string):void;
    setOpenWindowOnMatchmaking(pref:string):void;
    setOpenQuestReminderPreference(pref:string):void;
    setDesktopOnly(pref:string):void;
    setExternalLinkWarning(pref:string):void;
    setDoubleClickCompleteQuest(pref:string):void;
    setMinimizeOnGameClose(pref:string):void;
    setTimerOn(pref:boolean):void;
    addDisplayedPopupList(value:string):void;
    setInGameWindowOpacity(value:number):void;
    setPreferredImageUploadPath(folderPath:string):void;
    setMapZoomSensitivity(sensitivity:number):void;
    setFirstTimePlaying():void;
    setSidePageQuestHotkey(hotkey:string):void;
    setFirstTraderScene():void;

    getLocalePreference():string
    getQuestAutomationFlag():boolean;
    getLevelReminderFlag():boolean;
    getSecondMonitorPreference():string;
    getEnableSecondScreenWindow():string;
    getProgressionType():string;
    isLevelRequired():boolean;
    getMapDefaultPreference():string;
    getOpenWindowOnMatchmaking():string;
    getIsFirstTraderScene():boolean
    getOpenQuestReminderPreference():string;
    isDesktopOnly():boolean;
    isSecondScreenEnabled():boolean;
    getExternalLinkWarning():string;
    getDoubleClickCompleteQuest():string;
    getMinimizeOnGameClose():string;
    isTimerOn():boolean;
    getPopupDisplayedIdList():MessageStoredObject;
    // getFilterStates():IFilterStates;
    getInGameWindowOpacity():number;
    getPreferredImageUploadPath():string;
    getMapZoomSensitivity():number;
    isFirstTimePlaying():boolean;
    getSidePageQuestHotkey():string;
}

export interface IMapSettings {
    resolve():void;
}

export class ApplicationConfiguration implements IApplicationConfiguration {

    userSettings: IUserSettings;
    mapSettings: IMapSettings;

    constructor() {
        this.userSettings = new UserSettings();
        this.mapSettings = new MapSettings();
    }

    resolve() {
        if(!this.userSettings) {
            this.userSettings = new UserSettings()
        } else {
            this.userSettings = Object.assign(new UserSettings(), this.userSettings);
            this.userSettings.resolve();
        }

        if(!this.mapSettings) {
            this.mapSettings = new MapSettings()
        } else {
            this.mapSettings = Object.assign(new MapSettings(), this.mapSettings);
            this.mapSettings.resolve();
        }
        AppConfigUtils.save();
    } 

}

export class UserSettings implements IUserSettings {

    private locale:string;
    private questAutomationFlag:string;
    private levelReminderFlag:string;
    private levelRequired:string;
    private secondMonitorPreference:string;
    private enableSecondScreenWindow:string;
    private progressionType:string;
    private mapDefaultPreference:string;
    private openWindowOnMatchmaking:string;
    private openQuestReminderPreference:string;
    private desktopOnly:string;
    private externalLinkWarning:string;
    private doubleClickCompleteQuest:string;
    private minimizeOnGameClose:string;
    private displayedPopupList:MessageStoredObject;
    // private filterState:FilterStates;
    private inGameWindowOpacity:number;
    private timerOn:string;
    private preferredImageUploadPath:string;
    private zoomSensitivity:number;
    private firstTimePlaying:string;
    private sidePageQuestHotkey:string;
    private isFirstTraderScene:string;

    constructor() {
        this.init()
        this.resolve();
    }

    private init() {
        if(!this.locale) {
            this.locale = I18nHelper.defaultLocale;
        }
        if(!this.secondMonitorPreference) {
            this.secondMonitorPreference = localStorage.getItem(settingsKeys.secondMonitorPreference);
        }
        if(!this.enableSecondScreenWindow) {
            this.enableSecondScreenWindow = "true";
        }
        if(!this.mapDefaultPreference) {
            this.mapDefaultPreference = localStorage.getItem(settingsKeys.mapDefaultPreference);
        }
        if(!this.openWindowOnMatchmaking) {
            this.openWindowOnMatchmaking = localStorage.getItem(settingsKeys.openWindowOnMatchmaking);
        }
        if(!this.openQuestReminderPreference) {
            this.openQuestReminderPreference = localStorage.getItem(settingsKeys.openQuestReminderPreference);
        }
        if(!this.desktopOnly) {
            this.desktopOnly = localStorage.getItem(settingsKeys.desktopOnly);
        }
        if(!this.externalLinkWarning) {
            this.externalLinkWarning = localStorage.getItem(settingsKeys.externalLinkWarning);
        }
        if(!this.doubleClickCompleteQuest) {
            this.doubleClickCompleteQuest = localStorage.getItem(settingsKeys.doubleClickCompleteQuest);
        }
        if(!this.minimizeOnGameClose) {
            this.minimizeOnGameClose = localStorage.getItem(settingsKeys.minimizeOnGameClose);
        }
        if(!this.externalLinkWarning) {
            this.externalLinkWarning = localStorage.getItem(settingsKeys.externalLinkWarning);
        }
        if(!this.questAutomationFlag) {
            this.questAutomationFlag = "false";
        }
        if(!this.timerOn) {
            this.timerOn = "true";
        }
        if(!this.preferredImageUploadPath) {
            this.preferredImageUploadPath = overwolf.io.paths.documents
        }
        if(!this.zoomSensitivity) {
            this.zoomSensitivity = 1.4;
        }
        if(!this.firstTimePlaying) {
            this.firstTimePlaying = "true";
        }
        if(!this.sidePageQuestHotkey) {
            this.sidePageQuestHotkey = "F1"
        }
        if(!this.isFirstTraderScene) {
            this.isFirstTraderScene = "true"
        }

        const storedDislayList = localStorage.getItem(settingsKeys.displayedPopupList);
        if(storedDislayList) {
            this.displayedPopupList = JSON.parse(storedDislayList);
        }
        // if(!this.filterState) {
        //     this.filterState = new FilterStates();
        // }
    }

    resolve() {
        if(!this.locale) {
            this.locale = I18nHelper.defaultLocale;
        }
        if(!this.levelRequired) {
            this.setLevelRequired("true");
        }
        if(!this.progressionType) {
            this.setProgressionType(progressionTypes.pvp);
        }
        if(!this.mapDefaultPreference) {
            this.setMapDefaultPreference(MapsList[0].id);
        }
        if(!this.openWindowOnMatchmaking) {
            this.setOpenWindowOnMatchmaking("true");
        }
        if(!this.openQuestReminderPreference) {
            this.setOpenQuestReminderPreference("true")
        }
        if(!this.desktopOnly) {
            this.setDesktopOnly("false")
        }
        if(!this.enableSecondScreenWindow) {
            this.setEnableSecondScreenWindow("true");
        }
        if(!this.externalLinkWarning) {
            this.setExternalLinkWarning("true");
        }
        if(!this.doubleClickCompleteQuest) {
            this.setDoubleClickCompleteQuest("false")
        }
        if(!this.minimizeOnGameClose) {
            this.setMinimizeOnGameClose("false");
        }
        if(!this.displayedPopupList) {
            this.displayedPopupList = new MessageStoredImpl();
        }
        if(!this.inGameWindowOpacity) {
            this.inGameWindowOpacity = 1;
        }
        if(!this.levelReminderFlag) {
            this.levelReminderFlag = "true";
        }
        if(!this.questAutomationFlag) {
            this.questAutomationFlag = "false"
        }
        if(!this.timerOn) {
            this.timerOn = "true";
        }
        if(!this.preferredImageUploadPath) {
            this.preferredImageUploadPath = overwolf.io.paths.documents
        }
        if(!this.zoomSensitivity) {
            this.zoomSensitivity = 1.4;
        }
        if(!this.firstTimePlaying) {
            this.firstTimePlaying = "true";
        }
        if(!this.sidePageQuestHotkey) {
            this.sidePageQuestHotkey = "F1"
        }
        if(!this.isFirstTraderScene) {
            this.isFirstTraderScene = "true"
        }
        // if(!this.filterState) {
        //     this.filterState = new FilterStates();
        // }
        // this.filterState = Object.assign(new FilterStates(), this.filterState);
        // this.filterState.resolve();
    }

        
    setLocalePreference(locale: string) {
        this.locale = locale;
        AppConfigUtils.save()
    }
    getLocalePreference(): string {
        return this.locale;
    }

    setFirstTraderScene(): void {
        this.isFirstTraderScene = "false"
        AppConfigUtils.save();
    }

    setSidePageQuestHotkey(hotkey:string): void {
        this.sidePageQuestHotkey = hotkey;
    }

    setFirstTimePlaying(): void {
        this.firstTimePlaying = "false";
    }

    setQuestAutomationFlag(pref: boolean): void {
        if(pref) {
            this.questAutomationFlag = "true"
        } else {
            this.questAutomationFlag = "false";
        }
    }

    setLevelReminderFlag(pref: boolean): void {
        if(pref) {
            this.levelReminderFlag = "true"
        } else {
            this.levelReminderFlag = "false"
        }
        AppConfigUtils.save();
    }

    setInGameWindowOpacity(value: number): void {
        this.inGameWindowOpacity = value;
    }

    setSecondMonitorPreference(pref: string): void {
        this.secondMonitorPreference = pref
        AppConfigUtils.save();
    }

    setEnableSecondScreenWindow(pref: string): void {
        if(!this.isStringBooleanValueAccepted(pref)) {
            throw new Error(`Second screen enabled is wrong: ${pref}`);
        }
        this.enableSecondScreenWindow = pref;
        AppConfigUtils.save();
    }

    setProgressionType(pref:string) {
        this.progressionType = pref
        AppConfigUtils.save();
    }

    setLevelRequired(pref:string):void {
        if(!this.isStringBooleanValueAccepted(pref)) {
            throw new Error(`Open window on matchmaking is wrong: ${pref}`);
        }
        this.levelRequired = pref
        AppConfigUtils.save();
    }

    setMapDefaultPreference(pref:string):void {
        this.mapDefaultPreference = pref;
        AppConfigUtils.save();
    }

    setOpenWindowOnMatchmaking(pref:string):void {
        if(!this.isStringBooleanValueAccepted(pref)) {
            throw new Error(`Open window on matchmaking is wrong: ${pref}`);
        }
        this.openWindowOnMatchmaking = pref;
        AppConfigUtils.save();
    }
    
    setOpenQuestReminderPreference(pref:string):void {
        if(!this.isStringBooleanValueAccepted(pref)) {
            throw new Error(`Open window on matchmaking is wrong: ${pref}`);
        }
        this.openQuestReminderPreference = pref
        AppConfigUtils.save();
    }

    setDesktopOnly(pref:string):void {
        if(!this.isStringBooleanValueAccepted(pref)) {
            throw new Error(`Desktop only is wrong: ${pref}`);
        }
        this.desktopOnly = pref
        AppConfigUtils.save();
    }

    setExternalLinkWarning(pref:string):void {
        if(!this.isStringBooleanValueAccepted(pref)) {
            throw new Error(`Desktop only is wrong: ${pref}`);
        }
        this.externalLinkWarning = pref
        AppConfigUtils.save();
    }

    setDoubleClickCompleteQuest(pref:string):void {
        if(!this.isStringBooleanValueAccepted(pref)) {
            throw new Error(`Double click is wrong: ${pref}`);
        }
        this.doubleClickCompleteQuest = pref
        AppConfigUtils.save();
    }

    setMinimizeOnGameClose(pref:string):void {
        if(!this.isStringBooleanValueAccepted(pref)) {
            throw new Error(`Double click is wrong: ${pref}`);
        }
        this.minimizeOnGameClose = pref
        AppConfigUtils.save();
    }

    setTimerOn(pref:boolean) {
        if(pref) {
            this.timerOn = "true"
        } else {
            this.timerOn = "false";
        }
    }

    setPreferredImageUploadPath(folderPath: string): void {
        this.preferredImageUploadPath = folderPath;
    }

    setMapZoomSensitivity(sensitivity: number): void {
        this.zoomSensitivity = sensitivity;
    }

    addDisplayedPopupList(value:string):void {
        let object:MessageStoredObject = this.getPopupDisplayedIdList();
        object.messagesDisplayed.push(value);
        AppConfigUtils.save();
    }

    getIsFirstTraderScene(): boolean {
        return this.isFirstTraderScene === "true";
    }

    getSidePageQuestHotkey(): string {
        return this.sidePageQuestHotkey;
    }

    isFirstTimePlaying():boolean {
        return this.firstTimePlaying === "true";
    }

    getQuestAutomationFlag(): boolean {
        return this.questAutomationFlag === "true"
    }

    getLevelReminderFlag(): boolean {
        if(this.levelReminderFlag === "true") {
            return true
        } else {
            return false
        }
    }

    getSecondMonitorPreference(): string {
        return this.secondMonitorPreference
    }

    getEnableSecondScreenWindow(): string {
        return this.enableSecondScreenWindow
    }

    getProgressionType():string {
        return this.progressionType
    }

    isLevelRequired():boolean {
        return this.levelRequired === "true" ? true : false;
    }

    getMapDefaultPreference():string {
        return this.mapDefaultPreference
    }

    getOpenWindowOnMatchmaking():string {
        return this.openWindowOnMatchmaking
    }

    getOpenQuestReminderPreference():string {
        return this.openQuestReminderPreference
    }

    isDesktopOnly():boolean {
        return this.desktopOnly === "true" ? true : false;
    }

    isSecondScreenEnabled():boolean {
        return this.enableSecondScreenWindow === "true";
    }

    getExternalLinkWarning():string {
        return this.externalLinkWarning
    }

    getDoubleClickCompleteQuest():string {
        return this.doubleClickCompleteQuest
    }

    getMinimizeOnGameClose():string {
        return this.minimizeOnGameClose
    }

    isTimerOn(): boolean {
        if(this.timerOn === "true") {
            return true;
        }
        return false;
    }

    getPopupDisplayedIdList():MessageStoredObject {
        if(this.displayedPopupList) {
            return this.displayedPopupList;
        } else {
            this.displayedPopupList = new MessageStoredImpl();
            return this.displayedPopupList
        }
    }

    getInGameWindowOpacity(): number {
        return this.inGameWindowOpacity
    }

    getPreferredImageUploadPath(): string {
        return this.preferredImageUploadPath;
    }

    getMapZoomSensitivity(): number {
        return this.zoomSensitivity;
    }

    // getFilterStates(): IFilterStates {
    //     return this.filterState;
    // }

    private isStringBooleanValueAccepted(value:string) {
        return value === "true" || value === "false"
    }
}

export class MapSettings implements IMapSettings {

    constructor() {

    }

    resolve(): void {
        
    }
}