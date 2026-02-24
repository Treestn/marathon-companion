import { progressionTypes } from "../../../../consts";
import { MapsList } from "../../../constant/MapsConst";
import { QuestState, QuestStateList, QuestType, QuestTypeList } from "../../../constant/QuestConst";
import { TraderList } from "../../../constant/TraderConst";
import { FilterState, IState } from "../../../../model/IFilterState";
import { Quest, QuestsObject } from "../../../../model/quest/IQuestsElements";
import { AppConfigUtils } from "../../../utils/AppConfigUtils";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { SessionUtils } from "../../../utils/SessionUtils";
import { QuestsUtils } from "./QuestsUtils";

export class QuestsFiltersUtils {

    private static orderByTrader:boolean = false;
    private static orderByQuestName:boolean = false;

    static init() {
        for(const trader of TraderList) {
            this.traderFilter.set(trader.id, true);
        }
        for(const map of MapsList) {
            this.mapStateFilter.set(map.id, true);
        }
        for(const questType of QuestTypeList) {
            this.questTypeFilter.set(questType, true);
        }
        for(const questState of QuestStateList) {
            if(QuestState.COMPLETED === questState || QuestState.NO_TRACKING === questState) {
                this.questStateFilter.set(questState, false);
            } else {
                this.questStateFilter.set(questState, true);
            }
        }
    }

    static traderFilter:Map<string, boolean> = new Map();
    static questTypeFilter:Map<string, boolean> = new Map();
    static questStateFilter:Map<string, boolean> = new Map();
    static mapStateFilter:Map<string, boolean> = new Map();
    static kappaFilter:boolean = false;

    static saveAll() {
        this.saveMapState();
        this.saveQuestStateState();
        this.saveQuestTypeState();
        this.saveTraderFilterState();
        this.saveKappaFilterState();
    }

    static setKappaFilter(state:boolean) {
        this.kappaFilter = state;
        this.saveKappaFilterState();
    }

    static getKappaFilter():boolean {
        return this.kappaFilter;
    }

    private static saveKappaFilterState() {
        SessionUtils.setFilterState();
    }

    static setTraderFilter(traderName:string, state:boolean) {
        this.traderFilter.set(traderName, state);
        this.saveTraderFilterState();
    }

    static getTraderFilter(traderName:string):boolean {
        return this.traderFilter.get(traderName);
    }

    private static saveTraderFilterState() {
        const list:IState[] = []
        for(const [key, value] of this.traderFilter) {
            list.push(new FilterState(key, value));
        }
        SessionUtils.getFilterStates().questFilter.traderState = list;
        SessionUtils.setFilterState();
    }

    static resolveOrderState() {
        this.orderByTrader = SessionUtils.getFilterStates().questFilter.orderByTrader
        this.orderByQuestName = SessionUtils.getFilterStates().questFilter.orderByQuestName
    }

    static resolveTraderState() {
        const traderFilters = SessionUtils.getFilterStates().questFilter.traderState;
        for(const traderFilter of traderFilters) {
            this.traderFilter.set(traderFilter.id, traderFilter.state);
        }
    }

    static setOrderByTrader(state:boolean) {
        this.orderByTrader = state;
        SessionUtils.getFilterStates().questFilter.orderByTrader = state
        SessionUtils.setFilterState();
    }

    static getOrderByTrader():boolean {
        return this.orderByTrader;
    }
    
    static setOrderByQuestName(state:boolean) {
        this.orderByQuestName = state;
        SessionUtils.getFilterStates().questFilter.orderByQuestName = state
        SessionUtils.setFilterState();
    }

    static getOrderByQuestName():boolean {
        return this.orderByQuestName;
    }

    static setQuestTypeFilter(questType:string, state:boolean) {
        this.questTypeFilter.set(questType, state);
        this.saveQuestTypeState();
    }

    static getQuestTypeFilter(questType:string):boolean {
        return this.questTypeFilter.get(questType);
    }

    private static saveQuestTypeState() {
        const list:IState[] = []
        for(const [key, value] of this.questTypeFilter) {
            list.push(new FilterState(key, value));
        }
        SessionUtils.getFilterStates().questFilter.questTypeFilter = list;
        SessionUtils.setFilterState();
    }

    static resolveTypeState() {
        const typeFilters = SessionUtils.getFilterStates().questFilter.questTypeFilter;
        for(const typeFilter of typeFilters) {
            this.questTypeFilter.set(typeFilter.id, typeFilter.state);
        }
    }

    static setQuestStateFilter(questState:string, state:boolean) {
        this.questStateFilter.set(questState, state);
        this.saveQuestStateState();
    }

    static getQuestStateFilter(questState:string):boolean {
        return this.questStateFilter.get(questState);
    }

