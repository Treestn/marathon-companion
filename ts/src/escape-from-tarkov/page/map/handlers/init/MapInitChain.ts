import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { BuildEventListenerHandler } from "./impl/builder/BuildEventListenerHandler";
import { BuildFilterComponentHandler } from "./impl/builder/BuildFilterComponentHandler";
import { BuildFloorComponentHandler } from "./impl/builder/BuildFloorComponentHandler";
import { BuildHtmlElementHandler } from "./impl/builder/BuildHtmlElementHandler";
import { BuildIconComponentHandler } from "./impl/builder/BuildIconComponentHandler";
import { BuildMapComponentHandler } from "./impl/builder/BuildMapComponentHandler";
import { BuildMapRecenterComponentHandler } from "./impl/builder/BuildMapRecenterComponentHandler";
import { FetchFilterConfigHandler } from "./impl/fetcher/FetchFilterConfigHandler";
import { FetchFloorConfigHandler } from "./impl/fetcher/FetchFloorConfigHandler";
import { CanvasInitHandler } from "./impl/init/CanvasInitHandler";
import { FilterInitHandler } from "./impl/init/FilterInitHandler";
import { FloorInitHandler } from "./impl/init/FloorInitHandler";
import { IconsInitHandler } from "./impl/init/IconsInitHandler";
import { MapSelectorInitHandler } from "./impl/init/MapSelectorInitHandler";
import { MapInitHandler } from "./impl/init/MapInitHandler";
import { PopupInitHandler } from "./impl/init/PopupInitHandler";
import { LoadFilterElementHandler } from "./impl/loader/LoadFilterElementHandler";
import { LoadFloorElementHandler } from "./impl/loader/LoadFloorElementHandler";
import { ResolveFilterBoxStateHandler } from "./impl/resolver/ResolveFilterBoxStateHandler";
import { ResolveFloorsHandler } from "./impl/resolver/ResolveFloorsHandler";
import { ResolveIconsHandler } from "./impl/resolver/ResolveIconsHandler";
import { ResolveQuestIconsHandler } from "./impl/resolver/ResolveQuestIconsHandler";
import { BuildMapSelectorComponentHandler } from "./impl/builder/BuildMapSelectorComponentHandler";
import { FloorGlowInitHandler } from "./impl/init/FloorGlowInitHandler";
import { BuildPopupComponentHandler } from "./impl/builder/BuildPopupComponentHandler";
import { RemoveLoadingScreenHandler } from "./impl/loading/RemoveLoadingScreenHandler";
import { ResolveBtrPathHandler } from "./impl/resolver/ResolveBtrPathHandler";
import { BuildLabelComponentHandler } from "./impl/builder/BuildLabelComponentHandler";


export class MapInitChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }

    init() {
        if(this.entryPoint) {
            return;
        }
        this.entryPoint = new LoadFilterElementHandler();
        // let addLoadingScreenHandler = new AddLoadingScreenHandler();
        let filterConfigFetcher = new FetchFilterConfigHandler();
        let iconResolver = new ResolveIconsHandler();
        let questIconsResolver = new ResolveQuestIconsHandler();
        let mapComponentBuilder = new BuildMapComponentHandler();
        let floorElementLoad = new LoadFloorElementHandler();
        let floorConfigFetcher = new FetchFloorConfigHandler();
        let floorElementResolver = new ResolveFloorsHandler();
        let floorComponentBuilder = new BuildFloorComponentHandler(); 
        let iconComponentBuilder = new BuildIconComponentHandler();
        let labelComponentBuilder = new BuildLabelComponentHandler();
        let popupComponentBuilder = new BuildPopupComponentHandler();
        let initIconHandler = new IconsInitHandler();
        let initFloorHandler = new FloorInitHandler();
        let initCanvasHandler = new CanvasInitHandler();
        let initPopupHandler = new PopupInitHandler();
        let initMapHandler = new MapInitHandler();
        let initFilterHandler = new FilterInitHandler();
        let filterComponentHandler = new BuildFilterComponentHandler();
        let filterBoxStateResolver = new ResolveFilterBoxStateHandler(); 
        let initMapSelectorHandler = new MapSelectorInitHandler();
        let recenterComponentHandler = new BuildMapRecenterComponentHandler();
        let buildEventListener = new BuildEventListenerHandler();
        let buildHtmlElement = new BuildHtmlElementHandler();
        let buildMapSelector = new BuildMapSelectorComponentHandler();
        let floorGlowInitHandler = new FloorGlowInitHandler();
        let btrResolverHandler = new ResolveBtrPathHandler();
        let removeLoadingScreenHandler = new RemoveLoadingScreenHandler();

        this.entryPoint.setNext(filterConfigFetcher);
        filterConfigFetcher.setNext(iconResolver);
        iconResolver.setNext(mapComponentBuilder);
        mapComponentBuilder.setNext(recenterComponentHandler);
        recenterComponentHandler.setNext(floorElementLoad);
        floorElementLoad.setNext(floorConfigFetcher);
        floorConfigFetcher.setNext(floorElementResolver);
        floorElementResolver.setNext(floorComponentBuilder);
        floorComponentBuilder.setNext(iconComponentBuilder);
        iconComponentBuilder.setNext(labelComponentBuilder);
        labelComponentBuilder.setNext(filterComponentHandler);
        filterComponentHandler.setNext(popupComponentBuilder);
        popupComponentBuilder.setNext(buildMapSelector);
        buildMapSelector.setNext(filterBoxStateResolver);
        filterBoxStateResolver.setNext(questIconsResolver);
        questIconsResolver.setNext(buildHtmlElement);

        // All components are being pushed and built
        buildHtmlElement.setNext(initFloorHandler);
        initFloorHandler.setNext(initFilterHandler);
        initFilterHandler.setNext(initIconHandler);
        initIconHandler.setNext(initCanvasHandler);
        initCanvasHandler.setNext(initPopupHandler);
        initPopupHandler.setNext(initMapHandler);
        initMapHandler.setNext(floorGlowInitHandler);
        floorGlowInitHandler.setNext(initMapSelectorHandler);
        initMapSelectorHandler.setNext(btrResolverHandler);

        //Initiating the listeners for all components
        btrResolverHandler.setNext(buildEventListener);
        buildEventListener.setNext(removeLoadingScreenHandler);
    }
}