import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";

export class AmmoChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }
    
    init() {
        if(this.entryPoint) {
            return;
        }

        // const questUpdateHandler = new QuestUpdateHandler();
        // const questBodyHandler = new QuestBodyHandler();
        // const pageRefreshHandler = new QuestPageRefreshHandler();
        // const pagePartialRefreshHandler = new QuestPagePartialRefreshHandler();
        // const notifyQuestHandler = new NotifyQuestHandler();

        // this.entryPoint = questUpdateHandler;
        // questUpdateHandler.setNext(questBodyHandler);
        // questBodyHandler.setNext(pageRefreshHandler);
        // pageRefreshHandler.setNext(pagePartialRefreshHandler);
        // pagePartialRefreshHandler.setNext(notifyQuestHandler);
    }
}