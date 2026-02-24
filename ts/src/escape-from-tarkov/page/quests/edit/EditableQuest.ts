import { I18nHelper } from "../../../../locale/I18nHelper";
import { TraderMapper } from "../../../../adapter/TraderMapper";
import { ObjectiveTypeList } from "../../../constant/EditQuestConst";
import { MapsExtendedList } from "../../../constant/MapsConst";
import { TraderConst, TraderList } from "../../../constant/TraderConst";
import { Item, NeededKeys, Object, Objectives, Quest, QuestImageImpl, QuestImpl, QuestItemId, QuestLocales, QuestMap, QuestNeededKeys, QuestObject, QuestObjective, QuestRewardItem, QuestSkillReward, QuestTraderStanding, QuestTraderUnlock, TaskObject, TaskRequirement, TraderStanding, TraderUnlock, WeaponBuilder } from "../../../../model/quest/IQuestsElements";
import { ItemsElementUtils } from "../../../utils/ItemsElementUtils";
import { EditSession } from "./EditSession";

export class EditableQuest {

    quest:Quest;
    private changed:boolean = false;
    private newQuest:boolean = false;

    constructor(quest?:Quest) {
        if(quest) {
            this.quest = JSON.parse(JSON.stringify(quest));
        } else {
            this.quest = new QuestImpl();
            this.newQuest = true;
            this.hasChanged();
            this.changeQuestTrader(TraderConst.APOLLO.id);
        }
    }

    hasBeenChanged():boolean {
        return this.changed;
    }

    isNewQuest():boolean {
        return this.newQuest;
    }

    getQuestId():string {
        return this.quest.id;
    }

    private hasChanged():void {
        this.changed = true
        EditSession.enableReviewButton()
    }

    changeQuestTrader(traderId:string) {
        for(const info of TraderList) {
            if(info.id === traderId) {
                this.quest.trader.id = info.id;
                this.quest.trader.name = TraderMapper.getTraderFromId(info.id);
                this.quest.trader.normalizedName = TraderMapper.getTraderFromId(info.id);
                this.hasChanged();
                return;
            }
        }
    }

    changeQuestTitle(title:string) {
        if(I18nHelper.currentLocale() === I18nHelper.defaultLocale) {
            this.quest.name = title;
            this.quest.normalizedName = title.toLowerCase().replace(" - ", "-").replace(" ", "-");
        }
        if(!this.quest.locales) {
            this.quest.locales = new QuestLocales()
        }
        this.quest.locales[I18nHelper.currentLocale()] = title;
        this.hasChanged();
    }

    changeLevelRequirement(level:number) {
        this.quest.minPlayerLevel = level;
        this.hasChanged();
    }

    changeUnlockDelayRequirement(delay:number) {
        this.quest.unlockHoursDelay = delay;
        this.hasChanged();
    }

    changeProgressionTypeRequirement(progressionType:string) {
        this.quest.progressionType = progressionType;
        this.hasChanged();
    }

    changeFactionRequirement(faction:string) {
        this.quest.factionName = faction;
        this.hasChanged();
    }

    changeGameEditionRequirement(gameEdition:string) {
        this.quest.gameEdition = gameEdition;
        this.hasChanged();
    }

    addUnlockedBy(questId:string, state:string):TaskObject {
        for(const requirement of this.quest.taskRequirements) {
            if(requirement.task && requirement.task.id === questId) {
                requirement.status.push(state);
                this.hasChanged();
                return requirement;
            }
        }
        let newRequirement:TaskObject = new TaskRequirement();
        if(state) {
            newRequirement.status.push(state);
            newRequirement.task.id = questId
            this.quest.taskRequirements.push(newRequirement)
        }
        this.hasChanged();
        return newRequirement;
    }

    changeUnlockedById(oldId:string, newId:string) {
        for(const requirement of this.quest.taskRequirements) {
            if(requirement.task.id === oldId) {
                requirement.task.id = newId;
                this.hasChanged();
                return;
            }
        }
    }

