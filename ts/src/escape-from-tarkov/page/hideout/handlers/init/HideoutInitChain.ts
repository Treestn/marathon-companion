import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { BuildHideoutComponents } from "./builder/BuildHideoutComponents";
import { BuildHideoutPage } from "./builder/BuildHideoutPage";
import { HideoutInitControllers } from "./init/HideoutInitControllers";

export class HideoutInitChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }
    
    init() {
        if(this.entryPoint) {
            return;
        }

        const buildComponents = new BuildHideoutComponents();
        const buildPage = new BuildHideoutPage();
        const initControllers = new HideoutInitControllers();

        this.entryPoint = buildComponents;
        buildComponents.setNext(buildPage);
        buildPage.setNext(initControllers);
    }
    
}