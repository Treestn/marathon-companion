import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { BuildItemsComponents } from "./builder/BuildItemsComponents";
import { BuildItemsPage } from "./builder/BuildItemsPage";
import { ItemInitFilters } from "./init/ItemInitFilters";
import { ItemsInitControllers } from "./init/ItemsInitControllers";

export class ItemsInitChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }
    
    init() {
        if(this.entryPoint) {
            return;
        }
        const itemFilterInit = new ItemInitFilters();
        const buildComponents = new BuildItemsComponents();
        const buildPage = new BuildItemsPage();
        const initControllers = new ItemsInitControllers();

        this.entryPoint = itemFilterInit;
        itemFilterInit.setNext(buildComponents);
        buildComponents.setNext(buildPage);
        buildPage.setNext(initControllers);
        
    }
    
}