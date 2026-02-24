import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { NotifyItemHandler } from "../../../items/handlers/chain/notify/NotifyItemHandler";
import { QuestBodyHandler } from "./builder/QuestBodyHandler";
import { QuestPagePartialRefreshHandler } from "./builder/QuestPagePartialRefreshHandler";
import { QuestPageRefreshHandler } from "./builder/QuestPageRefreshHandler";
import { QuestEditHandler } from "./edit/QuestEditHandler";
import { NotifyItemsHandler } from "./notify/NotifyItemsHandler";
import { NotifyMapHandler } from "./notify/NotifyMapHandler";
import { NotifyQuestHandler } from "./notify/NotifyQuestHandler";
import { QuestUpdateHandler } from "./page/QuestUpdateHandler";

export class QuestChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }
    
    init() {
        if(this.entryPoint) {
            return;
        }

        const questUpdateHandler = new QuestUpdateHandler();
        const questBodyHandler = new QuestBodyHandler();
        const questEditHandler = new QuestEditHandler();
        const pageRefreshHandler = new QuestPageRefreshHandler();
        const pagePartialRefreshHandler = new QuestPagePartialRefreshHandler();
        const notifyQuestHandler = new NotifyQuestHandler();
        const notifyMapHandler = new NotifyMapHandler();
        const notifyItemHandler = new NotifyItemsHandler();

        this.entryPoint = questUpdateHandler;
        questUpdateHandler.setNext(questBodyHandler);
        questBodyHandler.setNext(questEditHandler);
        questEditHandler.setNext(pageRefreshHandler);
        pageRefreshHandler.setNext(pagePartialRefreshHandler);
        pagePartialRefreshHandler.setNext(notifyQuestHandler);
        notifyQuestHandler.setNext(notifyMapHandler);
        notifyMapHandler.setNext(notifyItemHandler);
    }
}