import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { HideoutStationPageHandler } from "./builder/HideoutStationPageHandler";
import { HideoutPageRefreshHandler } from "./builder/HideoutPageRefreshHandler";
import { HideoutPageStateHandler } from "./state/HideoutPageStateHandler";
import { HideoutNotifyHandler } from "./notify/HideoutNotifyHandler";
import { HideoutNavigationHandler } from "./page/HideoutNavigationHandler";
import { HideoutUpdateHandler } from "./page/HideoutUpdatePage";
import { HideoutMapHandler } from "./page/HideoutMapHandler";

export class HideoutChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }
    
    init() {
        if(this.entryPoint) {
            return;
        }

        const hideoutStateHandler = new HideoutPageStateHandler();
        const hideoutMapHandler = new HideoutMapHandler();
        const hideoutUpdateHandler = new HideoutUpdateHandler();
        const hideoutBodyHandler = new HideoutStationPageHandler();
        const hideoutPageRefreshHandler = new HideoutPageRefreshHandler();
        const hideoutNavigation = new HideoutNavigationHandler();
        const notifyHandler = new HideoutNotifyHandler();
        
        this.entryPoint = hideoutStateHandler;
        hideoutStateHandler.setNext(hideoutMapHandler);
        hideoutMapHandler.setNext(hideoutUpdateHandler);
        hideoutUpdateHandler.setNext(hideoutBodyHandler);
        hideoutBodyHandler.setNext(hideoutPageRefreshHandler);
        hideoutPageRefreshHandler.setNext(hideoutNavigation);
        hideoutNavigation.setNext(notifyHandler);
    }
}