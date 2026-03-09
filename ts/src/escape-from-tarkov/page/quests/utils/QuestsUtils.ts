import { ObjectiveTypeConst, QuestConditionConst } from "../../../constant/EditQuestConst";
import { Objectives, Quest, QuestsObject, TaskObject } from "../../../../model/quest/IQuestsElements";
import { StorageHelper } from "../../../service/helper/StorageHelper";
import { AppConfigUtils } from "../../../utils/AppConfigUtils";
import { OverwolfStatusUtils } from "../../../utils/OverwolfStatusUtils";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { EditSession } from "../edit/EditSession";
import { QuestPageUtils } from "./QuestPageUtils";
import { QuestsFiltersUtils } from "./QuestsFiltersUtils";
import { QuestType } from "../../../constant/QuestConst";

export class QuestsUtils {
    private static isManualOnlyQuest(quest: Quest | null | undefined): boolean {
        return quest?.questType === QuestType.STANDARD;
    }


    private static questsObject:QuestsObject;
    private static localStorageKey = "QuestsObjects"

    static setQuestsObject(questsObject:QuestsObject) {
        if(!this.questsObject) {
            this.questsObject = questsObject
        }
    }

    static getData():QuestsObject {
        return this.questsObject
    }

    static exists():boolean {
        if(this.questsObject) {
            return true;
        }
        return false;
    }

    static getStoredData():string {
        return StorageHelper.getStoredData(this.localStorageKey)
    }

    static save(quests:QuestsObject) {
        StorageHelper.save(this.localStorageKey, quests)
    }

    static getQuestsObject(): QuestsObject {
        return this.questsObject
    }

    static refreshLevel() {
        const level = document.getElementById("player-level-text");
        if(level) {
            level.textContent = PlayerProgressionUtils.getPlayerLevel().toString()
        } else {
            console.log(`Could not get the player level from DOM`);
        }
    }
    
    static setActiveQuest(id: string, isActive: boolean, forceUpdate?:boolean) {
        for(const quest of this.questsObject.tasks) {
            if(quest.id.toString() == id) {
                PlayerProgressionUtils.setActiveQuestState(quest.id, isActive, null, false, forceUpdate)
                if(!isActive || OverwolfStatusUtils.isQuestAutomationEnabled()) {
                    PlayerProgressionUtils.setManuallyActiveQuestState(quest.id, isActive)
                }
                QuestPageUtils.resolveQuestGlow(quest)
                QuestPageUtils.resolveActiveButtonText(quest);
                if(isActive && !OverwolfStatusUtils.isQuestAutomationEnabled()) {
                    this.resolveQuestsOnAccepting(id)
                }
                // QuestsUtils.dispatchQuestProgressEvent("active", quest.id);
                return;
            }
        }
    }

    static setFailedQuest(id: string, failed: boolean) {
        for(const quest of this.questsObject.tasks) {
            if(quest.id.toString() == id) {
                PlayerProgressionUtils.setFailedQuestState(quest.id, failed);
                
                QuestPageUtils.resolveQuestGlow(quest);
                // QuestsUtils.dispatchQuestProgressEvent("failed", quest.id);
                return;
            }
        }
    }

    static setTrackingQuest(id: string, isTracked: boolean) {
        for(const quest of this.questsObject.tasks) {
            if(quest.id.toString() == id) {
                PlayerProgressionUtils.setTrackingQuestState(quest.id, isTracked)
                QuestPageUtils.resolveQuestGlow(quest);
                QuestPageUtils.resolveQuestActiveButton(quest.id);
                // QuestsUtils.dispatchQuestProgressEvent("tracked", quest.id);
                return;
            }
        }
    }

    static getActiveQuests(): Array<Quest> {
        let activeQuests: Array<Quest> = [];
        if(!this.questsObject || !this.questsObject.tasks) {
            return activeQuests;
        }
        this.questsObject.tasks.forEach(quest => {
            if(PlayerProgressionUtils.isQuestActive(quest.id)
                && QuestsFiltersUtils.questAllowed(quest) 
                && (PlayerProgressionUtils.isQuestTracked(quest.id) || PlayerProgressionUtils.isQuestManuallyActivated(quest.id))) {
                activeQuests.push(quest)
            }
        })
        return activeQuests
    }

    static setCompletedQuestState(id: string, isCompleted: boolean) {
        for(const quest of this.questsObject.tasks) {
            if(quest.id.toString() == id) {
                PlayerProgressionUtils.setCompletedQuestState(quest.id, isCompleted)
                PlayerProgressionUtils.setActiveQuestState(quest.id, !isCompleted)
                if(isCompleted) {
                    QuestsUtils.setNextQuestsActive(quest.id)
                }
                return;
            }
        }
    }

