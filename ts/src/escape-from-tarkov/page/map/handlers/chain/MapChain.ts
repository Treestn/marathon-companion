import { AbstractChainMediator } from "../../../../types/abstract/AbstractChainMediator"
import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { FloorGlowHandler } from "./impl/floor/FloorGlowHandler";
import { FloorHandler } from "./impl/floor/FloorHandler";
import { AddIconHandler } from "./impl/icon/AddIconHandler";
import { IconFloorHandler } from "./impl/icon/IconFloorHandler";
import { IconHandler } from "./impl/icon/IconHandler";
import { QuestIconHandler } from "./impl/icon/QuestIconHandler";
import { RemoveIconHandler } from "./impl/icon/RemoveIconHandler";
import { FilterHandler } from "./impl/map/FilterHandler";
import { FilterStateHandler } from "./impl/map/FilterStateHandler";
import { MapHandler } from "./impl/map/MapHandler";
import { MapSelectorHandler } from "./impl/map/MapSelectorHandler";
import { RecenterMapHandler } from "./impl/map/RecenterMapHandler";
import { NotifyMapHandler } from "./impl/notify/NotifyMapHandler";
import { PopupHandler } from "./impl/popup/PopupHandler";

export class MapChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }

    init() {
        this.entryPoint = new MapHandler();
        let filterhandler = new FilterHandler();
        let floorHandler = new FloorHandler();
        let iconHandler = new IconHandler();
        let questIconHandler = new QuestIconHandler();
        let iconFloorHandler = new IconFloorHandler();
        let floorGlowHandler = new FloorGlowHandler();
        let popupHandler = new PopupHandler();
        let recenterMapHandler = new RecenterMapHandler();
        let mapSelectorHandler = new MapSelectorHandler();
        let addIconHandler = new AddIconHandler();
        let removeIconHandler = new RemoveIconHandler();
        let notifyOthers = new NotifyMapHandler();
        let filterStateHandler = new FilterStateHandler();

        this.entryPoint.setNext(addIconHandler);
        addIconHandler.setNext(removeIconHandler);
        removeIconHandler.setNext(filterhandler);
        filterhandler.setNext(floorHandler);
        floorHandler.setNext(iconHandler);
        iconHandler.setNext(questIconHandler);
        questIconHandler.setNext(iconFloorHandler);
        iconFloorHandler.setNext(filterStateHandler);
        filterStateHandler.setNext(floorGlowHandler);
        floorGlowHandler.setNext(popupHandler);
        popupHandler.setNext(recenterMapHandler);
        recenterMapHandler.setNext(mapSelectorHandler);
        mapSelectorHandler.setNext(notifyOthers);
    }
}