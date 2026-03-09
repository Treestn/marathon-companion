import { validate } from "webpack";
import { HideoutUtils } from "../escape-from-tarkov/page/hideout/utils/HideoutUtils";
import { QuestsUtils } from "../escape-from-tarkov/page/quests/utils/QuestsUtils";

export interface IPlayerProgression {
    id: string;
    pvp:IProgression
    pve:IProgression

    resolve():void;
}

export interface IProgression {
    playerLevel:string;
    questStates:IQuestState[];
    hideoutState:IHideoutState[];
    itemState:IItemsState[];
    getPlayerLevel():string;
    setPlayerLevel(level:string):void;
    getQuestStates():QuestState[];
    getQuestState(id:string):QuestState;
    getHideoutState(id:string):HideoutState;
    getItemStates():ItemState[];
    getItemState(id:string):ItemState;
    addNewQuest(questId:string, active?:boolean, completed?:boolean):void
    removeQuest(questId:string):void
    addNewHideoutStation(stationId:string, active?:boolean, completed?:boolean):void
    addNewItemState(itemId:string, requiredQuantity?:number, currentQuantity?:number):void
    resetHideoutStation(state:HideoutState)
    resetProgression():void;
}

export interface IQuestState {
    questId:string;
    oldQuestId: string;
    manuallyActivated:boolean;
    noTracking:boolean;
    active:boolean;
    completed:boolean;
    failed:boolean;
    objectivesState:ObjectiveState[];
}

export interface IObjectiveState {
    id:string;
    completed:boolean;
}

export interface IHideoutState {
    stationId:string;
    oldStationId?:string;
    active:boolean;
    completed:boolean;
    stationLevelState:IStationLevelState[];
}

export interface IStationLevelState {
    id:string;
    active:boolean;
    completed:boolean;
}

export interface IItemsState {
    itemId:string;
    requiredQuantity:number;
    overallQuantity:number
    currentQuantity:number;
}

export class PlayerProgression implements IPlayerProgression {

    id:string;
    pvp:IProgression
    pve:IProgression

    constructor(data?:IPlayerProgression) {
        if(data) {
            this.id = data.id;
            this.pvp = Progression.fromData(data.pvp);
            this.pve = Progression.fromData(data.pve);
        } else {
            this.init()
            this.pve.resetProgression();
        }
    }

    static fromData(data: IPlayerProgression): PlayerProgression {
        return new PlayerProgression(data);
    }

    private init() {
        this.pvp = new Progression();
        this.pve = new Progression(); 
    }

    resolve() {
        this.pvp = Object.assign(new Progression(), this.pvp)
        this.pve = Object.assign(new Progression(), this.pve)
    }

    addNewQuest(questId:string, active?:boolean, completed?:boolean) {
        this.pvp.addNewQuest(questId, active, completed)
        this.pve.addNewQuest(questId, active, completed)
    }
}

export class Progression implements IProgression {

    playerLevel:string;
    questStates:IQuestState[] = []
    hideoutState:IHideoutState[] = [];
    itemState:IItemsState[] = [];

    static readonly startingQuests:string[] = ["1f9fbbad-b784-4c85-9c92-c20da6f5e5aa"]

    constructor(data?:IProgression) {
        if(data) {
            this.playerLevel = data.playerLevel;
            data.questStates.forEach(state => {
                this.questStates.push(QuestState.fromData(state))
            })
            data.hideoutState.forEach(state => {
                this.hideoutState.push(HideoutState.fromData(state))
            })
            data.itemState.forEach(state => {
                this.itemState.push(ItemState.fromData(state))
            })
        } else {
            this.init()
        }
    }

    static fromData(data:IProgression): Progression {
        return new Progression(data);
    }

    private init() {
        if(!this.playerLevel) {
            this.playerLevel = "1";
        }
        if(!this.questStates) {
            this.questStates = [];
            QuestsUtils.getData().tasks.forEach(quest => {
                this.questStates.push(new QuestState(quest.id, quest.active, quest.completed))
            })
        }
        if(!this.hideoutState) {
            this.hideoutState = []
        }
        if(!this.itemState) {
            this.itemState = []
        }
    }

