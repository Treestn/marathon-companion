import { progressionTypes } from "../../consts";
import { ObjectiveTypeConst } from "../constant/EditQuestConst";
import { IProgression, ObjectiveState, StationLevelState } from "../../model/IPlayerProgression";
import { HideoutUtils } from "../page/hideout/utils/HideoutUtils";
import { QuestsFiltersUtils } from "../page/quests/utils/QuestsFiltersUtils";
import { QuestsUtils } from "../page/quests/utils/QuestsUtils";
import { AppConfigUtils } from "./AppConfigUtils";
import { PlayerProgressionUtils } from "./PlayerProgressionUtils";
import { Quest } from "../model/IQuestsElements";
import { HideoutLevels, HideoutStations } from "../../model/hideout/HideoutObject";

export class ItemsUtils {

    static getMapOfAllItemsWithRequiredAmount(progression?:IProgression):Map<string, number> {
        const map:Map<string, number> = new Map<string, number>()

        this.getQuestRequiredAmount(progression).forEach((count, itemId) => {
            let amount = count;
            if(map.has(itemId)) {
                amount += map.get(itemId);
            }
            map.set(itemId, amount);
        })

        this.getHideoutRequiredAmount(progression).forEach((count, itemId) => {
            let amount = count;
            if(map.has(itemId)) {
                amount += map.get(itemId);
            }
            map.set(itemId, amount);
        })
        return map
    }

    static getAllActiveItems(removeMoney?:boolean):Map<string, string[]> {

        const questMap = this.getAllQuestItemsActive(removeMoney, false);
        const hideoutMap = this.getAllHideoutItemsActive(removeMoney);

        const tempMap:Map<string, string[]> = new Map(questMap);

        hideoutMap.forEach((idList, itemId) => {
            if(tempMap.has(itemId)) {
                const existingArray = tempMap.get(itemId) || [];
                tempMap.set(itemId, [...existingArray, ...idList]);
            } else {
                tempMap.set(itemId, idList);
            }
        })
        const finalMap:Map<string, string[]> = new Map();
        tempMap.forEach((list, itemId) => {
            const itemState = PlayerProgressionUtils.getItemState(itemId);
            if(itemState && itemState.currentQuantity < itemState.requiredQuantity) {
                finalMap.set(itemId, list)
            }
        })
        return finalMap;
    }

    private static moneyIdList:string[] = ["5696686a4bdc2da3298b456a", "569668774bdc2da2298b4568", "5449016a4bdc2d6f028b456f"]

    static getAllQuestItemsActive(removeMoney?:boolean, removeIfEnough?:boolean):Map<string, string[]> {
        const map:Map<string, string[]> = new Map<string, string[]>()

        const activeQuest:Quest[] = QuestsUtils.getActiveQuests();
        for(const quest of activeQuest) {
            if(quest.objectives) {
                quest.objectives.forEach(objective => {
                    const objectiveState = PlayerProgressionUtils.getObjectiveState(quest.id, objective.id);
                    if(objectiveState && !objectiveState.completed && objective.item 
                            && (objective.type === ObjectiveTypeConst.GIVE_ITEM.type || objective.type === ObjectiveTypeConst.FIND_ITEM.type) && objective.item.id) {
                        if(removeMoney && this.moneyIdList.includes(objective.item.id)) {
                             
                        } else {
                            if(removeIfEnough) {
                                const itemState = PlayerProgressionUtils.getItemState(objective.item.id)
                                if(itemState.currentQuantity >= objective.count) {
                                    return;
                                }
                            }
                            if(map.has(objective.item.id)) {
                                map.get(objective.item.id).push(quest.id);
                            } else {
                                map.set(objective.item.id, new Array(quest.id));
                            }
                        }
                    }
                })
            }
        }
        return map;
    }