    removeUnlockedBy(questId:string) {
        for(let i = 0; i < this.quest.taskRequirements.length; i++) {
            if(this.quest.taskRequirements[i].task.id === questId) {
                this.quest.taskRequirements.splice(i, 1);
                this.hasChanged();
                return;
            }
        }
    }

    addUnlockedByCondition(requirementId:string, condition:string) {
        for(const requirement of this.quest.taskRequirements) {
            if(requirement.task.id === requirementId) {
                requirement.status.push(condition);
                this.hasChanged();
            }
        }
    }

    removeUnlockedByCondition(requirementId:string, condition:string) {
        for(const requirement of this.quest.taskRequirements) {
            if(requirement.task.id === requirementId) {
                for(let i = 0; i < requirement.status.length; i++) {
                    if(requirement.status[i] === condition) {
                        requirement.status.splice(i, 1);
                        this.hasChanged();
                        return;
                    }
                }
            }
        }
    }

    changeKappaRequired(value:boolean) {
        this.quest.kappaRequired = value;
        this.hasChanged();
    }

    changeExperience(value:number) {
        this.quest.experience = value;
        this.hasChanged();
    }

    addItemFinishReward(itemId:string, count:number):Item {
        for(const reward of this.quest.finishRewards.items) {
            if(reward && reward.item && reward.item.id === itemId) {
                reward.count = count;
                this.hasChanged();
                return null;
            }
        }
        const newItem = new QuestRewardItem(itemId);
        if(count && count > 0) {
            newItem.count = count
        } else {
            newItem.count = 1
        }
        this.quest.finishRewards.items.push(newItem);
        this.hasChanged();
        return newItem;
    }

    addWeaponPart(itemId:string, objectiveId:string, type:string, index:number):Object {
        let list:Object[] = this.getWeaponPartsListType(objectiveId, type, index);

        const newItem = new QuestObject(itemId);
        list.push(newItem);

        this.hasChanged();
        return newItem;
    }