    static setQuestObjectiveCompleted(id: string, objectiveId: string, isCompleted: boolean) {
        for(const quest of this.questsObject.tasks) {
            if(quest.id.toString() == id) {
                PlayerProgressionUtils.setQuestObjectiveCompletedState(quest, objectiveId, isCompleted)
                // QuestsUtils.dispatchQuestProgressEvent("objective-completed", quest.id, objectiveId);
                return;
            }
        }
    }

    static setQuestObjectiveCompletedStateFromIconId(id: string, iconId: string, isCompleted: boolean) {
        for(const quest of this.questsObject.tasks) {
            if(quest.id.toString() == id) {
                const objId = PlayerProgressionUtils.setQuestObjectiveCompletedStateFromIconId(quest, iconId, isCompleted)
                // QuestsUtils.dispatchQuestProgressEvent("objective-completed", quest.id, objId);
                return;
            }
        }
    }

    // private static dispatchQuestProgressEvent(type: string, questId: string, objectiveId?: string) {
    //     if(typeof window === "undefined") return;
    //     window.dispatchEvent(new CustomEvent("quest-progress-updated", {
    //         detail: { type, questId, objectiveId }
    //     }));
    // }

    static setLevelUpReminder() {
        if(!AppConfigUtils.getAppConfig().userSettings.getLevelReminderFlag()) {
            const text = document.getElementById("player-level-text")
            const arrowUp = document.getElementById("level-up-arrow")
            if(text && arrowUp) {
                text.classList.add("level-up-animation")
                arrowUp.classList.add("level-up-animation");
            } 
        }
    }

    static refreshActiveQuests() {
        if(!this.questsObject?.tasks) {
            return;
        }
        this.questsObject.tasks.forEach(quest => {
            const questState = PlayerProgressionUtils.getQuestState(quest.id)
            if(questState.completed || questState.active) {
                return;
            }
            if(this.isQuestRequirementsCompleted(quest) 
                && !AppConfigUtils.getAppConfig().userSettings.getQuestAutomationFlag()) {
                if (this.isManualOnlyQuest(quest)) {
                    return;
                }
                PlayerProgressionUtils.setActiveQuestState(quest.id, true);
            }
        })
        // this.save(this.questsObject)
    }

    static isQuestFailable(questId:string) {
        for(const quest of this.questsObject.tasks) {
            for(const requirement of quest.taskRequirements) {
                if(requirement.task.id === questId && requirement.status.includes(QuestConditionConst.FAILED.name)) {
                    return true;
                }
            }
        }
        return false;
    }

    static isQuestRequirementsCompleted(quest:Quest):boolean {
        if(!AppConfigUtils.getAppConfig().userSettings.isLevelRequired() 
                || (quest.minPlayerLevel !== 0 && quest.minPlayerLevel <= PlayerProgressionUtils.getPlayerLevel())) {
            let requirementsCompleted = true;
            quest.taskRequirements.forEach(requirement => {
                if(!PlayerProgressionUtils.isQuestCompleted(requirement.task.id)) {
                    requirementsCompleted = false;
                }
            })
            return requirementsCompleted;
        }
    }

    static setNextQuestsActive(completedQuestId:string):Map<string, boolean> {
        let questToUpdate:Map<string, boolean> = new Map<string, boolean>()
        this.getQuestUnlocksFromId(completedQuestId).forEach(quest => {
            let nextQuest:Quest = this.getQuestFromID(quest.id);
            
            if(PlayerProgressionUtils.isQuestCompleted(nextQuest.id)) {
                return;
            }
            if(!PlayerProgressionUtils.isQuestTracked(nextQuest.id)) {
                return;
            }
            if(PlayerProgressionUtils.isQuestFailed(nextQuest.id)) {
                return;
            }
            if(!QuestsFiltersUtils.questAllowed(quest)) {
                return;
            }
            if(AppConfigUtils.getAppConfig().userSettings.isLevelRequired() 
                    && nextQuest.minPlayerLevel > PlayerProgressionUtils.getPlayerLevel()) {
                return;
            }
            let requirementsCompleted = true;
            nextQuest.taskRequirements.forEach(requirement => {
                if(!this.areRequirementsCompleted(requirement)) {
                    requirementsCompleted = false;
                    
                }
            })
            if(requirementsCompleted) {
                if (this.isManualOnlyQuest(nextQuest)) {
                    return;
                }
                PlayerProgressionUtils.setActiveQuestState(nextQuest.id, true);
                questToUpdate.set(nextQuest.id, true);
                this.resolveQuestsOnAccepting(nextQuest.id, questToUpdate);
            }
        })
        return questToUpdate
    }

