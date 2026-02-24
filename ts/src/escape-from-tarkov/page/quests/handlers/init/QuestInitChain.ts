import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { BuildQuestComponents } from "./builder/BuildQuestComponents";
import { BuildQuestPage } from "./builder/BuildQuestPage";
import { QuestFilterInitHandler } from "./init/QuestFilterInit";
import { QuestInitControllers } from "./init/QuestInitControllers";

export class QuestInitChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }
    
    init() {
        if(this.entryPoint) {
            return;
        }
        const initFilter = new QuestFilterInitHandler();
        const buildQuestComponents = new BuildQuestComponents();
        const buildPage = new BuildQuestPage();
        const initControllers = new QuestInitControllers();

        this.entryPoint = initFilter;
        initFilter.setNext(buildQuestComponents);
        buildQuestComponents.setNext(buildPage);
        buildPage.setNext(initControllers);
    }
    
}