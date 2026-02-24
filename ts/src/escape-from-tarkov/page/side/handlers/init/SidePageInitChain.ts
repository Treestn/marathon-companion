import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { BuildSidePageQuests } from "./builder/BuildSidePageQuests";
import { BuildSidePageQuestsComponents } from "./builder/BuildSidePageQuestsComponents";
import { FetchHideoutElementHandler } from "./fetcher/FetchHideoutElementHandler";
import { FetchItemsElementHandler } from "./fetcher/FetchItemsElementHandler";
import { FetchMessagesInfoHandler } from "./fetcher/FetchMessagesInfoHandler";
import { FetchQuestConfigHandler } from "./fetcher/FetchQuestConfigHandler";
import { PlayerLevelControllerHandler } from "./init/PlayerLevelControllerHandler";
import { SidePageQuestInitControllersHandler } from "./init/SidePageQuestInitControllersHandler";
import { LoadHideoutElementHandler } from "./loader/LoadHideoutElementHandler";
import { LoadItemsElementHandler } from "./loader/LoadItemsElementHandler";
import { LoadPlayerLevelHandler } from "./loader/LoadPlayerLevelHandler";
import { LoadQuestHandler } from "./loader/LoadQuestHandler";
import { ResolveHideoutElementHandler } from "./resolver/ResolveHideoutElementHandler";
import { ResolveItemsElementHandler } from "./resolver/ResolveItemsElementHandler";
import { ResolverHandler } from "./resolver/ResolverHandler";
import { ResolveQuestsHandler } from "./resolver/ResolveQuestsHandler";
import { MapFilterInitHandler } from "./init/MapFilterInitHandler";
import { AutomationInitHandler } from "./init/AutomationInitHandler";
import { FirstTimePlayingHandler } from "./init/FirstTimePlayingHandler";

export class SidePageInitChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }
    
    init() {
        if(this.entryPoint) {
            return;
        }
        const mapFilterInitHandler = new MapFilterInitHandler();
        const loadPlayerLevel = new LoadPlayerLevelHandler();
        const initPlayerLevelController = new PlayerLevelControllerHandler();
        const firstTimePlaying = new FirstTimePlayingHandler();

        const loadItemsElement = new LoadItemsElementHandler();
        const fetchMessagesInfoHandler = new FetchMessagesInfoHandler();

        const fetchItemsElement = new FetchItemsElementHandler();
        const resolveItemsElement = new ResolveItemsElementHandler();

        const loadQuests = new LoadQuestHandler();
        const fetchQuestsConfig = new FetchQuestConfigHandler();
        const resolveQuests = new ResolveQuestsHandler();
        const buildQuestsComponents = new BuildSidePageQuestsComponents();

        const loadHideout = new LoadHideoutElementHandler();
        const fetchHideout = new FetchHideoutElementHandler();
        const resolveHideout = new ResolveHideoutElementHandler();

        const resolveItemsNeeded = new ResolverHandler();

        const buildPage = new BuildSidePageQuests();
        const addMediatorControllers = new SidePageQuestInitControllersHandler();
        const automationInitHandler = new AutomationInitHandler();

        this.entryPoint = automationInitHandler;
        automationInitHandler.setNext(mapFilterInitHandler);
        mapFilterInitHandler.setNext(initPlayerLevelController);
        initPlayerLevelController.setNext(firstTimePlaying);
        firstTimePlaying.setNext(loadItemsElement);

        loadItemsElement.setNext(fetchMessagesInfoHandler);
        fetchMessagesInfoHandler.setNext(fetchItemsElement);
        fetchItemsElement.setNext(resolveItemsElement);
        resolveItemsElement.setNext(loadQuests);

        loadQuests.setNext(fetchQuestsConfig);
        fetchQuestsConfig.setNext(loadHideout);

        loadHideout.setNext(fetchHideout);
        fetchHideout.setNext(resolveHideout);

        resolveHideout.setNext(resolveQuests);
        resolveQuests.setNext(resolveItemsNeeded);

        resolveItemsNeeded.setNext(loadPlayerLevel)

        loadPlayerLevel.setNext(buildQuestsComponents);
        buildQuestsComponents.setNext(buildPage);
        buildPage.setNext(addMediatorControllers);
    }
    
}