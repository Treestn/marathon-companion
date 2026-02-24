import { dbKeys, progressionTypes, storageKeys } from "../../consts";
import { OWQuestEvent } from "../../in_game/handler/IEvents";
import { ObjectiveTypeConst } from "../constant/EditQuestConst";
import { OwEventMapper, ProgressionTypes } from "../constant/ProgressionConst";
import { HideoutState, IPlayerProgression, IProgression, ItemState, ObjectiveState, PlayerProgression, Progression, QuestState, StationLevelState } from "../../model/IPlayerProgression";
import { HideoutUtils } from "../page/hideout/utils/HideoutUtils";
import { ItemUtils } from "../page/items/utils/ItemUtils";
import { QuestsUtils } from "../page/quests/utils/QuestsUtils";
import { AppConfigUtils } from "./AppConfigUtils";
import { ItemsUtils } from "./ItemsUtils";
import { Objectives, Quest, QuestsObject } from "../model/IQuestsElements";
import { HideoutStations } from "../../model/hideout/HideoutObject";

export class PlayerProgressionUtils {

    private static playerProgression:IPlayerProgression;
    private static progression:IProgression;
    private static db:IDBDatabase;

    static async load() {
        if(!this.db) {
            this.db = await this.openDatabase();
        }
        
        if(!this.playerProgression) {
            const storedDB:PlayerProgression = await this.getProgressionFromDb();
            console.log("Stored DB", storedDB);
            
            if(!storedDB) {
                this.playerProgression = new PlayerProgression();
                this.playerProgression.id = dbKeys.databaseProgressionEntry;
                this.setProgressionType(AppConfigUtils.getAppConfig().userSettings.getProgressionType());
                this.save();
                console.log("Player progression created");
                console.log(this.playerProgression);
                return;
            }
            console.log("Player progression loaded");
            this.playerProgression = PlayerProgression.fromData(storedDB);
            this.setProgressionType(AppConfigUtils.getAppConfig().userSettings.getProgressionType());
            if(this.getPlayerLevel() > 1 && !AppConfigUtils.getAppConfig().userSettings.getLevelReminderFlag()) {
                AppConfigUtils.getAppConfig().userSettings.setLevelReminderFlag(true); 
            }
            console.log("Player progression saved");
            this.save();
        }
    }

    static setPlayerProgression(playerProgression:IPlayerProgression) {
        this.playerProgression = PlayerProgression.fromData(playerProgression);
    }

    static getPlayerProgressionJsonString():string {
        return JSON.stringify(this.playerProgression, null, 2)
    }

    private static async requestPersistentStorage(): Promise<boolean> {
        if ('storage' in navigator && 'persist' in navigator.storage) {
            const isPersistent = await navigator.storage.persist();
            return isPersistent; // Returns true if persistent storage is granted
        }
        return false; // Persistent storage is not supported in the browser
    }

    private static async openDatabase(): Promise<IDBDatabase> {

        if (this.db) {
            return await Promise.resolve(this.db);
        }
    
        return new Promise((resolve, reject) => {
            const request:IDBOpenDBRequest = indexedDB.open(storageKeys.playerProgression, 1)
    
            request.onupgradeneeded = (event) => {
                const db = request.result;
                if (!db.objectStoreNames.contains(dbKeys.databaseProgressionStore)) {
                    db.createObjectStore(dbKeys.databaseProgressionStore, { keyPath: "id" });
                }
                const result = this.requestPersistentStorage();
                if(result) {
                    console.log("The database is persistent");
                }
            };
    
            request.onsuccess = (event) => {
                console.log(`DB on success ${event}`);
                this.db = request.result;
                resolve(this.db);
            };
    
            request.onerror = (event) => {
                console.log(`DB on error ${event}`);
                reject(request.error);
            };
        });
    }

    private static async storeIntoDb() {
        const db = await this.openDatabase();

        const transaction = db.transaction(dbKeys.databaseProgressionStore, "readwrite");
        const store = transaction.objectStore(dbKeys.databaseProgressionStore);
        store.put(this.playerProgression);

        transaction.oncomplete = () => {
            if(localStorage.getItem(storageKeys.playerProgression)) {
                localStorage.removeItem(storageKeys.playerProgression);
            }
        };

        transaction.onerror = () => {
            console.log("Transaction error.");
        }
    }

