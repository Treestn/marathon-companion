import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { Quest } from "../../../../../../model/quest/IQuestsElements";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { OverwolfStatusUtils } from "../../../../../utils/OverwolfStatusUtils";
import { QuestsFiltersUtils } from "../../../../quests/utils/QuestsFiltersUtils";
import { QuestsUtils } from "../../../../quests/utils/QuestsUtils";
import { SidePageQuestUtils } from "../../../utils/SidePageQuestUtils";
import { SidePageQuestRequest } from "../../request/SidePageQuestRequest";

export class SidePageQuestUpdateHandler extends AbstractChainHandler {

    handle(request: SidePageQuestRequest) {
        if(EventConst.QUEST_UPDATE === request.event) {
            switch(request.subEvent) {
                case DataEventConst.QUEST_UPDATE_OW_EVENT:
                case DataEventConst.PROGRESSION_CHANGED: this.handleRefreshAll(request); break;
                case DataEventConst.QUEST_COMPLETED: 
                case DataEventConst.QUEST_ACTIVATION:
                case DataEventConst.QUEST_TRACKING:
                case DataEventConst.QUEST_FAILED:
                case DataEventConst.QUEST_MAP_FILTER: this.handleQuestUpdate(request); break;
                case DataEventConst.QUEST_AUTOMATION: this.handleQuestAutomation(request); break;
            }
        }
        if(EventConst.SIDE_PAGE_QUEST_UPDATE === request.event) {
            switch(request.subEvent) {
                case DataEventConst.QUEST_COMPLETED: this.handleCompletedQuest(request); break;
                case DataEventConst.LEVEL_CHANGE: this.handleRefreshAll(request); break;
            }
        }
        if(EventConst.QUEST_FILTER === request.event) {
            switch(request.subEvent) {
                case DataEventConst.QUEST_SEARCH_BAR: this.handleQuestSearchBar(request);
            }
        }
    }

    private handleQuestSearchBar(request:SidePageQuestRequest) {
        if(request.htmlElement instanceof HTMLInputElement) {
            let searchBarInputText: string = request.htmlElement.value.toLocaleLowerCase();
            if(searchBarInputText.length > 0) {
                this.handleQuestUpdate(request, QuestsFiltersUtils.filterByQuestsTitle(searchBarInputText, 
                    QuestsUtils.getActiveQuests()));
            } else {
                this.handleQuestUpdate(request);
            }
        }
    }

    private handleQuestUpdate(request:SidePageQuestRequest, quests?:Quest[]) {
        SidePageQuestUtils.updateQuests(quests, request);
    }

    private async handleQuestAutomation(request:SidePageQuestRequest) {
        const buttonList = document.getElementsByClassName("side-page-quest-button-container");
        let display = "";
        if(OverwolfStatusUtils.isQuestAutomationEnabled()) {
            display = "none";
        }
        for(const button of buttonList) {
            if(button instanceof HTMLElement) {
                button.style.display = display
            }
        }
    }

    private handleCompletedQuest(request:SidePageQuestRequest) {
        QuestsUtils.setCompletedQuestState(request.quest.id, true);
        QuestsUtils.setActiveQuest(request.quest.id, false);
        QuestsUtils.setNextQuestsActive(request.quest.id);
        this.handleQuestUpdate(request);
    }

    private handleRefreshAll(request:SidePageQuestRequest) {
        QuestsUtils.refreshLevel()
        QuestsUtils.refreshActiveQuests();
        this.handleQuestUpdate(request);
    }

}