import { Quest } from "../../../../model/quest/IQuestsElements";
import { NavigationUtils } from "../../../utils/NavigationUtils";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { QuestPageUtils } from "../../quests/utils/QuestPageUtils";
import { QuestsUtils } from "../../quests/utils/QuestsUtils";
import { SidePageQuestsBuilder } from "../builder/helper/SidePageQuestsBuilder";
import { SidePageQuestRequest } from "../handlers/request/SidePageQuestRequest";

export class SidePageQuestUtils {

    static removeAllQuests() {
        const wrapper = document.getElementById("side-page-quests-container");
        if(wrapper) {
            for(let i = wrapper.children.length - 1; i>= 0; i--) {
                wrapper.children[i].remove()
            }
        }
    }

    static updateQuests(quests:Quest[], request?:SidePageQuestRequest) {
        this.removeAllQuests()
        let questList:Quest[] = []
        if(!quests) {
            if(request && NavigationUtils.getActivePageRunner() === NavigationUtils.MAP_RUNNER && NavigationUtils.isMapFilterEnabled()) {
                questList = QuestsUtils.getActiveQuestsForMap(request.mapMediator.getActiveMap())
            } else {
                questList = QuestsUtils.getActiveQuests();
            }
        } else {
            questList = quests
        }

        if(NavigationUtils.isKappaFilterEnabled()) {
            questList = questList.filter(quest => quest.kappaRequired)
        }
        questList = this.sortQuests(questList, NavigationUtils.isOrderTraderFilterEnabled(), NavigationUtils.isQuestNameFilterEnabled())

        questList.forEach(quest => {
            SidePageQuestsBuilder.addQuestElement(quest)
            SidePageQuestUtils.resolveQuestGlow(quest);
        })
    }

    private static sortQuests(
        list: Quest[],
        sortByTrader: boolean,
        sortByQuest: boolean
      ) {
        return list.sort((a, b) => {
          if (sortByTrader && sortByQuest) {
            const traderCompare = a.trader.id.localeCompare(b.trader.id);
            if (traderCompare !== 0) return traderCompare;
            return a.name.localeCompare(b.name);
          } else if (sortByTrader) {
            return a.trader.id.localeCompare(b.trader.id);
          } else if (sortByQuest) {
            return a.name.localeCompare(b.name);
          } else {
            return 0; // no sorting
          }
        });
    }

    static resolveQuestGlow(quest:Quest) {
        const sidePageWrapper = document.getElementById("side-page-quests-container")
        if(sidePageWrapper) {
            const questWrapperList = sidePageWrapper.getElementsByClassName("side-page-quest-entity");
            for(const questWrapper of questWrapperList) {
                if(questWrapper.id === quest.id) {
                    const active = PlayerProgressionUtils.isQuestActive(quest.id)
                    const completed = PlayerProgressionUtils.isQuestCompleted(quest.id)
                    const isTracked = PlayerProgressionUtils.isQuestTracked(quest.id);
                    const failed = PlayerProgressionUtils.isQuestFailed(quest.id);

                    if(!isTracked) {
                        (questWrapper as HTMLDivElement).style.boxShadow = QuestPageUtils.noTrackingBoxShadow;
                        return;
                    }
                    if(failed) {
                        (questWrapper as HTMLDivElement).style.boxShadow = QuestPageUtils.failedBoxShadow;
                        return;
                    }
                    if(active) {
                        (questWrapper as HTMLDivElement).style.boxShadow = QuestPageUtils.activeBoxShadow;
                    }
                    if(completed) {
                        (questWrapper as HTMLDivElement).style.boxShadow = QuestPageUtils.completedBoxShadow;
                    }
                    if(!active && !completed) {
                        (questWrapper as HTMLDivElement).style.boxShadow = QuestPageUtils.blockedBoxShadow;
                    }
                }
            }
        }
    }
}