    moveWeaponPartUp(itemId:string, objectiveId:string, type:string, index:number):boolean {
        let list:Object[] = this.getWeaponPartsListType(objectiveId, type, index);
        for(let i = 0; i < list.length; i++) {
            if(list[i].id === itemId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(list, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    
    }

    moveWeaponPartDown(itemId:string, objectiveId:string, type:string, index:number):boolean {
        let list:Object[] = this.getWeaponPartsListType(objectiveId, type, index);
        for(let i = 0; i < list.length; i++) {
            if(list[i].id === itemId) {
                if(list.length === i + 1) {
                    return false;
                }
                this.swapElement(list, i, i + 1);
                this.hasChanged();
                return true;
            }
        }
    }

    removeWeaponPart(itemId:string, objectiveId:string, type:string, index:number):boolean {
        let list:Object[] = this.getWeaponPartsListType(objectiveId, type, index);
        for(let i = 0; i < list.length; i++) {
            if(list[i].id === itemId) {
                list.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeWeaponPartId(objectiveId:string, type:string, index:number, previousId:string, newId:string):boolean {
        let list:Object[] = this.getWeaponPartsListType(objectiveId, type, index);
        for(const item of list) {
            if(item && item.id === previousId) {
                item.id = newId;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    setObjectiveWeaponBuild(objectiveId:string, weaponBuilder:WeaponBuilder[]) {
        const obj = this.getObjective(objectiveId);
        if(obj) {
            obj.weaponBuilder = [];
        }
    }


    getWeaponPartsListType(objectiveId:string, type:string, index:number):Object[] {
        const obj = this.getObjective(objectiveId);
        if(!obj.weaponBuilder || obj.weaponBuilder.length === 0) {
            obj.weaponBuilder = [];
            obj.weaponBuilder.push(new WeaponBuilder());
        }
        switch(type) {
            case "Muzzle": return obj.weaponBuilder[index].muzzle;
            case "Gas Block": return obj.weaponBuilder[index].gasBlock;
            case "Handguard": return obj.weaponBuilder[index].handguard;
            case "Barrel": return obj.weaponBuilder[index].barrel;
            case "Rail": return obj.weaponBuilder[index].rail;
            case "Attachment": return obj.weaponBuilder[index].attachment;
            case "Foregrip": return obj.weaponBuilder[index].grip;
            case "Receiver": return obj.weaponBuilder[index].receiver;
            case "Mounts": return obj.weaponBuilder[index].mount;
            case "Scope": return obj.weaponBuilder[index].scope;
            case "Magazine": return obj.weaponBuilder[index].magazine;
            case "Pistol Grip": return obj.weaponBuilder[index].pistolGrip;
            case "Bolt": return obj.weaponBuilder[index].bolt;
            case "Stock": return obj.weaponBuilder[index].stock;
        }
    }

    removeItemFinishReward(itemId:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.items.length; i++) {
            if(this.quest.finishRewards.items[i].item.id === itemId) {
                this.quest.finishRewards.items.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeItemFinishRewardId(previousId:string, newId:string):boolean {
        for(const reward of this.quest.finishRewards.items) {
            if(reward && reward.item && reward.item.id === previousId) {
                reward.item.id = newId;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    moveItemFinishRewardUp(itemId:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.items.length; i++) {
            if(this.quest.finishRewards.items[i].item.id === itemId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(this.quest.finishRewards.items, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    }

    moveItemFinishRewardDown(itemId:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.items.length; i++) {
            if(this.quest.finishRewards.items[i].item.id === itemId) {
                if(this.quest.finishRewards.items.length === i + 1) {
                    return false;
                }
                this.swapElement(this.quest.finishRewards.items, i, i + 1);
                this.hasChanged();
                return true;
            }
        }
    }

    addUnlockFinishReward(itemId:string):TraderUnlock {
        // for(const reward of this.quest.finishRewards.offerUnlock) {
        //     if(reward && reward.item && reward.item.id === itemId) {
        //         return null;
        //     }
        // }
        const newItem = new QuestTraderUnlock(itemId);
        this.quest.finishRewards.offerUnlock.push(newItem);
        this.hasChanged();
        return newItem;
    }

    changeItemUnlockTraderLevel(itemId:string, level:number):boolean {
        for(let i = 0; i < this.quest.finishRewards.offerUnlock.length; i++) {
            if(this.quest.finishRewards.offerUnlock[i].item.id === itemId) {
                this.quest.finishRewards.offerUnlock[i].level = level;
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeItemUnlockTrader(itemId:string, traderId:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.offerUnlock.length; i++) {
            if(this.quest.finishRewards.offerUnlock[i].item.id === itemId) {
                this.quest.finishRewards.offerUnlock[i].trader.id = traderId;
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    removeItemUnlockReward(itemId:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.offerUnlock.length; i++) {
            if(this.quest.finishRewards.offerUnlock[i].item.id === itemId) {
                this.quest.finishRewards.offerUnlock.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeItemUnlockId(previousId:string, newId:string):boolean {
        for(const reward of this.quest.finishRewards.offerUnlock) {
            if(reward && reward.item && reward.item.id === previousId) {
                reward.item.id = newId;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    moveItemUnlockRewardUp(itemId:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.offerUnlock.length; i++) {
            if(this.quest.finishRewards.offerUnlock[i].item.id === itemId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(this.quest.finishRewards.offerUnlock, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    }

    moveItemUnlockRewardDown(itemId:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.offerUnlock.length; i++) {
            if(this.quest.finishRewards.offerUnlock[i].item.id === itemId) {
                if(this.quest.finishRewards.offerUnlock.length === i + 1) {
                    return false;
                }
                this.swapElement(this.quest.finishRewards.offerUnlock, i, i + 1);
                this.hasChanged();
                return true;
            }
        }
    }

    addSkillFinishReward(bonus:number) {
        if(!this.quest.finishRewards.skillLevelReward.length) {
            this.quest.finishRewards.skillLevelReward = []
        }
        const skillReward = new QuestSkillReward();
        skillReward.name = "Skill Name " + this.quest.finishRewards.skillLevelReward.length + 1;
        skillReward.level = bonus;
        this.quest.finishRewards.skillLevelReward.push(skillReward);
        this.hasChanged();

        return skillReward;
    }

    changeSkillRewardBonus(name:string, bonus:number):boolean {
        for(const reward of this.quest.finishRewards.skillLevelReward) {
            if(reward.name === name) {
                reward.level = bonus;
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeSkillRewardName(oldName:string, newName:string):boolean {
        for(const reward of this.quest.finishRewards.skillLevelReward) {
            if(reward.name === oldName) {
                reward.name = newName;
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    removeSkillFinishReward(skillName:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.skillLevelReward.length; i++) {
            if(this.quest.finishRewards.skillLevelReward[i].name === skillName) {
                this.quest.finishRewards.skillLevelReward.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    addTraderStandingFinishReward(traderId:string, standing:number):TraderStanding {
        for(const reward of this.quest.finishRewards.traderStanding) {
            if(reward && reward.trader && reward.trader.id === traderId) {
                reward.standing = standing;
                this.hasChanged();
                return null;
            }
        }

        const newTraderStanding = new QuestTraderStanding(traderId);
        newTraderStanding.standing = standing;
        this.quest.finishRewards.traderStanding.push(newTraderStanding);
        this.hasChanged();
        return newTraderStanding;
    }

    removeTraderStanding(traderId:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.traderStanding.length; i++) {
            if(this.quest.finishRewards.traderStanding[i].trader.id === traderId) {
                this.quest.finishRewards.traderStanding.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeTraderStandingId(previousId:string, newId:string):boolean {
        for(const reward of this.quest.finishRewards.traderStanding) {
            if(reward && reward.trader && reward.trader.id === previousId) {
                reward.trader.id = newId;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    moveTraderStandingUp(traderId:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.traderStanding.length; i++) {
            if(this.quest.finishRewards.traderStanding[i].trader.id === traderId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(this.quest.finishRewards.traderStanding, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    }

    moveTraderStandingDown(traderId:string):boolean {
        for(let i = 0; i < this.quest.finishRewards.traderStanding.length; i++) {
            if(this.quest.finishRewards.traderStanding[i].trader.id === traderId) {
                if(this.quest.finishRewards.traderStanding.length === i + 1) {
                    return false;
                }
                this.swapElement(this.quest.finishRewards.traderStanding, i, i + 1);
                this.hasChanged();
                return true;
            }
        }
    }

    addTraderPenalty(traderId:string, standing:number):TraderStanding {
        for(const reward of this.quest.failureOutcome.traderStanding) {
            if(reward && reward.trader && reward.trader.id === traderId) {
                reward.standing = standing;
                this.hasChanged();
                return null;
            }
        }

        const newTraderStanding = new QuestTraderStanding(traderId);
        this.quest.failureOutcome.traderStanding.push(newTraderStanding);
        this.hasChanged();
        return newTraderStanding;
    }

    removeTraderPenalty(traderId:string):boolean {
        for(let i = 0; i < this.quest.failureOutcome.traderStanding.length; i++) {
            if(this.quest.failureOutcome.traderStanding[i].trader.id === traderId) {
                this.quest.failureOutcome.traderStanding.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeTraderPenaltyId(previousId:string, newId:string):boolean {
        for(const reward of this.quest.failureOutcome.traderStanding) {
            if(reward && reward.trader && reward.trader.id === previousId) {
                reward.trader.id = newId;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    moveTraderPenaltyUp(traderId:string):boolean {
        for(let i = 0; i < this.quest.failureOutcome.traderStanding.length; i++) {
            if(this.quest.failureOutcome.traderStanding[i].trader.id === traderId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(this.quest.failureOutcome.traderStanding, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    }

    moveTraderPenaltyDown(traderId:string):boolean {
        for(let i = 0; i < this.quest.failureOutcome.traderStanding.length; i++) {
            if(this.quest.failureOutcome.traderStanding[i].trader.id === traderId) {
                if(this.quest.failureOutcome.traderStanding.length === i + 1) {
                    return false;
                }
                this.swapElement(this.quest.failureOutcome.traderStanding, i, i + 1);
                this.hasChanged();
                return true;
            }
        }
    }

    addObjective():Objectives {
        const objective = new QuestObjective();
        this.quest.objectives.push(objective);
        this.hasChanged();
        return objective;
    }

    addKeys(objectiveId:string, keyId:string):NeededKeys {
        const neededKeys = new QuestNeededKeys();
        neededKeys.keys.push(new QuestObject(keyId))

        if(!this.quest.objectives.find(objective => objective.id === objectiveId).neededKeys) {
            this.quest.objectives.find(objective => objective.id === objectiveId).neededKeys = [];
        } else {
            for(const map of MapsExtendedList) {
                let used = false;
                this.quest.objectives.find(objective => objective.id === objectiveId).neededKeys.forEach(keys => {
                    if(keys.map.id === map.id) {
                        used = true;
                    }
                })
                if(!used) {
                    neededKeys.map.id = map.id;
                    break;
                }
            }
        }
  
        this.quest.objectives.find(objective => objective.id === objectiveId).neededKeys.push(neededKeys);
        this.hasChanged();
        return neededKeys;
    }

    addKey(objectiveId:string, mapId:string):Object {
        const neededKeys = this.getNeededKey(objectiveId, mapId);
        if(!neededKeys) {
            return null;
        }
        let defaultItem:string = null;
        for(const item of ItemsElementUtils.getData().items) {
            if(!item.id.includes("key")) {
                continue;
            }
            let alreadyTaken = false;
            for(const neededKey of neededKeys.keys) {
                if(neededKey.id === item.id) {
                    alreadyTaken = true;
                }
            }
            if(!alreadyTaken) {
                defaultItem = item.id;
                break;
            }
        }
        const key = new QuestObject(defaultItem);
        neededKeys.keys.push(key);
        this.hasChanged();

        return key;
    }

    moveKeyUp(objectiveId:string, keyId:string, mapId:string):boolean {
        let neededKeys = this.getNeededKey(objectiveId, mapId);
        for(let i = 0; i < neededKeys.keys.length; i++) {
            if(neededKeys.keys[i].id === keyId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(neededKeys.keys, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    }

    moveKeyDown(objectiveId:string, keyId:string, mapId:string):boolean {
        let neededKeys = this.getNeededKey(objectiveId, mapId);
        for(let i = 0; i < neededKeys.keys.length; i++) {
            if(neededKeys.keys[i].id === keyId) {
                if(neededKeys.keys.length === i + 1) {
                    return false;
                }
                this.swapElement(neededKeys.keys, i, i + 1);
                this.hasChanged();
                return true;
            }
        }
    }

    removeKey(objectiveId:string, keyId:string, mapId:string):boolean {
        let neededKeys = this.getNeededKey(objectiveId, mapId);
        for(let i = 0; i < neededKeys.keys.length; i++) {
            if(neededKeys.keys[i].id === keyId) {
                neededKeys.keys.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeKeyId(objectiveId:string, previousKeyId:string, newKeyId:string, mapId:string):boolean {
        let neededKeys = this.getNeededKey(objectiveId, mapId);
        for(const key of neededKeys.keys) {
            if(key && key.id === previousKeyId) {
                key.id = newKeyId;
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeKeyMapId(objectiveId:string, previousId:string, newId:string):boolean {
        for(const neededKeys of this.quest.objectives.find(objective => objective.id === objectiveId).neededKeys) {
            if(neededKeys?.map && neededKeys.map.id === previousId) {
                neededKeys.map.id = newId;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    getNeededKey(objectiveId:string, mapId:string):NeededKeys {
        return this.quest.objectives.find(objective => objective.id === objectiveId).neededKeys.find(neededKeys => neededKeys.map.id === mapId);
    }

    moveObjectiveUp(objId:string):boolean {
        for(let i = 0; i < this.quest.objectives.length; i++) {
            if(this.quest.objectives[i].id === objId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(this.quest.objectives, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    }

    moveObjectiveDown(objId:string):boolean {
        for(let i = 0; i < this.quest.objectives.length; i++) {
            if(this.quest.objectives[i].id === objId) {
                if(this.quest.objectives.length === i + 1) {
                    return false;
                }
                this.swapElement(this.quest.objectives, i, i + 1);
                this.hasChanged();
                return true;
            }
        }
    }

    private swapElement(list:any[], index:number, secondIndex:number) {
        let b = list[index];
        list[index] = list[secondIndex];
        list[secondIndex] = b
    }

    removeObjective(objId:string) {
        for(let i = 0; i < this.quest.objectives.length; i++) {
            if(this.quest.objectives[i].id === objId) {
                this.quest.objectives.splice(i, 1);
                this.hasChanged();
                return;
            }
        }
    }

    setObjectiveTypename(objId:string, typename:string) {
        const obj = this.getObjective(objId);
        if(obj) {
            obj.__typename = typename;
            this.hasChanged();
        }
    }

    setObjectiveCount(objId:string, count:number) {
        const obj = this.getObjective(objId);
        if(obj) {
            obj.count = count;
            this.hasChanged();
        }
    }

    setObjectiveDescription(objId:string, description:string) {
        const obj = this.getObjective(objId);
        if(obj) {
            if(I18nHelper.currentLocale() === I18nHelper.defaultLocale) {
                obj.description = description;
            }
            if(!obj.locales) {
                obj.locales = new QuestLocales();
            }
            obj.locales[I18nHelper.currentLocale()] = description;
            this.hasChanged();
        }
    }

    addObjectiveMap(objId:string, mapId:string) {
        const obj = this.getObjective(objId);
        if(obj) {
            for(const map of obj.maps) {
                if(map.id === mapId) {
                    return;
                }
            }
            obj.maps.push(new QuestMap(mapId));
            this.hasChanged();
        }
    }

    removeObjectiveMap(objId:string, mapId:string) {
        const obj = this.getObjective(objId);
        if(obj) {
            for(let i = 0; obj.maps.length; i++) {
                if(obj.maps[i].id === mapId) {
                    obj.maps.splice(i, 1);
                    this.hasChanged();
                    return;
                }
            }
        }
    }

    addMarkerItem(objId:string, markerId:string) {
        const obj = this.getObjective(objId);
        if(obj) {
            if(obj.markerItem && obj.markerItem.id !== markerId) {
                obj.markerItem.id = markerId;
            } else {
                obj.markerItem = new QuestItemId(markerId);
            }
            this.hasChanged();
        }
    }

    addIconToObjective(objId:string, iconId:string, description:string, imageId:string) {
        for(const obj of this.quest.objectives) {
            if(obj.id === objId) {
                if(obj.questImages && obj.questImages.length > 0) {
                    for(const questImages of obj.questImages) {
                        if(questImages.id === iconId) {
                            if(description) {
                                questImages.description = description;
                            }
                            questImages.paths.indexOf(imageId) === -1 ? questImages.paths.push(imageId) : "";
                            this.hasChanged();
                            return;
                        }
                    }
                }
                const newQuestImage = new QuestImageImpl();
                newQuestImage.id = iconId;
                newQuestImage.description = description;
                newQuestImage.paths.push(imageId);
                obj.questImages.push(newQuestImage);
                this.hasChanged();
                return;
            }
        }
    }

    removeIconFromObjective(iconId:string) {
        for(const obj of this.quest.objectives) {
            if(!obj.questImages || obj.questImages.length === 0) {
                continue;
            }
            for(let i = 0; i < obj.questImages.length; i++) {
                if(obj.questImages[i].id === iconId) {
                    EditSession.removeImageBlobsWithIconId(Number(obj.questImages[i].id))
                    obj.questImages.splice(i, 1);
                    this.hasChanged();
                    return;
                }
            }
        }
    }

    removeIconImageFromObjective(iconId:string, imagePath:string) {
        for(const obj of this.quest.objectives) {
            if(!obj.questImages || obj.questImages.length === 0) {
                continue;
            }
            for(let i = 0; i < obj.questImages.length; i++) {
                if(obj.questImages[i].id === iconId) {
                    EditSession.removeImageBlobsWithIconId(Number(obj.questImages[i].id))
                    for(let j = 0; j < obj.questImages[i].paths.length; j++) {
                        if(obj.questImages[i].paths[j] === imagePath) {
                            obj.questImages[i].paths.splice(j, 1);
                            this.hasChanged();
                            return;
                        }
                    }
                }
            }
        }
    }

    setObjectiveOptional(objId:string, value:boolean) {
        const obj = this.getObjective(objId);
        if(obj) {
            obj.optional = value;
            this.hasChanged();
        }
    }

    setObjectiveFoundInRaid(objId:string, value:boolean) {
        const obj = this.getObjective(objId);
        if(obj) {
            obj.foundInRaid = value;
            if(value) {
                this.hasChanged();
            }
        }
    }

    setObjectiveType(objId:string, type:string) {
        const obj = this.getObjective(objId);
        if(obj) {
            obj.type = type;
            this.hasChanged();
        }
    }

    getObjective(objId):QuestObjective {
        for(const obj of this.quest.objectives) {
            if(obj.id === objId) {
                return obj;
            }
        }
        return null
    }

    changeObjectiveDescription(objId:string, description:string) {
        for(const obj of this.quest.objectives) {
            if(obj.id === objId) {
                if(I18nHelper.currentLocale() === I18nHelper.defaultLocale) {
                    obj.description = description;
                }
                if(!obj.locales) {
                    obj.locales = new QuestLocales()
                }
                obj.locales[I18nHelper.currentLocale()] = description;
                this.hasChanged();
            }
        }
    }

    changeObjectiveType(objId:string, type:string) {
        for(const obj of this.quest.objectives) {
            if(obj.id === objId) {
                obj.type = type;
                this.changeObjectiveTypeName(obj, type);
                this.hasChanged();
            }
        }
    }

    setObjectiveItem(objId:string, item:string) {
        for(const obj of this.quest.objectives) {
            if(obj.id === objId) {
                if(item) {
                    if(obj.item) {
                        obj.item.id = item;
                    } else {
                        const newItem = new QuestObject();
                        newItem.id = item;
                        obj.item = newItem;
                    }
                } else {
                    if(obj.item) {
                        obj.item = null;
                    }
                }
                this.hasChanged();
            }
        }
    }

    setObjectiveMarkerItem(objId:string, item:string) {
        for(const obj of this.quest.objectives) {
            if(obj.id === objId) {
                if(item) {
                    if(obj.markerItem) {
                        obj.markerItem.id = item;
                    } else {
                        const newItem = new QuestObject();
                        newItem.id = item;
                        obj.markerItem = newItem;
                    }
                } else {
                    if(obj.markerItem) {
                        obj.markerItem = null;
                    }
                }
                this.hasChanged();
            }
        }
    }

    private changeObjectiveTypeName(objective:Objectives, type:string) {
        ObjectiveTypeList.forEach(info => {
            if(info.type === type) {
                objective.__typename = info.typename;
                this.hasChanged();
            }
        })
    }
}