    static disableNonKappaQuests() {
        this.questsObject.tasks.forEach(quest => {
            if(!quest.kappaRequired) {
                PlayerProgressionUtils.setTrackingQuestState(quest.id, false);
            }
        })
    }

    static enableNonKappaQuests() {
        this.questsObject.tasks.forEach(quest => {
            if(!quest.kappaRequired) {
                PlayerProgressionUtils.setTrackingQuestState(quest.id, true);
            }
        })
    }

    private static areRequirementsCompleted(taskRequirement:TaskObject):boolean {

        for(const requirementStatus of taskRequirement.status) {
            // If one condition below is true, we accept the requirement as completed
            // since you can have quest that requires one of the conditions (accept, complete or fail)
            let state = false;
            if(requirementStatus === QuestConditionConst.COMPLETE.name) {
                state = PlayerProgressionUtils.isQuestCompleted(taskRequirement.task.id);
                if(state) { return true; }
            }
            if(requirementStatus === QuestConditionConst.ACTIVE.name) {
                state = PlayerProgressionUtils.isQuestActive(taskRequirement.task.id);
                if(state) { return true; }
            }
            if(requirementStatus === QuestConditionConst.FAILED.name) {
                state = PlayerProgressionUtils.isQuestFailed(taskRequirement.task.id);
                if(state) { return true; }
            }
        }
    }

    private static resolveAcceptedQuest(acceptedQuestId:string) {
        this.questsObject.tasks.forEach(quest => {
            quest.taskRequirements.forEach(taskRequirement => {
                if(taskRequirement.task.id === acceptedQuestId && taskRequirement.status && taskRequirement.status.includes("active")) {
                    if(!PlayerProgressionUtils.isQuestCompleted(quest.id)) {
                        if (this.isManualOnlyQuest(quest)) {
                            return;
                        }
                        PlayerProgressionUtils.setActiveQuestState(quest.id, true);
                    }
                }
            })
        });
    }
    
    static resolveQuestsOnAccepting(acceptedQuestId:string, questToUpdate?:Map<string, boolean>) {
        this.questsObject.tasks.forEach(quest => {
            if(quest.taskRequirements) {
                quest.taskRequirements.forEach(questRequirement => {
                    if(questRequirement.status.includes("active") && questRequirement.task.id === acceptedQuestId && !PlayerProgressionUtils.isQuestCompleted(quest.id)) {
                        if (this.isManualOnlyQuest(quest)) {
                            return;
                        }
                        PlayerProgressionUtils.setActiveQuestState(quest.id, true);
                        QuestPageUtils.resolveQuestActiveButton(quest.id);
                        QuestPageUtils.resolveQuestGlow(quest);
                        if(questToUpdate) {
                            questToUpdate.set(quest.id, true);                  
                        }
                    }
                })
            }
        })
    }

    // static getQuestFromName(name: string): Quest {
    //     for(const element of this.questsObject.tasks) {
    //         if(element.name.toString() == name) {
    //             return element
    //         }
    //     }
    //     return null;
    // }

    static getQuestFromID(id: string): Quest {
        if(!this.questsObject?.tasks) {
            return null;
        }
        for(const element of this.questsObject.tasks) {
            if(element.id === id || element.oldQuestId === id) {
                return element
            }
        }
        if(EditSession.isSessionOpen()) {
            for(const questEdit of EditSession.getEditedQuests()) {
                if(questEdit.isNewQuest() && questEdit.getQuestId() === id) {
                    return questEdit.quest;
                }
            }
        }
        return null;
    }

    static getObjectiveId(objectiveId:string):Objectives {
        for(const quest of this.questsObject.tasks) {
            for(const obj of quest.objectives) {
                if(obj.id === objectiveId || obj.oldId === objectiveId) {
                    return obj;
                }
            }
        }
        return null
    }

    static getQuestFromObjectiveId(objectiveId:string):Quest {
        for(const quest of this.questsObject.tasks) {
            for(const obj of quest.objectives) {
                if(obj.id === objectiveId || obj.oldId === objectiveId) {
                    return quest;
                }
            }
        }
        return null
    }

    static getQuestUnlocksFromId(id:string): Quest[] {
        let list:Quest[] = []
        const completedQuest = this.getQuestFromID(id)
        this.questsObject.tasks.forEach(quest => {
            quest.taskRequirements.forEach(requirement => {
                if(requirement.task && (requirement.task.id == completedQuest.id || requirement.task.id == completedQuest.oldQuestId)) {
                    list.push(quest);
                }
            })
        });
        return list;
    }