    private static saveQuestStateState() {
        const list:IState[] = []
        for(const [key, value] of this.questStateFilter) {
            list.push(new FilterState(key, value));
        }
        SessionUtils.getFilterStates().questFilter.questStateFilter = list;
        SessionUtils.setFilterState();
    }

    static resolveQuestStateFilterState() {
        const questStateFilters = SessionUtils.getFilterStates().questFilter.questStateFilter;
        for(const questState of questStateFilters) {
            this.questStateFilter.set(questState.id, questState.state);
        }
    }

    static setMapStateFilter(mapId:string, state:boolean) {
        this.mapStateFilter.set(mapId, state);
        this.saveMapState();
    }

    static getMapStateFilter(mapId:string):boolean {
        return this.mapStateFilter.get(mapId);
    }

    private static saveMapState() {
        const list:IState[] = []
        for(const [key, value] of this.mapStateFilter) {
            list.push(new FilterState(key, value));
        }
        SessionUtils.getFilterStates().questFilter.mapFilterState = list
        SessionUtils.setFilterState();
    }

    static resolveMapFilterState() {
        const mapStates = SessionUtils.getFilterStates().questFilter.mapFilterState
        for(const mapState of mapStates) {
            this.mapStateFilter.set(mapState.id, mapState.state);
        }
    }

    static filterByQuestsTitle(text:string, quests:Quest[]):Quest[] {
        let questAllowed:Quest[] = [];

        for(const quest of quests) {
            if(quest.name.toLocaleLowerCase().includes(text.toLocaleLowerCase())
                && this.questAllowed(quest)) {
                questAllowed.push(quest)
            }
        }
        return questAllowed;
    }

    static filterQuests(quests:QuestsObject):Quest[] {
        let questAllowed:Quest[] = [];

        for(const quest of quests.tasks) {
            if(this.isQuestAllowed(quest)) {
                questAllowed.push(quest)
            }
        }
        return questAllowed;
    }

    static filterPveQuests(quests:QuestsObject):Quest[] {
        let questAllowed:Quest[] = [];

        for(const quest of quests.tasks) {
            if(this.questAllowed(quest)) {
                questAllowed.push(quest)
            }
        }
        return questAllowed;
    }

    static isQuestAllowed(quest:Quest) {

        const traderAllowed:boolean = this.traderFilter.get(quest.trader.id);
        let questTypeAllowed:boolean;
        if(!quest.questType) {
            questTypeAllowed = this.questTypeFilter.get(QuestType.SIDE_QUEST);
        } else {
            questTypeAllowed = this.questTypeFilter.get(quest.questType);
        }
        if(!this.questAllowed(quest)) {
            return false
        }
        if(!quest.kappaRequired && this.kappaFilter) {
            return false;
        } 

        if(traderAllowed && questTypeAllowed && this.isQuestStateAllowed(quest) && this.isQuestMapAllowed(quest)) {
            return true;
        }
        return false;  
    }

    // Filters for everyone when trying to refresh the page
    static questAllowed(quest:Quest) {
        const progressionType = AppConfigUtils.getAppConfig().userSettings.getProgressionType();
        if(!this.isProgressionTypeAllowed(quest, progressionType)) {
            return false;
        }
        return true;
    }

    static isProgressionTypeAllowed(quest:Quest, progressionType:string) {
        return !(quest.progressionType && quest.progressionType !== "" && progressionType !== quest.progressionType.toLocaleLowerCase())
    }

    static async updateQuestCounter() {
        const activeText = document.getElementById("quest-active-counter-text");
        const completedText = document.getElementById("quest-completed-counter-text");
        const totalText = document.getElementById("quest-total-counter-text");

        let active = 0;
        let completed = 0;
        let total = 0;

        QuestsUtils.getData().tasks.forEach(quest => {
            if(this.isQuestAllowedForCount(quest) && PlayerProgressionUtils.isQuestTracked(quest.id)) {
                total++;
                if(PlayerProgressionUtils.isQuestActive(quest.id) 
                        || PlayerProgressionUtils.isQuestManuallyActivated(quest.id)) {
                    active++;
                } else if (PlayerProgressionUtils.isQuestCompleted(quest.id) 
                        || PlayerProgressionUtils.isQuestFailed(quest.id)) {
                    completed++;
                }
            }
        })

        activeText.textContent = `${active}`;
        completedText.textContent = `${completed}`;
        totalText.textContent = `${total}`;
    }

