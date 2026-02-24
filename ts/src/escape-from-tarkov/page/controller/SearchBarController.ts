import { DataEventConst } from "../../events/DataEventConst";
import { EventConst } from "../../events/EventConst";
import { NavigationUtils } from "../../utils/NavigationUtils";
import { QuestRequest } from "../quests/handlers/request/QuestRequest";
import { QuestMediator } from "../quests/mediator/QuestMediator";
import { SidePageQuestRequest } from "../side/handlers/request/SidePageQuestRequest";
import { SidePageQuestMediator } from "../side/mediator/SidePageQuestMediator";
import { SidePageQuestController } from "./SidePageQuestController";

export class SearchBarController {
    
    private static questMediator:QuestMediator;
    private static questSidePageMediator:SidePageQuestMediator;

    static setQuestMediator(mediator:QuestMediator) {
        this.questMediator = mediator;
    }

    static setSidePageQuestMediator(mediator: SidePageQuestMediator) {
        this.questSidePageMediator = mediator;
    }

    static initSearchBarEventListener() {
        const searchBarInput = document.getElementById("quest-search-input");
        if(searchBarInput && searchBarInput instanceof HTMLInputElement) {
            this.addSearchBarTypingEvent(searchBarInput);
            this.addSearchBarButtonEvent(searchBarInput);
        }
    }

    private static addSearchBarTypingEvent(searchBarInput:HTMLInputElement) {
        searchBarInput.onkeyup = async(e) => {

            let sidePageRequest = new SidePageQuestRequest(this.questSidePageMediator, null, null,
                EventConst.QUEST_FILTER, DataEventConst.QUEST_SEARCH_BAR, null);
            sidePageRequest.htmlElement = searchBarInput
            this.questSidePageMediator.update(sidePageRequest);

            if(e.key !== "Enter" && NavigationUtils.getActivePageRunner() === NavigationUtils.QUEST_RUNNER) {
                this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, 
                    DataEventConst.QUEST_SEARCH_BAR, null, null, searchBarInput))
            }
            if(e.key === "Enter") {
                if(NavigationUtils.getActivePageRunner() !== NavigationUtils.QUEST_RUNNER) {
                    await NavigationUtils.loadQuestPage();
                }
                this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, 
                    DataEventConst.QUEST_SEARCH_BAR, null, null, searchBarInput))
                SidePageQuestController.searchBarClicked();
            }
        }
    }

    private static addSearchBarButtonEvent(searchBarInput:HTMLInputElement) {
        const questSearchButton = document.getElementById("quest-search-button");
        if(questSearchButton) {
            questSearchButton.onclick = async() => {
                if(NavigationUtils.getActivePageRunner() !== NavigationUtils.QUEST_RUNNER) {
                    await NavigationUtils.loadQuestPage();
                }
                this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, 
                    DataEventConst.QUEST_SEARCH_BAR, null, null, searchBarInput))
                SidePageQuestController.searchBarClicked();
            }
        }
    }
}