    getPlayerLevel():string {
        return this.playerLevel
    }

    setPlayerLevel(level:string) {
        this.playerLevel = level
    }

    getQuestStates():QuestState[] {
        return this.questStates
    }

    getQuestState(id:string):QuestState {
        for(const questState of this.questStates) {
            if(id === questState.questId || id === questState.oldQuestId) {
                return questState;
            }
        }
    }

    getHideoutStates():HideoutState[] {
        return this.hideoutState;
    }

    getHideoutState(id:string):HideoutState {
        for(const state of this.hideoutState) {
            if(id === state.stationId || id === state.oldStationId) {
                return state;
            }
        }
    }

    getItemStates():ItemState[] {
        return this.itemState;
    }

    getItemState(id:string):ItemState {
        for(const state of this.itemState) {
            if(state.itemId === id) {
                return state;
            }
        }
    }

    addNewQuest(questId:string, active?:boolean, completed?:boolean):void {
        let exists = false;
        for(const state of this.questStates) {
            if(state.questId === questId) {
                exists = true;
                break;
            }
        }
        if(!exists) {
            this.questStates.push(new QuestState(questId, active, completed))
        }
    }

    removeQuest(questId:string) {
        this.questStates.filter((state, i, arr) => {
            return !(state.questId === questId || state.oldQuestId === questId)
        })
    }
    
    addNewHideoutStation(stationId:string, active?:boolean, completed?:boolean):void {
        let exists = false;
        for(const state of this.hideoutState) {
            if(state.stationId === stationId) {
                exists = true;
                break;
            }
        }
        if(!exists) {
            const hideoutState = new HideoutState(stationId, active, completed);
            this.hideoutState.push(hideoutState)
            const station = HideoutUtils.getStation(stationId);
            if(station) {
                for(let i = 0; i < station.levels.length; i++) {
                    if( (!station.levels[i].itemRequirements || station.levels[i].itemRequirements.length === 0) 
                            && (!station.levels[i].stationLevelRequirements || station.levels[i].stationLevelRequirements.length === 0)) {
                        hideoutState.stationLevelState.push(new StationLevelState(station.levels[i].id, false, true));
                    } else if(station.levels[i].level === 1) {
                        hideoutState.stationLevelState.push(new StationLevelState(station.levels[i].id, true));
                    } else {
                        hideoutState.stationLevelState.push(new StationLevelState(station.levels[i].id));
                    }
                }
            }
        }
    }

    addNewItemState(itemId:string, requiredQuantity?:number, currentQuantity?:number) {
        let exists = false;
        for(const state of this.itemState) {
            if(state.itemId === itemId) {
                exists = true;
                break;
            }
        }
        if(!exists) {
            this.itemState.push(new ItemState(itemId, requiredQuantity, currentQuantity))
        }
    }

    resetProgression() {
        this.playerLevel = "1";
        this.resetQuests();
        this.resetHideout();
        this.resetItems();
    }

    private resetQuests() {
        this.questStates.forEach(state => {
            state.completed = false;
            state.manuallyActivated = false;
            state.noTracking = false;
            state.failed = false;
            if(Progression.startingQuests.includes(state.questId)) {
                state.active = true;
            } else {
                state.active = false;
            }
            if(state.objectivesState) {
                state.objectivesState.forEach(objState => {
                    objState.completed = false;
                })
            }
        })
    }

    private resetHideout() {
        this.hideoutState = []
        // this.hideoutState.forEach(state => {
        //     this.resetHideoutStation(state);
        // })
    }

    resetHideoutStation(state:HideoutState) {
        state.completed = false;
        state.active = true;
        if(state.stationLevelState && state.stationLevelState.length > 0) {
            for(const stationLevelState of state.stationLevelState) {
                const stationLevel = HideoutUtils.getStationLevel(state.stationId, stationLevelState.id)
                if(stationLevel) {
                    if(stationLevel.level === 1) {
                        stationLevelState.active = true;
                    } else {
                        stationLevelState.active = false;
                    }
                    stationLevelState.completed = false;
                } else {
                    console.log(`Station Level object was not found in state`);
                }
            }
        }
    }

