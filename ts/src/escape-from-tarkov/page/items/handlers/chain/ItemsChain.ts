import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { ItemBodyBuilderHandler } from "./builder/ItemBodyBuilderHandler";
import { NotifyItemHandler } from "./notify/NotifyItemHandler";
import { ItemNavigationHandler } from "./page/ItemNavigationHandler";
import { ItemPageRefreshHandler } from "./page/ItemPageRefreshHandler";
import { ItemStateChangeHandler } from "./page/ItemStateChangeHandler";

export class ItemsChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }
    
    init() {
        if(this.entryPoint) {
            return;
        }

        const itemStateChangeHandler = new ItemStateChangeHandler();
        const itemPageRefreshHandler = new ItemPageRefreshHandler();
        const itemBodyBuilder = new ItemBodyBuilderHandler();
        const itemNavigation = new ItemNavigationHandler();
        const itemNotify = new NotifyItemHandler();

        this.entryPoint = itemStateChangeHandler;
        itemStateChangeHandler.setNext(itemPageRefreshHandler);
        itemPageRefreshHandler.setNext(itemBodyBuilder);
        itemBodyBuilder.setNext(itemNavigation)
        itemNavigation.setNext(itemNotify)
        
    }
}