    static getObjectiveFromId(quest:Quest, objectiveId:string) {
        for(const obj of quest.objectives) {
            if(obj.id === objectiveId || obj.oldId === objectiveId) {
                return obj
            }
        }
        return null;
    }

    static getObjectiveFromIconId(objectives:Objectives[], iconId:string):Objectives {
        for(const obj of objectives) {
            if(obj.questImages && obj.questImages.length > 0) {
                for(const questImage of obj.questImages) {
                    if(questImage.id === iconId) {
                        return obj;
                    }
                }
            }
        }
        return null;
    }

    static getQuestsTitleMap(): Map<string, string> {
        let map:Map<string, string> = new Map<string, string>();
        this.questsObject.tasks.forEach(quest => {
            map.set(quest.id, quest.name);
        })
        return map;
    }

    static isMarkingPartOfObjective(obj:Objectives):boolean {
        return obj.__typename === "TaskObjectiveMark"
    }

    static isPlantingPartOfObjective(obj:Objectives):boolean {
        return obj.type === "plantItem"
    }

    static isTaskObjectiveQuestItem(obj:Objectives):boolean {
        return obj.__typename === "TaskObjectiveQuestItem"
    }

    static getActiveQuestsForMap(mapId:string) {
        let activeQuests:Quest[] = []
        this.getActiveQuests().forEach(quest => {
            if(QuestsFiltersUtils.questAllowed(quest)) {
                for(let i = 0; i < quest.objectives.length; i++) {
                    for(let j = 0; j < quest.objectives[i].maps.length; j ++) {
                        if(quest.objectives[i].maps[j].name 
                                && quest.objectives[i].maps[j].id === mapId) {
                            const objectiveState = PlayerProgressionUtils.getObjectiveState(quest.id, quest.objectives[i].id);
                            if(!activeQuests.includes(quest) && !objectiveState?.completed) {
                                activeQuests.push(quest)
                            }
                            break;
                        }
                    }
                }
            }
        })
        return activeQuests
    }

    static getRequiredItemsForQuest(quest:Quest):string[] {
        let list:string[] = []
        quest.objectives.forEach(obj => {
            if(obj.type && obj.item && obj.item.id && (obj.type === ObjectiveTypeConst.GIVE_ITEM.type || obj.type === ObjectiveTypeConst.FIND_ITEM.type)) {
                list.push(obj.item.id);
            }
        })
        return list;
    }

    static getRequiredItemsAmountForQuest(quest:Quest):Map<string, number> {
        let map:Map<string, number> = new Map();
        quest.objectives.forEach(obj => {
            if(obj.type && obj.item && obj.item.id && (obj.type === ObjectiveTypeConst.GIVE_ITEM.type || obj.type === ObjectiveTypeConst.FIND_ITEM.type)) {
                map.set(obj.item.id, obj.count);
            }
        })
        return map;
    }

    static isObjectiveInMap(objective:Objectives, mapId:string) {
        let isInMap = false;
        objective.maps.forEach(map => {
            if(map.id === mapId) {
                isInMap = true;
            }
        })
        return isInMap;
    }

    static normalizeQuestGoalText(text:string, objective:Objectives):string {
        let normalizedText:string = text;

        if(text.includes("Find the")) { normalizedText =  text }
        else if(text.includes("Find any")) { normalizedText = "Find " + ((objective.count !== undefined && objective.count !== 0) ? objective.count : "") + text.replace("Find any", "") }
        else if(text.includes("Find")) { normalizedText = "Find " + ((objective.count !== undefined && objective.count !== 0) ? objective.count : "") + text.replace("Find", "") }
        else if(text.includes("Eliminate")) { normalizedText = "Eliminate " + objective.count + text.replace("Eliminate", "") }
        else if(text.includes("Reach the required")) { normalizedText = "Reach " + text.replace("Reach the required", "") + " " + objective.skillLevel.level }
        else if(text.includes("Hand over the found in raid") && objective.count > 1) {normalizedText = "Hand over the "+ objective.count + text.replace("Hand over the ", " ") }
        else if(text.includes("Hand over USD") || text.includes("Hand over RUB") || text.includes("Hand over EUR")) { 
            normalizedText = "Hand over " + (objective.count !== undefined ? objective.count : "") + text.replace("Hand over", "") 
        } else { normalizedText = text }
        if(objective.targetNames !== undefined && objective.targetNames.length !== 0 
            && objective.targetNames.includes("any target")) {
            normalizedText += " " + objective.count + " times";
        }
        return objective.optional ? "(Optional) " + normalizedText : normalizedText;
    }
}