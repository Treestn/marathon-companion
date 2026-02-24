import { ObjectiveTypeConst, QuestConditionConst } from "../../../constant/EditQuestConst";
import { NeededKeys, Object, Objectives, Quest, QuestObject, SkillReward, TraderStanding, WeaponBuilder } from "../../../../model/quest/IQuestsElements";
import { QuestBodyBuilder } from "../builder/helper/QuestBodyBuilder";
import { EditableQuest } from "../edit/EditableQuest";
import { EditSession } from "../edit/EditSession";
import { QuestsUtils } from "../utils/QuestsUtils";
import { TraderList } from "../../../constant/TraderConst";
import { ItemsElementUtils } from "../../../utils/ItemsElementUtils";
import { ImageUtils } from "../../map/utils/ImageUtils";
import { TraderMapper } from "../../../../adapter/TraderMapper";

export class QuestEditController {

    static addQuest(quest:Quest) {
        if(!EditSession.isQuestBeingModified(quest.id)) {
            EditSession.addModifiedQuest(new EditableQuest(quest));
        }
    }

    static registerQuestHeaderTraderSelector(target:HTMLSelectElement, questId:string, image:HTMLImageElement) {
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.changeQuestTrader(target.value);
            for(const trader of TraderList) {
                if(target.value === trader.id) {
                    ImageUtils.loadImage(image, TraderMapper.getImageFromTraderId(trader.id), 1);
                    break;
                }
            }
            e.stopPropagation();
        }
    }

    static registerQuestHeaderTitle(target:HTMLInputElement, questId:string) {
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.changeQuestTitle(target.value);
            e.stopPropagation()
        }
    }

    static registerRemoveQuest(target:HTMLElement, questId:string, wrapper:HTMLElement) {
        target.onclick = (e) => {
            EditSession.removeModifiedQuest(questId);
            wrapper.remove();
            e.stopPropagation();
        }
    }

    static registerLevelController(questId:string, input:HTMLInputElement, originalLevel:number) {
        input.onkeyup = (e) => {
            const number:number = parseInt(input.value);
            const editableQuest = EditSession.getModifiedQuest(questId);
            if(!isNaN(number) && number >= 1) {
                editableQuest.changeLevelRequirement(number);
                input.value = String(number)
            } else if(input.value === "" || number < 1) {
                editableQuest.changeLevelRequirement(1);
                input.value = String(1);
            } else {
                EditSession.getModifiedQuest(questId).changeLevelRequirement(originalLevel);
                input.value = ""
            }
        }
    }

    static registerUnlockDelayController(questId:string, input:HTMLInputElement, originalDelay:number) {
        input.onkeyup = (e) => {
            const number:number = parseInt(input.value);
            const editableQuest = EditSession.getModifiedQuest(questId);
            if(!isNaN(number) && number >= 1) {
                editableQuest.changeUnlockDelayRequirement(number);
                input.value = String(number)
            } else if(input.value === "" || number < 0) {
                editableQuest.changeUnlockDelayRequirement(null);
                input.value = String(0);
            } else {
                EditSession.getModifiedQuest(questId).changeUnlockDelayRequirement(originalDelay);
                input.value = "0"
            }
        }
    }

    static registerProgressionTypeController(target:HTMLSelectElement, questId:string) {
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.changeProgressionTypeRequirement(target.value === "" ? null : target.value);
            e.stopPropagation();
        }
    }

    static registerFactionController(target:HTMLSelectElement, questId:string) {
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.changeFactionRequirement(target.value);
            e.stopPropagation();
        }
    }

    static registerGameEditionController(target:HTMLSelectElement, questId:string) {
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.changeGameEditionRequirement(target.value === "" ? null : target.value);
            e.stopPropagation();
        }
    }

    static registerAddQuestConditionController(target:HTMLElement, wrapper:HTMLDivElement, questId:string, select:HTMLSelectElement) {
        target.onclick = (e) => {
            EditSession.getModifiedQuest(questId).addUnlockedByCondition(select.value, QuestConditionConst.COMPLETE.name);
            wrapper.insertBefore(QuestBodyBuilder.createConditionDropdown(QuestConditionConst.COMPLETE.name, questId, select), target);
            e.stopPropagation()
        }
    }

    static registerChangeQuestConditionController(target:HTMLSelectElement, questId:string, select:HTMLSelectElement) {
        let lastValue = target.value;
        target.onchange = (e) => {
            EditSession.getModifiedQuest(questId).removeUnlockedByCondition(select.value, lastValue);
            EditSession.getModifiedQuest(questId).addUnlockedByCondition(select.value, target.value);
            lastValue = target.value;
            e.stopPropagation()
        }
    }

    static registerRemoveQuestConditionController(target:HTMLElement, select:HTMLSelectElement, wrapper:HTMLElement, questId:string, questSelect:HTMLSelectElement) {
        target.onclick = (e) => {
            EditSession.getModifiedQuest(questId).removeUnlockedByCondition(questSelect.value, select.value);
            wrapper.remove();
            e.stopPropagation()
        }
    }

    static registerAddConditionQuest(target:HTMLElement, wrapper:HTMLElement, quest:Quest) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            let defaultQuest:Quest = null;
            for(const temp of QuestsUtils.getData().tasks) {
                let alreadyTaken = false;
                for(const requirement of quest.taskRequirements) {
                    if(requirement.task.id === temp.id) {
                        alreadyTaken = true;
                    }
                }
                if(!alreadyTaken) {
                    defaultQuest = temp;
                    break;
                }
            }
            
            const requirement = editableQuest.addUnlockedBy(defaultQuest.id, QuestConditionConst.COMPLETE.name);
            wrapper.insertBefore(QuestBodyBuilder.createQuestRequiredDiv(defaultQuest, true, quest.id, requirement), target);

            QuestBodyBuilder.updateSelect2();
            e.stopPropagation()
        }
    }

    static registerQuestConditionId(target:HTMLSelectElement, questId:string) {
        let oldQuestId = target.value;
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.changeUnlockedById(oldQuestId, target.value);
            oldQuestId = target.value;
            e.stopPropagation()
        }
    }

    static registerRemoveConditionQuest(target:HTMLElement, wrapper:HTMLElement, select:HTMLSelectElement, questId:string) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.removeUnlockedBy(select.value);
            wrapper.parentElement.remove();
            e.stopPropagation()
        }
    }

    static registerObjectiveCount(target:HTMLInputElement, questId:string, objId:string) {
        let previousCount:number = parseInt(target.value);
        target.onkeyup = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const number:number = parseInt(target.value);
            if(!isNaN(number) && number >= 0) {
                editableQuest.setObjectiveCount(objId, number);
                target.value = String(number)
                previousCount = number;
            } else if(target.value === "" || number < 0) {
                editableQuest.setObjectiveCount(objId, 0);
                target.value = String(0)
                previousCount = 0;
            } else {
                editableQuest.setObjectiveCount(objId, previousCount);
                target.value = String(previousCount)
            }
            e.stopPropagation();
        }
    }

    static registerObjectiveDescription(target:HTMLInputElement, questId:string, objId:string) {
        target.onchange = (e) => {
            if(target.value.length <= 250) {
                const editableQuest = EditSession.getModifiedQuest(questId);
                editableQuest.changeObjectiveDescription(objId, target.value);
            }
            else {
                target.value = target.value.substring(0, 250);
            }
        }
    }

    static registerObjectiveMap(target:HTMLInputElement, questId:string, objId:string, mapId:string) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            if(target.checked) {
                editableQuest.addObjectiveMap(objId, mapId);
            } else {
                editableQuest.removeObjectiveMap(objId, mapId);
            }
            e.stopPropagation();
        }
    }

    static registerObjectiveOptional(target:HTMLInputElement, questId:string, objId:string) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.setObjectiveOptional(objId, target.checked);
            e.stopPropagation();
        }
    }

    static registerObjectiveFoundInRaid(target:HTMLInputElement, questId:string, objId:string) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.setObjectiveFoundInRaid(objId, target.checked);
            e.stopPropagation();
        }
    }


    static registerObjectiveType(target:HTMLSelectElement, questId:string, objId:string, count:HTMLElement, 
            item:HTMLElement, markerItem:HTMLElement, foundInRaid:HTMLElement) {
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.changeObjectiveType(objId, target.value);
            this.resolveObjective(target, questId, objId, count, item, markerItem, foundInRaid, true);
            QuestBodyBuilder.updateSelect2();
            e.stopPropagation();
        }
    }

    static registerObjectiveItem(target:HTMLSelectElement, questId:string, objId:string, image:HTMLImageElement) {
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.setObjectiveItem(objId, target.value);
            ItemsElementUtils.getItemInformation(target.value).then(data => {
                ImageUtils.loadImage(image, data.baseImageLink, 1);
            })
        }
    }

    static registerObjectiveMarkerItem(target:HTMLSelectElement, questId:string, objId:string, image:HTMLImageElement) {
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.setObjectiveMarkerItem(objId, target.value);
            ItemsElementUtils.getItemInformation(target.value).then(data => {
                ImageUtils.loadImage(image, data.baseImageLink, 1);
            })
        }
    }

    static resolveObjective(type:HTMLSelectElement, questId:string, objId:string, count:HTMLElement, 
            item:HTMLElement, markerItem:HTMLElement, foundInRaid:HTMLElement, setValues:boolean) {

        const editableQuest = EditSession.getModifiedQuest(questId);

        if(type.value === ObjectiveTypeConst.BUILD_WEAPON.type) {
            const objectiveWrapper = document.getElementById(objId);
            if(objectiveWrapper) {
                objectiveWrapper.appendChild(QuestBodyBuilder.createEditQuestWeaponBuilder(editableQuest.quest, editableQuest.getObjective(objId)))
            }
        } else {
            const weaponBuilder = document.getElementById("quest-edit-weapon-builder-wrapper");
            if(weaponBuilder) {
                weaponBuilder.remove();
                editableQuest.setObjectiveWeaponBuild(objId, null);
            }
        }

        if(type.value === ObjectiveTypeConst.FIND_ITEM.type || type.value === ObjectiveTypeConst.GIVE_ITEM.type) {
            foundInRaid.style.display = "";
        } else {
            foundInRaid.style.display = "none";
            editableQuest.setObjectiveFoundInRaid(objId, null);
        }

        if(type.value === ObjectiveTypeConst.MARK.type) {
            count.style.display = "none";
            item.style.display = "none";
            markerItem.style.display = "";
            if(setValues) {
                editableQuest.setObjectiveCount(objId, 1);
                editableQuest.setObjectiveMarkerItem(objId, (markerItem.getElementsByClassName("quest-edit-dropdown")[0] as HTMLSelectElement).value);
                editableQuest.setObjectiveItem(objId, null);
            }
            return;
        }
        if(this.isItemTypeObjective(type.value)) {
            count.style.display = "";
            item.style.display = "";
            markerItem.style.display = "none";
            const input = count.getElementsByClassName("quest-edit-objective-count-input")[0] as HTMLInputElement
            if(input) {
                const number:number = parseInt(input.value);
                if(!isNaN(number)) {
                    if(setValues) {
                        editableQuest.setObjectiveCount(objId, number);
                    }
                    input.value = String(number);
                } else {
                    if(setValues) {
                        editableQuest.setObjectiveCount(objId, 1);
                    }
                    input.value = "1";
                }
            }
            if(setValues) {
                editableQuest.setObjectiveMarkerItem(objId, null);
                editableQuest.setObjectiveItem(objId, (item.getElementsByClassName("quest-edit-dropdown")[0] as HTMLSelectElement).value);
            }
            return;
        }
        if(type.value === ObjectiveTypeConst.VISIT.type) {
            count.style.display = "none";
            item.style.display = "none";
            markerItem.style.display = "none";
            if(setValues) {
                editableQuest.setObjectiveCount(objId, 0);
                editableQuest.setObjectiveMarkerItem(objId, null);
                editableQuest.setObjectiveItem(objId, null);
            }
            return;
        }
        count.style.display = "";
        item.style.display = "none";
        markerItem.style.display = "none";
        const input = count.getElementsByClassName("quest-edit-objective-count-input")[0] as HTMLInputElement
        if(input) {
            const number:number = parseInt(input.value);
            if(!isNaN(number)) {
                if(setValues) {
                    editableQuest.setObjectiveCount(objId, number);
                }
                input.value = String(number);
            } else {
                if(setValues) {
                    editableQuest.setObjectiveCount(objId, 1);
                }
                input.value = "1";
            }
        }
        if(setValues) {
            editableQuest.setObjectiveMarkerItem(objId, null);
            editableQuest.setObjectiveItem(objId, null);
        }

        QuestBodyBuilder.updateSelect2();
    }

    private static isItemTypeObjective(type:string) {
        return type === ObjectiveTypeConst.FIND_ITEM.type 
                || type === ObjectiveTypeConst.GIVE_ITEM.type
                || type === ObjectiveTypeConst.PLANT_ITEM.type
                || type === ObjectiveTypeConst.SELL_ITEM.type
                || type === ObjectiveTypeConst.USE_ITEM.type
    }

    static addObjective(target:HTMLElement, wrapper:HTMLElement, quest:Quest) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            const objective:Objectives = editableQuest.addObjective();
            const div = QuestBodyBuilder.createQuestGoalDiv(quest, objective);
            wrapper.insertBefore(div, target);
            e.stopPropagation();
        }
    }

    static registerAddKeys(target:HTMLElement, wrapper:HTMLElement, quest:Quest, objectiveId:string) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            for(const item of ItemsElementUtils.getData().items) {
                if(item.id.includes("key") && !editableQuest.quest.objectives.find(objective => objective.id === objectiveId).neededKeys.find(key => key.keys.find(key => key.id === item.id))) {
                    const keys:NeededKeys = editableQuest.addKeys(objectiveId, item.id);
                    const div = QuestBodyBuilder.createEditKeyRequired(quest, keys);
                    wrapper.insertBefore(div, target);
                    QuestBodyBuilder.updateSelect2();
                    break;
                }
            }

            e.stopPropagation();
        }
    }

    static registerAddKey(target:HTMLElement, wrapper:HTMLElement, quest:Quest, objectiveId:string, mapSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            const key:Object = editableQuest.addKey(objectiveId, mapSelector.value);
            if(key) {
                const keysContainer = QuestBodyBuilder.addEditNeededKey(quest, objectiveId, key, mapSelector);
                wrapper.appendChild(keysContainer);
                QuestBodyBuilder.updateSelect2();
            }

            e.stopPropagation();
        }
    }

    static moveKeyUp(target:HTMLElement, wrapper:HTMLElement, questId:string, objectiveId:string, itemSelector:HTMLSelectElement, mapSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let swapped = editableQuest.moveKeyUp(objectiveId, itemSelector.value, mapSelector.value);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
            }
            e.stopPropagation();
        }
    }

    static moveKeyDown(target:HTMLElement, wrapper:HTMLElement, questId:string, objectiveId:string, itemSelector:HTMLSelectElement, mapSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let swapped = editableQuest.moveKeyDown(objectiveId, itemSelector.value, mapSelector.value);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
            }
            e.stopPropagation();
        }
    }

    static removeKey(target:HTMLElement, wrapper:HTMLElement, questId:string, objectiveId:string, selector:HTMLSelectElement, mapSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let removed = editableQuest.removeKey(objectiveId, selector.value, mapSelector.value);
            if(removed) {
                const neededKeys = editableQuest.getNeededKey(objectiveId, mapSelector.value);
                if(!neededKeys || neededKeys.keys.length === 0) {
                    wrapper.parentElement.parentElement.remove();
                    for(let i = editableQuest.quest.objectives.find(objective => objective.id === objectiveId).neededKeys.length - 1; i >=0; i--) {
                        if(editableQuest.quest.objectives.find(objective => objective.id === objectiveId).neededKeys[i].keys.length === 0) {
                            editableQuest.quest.objectives.find(objective => objective.id === objectiveId).neededKeys.splice(i, 1);
                        }
                    }
                } else {
                    wrapper.remove();
                }
            }

            e.stopPropagation();
        }
    }

    static keySelector(target:HTMLSelectElement, questId:string, objectiveId:string, image:HTMLImageElement, mapSelector:HTMLSelectElement) {
        let previousWeaponPartId = target.value;
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let usedId = false;
            const neededKeys = editableQuest.getNeededKey(objectiveId, mapSelector.value);
            if(neededKeys) {
                for(const key of neededKeys.keys) {
                    if(key.id === target.value) {
                        usedId = true;
                        break;
                    }
                }
            }
            if(!usedId) {
                editableQuest.changeKeyId(objectiveId, previousWeaponPartId, target.value, mapSelector.value)
                ItemsElementUtils.getItemInformation(target.value).then(data => {
                    ImageUtils.loadImage(image, data.baseImageLink, 1);
                })
                previousWeaponPartId = target.value
            } else {
                target.value = previousWeaponPartId;
            }
            e.stopPropagation();
        }
    }

    static keyMapSelector(target:HTMLSelectElement, questId:string, objectiveId:string) {
        let previousMapId = target.value;
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let usedId = false;
            for(const neededKeys of editableQuest.quest.objectives.find(objective => objective.id === objectiveId).neededKeys) {
                if(neededKeys.map.id === target.value) {
                    usedId = true;
                    break;
                }
            }
            if(!usedId) {
                editableQuest.changeKeyMapId(objectiveId, previousMapId, target.value);
                previousMapId = target.value
            } else {
                target.value = previousMapId;
            }
            e.stopPropagation();
        }
    }

    static registerRemoveObjective(target:HTMLElement, wrapper:HTMLElement, questId:string, objId:string) { 
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.removeObjective(objId);
            wrapper.parentElement.remove();
            e.stopPropagation();
        }
    }

    static registerMoveObjectiveUp(target:HTMLElement, wrapper:HTMLElement, questId:string, objId:string) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const swapped = editableQuest.moveObjectiveUp(objId);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
            }
            e.stopPropagation();
        }
    }

    static registerMoveObjectiveDown(target:HTMLElement, wrapper:HTMLElement, questId:string, objId:string) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const swapped = editableQuest.moveObjectiveDown(objId);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
            }
            e.stopPropagation();
        }
    }

    static registerExperience(target:HTMLInputElement, questId:string, originalExp:number) {
        target.onchange = (e) => {
            const number:number = parseInt(target.value);
            const editableQuest = EditSession.getModifiedQuest(questId);
            if(!isNaN(number) && number >= 1) {
                editableQuest.changeExperience(number);
                target.value = String(number)
            } else if(target.value === "" || number < 1) {
                editableQuest.changeExperience(1);
                target.value = String(1);
            } else {
                editableQuest.changeExperience(originalExp);
                target.value = String(originalExp);
            }
            e.stopPropagation();
        }
    }

    static registerAddSkill(target:HTMLElement, wrapper:HTMLElement, quest:Quest) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            const skill:SkillReward = editableQuest.addSkillFinishReward(1);

            const component = QuestBodyBuilder.createEditSkillsComponent(quest, skill);
            wrapper.insertBefore(component, wrapper.lastChild);

            e.stopPropagation();
        }
    }

    static registerChangeSkillBonus(target:HTMLInputElement, quest:Quest, inputSkill:HTMLInputElement) {
        let previousCount:number = parseInt(target.value);
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            
            const number:number = parseInt(target.value);
            if(!isNaN(number) && number >= 0) {
                editableQuest.changeSkillRewardBonus(inputSkill.value, number);
                target.value = String(number)
                previousCount = number;
            } else if(target.value === "" || number < 0) {
                editableQuest.changeSkillRewardBonus(inputSkill.value, 1);
                target.value = String(1)
                previousCount = 1;
            } else {
                editableQuest.changeSkillRewardBonus(inputSkill.value, previousCount);
                target.value = String(previousCount)
            }

            e.stopPropagation();
        }
    }

    static registerChangeSkillName(target:HTMLInputElement, quest:Quest) {
        let previousName = target.value;
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            editableQuest.changeSkillRewardName(previousName, target.value);
            previousName = target.value;
            e.stopPropagation();
        }
    }

    static registerRemoveSkill(target:HTMLElement, wrapper:HTMLElement, quest:Quest, input:HTMLInputElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            const removed = editableQuest.removeSkillFinishReward(input.value);

            if(removed) {
                wrapper.remove();
            }
            e.stopPropagation();
        }
    }

    static registerAddTraderStanding(target:HTMLElement, wrapper:HTMLElement, quest:Quest) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            let defaultTraderId:string = null;
            for(const temp of TraderList) {
                let alreadyTaken = false;
                for(const requirement of quest.finishRewards.traderStanding) {
                    if(requirement.trader.id === temp.id) {
                        alreadyTaken = true;
                    }
                }
                if(!alreadyTaken) {
                    defaultTraderId = temp.id;
                    break;
                }
            }
            if(defaultTraderId) {
                const traderStanding:TraderStanding = editableQuest.addTraderStandingFinishReward(defaultTraderId, 0.01);
                // If we have one, it did not exist before
                if(traderStanding) {
                    const component = QuestBodyBuilder.createEditTraderStandingComponent(quest, traderStanding);
                    wrapper.insertBefore(component, wrapper.lastChild);
                }
            }

            e.stopPropagation();
        }
    }

    static removeTraderStanding(target:HTMLElement, wrapper:HTMLElement, questId:string, selector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const removed = editableQuest.removeTraderStanding(selector.value);
            if(removed) {
                wrapper.remove();
            }
            e.stopPropagation();
        }
    }

    static traderStandingSelector(target:HTMLSelectElement, questId:string, image:HTMLImageElement) {
        let previousTraderId = target.value;
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let usedId = false;
            for(const traderStanding of editableQuest.quest.finishRewards.traderStanding) {
                if(traderStanding.trader.id === target.value) {
                    usedId = true;
                    break;
                }
            }
            if(!usedId) {
                editableQuest.changeTraderStandingId(previousTraderId, target.value);
                for(const trader of TraderList) {
                    if(target.value === trader.id) {
                        ImageUtils.loadImage(image, TraderMapper.getImageFromTraderId(trader.id), 1);
                        break;
                    }
                }
                previousTraderId = target.value
            } else {
                target.value = previousTraderId;
            }
            e.stopPropagation();
        }
    }

    static traderStandingCount(target:HTMLInputElement, questId:string, traderSelector:HTMLSelectElement) {
        target.onchange = (e) => {
            const number:number = parseFloat(target.value);
            const editableQuest = EditSession.getModifiedQuest(questId);
            if(!isNaN(number)) {
                editableQuest.addTraderStandingFinishReward(traderSelector.value, number);
                target.value = String(number)
            } else {
                editableQuest.addTraderStandingFinishReward(traderSelector.value, 0.01);
                target.value = String(0.01);
            }
            e.stopPropagation();
        }
    }

    static moveTraderStandingUp(target:HTMLElement, wrapper:HTMLElement, questId:string, traderSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const swapped = editableQuest.moveTraderStandingUp(traderSelector.value);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
            }
            e.stopPropagation();
        }
    }

    static moveTraderStandingDown(target:HTMLElement, wrapper:HTMLElement, questId:string, traderSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const swapped = editableQuest.moveTraderStandingDown(traderSelector.value);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
            }
            e.stopPropagation();
        }
    }

    static registerAddItemReward(target:HTMLElement, wrapper:HTMLElement, quest:Quest) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            let defaultItem:string = null;
            for(const item of ItemsElementUtils.getData().items) {
                let alreadyTaken = false;
                for(const itemReward of quest.finishRewards.items) {
                    if(itemReward.item.id === item.id) {
                        alreadyTaken = true;
                    }
                }
                if(!alreadyTaken) {
                    defaultItem = item.id;
                    break;
                }
            }
            const itemReward = editableQuest.addItemFinishReward(defaultItem, 1);
            // If we have one, it did not exist before
            if(itemReward) {
                const component = QuestBodyBuilder.createEditItemRewardComponent(quest, itemReward);
                wrapper.insertBefore(component, wrapper.lastChild);
                QuestBodyBuilder.updateSelect2();
            }
            e.stopPropagation();
        }
    }

    static registerAddWeaponBuildPart(target:HTMLElement, wrapper:HTMLElement, quest:Quest, objectiveId:string, type:string, index:number) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            let defaultItem:string = null;
            for(const item of ItemsElementUtils.getData().items) {
                let alreadyTaken = false;
                for(const part of editableQuest.getWeaponPartsListType(objectiveId, type, index)) {
                    if(part.id === item.id) {
                        alreadyTaken = true;
                    }
                }
                if(!alreadyTaken) {
                    defaultItem = item.id;
                    break;
                }
            }
            const newPart = editableQuest.addWeaponPart(defaultItem, objectiveId, type, index);

            const component = QuestBodyBuilder.createEditQuestWeaponBuilderPart(quest, objectiveId, newPart, type, index);
            wrapper.insertBefore(component, wrapper.lastChild);
            QuestBodyBuilder.updateSelect2();

            e.stopPropagation();
        }
    }

    static moveWeaponBuilderPartUp(target:HTMLElement, wrapper:HTMLElement, questId:string, objectiveId:string, itemSelector:HTMLSelectElement, type:string, index:number) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let swapped = editableQuest.moveWeaponPartUp(itemSelector.value, objectiveId, type, index);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
            }
            e.stopPropagation();
        }
    }

    static moveWeaponBuilderPartDown(target:HTMLElement, wrapper:HTMLElement, questId:string, objectiveId:string, itemSelector:HTMLSelectElement, type:string, index:number) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let swapped = editableQuest.moveWeaponPartDown(itemSelector.value, objectiveId, type, index);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
            }
            e.stopPropagation();
        }
    }

    static removeWeaponPart(target:HTMLElement, wrapper:HTMLElement, questId:string, objectiveId:string, selector:HTMLSelectElement, type:string, index:number) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let removed = editableQuest.removeWeaponPart(selector.value, objectiveId, type, index);
            if(removed) {
                wrapper.remove();
            }
            e.stopPropagation();
        }
    }

    static weaponBuilderPartSelector(target:HTMLSelectElement, questId:string, objectiveId:string, image:HTMLImageElement, type:string, index:number) {
        let previousWeaponPartId = target.value;
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let usedId = false;
            for(const part of editableQuest.getWeaponPartsListType(objectiveId, type, index)) {
                if(part.id === target.value) {
                    usedId = true;
                    break;
                }
            }
            if(!usedId) {
                editableQuest.changeWeaponPartId(objectiveId, type, index, previousWeaponPartId, target.value)
                ItemsElementUtils.getItemInformation(target.value).then(data => {
                    ImageUtils.loadImage(image, data.baseImageLink, 1);
                })
                previousWeaponPartId = target.value
            } else {
                target.value = previousWeaponPartId;
            }
            e.stopPropagation();
        }
    }

    static removeItemReward(target:HTMLElement, wrapper:HTMLElement, questId:string, selector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const removed = editableQuest.removeItemFinishReward(selector.value);
            if(removed) {
                wrapper.remove();
            }
            e.stopPropagation();
        }
    }

    static itemRewardSelector(target:HTMLSelectElement, questId:string, image:HTMLImageElement) {
        let previousTraderId = target.value;
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let usedId = false;
            for(const item of editableQuest.quest.finishRewards.items) {
                if(item.item.id === target.value) {
                    usedId = true;
                    break;
                }
            }
            if(!usedId) {
                editableQuest.changeItemFinishRewardId(previousTraderId, target.value);
                ItemsElementUtils.getItemInformation(target.value).then(data => {
                    ImageUtils.loadImage(image, data.baseImageLink, 1);
                })
                previousTraderId = target.value
            } else {
                target.value = previousTraderId;
            }
            e.stopPropagation();
        }
    }

    static itemRewardCount(target:HTMLInputElement, questId:string, itemSelector:HTMLSelectElement) {
        target.onchange = (e) => {
            const number:number = parseInt(target.value);
            const editableQuest = EditSession.getModifiedQuest(questId);
            if(!isNaN(number) && number >= 1) {
                editableQuest.addItemFinishReward(itemSelector.value, number);
                target.value = String(number)
            } else {
                editableQuest.addItemFinishReward(itemSelector.value, 1);
                target.value = String(1);
            }
            e.stopPropagation();
        }
    }

    static moveItemRewardUp(target:HTMLElement, wrapper:HTMLElement, questId:string, itemSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const swapped = editableQuest.moveItemFinishRewardUp(itemSelector.value);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
            }
            e.stopPropagation();
        }
    }

    static moveItemRewardDown(target:HTMLElement, wrapper:HTMLElement, questId:string, itemSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const swapped = editableQuest.moveItemFinishRewardDown(itemSelector.value);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
            }
            e.stopPropagation();
        }
    }

    static registerAddItemUnlock(target:HTMLElement, wrapper:HTMLElement, quest:Quest) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            let defaultItem:string = null;
            for(const item of ItemsElementUtils.getData().items) {
                let alreadyTaken = false;
                for(const itemUnlock of quest.finishRewards.offerUnlock) {
                    if(itemUnlock.item.id === item.id) {
                        alreadyTaken = true;
                    }
                }
                if(!alreadyTaken) {
                    defaultItem = item.id;
                    break;
                }
            }
            const itemReward = editableQuest.addUnlockFinishReward(defaultItem);
            // If we have one, it did not exist before
            if(itemReward) {
                const component = QuestBodyBuilder.createEditItemUnlockComponent(quest, itemReward);
                wrapper.insertBefore(component, wrapper.lastChild);
                QuestBodyBuilder.updateSelect2();
            }
            e.stopPropagation();
        }
    }

    static changeItemUnlockTrader(target:HTMLSelectElement, questId:string, image:HTMLImageElement, itemSelector:HTMLSelectElement) {
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.changeItemUnlockTrader(itemSelector.value, target.value);
            for(const trader of TraderList) {
                if(target.value === trader.id) {
                    ImageUtils.loadImage(image, TraderMapper.getImageFromTraderId(trader.id), 1);
                    break;
                }
            }
            e.stopPropagation();
        }
    }

    static changeItemUnlockTraderLevel(target:HTMLInputElement, questId:string, itemSelector:HTMLSelectElement) {
        target.onchange = (e) => {
            const number:number = parseInt(target.value);
            const editableQuest = EditSession.getModifiedQuest(questId);
            if(!isNaN(number)) {
                editableQuest.changeItemUnlockTraderLevel(itemSelector.value, number);
                target.value = String(number);
            } else {
                editableQuest.changeItemUnlockTraderLevel(itemSelector.value, 1);
                target.value = String(1);
            }
            e.stopPropagation();
        }
    }

    static removeItemUnlock(target:HTMLElement, wrapper:HTMLElement, questId:string, selector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const removed = editableQuest.removeItemUnlockReward(selector.value);
            if(removed) {
                wrapper.remove();
            }
            e.stopPropagation();
        }
    }

    static itemUnlockSelector(target:HTMLSelectElement, questId:string, image:HTMLImageElement) {
        let previousTraderId = target.value;
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let usedId = false;
            for(const item of editableQuest.quest.finishRewards.offerUnlock) {
                if(item.item.id === target.value) {
                    usedId = true;
                    break;
                }
            }
            if(!usedId) {
                editableQuest.changeItemUnlockId(previousTraderId, target.value);
                ItemsElementUtils.getItemInformation(target.value).then(data => {
                    ImageUtils.loadImage(image, data.baseImageLink, 1);
                })
                previousTraderId = target.value
            } else {
                target.value = previousTraderId;
            }
            e.stopPropagation();
        }
    }

    static moveItemUnlockUp(target:HTMLElement, wrapper:HTMLElement, questId:string, itemSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const swapped = editableQuest.moveItemUnlockRewardUp(itemSelector.value);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
            }
            e.stopPropagation();
        }
    }

    static moveItemUnlockDown(target:HTMLElement, wrapper:HTMLElement, questId:string, itemSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const swapped = editableQuest.moveItemUnlockRewardDown(itemSelector.value);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
            }
            e.stopPropagation();
        }
    }

    static registerAddTraderPenalty(target:HTMLElement, wrapper:HTMLElement, quest:Quest) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(quest.id);
            let defaultTraderId:string = null;
            for(const temp of TraderList) {
                let alreadyTaken = false;
                for(const requirement of quest.failureOutcome.traderStanding) {
                    if(requirement.trader.id === temp.id) {
                        alreadyTaken = true;
                    }
                }
                if(!alreadyTaken) {
                    defaultTraderId = temp.id;
                    break;
                }
            }
            if(defaultTraderId) {
                const tranderStanding = editableQuest.addTraderPenalty(defaultTraderId, -0.01);
                // If we have one, it did not exist before
                if(tranderStanding) {
                    const component = QuestBodyBuilder.createEditPenaltyComponent(quest, tranderStanding);
                    wrapper.insertBefore(component, wrapper.lastChild);
                }
            }
            e.stopPropagation();
        }
    }

    static removeTraderPenalty(target:HTMLElement, wrapper:HTMLElement, questId:string, selector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const removed = editableQuest.removeTraderPenalty(selector.value);
            if(removed) {
                wrapper.remove();
            }
            e.stopPropagation();
        }
    }

    static traderPenaltySelector(target:HTMLSelectElement, questId:string, image:HTMLImageElement) {
        let previousTraderId = target.value;
        target.onchange = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            let usedId = false;
            for(const traderStanding of editableQuest.quest.failureOutcome.traderStanding) {
                if(traderStanding.trader.id === target.value) {
                    usedId = true;
                    break;
                }
            }
            if(!usedId) {
                editableQuest.changeTraderPenaltyId(previousTraderId, target.value);
                for(const trader of TraderList) {
                    if(target.value === trader.id) {
                        ImageUtils.loadImage(image, TraderMapper.getImageFromTraderId(trader.id), 1);
                        break;
                    }
                }
                previousTraderId = target.value
            } else {
                target.value = previousTraderId;
            }
            e.stopPropagation();
        }
    }

    static traderPenaltyCount(target:HTMLInputElement, questId:string, traderSelector:HTMLSelectElement) {
        target.onchange = (e) => {
            const number:number = parseFloat(target.value);
            const editableQuest = EditSession.getModifiedQuest(questId);
            if(!isNaN(number)) {
                editableQuest.addTraderPenalty(traderSelector.value, number);
                target.value = String(number)
            } else {
                editableQuest.addTraderPenalty(traderSelector.value, -0.01);
                target.value = String(0.01);
            }
            e.stopPropagation();
        }
    }

    static moveTraderPenaltyUp(target:HTMLElement, wrapper:HTMLElement, questId:string, traderSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const swapped = editableQuest.moveTraderPenaltyUp(traderSelector.value);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
            }
            e.stopPropagation();
        }
    }

    static moveTraderPenaltyDown(target:HTMLElement, wrapper:HTMLElement, questId:string, traderSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            const swapped = editableQuest.moveTraderPenaltyDown(traderSelector.value);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
            }
            e.stopPropagation();
        }
    }

    static registerKappa(target:HTMLInputElement, questId:string) {
        target.onclick = (e) => {
            const editableQuest = EditSession.getModifiedQuest(questId);
            editableQuest.changeKappaRequired(target.checked);
            e.stopPropagation();
        }
    }
}