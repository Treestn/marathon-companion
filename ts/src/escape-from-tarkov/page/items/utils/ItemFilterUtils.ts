import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { ItemsComponent } from "../component/ItemsComponent";
import { ItemsUtils } from "../../../utils/ItemsUtils";
import { SessionUtils } from "../../../utils/SessionUtils";

export class ItemFilterUtils {

    // private static removeDone:boolean = false;
    private static showMissingOnly:boolean = false;
    private static quest:boolean = false;
    private static hideout:boolean = false;
    private static searchBarInputElement:HTMLInputElement;

    static setShowMissingOnly(state:boolean) {
        this.showMissingOnly = state
        SessionUtils.getFilterStates().itemsFilter.missingOnlyState = state
        SessionUtils.setFilterState();
    }

    static getShowMissingOnly() {
        return this.showMissingOnly
    }
    
    static setQuest(state:boolean) {
        this.quest = state
        SessionUtils.getFilterStates().itemsFilter.quest = state
        SessionUtils.setFilterState();
    }

    static getQuest() {
        return this.quest
    }

    static setHideout(state:boolean) {
        this.hideout = state
        SessionUtils.getFilterStates().itemsFilter.hideout = state
        SessionUtils.setFilterState();
    }

    static getHideout() {
        return this.hideout
    }

    // static disableFilters() {
    //     // this.removeDone = false;
    //     this.showMissingOnly = false;
    //     this.quest = false;
    //     this.hideout = false;
    // }

    static setSearchBarInputElement(input:HTMLInputElement) {
        this.searchBarInputElement = input
    }

    static grabSearchBarFocus() {
        this.searchBarInputElement.focus();
    }

    static filterComponents(components:ItemsComponent[]):ItemsComponent[] {
        const filteredList:ItemsComponent[] = []

        for(const component of components) {
            if(this.searchBarInputElement.value !== "" && !this.searchMatching(component)) {
                continue;
            }
            // if(this.removeDone && this.isDone(component)) {
            //     continue;
            // }
            if(this.showMissingOnly && (this.hasEnough(component) || this.isDone(component))) {
                continue;
            }
            if(this.quest && (!this.hasQuest(component) || this.isQuestDone(component))) {
                continue;
            }
            if(this.hideout && (!this.hasHideout(component) || this.isHideoutDone(component))) {
                continue;
            }
            filteredList.push(component);
        }
        return filteredList
    }

    private static isQuestDone(component:ItemsComponent):boolean {
        let done = true;
        component.questsRequirement.forEach((objectives, quest) => {
            const questState = PlayerProgressionUtils.getQuestState(quest.id);
            objectives.forEach(objective => {
                if(questState && questState.objectivesState) {
                    if(!questState.completed) {
                        questState.objectivesState.forEach(objState => {
                            if(objective.id === objState.id && !objState.completed) {
                                done = false;
                            }
                        })
                    }
                }
            })
        })
        return done;
    }

    private static isHideoutDone(component:ItemsComponent):boolean {
        let done = true;
        component.hideoutRequirement.forEach((hideoutLevels, hideoutStation) => {
            hideoutLevels.forEach(hideoutLevel => {
                const hideoutLevelState = PlayerProgressionUtils.getStationLevelState(hideoutStation.id, hideoutLevel.id);
                if(hideoutLevelState && !hideoutLevelState.completed) {
                    done = false;
                }
            })
        })
        return done;
    }

    private static isDone(component:ItemsComponent):boolean {
        let done = true;
        done = this.isHideoutDone(component);
        if(!done) {
            return false;
        }
        done = this.isQuestDone(component);
        return done;
    }

    private static hasEnough(component:ItemsComponent):boolean {
        const itemState = PlayerProgressionUtils.getItemState(component.itemId);
        if(itemState) {
            if(this.getHideout()) {
                const hideoutMap = ItemsUtils.getHideoutRequiredAmount();
                if(hideoutMap) {
                    return itemState.currentQuantity >= hideoutMap.get(component.itemId);
                }
            } else if(this.getQuest()) {
                const questMap = ItemsUtils.getQuestRequiredAmount();
                if(questMap) {
                    return itemState.currentQuantity >= questMap.get(component.itemId);
                }
            } else {
                return itemState.currentQuantity >= itemState.requiredQuantity
            }
        }
        return true;
    }

    private static searchMatching(component:ItemsComponent):boolean {
        if(!this.searchBarInputElement || this.searchBarInputElement.value === null || this.searchBarInputElement.value === "") {
            return true;
        }
        const text = this.searchBarInputElement.value.toLowerCase();
        return component.itemData.shortName?.toLowerCase().includes(text) || component.itemData.name?.toLowerCase().includes(text);
    }

    private static hasQuest(component:ItemsComponent) {
        return component.questsRequirement && component.questsRequirement.size > 0 
    }

    private static hasHideout(component:ItemsComponent) {
        return component.hideoutRequirement && component.hideoutRequirement.size > 0 
    }
 }