import { QuestSidePageMediator } from "./page/side/QuestSidePageMediator";
import { QuestPageMediator } from "./page/quests/QuestPageMediator";
import { MapPageMediator } from "./page/map/MapPageMediator";
import { AmmoPageMediator } from "./page/ammo/AmmoPageMediator";
import { NavigationController } from "./page/side-bar-menu/controller/NavigationController";
import { NavigationUtils } from "./utils/NavigationUtils";
import { SearchBarController } from "./page/controller/SearchBarController";
import { MapUtils } from "./page/map/utils/MapUtils";
import { Settings } from "../setting/Settings";
import { HideoutPageMediator } from "./page/hideout/HideoutPageMediator";
import { ItemsPageMediator } from "./page/items/ItemsPageMediator";
import { EventHandler } from "../in_game/handler/EventHandler";
import { OverwolfStatusUtils } from "./utils/OverwolfStatusUtils";
import { InRaidTimerUtils } from "./utils/InRaidTimerUtils";
import { SidePageQuestController } from "./page/controller/SidePageQuestController";
import { I18nHelper } from "../locale/I18nHelper";
import { registerPageLoaders } from "../shared/pages/registerPageLoaders";
import { pageLoader } from "../shared/pages/PageLoader";

export class EftMain {

    private static _instance: EftMain;

    private static sidePageQuestMediator:QuestSidePageMediator = new QuestSidePageMediator();
    private static mapPageMediator:MapPageMediator = new MapPageMediator();
    private static questsPageMediator:QuestPageMediator = new QuestPageMediator();
    private static ammoPageMediator:AmmoPageMediator = new AmmoPageMediator();
    private static hideoutPageMediator:HideoutPageMediator = new HideoutPageMediator();
    private static itemsPageMediator:ItemsPageMediator = new ItemsPageMediator();

    constructor() {
    }

    getMapPageMediator() {
        return EftMain.mapPageMediator;
    }

    public async start() {
        await I18nHelper.init();

        EftMain.removeLoadingScreen()
        MapUtils.initWorker()
        NavigationUtils.initButtonMap();

        NavigationUtils.mapPageMediator = EftMain.mapPageMediator;
        NavigationUtils.questsPageMediator = EftMain.questsPageMediator;
        NavigationUtils.ammoPageMediator = EftMain.ammoPageMediator;
        NavigationUtils.sidePageMediator = EftMain.sidePageQuestMediator
        NavigationUtils.hideoutPageMediator = EftMain.hideoutPageMediator;
        NavigationUtils.itemsPageMediator = EftMain.itemsPageMediator;

        // Register page loaders for the new routing system
        // Inject mediators to ensure they're properly initialized
        console.log('[EftMain.start] About to register page loaders with mediators:', {
            mapPageMediator: !!EftMain.mapPageMediator,
            questsPageMediator: !!EftMain.questsPageMediator,
            hideoutPageMediator: !!EftMain.hideoutPageMediator,
            itemsPageMediator: !!EftMain.itemsPageMediator,
            sidePageMediator: !!EftMain.sidePageQuestMediator
        });
        try {
            registerPageLoaders({
                mapPageMediator: EftMain.mapPageMediator,
                questsPageMediator: EftMain.questsPageMediator,
                hideoutPageMediator: EftMain.hideoutPageMediator,
                itemsPageMediator: EftMain.itemsPageMediator,
                sidePageMediator: EftMain.sidePageQuestMediator
            });
            console.log('[EftMain.start] Page loaders registered successfully');
        } catch (error) {
            console.error('[EftMain.start] Error registering page loaders:', error);
        }

        EventHandler.setSidePageMediator(EftMain.sidePageQuestMediator);
        OverwolfStatusUtils.setSidePageMediator(EftMain.sidePageQuestMediator)

        Settings.instance().setSidePageMediator(EftMain.sidePageQuestMediator)
        
        SidePageQuestController.registerEventListeners();
        SearchBarController.initSearchBarEventListener();
        
        NavigationController.init();
        NavigationController.mapPageMediator = EftMain.mapPageMediator;

        EftMain.mapPageMediator.questPageMediator = EftMain.questsPageMediator;
        EftMain.mapPageMediator.sidePageQuestMediator = EftMain.sidePageQuestMediator

        EftMain.sidePageQuestMediator.mapPageMediator = EftMain.mapPageMediator;
        EftMain.sidePageQuestMediator.questPageMediator = EftMain.questsPageMediator;
        EftMain.sidePageQuestMediator.hideoutPageMediator = EftMain.hideoutPageMediator;
        EftMain.sidePageQuestMediator.itemsPageMediator = EftMain.itemsPageMediator;

        EftMain.questsPageMediator.sidePageQuestMediator = EftMain.sidePageQuestMediator;
        EftMain.questsPageMediator.mapPageMediator = EftMain.mapPageMediator
        EftMain.questsPageMediator.itemsPageMediator = EftMain.itemsPageMediator;

        EftMain.hideoutPageMediator.questPageMediator = EftMain.questsPageMediator;
        EftMain.hideoutPageMediator.itemsPageMediator = EftMain.itemsPageMediator;

        EftMain.itemsPageMediator.questPageMediator = EftMain.questsPageMediator;
        EftMain.itemsPageMediator.hideoutPageMediator = EftMain.hideoutPageMediator;

        await EftMain.sidePageQuestMediator.load();
        if (pageLoader.hasLoader('interactive-map')) {
            await pageLoader.loadPage('interactive-map');
        } else {
            await EftMain.mapPageMediator.load();
        }

        // InRaidTimerUtils.start();

        SidePageQuestController.updateHotkeyText();

        const label1 = document.getElementById("side-page-map-filter-label");
        if(label1) {
            const textNode = Array.from(label1.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
            if (textNode) {
                textNode.textContent = I18nHelper.get("pages.sidePanel.filters.map")
            }
        }

        const label2 = document.getElementById("side-page-order-quest-name-filter-label");
        if(label2) {
            const textNode = Array.from(label2.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
            if (textNode) {
                textNode.textContent = I18nHelper.get("pages.sidePanel.filters.order.quest")
            }
        }

        const label3 = document.getElementById("side-page-order-trader-filter-label");
        if(label3) {
            const textNode = Array.from(label3.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
            if (textNode) {
                textNode.textContent = I18nHelper.get("pages.sidePanel.filters.order.trader")
            }
        }

        // const label4 = document.getElementById("side-page-kappa-filter-label");
        // if(label4) {
        //     const textNode = Array.from(label4.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
        //     if (textNode) {
        //         textNode.textContent = I18nHelper.get("pages.sidePanel.filters.kappa")
        //     }
        // }

        const searchBar = document.getElementById("quest-search-input") as HTMLInputElement
        if(searchBar) {
            searchBar.placeholder = I18nHelper.get("pages.sidePanel.search.placeholder") 
        }
    }

    static removeLoadingScreen() {
        const loadingScreen = document.getElementById("loading-screen-background");
        if(loadingScreen) {
            loadingScreen.remove();
        }
    }

    public static getInstance() {
        if (!this._instance) {
        this._instance = new EftMain();
        }
        return this._instance;
    }
}