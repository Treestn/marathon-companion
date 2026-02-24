import { DataEventConst } from "../events/DataEventConst";
import { EventConst } from "../events/EventConst";
import { AmmoPageMediator } from "../page/ammo/AmmoPageMediator";
import { HideoutPageMediator } from "../page/hideout/HideoutPageMediator";
import { ItemsPageMediator } from "../page/items/ItemsPageMediator";
import { MapPageMediator } from "../page/map/MapPageMediator";
import { MapRequest } from "../page/map/handlers/request/impl/MapRequest";
import { QuestPageMediator } from "../page/quests/QuestPageMediator";
import { QuestBodyBuilder } from "../page/quests/builder/helper/QuestBodyBuilder";
import { EditSession } from "../page/quests/edit/EditSession";
import { NavigationController } from "../page/side-bar-menu/controller/NavigationController";
import { QuestSidePageMediator } from "../page/side/QuestSidePageMediator";
import { SidePageQuestRequest } from "../page/side/handlers/request/SidePageQuestRequest";
import { AppConfigUtils } from "./AppConfigUtils";
import { PlayerProgressionUtils } from "./PlayerProgressionUtils";
import { SessionUtils } from "./SessionUtils";

export class NavigationUtils {

    static questsPageMediator:QuestPageMediator;
    static mapPageMediator:MapPageMediator;
    static ammoPageMediator:AmmoPageMediator;
    static sidePageMediator:QuestSidePageMediator;
    static hideoutPageMediator:HideoutPageMediator;
    static itemsPageMediator:ItemsPageMediator;

    static readonly MAP_RUNNER = "maps-runner";
    static readonly QUEST_RUNNER = "quests-runner";
    static readonly AMMO_RUNNER = "quest-runner";
    static readonly HIDEOUT_RUNNER = "hideout-runner";
    static readonly ITEMS_RUNNER = "items-runner"

    private static runnerIdsList:string[] = [this.MAP_RUNNER, this.QUEST_RUNNER, this.AMMO_RUNNER, this.HIDEOUT_RUNNER, this.ITEMS_RUNNER] 

    private static buttonMap = new Map<string, HTMLElement>();

    private static filterQuestMap:boolean = false;
    private static filterOrderTrader:boolean = false;
    private static filterOrderQuestName:boolean = false;
    private static filterKappaOnly:boolean = false;

    static isMapFilterEnabled() {
        return SessionUtils.getFilterStates().mapFilter.filterQuestWithMap
    }

    static isOrderTraderFilterEnabled() {
        return SessionUtils.getFilterStates().mapFilter.orderTrader
    }

    static isQuestNameFilterEnabled() {
        return SessionUtils.getFilterStates().mapFilter.orderQuestName
    }

    static isKappaFilterEnabled() {
        return SessionUtils.getFilterStates().mapFilter.kappaOnly
    }

    static initMapFilterEnabled() {
        this.filterQuestMap = SessionUtils.getFilterStates().mapFilter.filterQuestWithMap
    }

    static initButtonMap() {
        let buttons: HTMLCollectionOf<Element> = document.getElementsByClassName("page-icon-container");
        for(let i = 0; i < buttons.length; i++) {
            if(!buttons[i].id.includes("subscription") && !buttons[i].id.includes("setting") && !buttons[i].id.includes("support")) {
                this.buttonMap.set(buttons[i].id, buttons[i] as HTMLElement)
                NavigationController.createEventListener(buttons[i] as HTMLElement);
            }
        }
        this.setActiveButton("maps-navigation")
    }

    static setActiveButton(btnTitle: string) {
        this.resetButtonsToInactive();
        const btnContainer:HTMLDivElement = document.getElementById(btnTitle) as HTMLDivElement;
        if(btnContainer) {
            const image:HTMLImageElement = btnContainer.getElementsByClassName("page-icon-image")[0] as HTMLImageElement
            image.style.filter = "drop-shadow(0 0 1.25rem var(--main-btn-active-color))";
            image.src = image.src.replace(".png", "-active.png");
        }
    }