    private resetItems() {
        this.itemState.forEach(itemState => {
            itemState.currentQuantity = 0;
        })
    }
}

export class QuestState implements IQuestState {

    questId: string;
    oldQuestId: string;
    active: boolean;
    manuallyActivated: boolean;
    noTracking: boolean;
    completed: boolean;
    failed:boolean;
    objectivesState:ObjectiveState[] = [];
    
    constructor(questId:string, active?:boolean, manuallyActivated?:boolean, completed?:boolean, failed?:boolean, noTracking?:boolean, oldQuestId?:string, objectivesState?:IObjectiveState[]) {
        this.questId = questId;
        this.manuallyActivated = manuallyActivated ? manuallyActivated : false;
        this.noTracking = noTracking ? noTracking : false;
        this.failed = failed ? failed : false;
        this.active = active ? active : false;
        this.completed = completed ? completed : false;
        if(oldQuestId) { 
            this.oldQuestId = oldQuestId
        }
        if(objectivesState) {
            objectivesState.forEach(state => {
                this.objectivesState.push(ObjectiveState.fromData(state))
            })
        } else {
            this.objectivesState = []
        }
    }

    static fromData(data?:IQuestState): IQuestState {
        return new QuestState(data.questId, data.active, data.manuallyActivated, data.completed, data.failed, data.noTracking, data.oldQuestId, data.objectivesState)
    }
}

export class ObjectiveState implements IObjectiveState {

    id: string;
    completed: boolean;

    constructor(id:string, completed?:boolean) {
        this.id = id;
        this.completed = completed ? completed : false;
    }

    static fromData(data:IObjectiveState): IObjectiveState {
        return new ObjectiveState(data.id, data.completed);
    }
}

export class HideoutState implements IHideoutState {
    stationId: string;
    oldStationId?: string;
    active: boolean;
    completed: boolean;
    stationLevelState: IStationLevelState[] = [];
    
    constructor(id:string, active?:boolean, completed?:boolean, oldStationId?:string, stationLevelStates?:IStationLevelState[]) {
        this.stationId = id;
        this.active = active ? active : false;
        this.completed = completed ? completed : false;
        if(oldStationId) {
            this.oldStationId = oldStationId;
        }
        if(stationLevelStates) {
            stationLevelStates.forEach(state => {
                this.stationLevelState.push(StationLevelState.fromData(state))
            })
        } else {
            this.stationLevelState = []
        }
    }

    static fromData(data:IHideoutState): IHideoutState {
        return new HideoutState(data.stationId, data.active, data.completed, data.oldStationId, data.stationLevelState)
    }
}

export class StationLevelState implements IStationLevelState {
    id: string;
    active: boolean;
    completed: boolean;
    
    constructor(id:string, active?:boolean, completed?:boolean) {
        this.id = id;
        this.active = active ? active : false;
        this.completed = completed ? completed : false;
    }

    static fromData(data:IStationLevelState): IStationLevelState {
        return new StationLevelState(data.id, data.active, data.completed);
    }
}

export class ItemState implements IItemsState {
    itemId: string;
    requiredQuantity: number;
    overallQuantity:number;
    currentQuantity: number;
    
    constructor(id:string, requiredQuantity?:number, currentQuantity?:number, overallQuantity?:number) {
        this.itemId = id;
        this.requiredQuantity = requiredQuantity ? requiredQuantity : 0;
        this.overallQuantity = requiredQuantity ? requiredQuantity : 0;
        this.currentQuantity = currentQuantity ? currentQuantity : 0;
    }

    static fromData(data:IItemsState): IItemsState {
        return new ItemState(data.itemId, data.requiredQuantity, data.currentQuantity, data.overallQuantity);
    }
}