    private static async getProgressionFromDb(): Promise<PlayerProgression> {
        const db = await this.openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(dbKeys.databaseProgressionStore, "readonly");
            const store = transaction.objectStore(dbKeys.databaseProgressionStore);
            const request = store.get(dbKeys.databaseProgressionEntry);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static wipeQuests(progressionType:string) {
        if(progressionType === progressionTypes.pvp) {
            this.playerProgression.pvp.resetProgression();
        } else if(progressionType === progressionTypes.pve) {
            this.playerProgression.pve.resetProgression();
        }
        this.resolve();
        this.resolveAllHideoutStations(HideoutUtils.getData().hideoutStations);
        this.save()
    }

    static resolve() {
        this.resolveQuests();
        this.resolveHideoutStations();
        this.resolveItemsState();
        this.save();
        console.log("Resolved progression");
    }

    private static resolveQuests() {        
        QuestsUtils.getData().tasks.forEach(quest => {
            if(quest.progressionType === ProgressionTypes.PVP.storedString) {
                this.playerProgression.pvp.addNewQuest(quest.id, quest.active, quest.completed)
                this.playerProgression.pve.removeQuest(quest.id);
            } else if(quest.progressionType === ProgressionTypes.PVE.storedString) {
                this.playerProgression.pve.addNewQuest(quest.id, quest.active, quest.completed)
                this.playerProgression.pvp.removeQuest(quest.id);
            } else {
                this.playerProgression.pvp.addNewQuest(quest.id, quest.active, quest.completed)
                this.playerProgression.pve.addNewQuest(quest.id, quest.active, quest.completed)
            }
        })
        console.log('Removing duplicate objectives');
        this.removeDoubleObjectiveState();
        console.log('Removing old objectives');
        this.removeObjectivesFromState();
    }

    static async handleOwQuestEvent(questsList:OWQuestEvent[], progressionType:string) {
        let progression:IProgression;
        if(progressionType === ProgressionTypes.PVE.owEvent) {
            progression = this.playerProgression.pve;
        } else if(progressionType === ProgressionTypes.PVP.owEvent) {
            progression = this.playerProgression.pvp
        }
        questsList.forEach(questEvent => {
            this.handleQuestEvent(questEvent, progression);
        })
        // this.handleQuestsNotFoundYetEvent(questsList, progression);
        this.save();
    }

    // Resolve available quests from quest event
    private static handleQuestEvent(questEvent:OWQuestEvent, progression:IProgression) {
        let found = false;

        
        for(const quest of QuestsUtils.getData().tasks) {
            if(this.areQuestsMatching(quest, questEvent)) {
                found = true
                this.setQuestsStatus(quest.id, questEvent, progression);
                break;
            }
        }
        
        if(!found) {
            console.log(`Quest could not be updated: ${questEvent.quest}`);
        }
    }

    private static areQuestsMatching(quest:Quest, questEvent:OWQuestEvent):boolean {
        return this.normalizeQuestName(quest.name) === this.normalizeQuestName(questEvent.quest)
                || quest.id === questEvent.quest || quest.id === questEvent.quest_id
    }

    private static normalizeQuestName(questName:string):string {
        return questName.replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "")
            .replace(/’/g, "")
            .replace(/'/g, "")
            .replace(/ /g, "")
            .replace(/-/g, "")
            .toLowerCase();
    }

    private static setQuestsStatus(questId:string, questEvent:OWQuestEvent, progression:IProgression) {
        const statusConst = OwEventMapper.getProgressionQuestStatus(questEvent.quest_status);
        if(statusConst) {
            this.setActiveQuestState(questId, statusConst.active, progression, true);
            this.setCompletedQuestState(questId, statusConst.completed, progression, true);
            this.setFailedQuestState(questId, statusConst.failed, progression, true);
        } else {
            console.log("Could not find Progression Status, when searching for " + questEvent.quest_status);
        }
    }

    // These are objectives that were added, but are were removed from the quest
    private static removeObjectivesFromState() {
        QuestsUtils.getData().tasks.forEach(quest => {
            let questStatePvP = this.getQuestState(quest.id, this.playerProgression.pvp);
            let questStatePvE = this.getQuestState(quest.id, this.playerProgression.pve);
            if(questStatePvP && questStatePvP.objectivesState) {
                // console.log(`${quest.name} PVP state before:`);
                // console.log(questStatePvP.objectivesState);
                const toKeep:ObjectiveState[] = []
                questStatePvP.objectivesState.forEach(objState => {
                    if(quest.objectives) {
                        quest.objectives.forEach(obj => {
                            if(obj.id === objState.id || obj.oldId === objState.id) {
                                toKeep.push(objState);
                            }
                        })
                    }
                })
                questStatePvP.objectivesState = []
                questStatePvP.objectivesState = toKeep;
                // console.log(`${quest.name} PVP state after:`);
                // console.log(questStatePvP.objectivesState);
            }
            if(questStatePvE && questStatePvE.objectivesState) {
                const toKeep:ObjectiveState[] = []
                // console.log(`${quest.name} PVE state before:`);
                // console.log(questStatePvE.objectivesState);
                questStatePvE.objectivesState.forEach(objState => {
                    if(quest.objectives) {
                        quest.objectives.forEach(obj => {
                            if(obj.id === objState.id || obj.oldId === objState.id) {
                                toKeep.push(objState);
                            }
                        })
                    }
                })
                questStatePvE.objectivesState = []
                questStatePvE.objectivesState = toKeep;
                // console.log(`${quest.name} PVE state after`);
                // console.log(questStatePvE.objectivesState);
            }
        })
    }

    private static removeDoubleObjectiveState() {
        QuestsUtils.getData().tasks.forEach(quest => {
            let questStatePvP = this.getQuestState(quest.id, this.playerProgression.pvp);
            let questStatePvE = this.getQuestState(quest.id, this.playerProgression.pve);
            if(questStatePvP && questStatePvP.objectivesState) {
                let list:string[] = [];
                let objStateList:ObjectiveState[] = []
                questStatePvP.objectivesState.forEach(state => {
                    if(!list.includes(state.id)) {
                        list.push(state.id)
                        objStateList.push(state);
                    } 
                })
                questStatePvP.objectivesState = []
                questStatePvP.objectivesState = objStateList;
            }
            if(questStatePvE && questStatePvE.objectivesState) {
                let list:string[] = [];
                let objStateList:ObjectiveState[] = []
                questStatePvE.objectivesState.forEach(state => {
                    if(!list.includes(state.id)) {
                        list.push(state.id)
                        objStateList.push(state);
                    } 
                })
                questStatePvE.objectivesState = []
                questStatePvE.objectivesState = objStateList;
            }
        })
    }

    private static resolveHideoutStations() {
        HideoutUtils.getData().hideoutStations.forEach(station => {
            this.playerProgression.pvp.addNewHideoutStation(station.id);
            this.playerProgression.pve.addNewHideoutStation(station.id);
        })
    }

    static resolveItemsState() {
        this.resolveItems(this.playerProgression.pvp, ProgressionTypes.PVP.storedString);
        this.resolveItems(this.playerProgression.pve, ProgressionTypes.PVE.storedString);
        this.resolveRequiredItems(this.playerProgression.pvp);
        this.resolveRequiredItems(this.playerProgression.pve);
        this.removeAllNoTrackingQuestItems(this.playerProgression.pvp);
        this.removeAllNoTrackingQuestItems(this.playerProgression.pve);
        this.save();
    }

    static save() {
        this.storeIntoDb();
        // StorageHelper.save(storageKeys.playerProgression, this.playerProgression)
    }

    static setProgressionType(progression:string) {
        if(progression === progressionTypes.pvp) {
            this.progression = this.playerProgression.pvp
        } else if(progression === progressionTypes.pve) {
            this.progression = this.playerProgression.pve
        } else {
            throw new Error(`Wrong progression type provided: ${progression}`)
        }
        this.save();
    }

    static getQuestState(questId:string, progression?:IProgression):QuestState {
        if(!this.progression && !progression) {
            return undefined as unknown as QuestState;
        }
        let questState:QuestState;
        if(progression) {
            questState = progression.getQuestState(questId)
        } else {
            questState = this.progression.getQuestState(questId)
        }
        if(questState) {
            return questState
        } else {
            console.log(`Quest state not found for: ${questId}`);
            this.addNewQuest(questId);
        }
        this.save();
        return this.progression.getQuestState(questId);
    }

    static getObjectiveState(questId:string, objectiveId:string, progression?:IProgression):ObjectiveState {
        const questState = this.getQuestState(questId, progression);
        if(questState) {
            const objState = questState.objectivesState.find(state => state.id === objectiveId);
            if(!objState) {
                console.log(`Quest objective state not found for quest id: ${questId} and obj id: ${questId}`);
                return;
            }
            return objState;
        }
    }

    static getHideoutStationState(stationid:string, progression?:IProgression):HideoutState {
        let hideoutState:HideoutState;
        if(progression) {
            hideoutState = progression.getHideoutState(stationid)
        } else {
            hideoutState = this.progression.getHideoutState(stationid)
        }
        
        if(hideoutState) {
            return hideoutState
        } else {
            console.log(`Hideout state not found for: ${stationid}`);
            this.addNewHideout(stationid);
        }
        this.save();
        return this.progression.getHideoutState(stationid);
    }

    static getStationLevelState(stationid:string, levelStationId:string, progression?:IProgression):StationLevelState {
        let hideoutState:HideoutState; 
        if(progression) {
            hideoutState = progression.getHideoutState(stationid)
        } else {
            hideoutState = this.progression.getHideoutState(stationid)
        }
        if(hideoutState && hideoutState.stationLevelState && hideoutState.stationLevelState.length > 0) {
            for(const levelState of hideoutState.stationLevelState) {
                if(levelState.id === levelStationId) {
                    return levelState
                }
            }
        }
        console.log(`Could not find Station Level with i: ${levelStationId} for station with id: ${stationid}`);
        return null;
    }

    static getItemState(itemId:string, progression?:IProgression):ItemState {
        let itemState:ItemState;
        if(progression) {
            itemState = progression.getItemState(itemId)
        } else {
            itemState = this.progression.getItemState(itemId)
        }
        if(itemState) {
            return itemState
        } else {
            console.log(`Item state not found for: ${itemId}`);
            this.addNewItem(itemId);
        }
        this.save();
        if(progression) {
            return progression.getItemState(itemId);
        }
        return this.progression.getItemState(itemId);
    }

    static getAllItemQuantities(): Record<string, number> {
        const result: Record<string, number> = {};
        for (const state of this.progression.getItemStates()) {
            result[state.itemId] = state.currentQuantity;
        }
        return result;
    }

    static setPlayerLevel(level:string, progression?:IProgression) {
        if(progression) {
            progression.setPlayerLevel(level);
        } else {
            this.progression.setPlayerLevel(level);
        }
        this.save();
    }

    static getPlayerLevel():number {
        return Number.parseInt(this.progression.getPlayerLevel());
    }

    static setActiveQuestState(questId:string, state:boolean, progression?:IProgression, dontSave?:boolean, forceUpdate?:boolean) {
        let questState:QuestState;
        if(progression) {
            questState = progression.getQuestState(questId)
        } else {
            questState = this.progression.getQuestState(questId)
        }
        if(questState && !questState.manuallyActivated) {
            if(forceUpdate && questState.noTracking) {
                this.setManuallyActiveQuestState(questId, state, progression)
            } else if(questState.manuallyActivated || questState.noTracking) {
                // Do nothing
            } else {
                questState.active = state
            }
        } else {
            console.log(`Quest state not found for: ${questId}`);
            this.addNewQuest(questId);
            if(progression) {
                progression.getQuestState(questId).active = state;
            } else {
                this.progression.getQuestState(questId).active = state;
            }
        }
        if(!dontSave) {
            this.save();
        }
        PlayerProgressionUtils.dispatchQuestProgressEvent("active-state", questId);
    }

    static setManuallyActiveQuestState(questId:string, state:boolean, progression?:IProgression) {
        let questState:QuestState;
        if(progression) {
            questState = progression.getQuestState(questId)
        } else {
            questState = this.progression.getQuestState(questId)
        }
        if(questState) {
            questState.active = state
            questState.manuallyActivated = state
        } else {
            console.log(`Quest state not found for: ${questId}`);
            this.addNewQuest(questId);
            if(progression) {
                progression.getQuestState(questId).active = state;
                progression.getQuestState(questId).manuallyActivated = state;
            } else {
                this.progression.getQuestState(questId).active = state;
                this.progression.getQuestState(questId).manuallyActivated = state;
            }
        }
        this.save();
    }

    static setCompletedQuestState(questId:string, state:boolean, progression?:IProgression, dontSave?:boolean) {
        let questState:QuestState;
        if(progression) {
            questState = progression.getQuestState(questId)
        } else {
            questState = this.progression.getQuestState(questId)
        }
        if(questState) {
            if(questState.noTracking) {
                return;
            }
            questState.completed = state
            if(state) {
                this.setAllQuestObjectiveState(questState, state, progression)
            }
        } else {
            console.log(`Quest state not found for: ${questId}`);
            // const shouldBeActive = QuestsUtils.isQuestRequirementsCompleted(QuestsUtils.getQuestFromID(questId));
            this.addNewQuest(questId);
            if(progression) {
                questState = progression.getQuestState(questId)
            } else {
                questState = this.progression.getQuestState(questId)
            }
            questState.active = false;
            questState.completed = state;
            this.setAllQuestObjectiveState(questState, state, progression)
        }
        if(!dontSave) {
            this.save();
        }
        PlayerProgressionUtils.dispatchQuestProgressEvent("completed", questId);
    }

    static setFailedQuestState(questId:string, failed:boolean, progression?:IProgression, dontSave?:boolean) {
        let questState:QuestState;
        if(progression) {
            questState = progression.getQuestState(questId)
        } else {
            questState = this.progression.getQuestState(questId)
        }
        if(questState) {
            questState.failed = failed
            if(failed) {
                questState.active = false;
            }
        } else {
            console.log(`Quest state not found for: ${questId}`);
            this.addNewQuest(questId);
            if(progression) {
                questState = progression.getQuestState(questId)
            } else {
                questState = this.progression.getQuestState(questId)
            }
            questState.failed = failed
            if(failed) {
                questState.active = false;
            }
        }
        if(!dontSave) {
            this.save();
        }
    }

    static setTrackingQuestState(questId:string, isTracked:boolean, progression?:IProgression) {
        let questState:QuestState;
        if(progression) {
            questState = progression.getQuestState(questId)
        } else {
            questState = this.progression.getQuestState(questId)
        }
        if(questState) {
            questState.noTracking = !isTracked
            if(questState.noTracking) {
                questState.active = false;
            }
            this.handleQuestItemsTracking(questId, questState.noTracking, progression);
        } else {
            console.log(`Quest state not found for: ${questId}`);
            this.addNewQuest(questId);
            if(progression) {
                questState = progression.getQuestState(questId)
            } else {
                questState = this.progression.getQuestState(questId)
            }
            questState.noTracking = !isTracked;
            if(questState.noTracking) {
                questState.active = false;
            }
            this.handleQuestItemsTracking(questId, questState.noTracking, progression);
        }
        this.save();
    }

    private static handleQuestItemsTracking(questId:string, noTracking:boolean, progression?:IProgression) {
        const quest = QuestsUtils.getQuestFromID(questId);
        if(!progression) {
            progression = this.progression;
        }
        const questState = PlayerProgressionUtils.getQuestState(questId, progression);
        quest.objectives.forEach(objective => {
            if(questState && questState.objectivesState) {
                let found = false;
                for(const objState of questState.objectivesState) {
                    if(objState.id === objective.id) {
                        found = true;
                        if((objective.type === ObjectiveTypeConst.GIVE_ITEM.type || objective.type === ObjectiveTypeConst.FIND_ITEM.type) && objective.item) {
                            const itemState = this.getItemState(objective.item.id, progression);
                            if(itemState) {
                                if(noTracking) {
                                    // itemState.overallQuantity -= objective.count;
                                    itemState.requiredQuantity -= objective.count;
                                } else {
                                    // itemState.overallQuantity += objective.count;
                                    itemState.requiredQuantity += objective.count;
                                }
                            }
                        }
                    }
                }
                if(!found) {
                    console.log(`Could not find quest objective state for quest id: ${questId} and objective id: ${objective.id}`);
                }
            } else {
                console.log(`Could not find quest state for quest id: ${objective.id}`);
            }
        })
        this.save()
    }

    private static setAllQuestObjectiveState(questState:QuestState, state:boolean, progression?:IProgression) {
        if(questState.objectivesState && questState.objectivesState.length > 0) {
            const quest = QuestsUtils.getQuestFromID(questState.questId);
            if(quest) {
                for(const objective of quest.objectives) {
                    this.setQuestObjectiveState(questState.questId, objective, state, progression);
                }
            }
        }
    }

    static setQuestObjectiveState(questId:string, objective:Objectives, state:boolean, progression?:IProgression) {
        const questState = PlayerProgressionUtils.getQuestState(questId);
        if(questState && questState.objectivesState) {
            let found = false;
            for(const objState of questState.objectivesState) {
                if(objState.id === objective.id) {
                    found = true;
                    if((objective.type === ObjectiveTypeConst.GIVE_ITEM.type || objective.type === ObjectiveTypeConst.FIND_ITEM.type) && objective.item) {
                        if(state && !objState.completed) {
                            ItemUtils.giveItem(objective.item.id, objective.count, progression)
                        } else if(!state && objState.completed) {
                            ItemUtils.giveItemBack(objective.item.id, objective.count, progression)
                        }
                    }
                    objState.completed = state;
                }
            }
            if(!found) {
                console.log(`Could not find quest objective state for quest id: ${questId} and objective id: ${objective.id}`);
            }
        } else {
            console.log(`Could not find quest state for quest id: ${objective.id}`);
        }
        this.save()
        PlayerProgressionUtils.dispatchQuestProgressEvent("objective", questId, objective.id);
    }

    private static dispatchQuestProgressEvent(type: string, questId: string, objectiveId?: string) {
        if(typeof globalThis.dispatchEvent !== "function") return;
        globalThis.dispatchEvent(new CustomEvent("quest-progress-updated", {
            detail: { type, questId, objectiveId }
        }));
    }

    static setQuestObjectiveCompletedState(quest:Quest, objectiveId:string, completedState:boolean) {
        for(const obj of quest.objectives) {
            if(obj.id === objectiveId || obj.oldId === objectiveId) {
                PlayerProgressionUtils.setQuestObjectiveState(quest.id, obj, completedState);
                return;
            }
        }
        console.log(`Objective not found from objective id: ${objectiveId} for quest id: ${quest.id}`);
    }

    static setQuestObjectiveCompletedStateFromIconId(quest:Quest, iconId:string, completedState:boolean):string {
        const objective:Objectives = QuestsUtils.getObjectiveFromIconId(quest.objectives, iconId);
        if(objective) {
            PlayerProgressionUtils.setQuestObjectiveState(quest.id, objective, completedState);
            return objective.id
        } else {
            console.log(`Objective not found from icon id: ${iconId} for quest id: ${quest.id}`);
        }
        return null;
    }

    static isQuestObjectiveCompleted(quest:Quest, objectiveId:string):boolean {
        for(const obj of quest.objectives) {
            if(obj.id === objectiveId || obj.oldId === objectiveId) {
                const questState = PlayerProgressionUtils.getQuestState(quest.id);
                if(questState && questState.objectivesState) {
                    for(const objState of questState.objectivesState) {
                        if(objState.id === objectiveId) {
                            return objState.completed;
                        }
                    }
                } else {
                    console.log(`Could not find quest state for quest id: ${quest.id}`);
                }
            }
        }
        console.log(`Could not find the quest objective id: ${objectiveId} for quest id: ${quest.id}`);
        return false;
    }

    static isQuestObjectiveCompletedByIconId(quest:Quest, iconId:string) {
        const obj = QuestsUtils.getObjectiveFromIconId(quest.objectives, iconId);
        if(obj) {
            const questState = PlayerProgressionUtils.getQuestState(quest.id);
            if(questState && questState.objectivesState) {
                for(const objState of questState.objectivesState) {
                    if(objState.id === obj.id) {
                        return objState.completed;
                    }
                }
            } else {
                console.log(`Could not find quest state for quest id: ${quest.id}`);
            }
        }
        console.log(`Could not find objective for quest id: ${quest.id}`);
        return false;
    }

    static isQuestActive(questId:string):boolean {
        if(!this.progression) {
            return false;
        }
        const quest = this.progression.getQuestState(questId)
        if(quest) {
            return quest.active || quest.manuallyActivated
        } else {
            console.log(`Quest state not found for: ${questId}`);
            this.addNewQuest(questId);
            this.save();
        }
        return false;
    }

    static isQuestManuallyActivated(questId:string):boolean {
        if(!this.progression) {
            return false;
        }
        const quest = this.progression.getQuestState(questId)
        if(quest) {
            return quest.manuallyActivated
        } else {
            console.log(`Quest state not found for: ${questId}`);
            this.addNewQuest(questId);
            this.save();
        }
        return false;
    }

    static isQuestRequirementCompleted(questId:string, questRequirementId:string):boolean {
        const quest = QuestsUtils.getQuestFromID(questId);
        if(!quest) {
            return false
        }
        for(let requirement of quest.taskRequirements) {
            if(requirement.status && requirement.task && requirement.task.id === questRequirementId) {
                for(let status of requirement.status) {
                    // if(status === "active" && this.isQuestActive(questRequirementId)) {
                    //     return true;
                    // }
                    if(status === "complete" && this.isQuestCompleted(questRequirementId)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    static isQuestCompleted(questId:string):boolean {
        const questState = this.progression.getQuestState(questId)
        if(questState) {
            return questState.completed
        } else {
            console.log(`Quest state not found for: ${questId}`);
            this.addNewQuest(questId);
            this.save();
        }
        return false;
    }

    static isQuestFailed(questId:string):boolean {
        const questState = this.progression.getQuestState(questId)
        if(questState) {
            return questState.failed
        } else {
            console.log(`Quest state not found for: ${questId}`);
            this.addNewQuest(questId);
            this.save();
        }
        return true;
    }

    static isQuestTracked(questId:string):boolean {
        const questState = this.progression.getQuestState(questId)
        if(questState) {
            return !questState.noTracking
        } else {
            console.log(`Quest state not found for: ${questId}`);
            this.addNewQuest(questId);
            this.save();
        }
        return true;
    }

    private static addNewQuest(questId:string, active?:boolean, completed?:boolean):void {
        this.playerProgression.pve.addNewQuest(questId, active, completed);
        this.playerProgression.pvp.addNewQuest(questId, active, completed);
        const quest = QuestsUtils.getQuestFromID(questId);
        if(quest) {
            if(quest.objectives && quest.objectives.length > 0) {
                this.resolveQuestObjectives(quest, this.playerProgression.pvp);
                this.resolveQuestObjectives(quest, this.playerProgression.pve);
            }
        } else {
            console.log(`Quest not found for: ${questId}`);
        }
    }

    private static addNewHideout(stationId:string, active?:boolean, completed?:boolean):void {
        this.playerProgression.pve.addNewHideoutStation(stationId, active, completed);
        this.playerProgression.pvp.addNewHideoutStation(stationId, active, completed);
    }

    private static addNewItem(itemId:string):void {
        console.log("Adding new Item");
        this.playerProgression.pve.addNewItemState(itemId);
        this.resolveNewItem(itemId, this.playerProgression.pve);
        this.playerProgression.pvp.addNewItemState(itemId);
        this.resolveNewItem(itemId, this.playerProgression.pvp);
    }

    static resolveQuest(quest:Quest, storedData:QuestsObject) {
        this.resolveQuestId(quest, this.playerProgression.pvp);
        this.resolveQuestId(quest, this.playerProgression.pve);

        this.resolveNewQuests(quest, storedData, this.playerProgression.pvp);
        this.resolveNewQuests(quest, storedData, this.playerProgression.pve);

        if(quest.objectives && quest.objectives.length > 0) {
            this.resolveQuestObjectives(quest, this.playerProgression.pvp);
            this.resolveQuestObjectives(quest, this.playerProgression.pve);
        }
        this.save();
    }

    private static resolveNewQuests(quest:Quest, storedData:QuestsObject, progression:IProgression) {
        const questState = progression.getQuestState(quest.id);
        if(!questState && storedData) {
            let storedQuest = storedData.tasks.find(storedQuest => storedQuest.id === quest.id)
            let isActive:boolean = false;
            let isCompleded:boolean = false;
            if(storedQuest) {
                isActive = storedQuest.active ?? false;
                isCompleded = storedQuest.completed ?? false;
            }
            PlayerProgressionUtils.setActiveQuestState(quest.id, isActive)
            PlayerProgressionUtils.setCompletedQuestState(quest.id, isCompleded)
        }
        if(!storedData && Progression.startingQuests.includes(quest.id) && !questState) {
            PlayerProgressionUtils.setActiveQuestState(quest.id, true);
        }
    }

    private static resolveQuestId(quest:Quest, progression:IProgression) {
        if(quest.oldQuestId) {
            let state = progression.getQuestState(quest.oldQuestId)
            if(state) {
                state.oldQuestId = state.questId;
                state.questId = quest.id;
            }
        }
    }

    private static resolveQuestObjectives(quest:Quest, progression:IProgression) {

        let questState = progression.getQuestState(quest.id);

        if(!questState) {
            console.log(`Quest state was not found but should have for quest id: {}`, quest.id);
            return;
        }
        if(!questState.objectivesState) {
            questState.objectivesState = []
        }
        if(questState.objectivesState.length === 0) {
            quest.objectives.forEach(obj => {
                questState.objectivesState.push(new ObjectiveState(obj.id, questState.completed))
            })

        } else {
            quest.objectives.forEach(obj => {
                // Resolve the id if it was changed
                questState.objectivesState.forEach(state => {
                    if(obj.oldId && state.id === obj.oldId) {
                        state.id = obj.id
                    }
                    // Change the state of the objective to completed if the quest is completed
                    if(!state.completed && quest.completed) {
                        state.completed = quest.completed
                    }
                })
                // Add new states if new objectives were added to the quest
                let exists = false;
                for(let state of questState.objectivesState) {
                    if(state.id === obj.id) {
                        exists = true;
                    }
                }
                if(!exists) {
                    questState.objectivesState.push(new ObjectiveState(obj.id, questState.completed))
                }
            })

        }
    }

    static resolveAllHideoutStations(stations:HideoutStations[]) {
        stations.forEach(station => {
            PlayerProgressionUtils.resolveHideoutStation(station)
        })
        stations.forEach(station => {
            PlayerProgressionUtils.resolveHideoutStationState(station);
        })
    }

    private static resolveHideoutStation(station:HideoutStations) {
        this.resolveHideoutStationId(station, this.playerProgression.pvp);
        this.resolveHideoutStationId(station, this.playerProgression.pve);

        this.resolveNewHideoutStation(station, this.playerProgression.pvp);
        this.resolveNewHideoutStation(station, this.playerProgression.pve);

        if(station.levels && station.levels.length > 0) {
            this.resolveHideoutStationLevels(station, this.playerProgression.pvp);
            this.resolveHideoutStationLevels(station, this.playerProgression.pve);
        }

        this.save();
    }

    static resolveHideoutStates(hideoutStations:HideoutStations[]) {
        hideoutStations.forEach(station => {
            if(HideoutUtils.areStationRequirementsCompleted(station)) {
                const state = this.getHideoutStationState(station.id);
                if(state && !state.completed) {
                    state.active = true;
                    const level1 = HideoutUtils.getStationLevelWithNumber(station.id, 1);
                    if(level1) {
                        const level1State = this.getStationLevelState(station.id, level1.id)
                        if(!level1State.completed) {
                            level1State.active = true;
                        }
                    }
                }
            }
            // Set previous hideout levels completed
            let setCompleted = false;
            for(let i = station.levels.length - 1; i >= 0; i--) {
                const levelState = this.getStationLevelState(station.id, station.levels[i].id);
                if(levelState && !levelState.completed && setCompleted) {
                    levelState.active = false;
                    levelState.completed = true;
                    HideoutUtils.giveItems(station.levels[i])
                } else if(levelState && levelState.completed) {
                    setCompleted = true;
                }
            }
        })
    }

    private static resolveHideoutStationState(station:HideoutStations) {
        const state = this.getHideoutStationState(station.id);
        if(station.id === "637b39f02e873739ec490215"){
            console.log("Defective wall");
        }
        if(HideoutUtils.areStationRequirementsCompleted(station) && !state.completed) {
            if(state.stationLevelState) {
                let i = 1;
                for(const levelState of state.stationLevelState) {
                    const level = HideoutUtils.getStationLevelWithNumber(station.id, i);
                    if(level) {
                        // Override the levelState variable to make sure you are using the state with the right level number
                        const levelState = this.getStationLevelState(station.id, level.id);
                        if(!levelState) {
                            console.log(`Could not find level state for station id: ${station.id} with level id: ${level.id}`);
                            continue;
                        }
                        // Resolve everything besides level 1
                        if(level.level !== 1) {
                            // If the station level is completed, just make it inactive
                            if(levelState.completed) {
                                levelState.active = false;
                                continue;
                            }
                            
                            // If the previous state is completed, set it to active and not completed
                            // If the next level is completed, it will get overriden by the next block
                            // If there is no next level, it stays like this
                            const previousLevel = HideoutUtils.getPreviousStationLevel(station.id, level.id);
                            if(previousLevel) {
                                const previousLevelState = this.getStationLevelState(station.id, previousLevel.id);
                                if(previousLevelState && previousLevelState.completed) {
                                    levelState.active = true;
                                    levelState.completed = false;
                                    previousLevelState.active = false;
                                }
                            }

                            // If the next level is active or completed, set the current level to completed and inactive
                            // Otherwise, set the current level to not completed and active
                            const nextLevel = HideoutUtils.getNextStationLevel(station.id, level.id);
                            if(nextLevel) {
                                const nextLevelState = this.getStationLevelState(station.id, nextLevel.id);
                                if(nextLevelState && (nextLevelState.active || nextLevelState.completed)) {
                                    levelState.active = false;
                                    levelState.completed = true;
                                }
                            }
                        }
                        // Resolve Level 1 if not completed yet
                        if(level.level === 1 && !levelState.completed) {
                            if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
                                if(!level.itemPveRequirements || level.itemPveRequirements.length === 0) {
                                    levelState.active = false;
                                    levelState.completed = true;
                                }
                            } else {
                                if(!level.itemRequirements || level.itemRequirements.length === 0) {
                                    levelState.active = false;
                                    levelState.completed = true;
                                }
                            }
                            const nextLevel = HideoutUtils.getNextStationLevel(station.id, level.id);
                            if(nextLevel) {
                                const nextLevelState = this.getStationLevelState(station.id, nextLevel.id);
                                if(nextLevelState && (nextLevelState.active || nextLevelState.completed)) {
                                    levelState.active = false;
                                    levelState.completed = true;
                                } else if(!levelState.completed) {
                                    levelState.active = true;
                                    levelState.completed = false;
                                }
                            }
                        }
                    }
                    i++;
                }
            }
            state.active = true;
        } else if(!state.completed) {
            state.active = false;
            if(state.stationLevelState) {
                state.stationLevelState.forEach(levelState => {
                    levelState.active = false;
                })
            }
        }
    }

    private static resolveHideoutStationId(station:HideoutStations, progression:IProgression) {
        if(station.oldId) {
            let state = progression.getHideoutState(station.oldId)
            if(state) {
                state.oldStationId = state.stationId;
                state.stationId = station.id;
            }
        }
    }

    private static resolveNewHideoutStation(station:HideoutStations, progression:IProgression) {
        if(!progression.getHideoutState(station.id)) {
            progression.addNewHideoutStation(station.id, false, false);
            if(station.levels.length === 1 
                && station.levels[0].itemRequirements.length === 0
                && station.levels[0].stationLevelRequirements.length === 0) {
                progression.getHideoutState(station.id).completed = true;
            }
        }
    }

    private static resolveHideoutStationLevels(station:HideoutStations, progression:IProgression) {
        let stationState = progression.getHideoutState(station.id);

        if(!stationState) {
            console.log(`Hideout state was not found but should have for station id: {}`, station.id);
            return;
        }
        if(!stationState.stationLevelState) {
            stationState.stationLevelState = []
        }
        if(stationState.stationLevelState.length === 0) {
            station.levels.forEach(level => {
                stationState.stationLevelState.push(new StationLevelState(level.id, stationState.completed ? false : true, stationState.completed))
            })
        } else {
            station.levels.forEach(level => {
                // Resolve the id if it was changed
                stationState.stationLevelState.forEach(state => {
                    if(level.oldId && state.id === level.oldId) {
                        state.id = level.id
                    }
                    // Change the state of the objective to completed if the station is completed
                    if(!state.completed && stationState.completed) {
                        state.completed = stationState.completed
                    }
                })
                // Add new states if new station levels were added to the Hideout station
                let exists = false;
                for(let state of stationState.stationLevelState) {
                    if(state.id === level.id) {
                        exists = true;
                    }
                }
                if(!exists) {
                    const previousLevel = HideoutUtils.getPreviousStationLevel(station.id, level.id);
                    const nextLevel = HideoutUtils.getNextStationLevel(station.id, level.id);

                    if(!nextLevel && !previousLevel) {
                        if(stationState.completed) {
                            stationState.stationLevelState.push(new StationLevelState(level.id, false, true))
                        } else {
                            stationState.stationLevelState.push(new StationLevelState(level.id, true, false))
                        }
                    } else if(previousLevel && !nextLevel) {
                        const previousLevelState = this.getHideoutLevelState(stationState, previousLevel.id);
                        if(previousLevelState && previousLevelState.completed && !stationState.completed) {
                            stationState.stationLevelState.push(new StationLevelState(level.id, true, false))
                        } else if(previousLevelState && previousLevelState.active && !previousLevelState.completed) {
                            stationState.stationLevelState.push(new StationLevelState(level.id, false, false))
                        } else {
                            stationState.stationLevelState.push(new StationLevelState(level.id, true, false))
                        }
                    }

                    if(!previousLevel && nextLevel) {
                        const nextLevelState = this.getHideoutLevelState(stationState, nextLevel.id);
                        if(nextLevel && (nextLevelState.active || nextLevelState.completed)) {
                            stationState.stationLevelState.push(new StationLevelState(level.id, false, true))
                        } else if(nextLevelState && !nextLevelState.completed && !stationState.completed) {
                            stationState.stationLevelState.push(new StationLevelState(level.id, true, stationState.completed))
                        } else {
                            stationState.stationLevelState.push(new StationLevelState(level.id, level.level === 1, stationState.completed))
                        }
                    }

                    if(previousLevel && nextLevel) {
                        const previousLevelState = this.getHideoutLevelState(stationState, previousLevel.id);
                        const nextLevelState = this.getHideoutLevelState(stationState, nextLevel.id);

                        if(previousLevelState && nextLevelState) {
                            if(previousLevelState.completed && !nextLevelState.active && !nextLevelState.completed && !stationState.completed) {
                                stationState.stationLevelState.push(new StationLevelState(level.id, true, false))
                            } else {
                                stationState.stationLevelState.push(new StationLevelState(level.id, false, true))
                            }
                        } else {
                            if(stationState.completed) {
                                stationState.stationLevelState.push(new StationLevelState(level.id, false, true))
                            } else {
                                stationState.stationLevelState.push(new StationLevelState(level.id, true, false))
                            }
                        }
                    }
                }
            })

        }
    }

    private static getHideoutLevelState(stationState: HideoutState, levelId:string):StationLevelState {
        for(const levelState of stationState.stationLevelState) {
            if(levelState.id === levelId) {
                return levelState;
            }
        }
        console.log(`Could not find station level state for level id: ${levelId} for station id: ${stationState.stationId}`);
        return null;
        
    }

    private static resolveItems(progression:IProgression, progressionType?:string) {
        const map = ItemsUtils.getMapOfAllItemsWithOverallAmount(progressionType)
        map.forEach((requiredAmount, itemId) => {
            let itemState = progression.getItemState(itemId);
            if(itemState) {
                let delta = 0;
                if(itemState.overallQuantity != requiredAmount) {
                    delta = requiredAmount - itemState.overallQuantity
                }
                itemState.overallQuantity += delta
                // itemState.requiredQuantity += delta;
            } else {
                console.log(`Item state not found, adding it: ${itemId}`);
                progression.addNewItemState(itemId, requiredAmount);             
                console.log("Resolving items");
                this.resolveNewItem(itemId, progression);
            }
        })
    }

    private static removeAllNoTrackingQuestItems(progression:IProgression) {
        QuestsUtils.getData().tasks.forEach(quest => {
            const questState = this.getQuestState(quest.id, progression);
            if(questState && questState.noTracking) {
                quest.objectives.forEach(objective => {
                    if((objective.type === ObjectiveTypeConst.GIVE_ITEM.type || objective.type === ObjectiveTypeConst.FIND_ITEM.type) && objective.item) {
                        const itemState = this.getItemState(objective.item.id, progression);
                        if(itemState) {
                            // itemState.overallQuantity -= objective.count;
                            itemState.requiredQuantity -= objective.count;
                        }
                    }
                })
            }
        })
    }

    private static resolveRequiredItems(progression:IProgression) {
        const map = ItemsUtils.getMapOfAllItemsWithRequiredAmount(progression);
        map.forEach((requiredAmount, itemId) => {
            let itemState = progression.getItemState(itemId);
            if(itemState) {
                itemState.requiredQuantity = requiredAmount;
            }
        })
    }

    private static resolveNewItem(itemId:string, progression:IProgression) {
        QuestsUtils.getData().tasks.forEach(quest => {
            if(quest.objectives){
                quest.objectives.forEach(obj => {
                    if((obj.type === ObjectiveTypeConst.GIVE_ITEM.type || obj.type === ObjectiveTypeConst.FIND_ITEM.type) && obj.item && obj.item.id === itemId) {
                        const objState = this.getObjectiveState(quest.id, obj.id, progression);
                        if(objState && objState.completed) {
                            console.log(`Giving item: ${obj.count} with id ${itemId}`);
                            ItemUtils.giveItem(itemId, obj.count, progression, true);
                        } else {
                            console.log(`Objective state not found for id: ${obj.id}`);
                        }
                    }
                })
            }
        })
        HideoutUtils.getData().hideoutStations.forEach(hideoutStation => {
            if(hideoutStation.levels) {
                hideoutStation.levels.forEach(hideoutLevel => {
                    if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
                        if(hideoutLevel.itemPveRequirements && hideoutLevel.itemPveRequirements.length > 0) {
                            hideoutLevel.itemPveRequirements.forEach(itemRequirement => {
                                if(itemRequirement.item && itemRequirement.item.id === itemId) {
                                    const hideoutLevelState = this.getStationLevelState(hideoutStation.id, hideoutLevel.id, progression); 
                                    if(hideoutLevelState && hideoutLevelState.completed) {
                                        console.log(`Giving item: ${itemRequirement.quantity} with id ${itemRequirement.item.id} `);
                                        ItemUtils.giveItem(itemId, itemRequirement.quantity, progression, true);
                                    } else {
                                        console.log(`Hideout Level state not found for id: ${hideoutLevel.id}`);
                                    }
                                }
                            })
                        }
                    } else {
                        if(hideoutLevel.itemRequirements && hideoutLevel.itemRequirements.length > 0) {
                            hideoutLevel.itemRequirements.forEach(itemRequirement => {
                                if(itemRequirement.item && itemRequirement.item.id === itemId) {
                                    const hideoutLevelState = this.getStationLevelState(hideoutStation.id, hideoutLevel.id, progression); 
                                    if(hideoutLevelState && hideoutLevelState.completed) {
                                        console.log(`Giving item: ${itemRequirement.quantity} with id ${itemRequirement.item.id} `);
                                        ItemUtils.giveItem(itemId, itemRequirement.quantity, progression, true);
                                    } else {
                                        console.log(`Hideout Level state not found for id: ${hideoutLevel.id}`);
                                    }
                                }
                            })
                        }
                    }
                })
            }
        })
    }

    private itemExist(itemId:string, progression:Progression):boolean {
        for(const itemState of progression.getItemStates()) {
            if(itemState.itemId === itemId) {
                return true;
            }
        }
        return false;
    }

    static completeQuestsAutomatically() {
        const taskList:Quest[] = QuestsUtils.getData().tasks;
        for(let i = taskList.length - 1; i >= 0; i--) {
            const quest:Quest = taskList[i];
            const state = this.progression.getQuestState(taskList[i].id);
            if(state && (state.active || state.completed)) {
                this.completeRequirement(quest);
            }
        }
        this.save();
    }

    private static completeRequirement(quest:Quest) {
        if(quest.taskRequirements) {
            quest.taskRequirements.forEach(requirement => {
                if(requirement.task && requirement.task.id) {
                    const requirementState = this.progression.getQuestState(requirement.task.id);
                    if(requirementState) {
                        //Change it all to completed
                        requirementState.active = false;
                        requirementState.completed = true;
                        requirementState.objectivesState.forEach(obj => {
                            obj.completed = true;
                        })
                        // Continue completing the requirement for the quests
                        this.completeRequirement(QuestsUtils.getQuestFromID(requirement.task.id));
                    }
                }
            })
        }
    }
}