    private static isQuestAllowedForCount(quest:Quest) {
        const traderAllowed:boolean = this.traderFilter.get(quest.trader.id);
        let questTypeAllowed:boolean;
        if(!quest.questType) {
            questTypeAllowed = this.questTypeFilter.get(QuestType.SIDE_QUEST);
        } else {
            questTypeAllowed = this.questTypeFilter.get(quest.questType);
        }
        if(!this.questAllowed(quest)) {
            return false
        }
        if(!quest.kappaRequired && this.kappaFilter) {
            return false;
        }

        if(traderAllowed && questTypeAllowed && this.isQuestMapAllowed(quest)) {
            return true;
        }
    }

    private static isQuestStateAllowed(quest:Quest):boolean {
        const isCompletedAllowed = this.questStateFilter.get(QuestState.COMPLETED);
        const isActiveAllowed = this.questStateFilter.get(QuestState.ACTIVE);
        const isBlockedAllowed = this.questStateFilter.get(QuestState.BLOCKED);
        const isFailedAllowed = this.questStateFilter.get(QuestState.FAILED);
        const isNoTrackingAllowed = this.questStateFilter.get(QuestState.NO_TRACKING);

        const active = PlayerProgressionUtils.isQuestActive(quest.id);
        const manuallyActive = PlayerProgressionUtils.isQuestManuallyActivated(quest.id);
        const completed = PlayerProgressionUtils.isQuestCompleted(quest.id);
        const failed = PlayerProgressionUtils.isQuestFailed(quest.id);
        const tracking = PlayerProgressionUtils.isQuestTracked(quest.id);

        if(isNoTrackingAllowed && !tracking) {
            return true;
        }
        if(!isNoTrackingAllowed && !tracking && !active && !manuallyActive && isActiveAllowed) {
            return false;
        }

        if(isFailedAllowed && failed) {
            return true;
        }
        if(!isFailedAllowed && failed) {
            return false;
        }

        if(isCompletedAllowed && completed) {
            return true;
        }
        if(!isCompletedAllowed && completed) {
            return false;
        }

        // This is for quests that are not completed at this point
        if(isActiveAllowed && active) {
            return true;
        }

        if(isBlockedAllowed && !active) {
            return true;
        }

        return false;
    }

    private static isQuestMapAllowed(quest:Quest) {
        let allMapsFilterSelected = true;
        for(const [map, value]  of this.mapStateFilter) {
            if(!value) {
                allMapsFilterSelected = false;
            }
        }
        if(allMapsFilterSelected) {
            return true;
        }
        let isQuestAllowed = false;
        quest.objectives.forEach(obj => {
            if(obj.maps && obj.maps.length > 0) {
                if(!obj.maps || obj.maps.length === 0) {
                    isQuestAllowed = true;
                } else {
                    obj.maps.forEach(map => {
                        if(this.mapStateFilter.get(map.id)) {
                            isQuestAllowed = true;
                        }
                    })
                }
            }
        })
        return isQuestAllowed;
    }

    static orderQuests(quests:Quest[]) {
        let orderedActive:Quest[] = [];
        let orderedOther:Quest[] = [];
        for(const quest of quests) {
            if(PlayerProgressionUtils.isQuestActive(quest.id) 
                || PlayerProgressionUtils.isQuestManuallyActivated(quest.id)) {
                orderedActive.push(quest);
            } else {
                orderedOther.push(quest);
            }
        }
        orderedActive = this.sortQuests(orderedActive, this.orderByTrader, this.orderByQuestName)
        orderedOther = this.sortQuests(orderedOther, this.orderByTrader, this.orderByQuestName);
        return [...orderedActive, ...orderedOther];
    }

    private static sortQuests(
        list: Quest[],
        sortByTrader: boolean,
        sortByQuest: boolean
      ) {
        return list.sort((a, b) => {
          if (sortByTrader && sortByQuest) {
            const traderCompare = a.trader.name.localeCompare(b.trader.name);
            if (traderCompare !== 0) return traderCompare;
            return a.name.localeCompare(b.name);
          } else if (sortByTrader) {
            return a.trader.name.localeCompare(b.trader.name);
          } else if (sortByQuest) {
            return a.name.localeCompare(b.name);
          } else {
            return 0; // no sorting
          }
        });
    }

    static getNumberOfActiveTraderFilter():number {
        let count:number = 0;
        for(const [key, value] of this.traderFilter) {
            if(value) {
                count++;
            }
        }
        return count;
    }

    static getNumberOfActiveQuestTypeFilter():number {
        let count:number = 0;
        for(const [key, value] of this.questTypeFilter) {
            if(value) {
                count++;
            }
        }
        return count;
    }

    static getNumberOfActiveQuestStateFilter():number {
        let count:number = 0;
        for(const [key, value] of this.questStateFilter) {
            if(value) {
                count++;
            }
        }
        return count;
    }

    static getNumberOfActiveMapStateFilter():number {
        let count:number = 0;
        for(const [key, value] of this.mapStateFilter) {
            if(value) {
                count++;
            }
        }
        return count;
    }
}