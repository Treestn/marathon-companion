import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { NavigationUtils } from "../../../../../utils/NavigationUtils";
import { HideoutRequest } from "../../../../hideout/handlers/request/HideoutRequest";
import { ItemsRequest } from "../../../../items/handlers/request/ItemsRequest";
import { MapRequest } from "../../../../map/handlers/request/impl/MapRequest";
import { QuestRequest } from "../../../../quests/handlers/request/QuestRequest";
import { SidePageQuestRequest } from "../../request/SidePageQuestRequest";

export class NotifySidePageQuestHandler extends AbstractChainHandler {

    async handle(request: SidePageQuestRequest) {
        if(request.notifyOthers) {
            if(EventConst.QUEST_SEARCH === request.event) {
                switch(request.subEvent) {
                    case DataEventConst.MOUSE_CLICK: await this.handleQuestSearch(request); break;
                }
            }
            if(EventConst.QUEST_UPDATE === request.event) {
                switch(request.subEvent) {
                    case DataEventConst.QUEST_COMPLETED: this.handleCompletedQuest(request); break;
                    case DataEventConst.PROGRESSION_CHANGED: this.handleProgressionUpdate(request); break;
                    case DataEventConst.QUEST_UPDATE_OW_EVENT: this.handleOwQuestEvent(request);break;
                    case DataEventConst.QUEST_AUTOMATION: this.handleQuestAutomation(request); break;
                }
            }
            if(EventConst.SIDE_PAGE_QUEST_UPDATE === request.event) {
                switch(request.subEvent) {
                    case DataEventConst.QUEST_COMPLETED: this.handleCompletedQuest(request); break;
                    case DataEventConst.LEVEL_CHANGE: this.handleLevelChange(request); break;
                }
            }
        }
    }

    private async handleQuestSearch(request:SidePageQuestRequest) {
        if(NavigationUtils.getActivePageRunner() !== NavigationUtils.QUEST_RUNNER) {
            await NavigationUtils.loadQuestPage();
        }
        request.questMediator.update(new QuestRequest(request.questMediator, request.event, 
            request.subEvent, request.quest, null, null))
    }

    private async handleQuestAutomation(request:SidePageQuestRequest) {
        if(NavigationUtils.getActivePageRunner() === NavigationUtils.QUEST_RUNNER) {
            request.questMediator.update(new QuestRequest(null, EventConst.QUEST_UPDATE, 
                DataEventConst.QUEST_AUTOMATION, null, null, null))
        }
    }

    private handleCompletedQuest(request:SidePageQuestRequest) {
        if(NavigationUtils.getActivePageRunner() === NavigationUtils.MAP_RUNNER) {
            const questComponent = request.mapMediator.getQuestIconComponent(request.quest.id);
            request.mapMediator.update(new MapRequest(null, EventConst.ICON_UPDATE, null, questComponent, 
                DataEventConst.QUEST_UPDATE, new Date().getTime()))
        }
        if(NavigationUtils.getActivePageRunner() === NavigationUtils.QUEST_RUNNER) {
            request.questMediator.update(new QuestRequest(null, EventConst.QUEST_UPDATE, 
                DataEventConst.QUEST_COMPLETED, request.quest, null, null))
        }
        if(request.hideoutMediator) {
            request.hideoutMediator.savedPage = null;
            if(NavigationUtils.getActivePageRunner() === NavigationUtils.HIDEOUT_RUNNER) {
                request.hideoutMediator.update(new HideoutRequest(null, EventConst.HIDEOUT_EVENT, 
                    DataEventConst.QUEST_UPDATE, null, null, null
                ));
            }
        }

        if(request.itemsMediator) {
            request.itemsMediator.savedPage = null;
            if(NavigationUtils.getActivePageRunner() === NavigationUtils.ITEMS_RUNNER) {
                request.itemsMediator.update(new ItemsRequest(null, EventConst.ITEMS_EVENT, 
                    DataEventConst.QUEST_UPDATE, null, null, null))
            }
        }
    }

