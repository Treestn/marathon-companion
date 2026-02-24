import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { BuildSidePageQuestHandler } from "./builder/BuildSidePageQuestHandler";
import { NotifySidePageQuestHandler } from "./notify/NotifySidePageQuestHandler";
import { SidePageQuestUpdateHandler } from "./page/SidePageQuestUpdateHandler";

export class SidePageQuestChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }
    
    init() {
        if(this.entryPoint) {
            return;
        }

        const questUpdateHandler = new SidePageQuestUpdateHandler();
        const buildSidePageQuestHandler = new BuildSidePageQuestHandler();
        const notifyQuestHandler = new NotifySidePageQuestHandler();

        this.entryPoint = questUpdateHandler;
        questUpdateHandler.setNext(buildSidePageQuestHandler);
        buildSidePageQuestHandler.setNext(notifyQuestHandler);
    }
}