    static async questAutomationChanged() {
        const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.QUEST_AUTOMATION, null);
        request.notifyOthers = true;
        this.sidePageMediator.update(request);
    }

    static async handleQuestMapFilterClick(input:HTMLInputElement) {
        this.filterQuestMap = input.checked;
        SessionUtils.getFilterStates().mapFilter.filterQuestWithMap = this.filterQuestMap;
        SessionUtils.setFilterState();
        const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.QUEST_MAP_FILTER, null)
        this.sidePageMediator.update(request)
    }
    
    static async handleOrderTraderFilterClick(input:HTMLInputElement) {
        this.filterOrderTrader = input.checked;
        SessionUtils.getFilterStates().mapFilter.orderTrader = this.filterOrderTrader;
        SessionUtils.setFilterState();
        const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.QUEST_MAP_FILTER, null)
        this.sidePageMediator.update(request)
    }

    static async handleOrderQuestNameFilterClick(input:HTMLInputElement) {
        this.filterOrderQuestName = input.checked;
        SessionUtils.getFilterStates().mapFilter.orderQuestName = this.filterOrderQuestName;
        SessionUtils.setFilterState();
        const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.QUEST_MAP_FILTER, null)
        this.sidePageMediator.update(request)
    }

    static async handleKappaOnlyFilterClick(input:HTMLInputElement) {
        this.filterKappaOnly = input.checked;
        SessionUtils.getFilterStates().mapFilter.kappaOnly = this.filterKappaOnly;
        SessionUtils.setFilterState();
        const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.QUEST_MAP_FILTER, null)
        this.sidePageMediator.update(request)
    }

    static async handleNavigationButtonClick(button:HTMLElement):Promise<void> {
        this.resetButtonsToInactive()
        // EftMain.mainPageCreator.setPage((button as HTMLButtonElement).id + 'Runner');
        this.setActiveButton((button as HTMLButtonElement).id);
        // (button as HTMLButtonElement).setAttribute('style', 'background-color:rgb(153, 135, 101)');
    }

    static async handleProgressionTypeClick(type:string) {
        PlayerProgressionUtils.setProgressionType(type);
        const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.PROGRESSION_CHANGED, null)
        request.hideoutMediator = this.hideoutPageMediator;
        request.itemsMediator = this.itemsPageMediator;
        request.notifyOthers = true
        this.sidePageMediator.update(request)
        // const activeRunnerId = this.getActivePageRunner();
        // switch(activeRunnerId) {
        //     case this.MAP_RUNNER: this.handleProgressionChangeOnMap(type); break;
        //     case this.QUEST_RUNNER: this.handleProgressionChangeOnQuest(type); break;
        // }
    }

    private static resetButtonsToInactive() {
        this.buttonMap.forEach((value, key) => {
            const btnContainer:HTMLDivElement = document.getElementById(key) as HTMLDivElement;
            const image:HTMLImageElement = btnContainer.getElementsByClassName("page-icon-image")[0] as HTMLImageElement
            image.style.filter = "";
            image.src = image.src.replace("-active", "");
        })
    }

    public static removeiFrames() {
        const iFrames = document.getElementsByClassName("iframe");
        if(iFrames?.length > 0) {
            for(const frame of iFrames) {
                frame.remove();
            }
        }
    }

    static getActivePageRunner():string {
        for(const runnerId of this.runnerIdsList) {
            const runnerDiv = document.getElementById(runnerId);
            if(runnerDiv) {
                return runnerDiv.id;
            }
        }
        return null;
    }

    public static saveActivePage() {
        this.runnerIdsList.forEach(runnerId => {
            const runnerDiv = document.getElementById(runnerId);
            if(runnerDiv) {
                switch(runnerDiv.id) {
                    case this.MAP_RUNNER: 
                        if (this.mapPageMediator) {
                            this.mapPageMediator.save();
                        }
                        return;
                    // case this.QUEST_RUNNER: this.questsPageMediator.save(); return;
                    case this.AMMO_RUNNER: 
                        if (this.ammoPageMediator) {
                            this.ammoPageMediator.save();
                        }
                        return;
                    case this.HIDEOUT_RUNNER: 
                        if (this.hideoutPageMediator) {
                            this.hideoutPageMediator.save();
                        }
                        return;
                    case this.ITEMS_RUNNER: 
                        if (this.itemsPageMediator) {
                            this.itemsPageMediator.save();
                        }
                        return;
                }
            }
        });
    }

    static async loadMapPage(
        mapId?: string,
        options?: { setDefaultPreference?: boolean }
    ) {
        // Use centralized page loader - this ensures navbar is updated via navigation events
        // Access via global instance to avoid circular dependencies
        const pageLoader = (window as any).__pageLoader;
        const shouldSetDefault = options?.setDefaultPreference !== false;
        if (mapId) {
            if (shouldSetDefault) {
                AppConfigUtils.getAppConfig().userSettings.setMapDefaultPreference(mapId);
            }
            if (typeof globalThis.dispatchEvent === "function") {
                globalThis.dispatchEvent(
                    new CustomEvent("map-change-request", { detail: { mapId } })
                );
            }
        }
        if (pageLoader && pageLoader.hasLoader && pageLoader.hasLoader('interactive-map')) {
            await pageLoader.loadPage('interactive-map', {
                mapId,
                setDefaultPreference: shouldSetDefault,
            });
        } else {
            // Fallback to direct mediator call if pageLoader not ready
            // Note: Active state will not be updated in navbar in this case
            console.warn('[NavigationUtils] PageLoader not available, using fallback for maps');
            this.removeiFrames()
            this.saveActivePage();
            await this.mapPageMediator.load();
            if(mapId) {
                await this.mapPageMediator.loadMap(mapId);
            }
            const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.QUEST_MAP_FILTER, null)
            this.sidePageMediator.update(request)
        }
    }

    static async loadQuestPage() {
        // Use centralized page loader - this ensures navbar is updated via navigation events
        const pageLoader = (window as any).__pageLoader;
        if (pageLoader && pageLoader.hasLoader && pageLoader.hasLoader('quests')) {
            await pageLoader.loadPage('quests');
        } else {
            // Fallback to direct mediator call if pageLoader not ready
            // Note: Active state will not be updated in navbar in this case
            console.warn('[NavigationUtils] PageLoader not available, using fallback for quests');
            this.removeiFrames()
            this.saveActivePage();
            await this.questsPageMediator.load();
            const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.QUEST_MAP_FILTER, null)
            this.sidePageMediator.update(request)
        }
    }

    static async loadHideoutPage() {
        // Use centralized page loader - this ensures navbar is updated via navigation events
        const pageLoader = (window as any).__pageLoader;
        if (pageLoader && pageLoader.hasLoader && pageLoader.hasLoader('hideout')) {
            await pageLoader.loadPage('hideout');
        } else {
            // Fallback to direct mediator call if pageLoader not ready
            // Note: Active state will not be updated in navbar in this case
            console.warn('[NavigationUtils] PageLoader not available, using fallback for hideout');
            this.removeiFrames()
            this.saveActivePage();
            await this.hideoutPageMediator.load();
            const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.QUEST_MAP_FILTER, null)
            this.sidePageMediator.update(request)
        }
    }

    static async loadItemsNeededPage() {
        // Use centralized page loader - this ensures navbar is updated via navigation events
        const pageLoader = (window as any).__pageLoader;
        if (pageLoader && pageLoader.hasLoader && pageLoader.hasLoader('items-needed')) {
            await pageLoader.loadPage('items-needed');
        } else {
            // Fallback to direct mediator call if pageLoader not ready
            // Note: Active state will not be updated in navbar in this case
            console.warn('[NavigationUtils] PageLoader not available, using fallback for items-needed');
            this.removeiFrames()
            this.saveActivePage();
            await this.itemsPageMediator.load();
            const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.QUEST_MAP_FILTER, null)
            this.sidePageMediator.update(request);
        }
    }

    static async loadAmmoPage() {
        this.removeiFrames()
        this.saveActivePage();
        this.setActiveButton("ammoChart-navigation")
        await this.ammoPageMediator.load();
        const request = new SidePageQuestRequest(null, this.mapPageMediator, this.questsPageMediator, EventConst.QUEST_UPDATE, DataEventConst.QUEST_MAP_FILTER, null)
        this.sidePageMediator.update(request)
    }
}