    private handleLevelChange(request:SidePageQuestRequest) {
        if(NavigationUtils.getActivePageRunner() === NavigationUtils.MAP_RUNNER) {
            request.mapMediator.update(new MapRequest(null, EventConst.QUEST_ICON_EVENT, null, null, 
                DataEventConst.QUEST_UPDATE, new Date().getTime()))
        }
        if(NavigationUtils.getActivePageRunner() === NavigationUtils.QUEST_RUNNER) {
            request.questMediator.update(new QuestRequest(null, EventConst.QUEST_UPDATE,
                DataEventConst.LEVEL_CHANGE, request.quest, null, null))
        }
    }

    private handleProgressionUpdate(request:SidePageQuestRequest) {
        if(NavigationUtils.getActivePageRunner() === NavigationUtils.MAP_RUNNER) {
            request.mapMediator.update(new MapRequest(null, EventConst.QUEST_ICON_EVENT, null, null, 
                DataEventConst.QUEST_UPDATE, new Date().getTime()))
            request.mapMediator.update(new MapRequest(null, EventConst.MAP_EVENT, null, null, 
                DataEventConst.EDIT_MODE_CHANGED, new Date().getTime()))
        }
        if(NavigationUtils.getActivePageRunner() === NavigationUtils.QUEST_RUNNER) {
            request.questMediator.update(new QuestRequest(null, EventConst.QUEST_UPDATE,
                DataEventConst.PROGRESSION_CHANGED, request.quest, null, null))
        }
        
        if(request.hideoutMediator) {
            request.hideoutMediator.savedPage = null;
            if(NavigationUtils.getActivePageRunner() === NavigationUtils.HIDEOUT_RUNNER) {
                request.hideoutMediator.update(new HideoutRequest(null, EventConst.HIDEOUT_EVENT, 
                    DataEventConst.PROGRESSION_CHANGED, null, null, null
                ));
            }
        }

        if(request.itemsMediator) {
            request.itemsMediator.savedPage = null;
            if(NavigationUtils.getActivePageRunner() === NavigationUtils.ITEMS_RUNNER) {
                request.itemsMediator.update(new ItemsRequest(null, EventConst.ITEMS_EVENT, 
                    DataEventConst.PROGRESSION_CHANGED, null, null, null))
            }
        }

    }

    private handleOwQuestEvent(request:SidePageQuestRequest) {
        if(NavigationUtils.getActivePageRunner() === NavigationUtils.MAP_RUNNER) {
            request.mapMediator.update(new MapRequest(null, EventConst.QUEST_ICON_EVENT, null, null, 
                DataEventConst.QUEST_UPDATE, new Date().getTime()))
        }
        if(NavigationUtils.getActivePageRunner() === NavigationUtils.QUEST_RUNNER) {
            request.questMediator.update(new QuestRequest(null, EventConst.QUEST_UPDATE,
                DataEventConst.QUEST_UPDATE_OW_EVENT, null, null, null))
        }
        
        if(request.hideoutMediator) {
            request.hideoutMediator.savedPage = null;
            if(NavigationUtils.getActivePageRunner() === NavigationUtils.HIDEOUT_RUNNER) {
                request.hideoutMediator.update(new HideoutRequest(null, EventConst.HIDEOUT_EVENT, 
                    DataEventConst.QUEST_UPDATE, null, null, null
                ));
            }
        }

        if(request.itemsMediator) {
            request.itemsMediator.savedPage = null;
            if(NavigationUtils.getActivePageRunner() === NavigationUtils.ITEMS_RUNNER) {
                request.itemsMediator.update(new ItemsRequest(null, EventConst.ITEMS_EVENT, 
                    DataEventConst.QUEST_UPDATE, null, null, null))
            }
        }
    }
}