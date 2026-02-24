import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { NavigationController } from "../../../../side-bar-menu/controller/NavigationController";
import { QuestBodyUtils } from "../../../utils/QuestBodyUtils";
import { QuestPageUtils } from "../../../utils/QuestPageUtils";
import { QuestRequest } from "../../request/QuestRequest";

export class QuestPageRefreshHandler extends AbstractChainHandler {
    
    handle(request: QuestRequest) {
        if(EventConst.QUEST_HEADER === request.event) {
            switch(request.subEvent) {
                case DataEventConst.QUEST_PAGE_REFRESH: this.handlePageRefresh(request); break;
            }
        }
        if(EventConst.QUEST_UPDATE === request.event) {
            switch(request.subEvent) {
                case DataEventConst.QUEST_FAILED:
                case DataEventConst.QUEST_COMPLETED: this.handlePageRefresh(request); break;
                case DataEventConst.PROGRESSION_CHANGED:
                case DataEventConst.QUEST_UPDATE_OW_EVENT:
                case DataEventConst.LEVEL_CHANGE: this.handlePageRefresh(request); break;
                
            }
        }
        if(EventConst.QUEST_SEARCH === request.event) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleQuestSearch(request); break;
            }
        }
        if(EventConst.QUEST_FILTER === request.event) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handlePageRefresh(request); break;
                case DataEventConst.QUEST_SEARCH_BAR: this.handleQuestSearchBar(request);
            }
        }
        if(EventConst.QUEST_EDIT === request.event) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handlePageRefresh(request); break;
            }
        }
    }

    private handleQuestSearchBar(request:QuestRequest) {
        if(request.htmlElement instanceof HTMLInputElement) {
            let searchBarInputText: string = request.htmlElement.value.toLocaleLowerCase();
            if(searchBarInputText.length > 0) {
                QuestPageUtils.updateQuestByTitle(searchBarInputText);
            } else {
                this.handlePageRefresh(request);
            }
            NavigationController.disableQuestMapFilter();
        }
    }

    private handleQuestSearch(request:QuestRequest) {
        this.clearSearchBar();
        QuestPageUtils.displayQuestOnly(request.quest)
        QuestBodyUtils.refreshAllItemState();
    }
    
    private handlePageRefresh(request: QuestRequest) {
        this.clearSearchBar();
        QuestPageUtils.updateQuestsPage(true);
    }

    private clearSearchBar() {
        var input:HTMLInputElement = (document.getElementById("quest-search-input") as HTMLInputElement)
        if(input.value != null || input.value.length > 0) {
            input.value = ""
        }
    }
}