    static getAllHideoutItemsActive(removeMoney?:boolean):Map<string, string[]> {
        const map:Map<string, string[]> = new Map<string, string[]>()

        const activeHideoutLevel:Map<HideoutStations, HideoutLevels[]> = HideoutUtils.getActiveStationsLevel();
        activeHideoutLevel.forEach((hideoutLevelList, station) => {
            hideoutLevelList.forEach(hideoutLevel => {
                if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
                    if(hideoutLevel.itemPveRequirements && hideoutLevel.itemPveRequirements.length > 0) {
                        hideoutLevel.itemPveRequirements.forEach(requirement => {
                            if(removeMoney && this.moneyIdList.includes(requirement.item.id)) {
                                
                            } else {
                                if(map.has(requirement.item.id)) {
                                    map.get(requirement.item.id).push(hideoutLevel.id);
                                } else {
                                    map.set(requirement.item.id, new Array(hideoutLevel.id));
                                }
                            }
                        })
                    }
                } else {
                    if(hideoutLevel.itemRequirements && hideoutLevel.itemRequirements.length > 0) {
                        hideoutLevel.itemRequirements.forEach(requirement => {
                            if(removeMoney && this.moneyIdList.includes(requirement.item.id)) {
                                
                            } else {
                                if(map.has(requirement.item.id)) {
                                    map.get(requirement.item.id).push(hideoutLevel.id);
                                } else {
                                    map.set(requirement.item.id, new Array(hideoutLevel.id));
                                }
                            }
                        })
                    }
                }
            })
        })
        return map;

    }

    static getQuestRequiredAmount(progression?:IProgression):Map<string, number> {
        const map:Map<string, number> = new Map<string, number>()
        QuestsUtils.getData().tasks.forEach(quest => {
            if(quest.objectives && quest.objectives.length > 0) {
                quest.objectives.forEach(obj => {
                    if((obj.type === ObjectiveTypeConst.GIVE_ITEM.type || obj.type === ObjectiveTypeConst.FIND_ITEM.type) && obj.item && obj.item.id) {
                        const objectiveState:ObjectiveState = PlayerProgressionUtils.getObjectiveState(quest.id, obj.id, progression);
                        if(objectiveState && !objectiveState.completed) {
                            let amount = obj.count;
                            if(map.has(obj.item.id)) {
                                amount += map.get(obj.item.id);
                            }
                            map.set(obj.item.id, amount);
                        }
                    }
                })
            }
        })
        return map
    }

    static getHideoutRequiredAmount(progression?:IProgression, progressionType?:string):Map<string, number> {
        const map:Map<string, number> = new Map<string, number>()
        HideoutUtils.getData().hideoutStations.forEach(station => {
            if(station.levels && station.levels.length > 0) {
                station.levels.forEach(level => {
                    if(progressionType === progressionTypes.pve) {
                        if(level.itemPveRequirements && level.itemPveRequirements.length > 0) {
                            level.itemPveRequirements.forEach(requirement => {
                                const levelState:StationLevelState = PlayerProgressionUtils.getStationLevelState(station.id, level.id, progression);
                                if(levelState && !levelState.completed) {
                                    let amount = requirement.quantity;
                                    if(map.has(requirement.item.id)) {
                                        amount += map.get(requirement.item.id);
                                    }
                                    map.set(requirement.item.id, amount);
                                }
                            })
                        }
                    } else {
                        if(level.itemRequirements && level.itemRequirements.length > 0) {
                            level.itemRequirements.forEach(requirement => {
                                const levelState:StationLevelState = PlayerProgressionUtils.getStationLevelState(station.id, level.id, progression);
                                if(levelState && !levelState.completed) {
                                    let amount = requirement.quantity;
                                    if(map.has(requirement.item.id)) {
                                        amount += map.get(requirement.item.id);
                                    }
                                    map.set(requirement.item.id, amount);
                                }
                            })
                        }
                    }
                })
            }
        })
        return map
    }

    static getMapOfAllItemsWithOverallAmount(progressionType?:string):Map<string, number> {
        const map:Map<string, number> = new Map<string, number>()
        QuestsUtils.getData().tasks.forEach(quest => {
            if(quest.objectives && quest.objectives.length > 0 
                && QuestsFiltersUtils.isProgressionTypeAllowed(quest, progressionType)) {
                quest.objectives.forEach(obj => {
                    if((obj.type === ObjectiveTypeConst.GIVE_ITEM.type || obj.type === ObjectiveTypeConst.FIND_ITEM.type) && obj.item && obj.item.id) {
                        let amount = obj.count;
                        if(map.has(obj.item.id)) {
                            amount += map.get(obj.item.id);
                        }
                        map.set(obj.item.id, amount);
                    }
                })
            }
        })
        HideoutUtils.getData().hideoutStations.forEach(station => {
            if(station.levels && station.levels.length > 0) {
                station.levels.forEach(level => {
                    if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
                        if(level.itemPveRequirements && level.itemPveRequirements.length > 0) {
                            level.itemPveRequirements.forEach(requirement => {
                                let amount = requirement.quantity;
                                if(map.has(requirement.item.id)) {
                                    amount += map.get(requirement.item.id);
                                }
                                map.set(requirement.item.id, amount);
                            })
                        }
                    } else {
                        if(level.itemRequirements && level.itemRequirements.length > 0) {
                            level.itemRequirements.forEach(requirement => {
                                let amount = requirement.quantity;
                                if(map.has(requirement.item.id)) {
                                    amount += map.get(requirement.item.id);
                                }
                                map.set(requirement.item.id, amount);
                            })
                        }
                    }
                })
            }
        })
        return map
    }

    static getItemRequirementsObject(itemId:string) {
        const map:Map<string, number> = new Map<string, number>()
        QuestsUtils.getData().tasks.forEach(quest => {
            if(quest.objectives && quest.objectives.length > 0) {
                quest.objectives.forEach(obj => {
                    if((obj.type === ObjectiveTypeConst.GIVE_ITEM.type || obj.type === ObjectiveTypeConst.FIND_ITEM.type) && obj.item?.id) {
                        let amount = obj.count;
                        if(map.has(obj.item.id)) {
                            amount += map.get(obj.item.id);
                        }
                        map.set(obj.item.id, amount);
                    }
                })
            }
        })
    }

}