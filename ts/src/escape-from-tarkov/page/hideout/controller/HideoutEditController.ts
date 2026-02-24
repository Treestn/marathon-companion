import { TraderMapper } from "../../../../adapter/TraderMapper";
import { TraderList } from "../../../constant/TraderConst";
import { HideoutLevels, StationLevelRequirements, TraderRequirements } from "../../../../model/HideoutObject";
import { ItemsElementUtils } from "../../../utils/ItemsElementUtils";
import { ImageUtils } from "../../map/utils/ImageUtils";
import { EditableHideoutCrafts } from "../../quests/edit/EditableHideoutCrafts";
import { EditSession } from "../../quests/edit/EditSession";
import { HideoutBodyBuilder } from "../builder/helper/HideoutBodyBuilder";
import { HideoutUtils } from "../utils/HideoutUtils";

export class HideoutEditController {

    static addHideout(hideoutLevel:HideoutLevels) {
        EditSession.addModifiedHideout(hideoutLevel);
    }

    static registerAddCraft(target:HTMLElement, wrapper:HTMLElement, stationId:string, stationLevel:number) {
        target.onclick = (e) => {
            const newCraft = new EditableHideoutCrafts(stationId, stationLevel);
            EditSession.addModifiedHideoutCraft(newCraft)

            const station = HideoutUtils.getStation(stationId);

            const component = HideoutBodyBuilder.createEditCraftInformation(newCraft.craft, (station.crafts.length + EditSession.getEditedHideoutCrafts().length + 1)%2 ? "#23231f" : "#2b2b27");
            wrapper.insertBefore(component, wrapper.lastChild);

            HideoutBodyBuilder.updateSelect2();

            e.stopPropagation()
        }
    }

    static registerRemoveCraft(target:HTMLElement, wrapper:HTMLElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        target.onclick = (e) => {
            EditSession.removeHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));

            wrapper.remove()

            e.stopPropagation()
        }
    }

    static changeCraftHours(target:HTMLInputElement, minutesInput:HTMLInputElement, secondsInput:HTMLInputElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        let previousHours = parseInt(target.value);
        target.onchange = (e) => {
            const hours:number = parseInt(target.value);
            const minutes = parseInt(minutesInput.value) * 60;
            const seconds = parseInt(secondsInput.value);
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                if(!isNaN(hours) && hours >= 0) {
                    craft.changeDuration(hours*3600 + minutes + seconds);
                    target.value = String(hours)
                } else {
                    const duration = previousHours*3600 + minutes + seconds
                    craft.changeDuration(duration);
                    target.value = String(previousHours);
                }
            }
            previousHours = parseInt(target.value);
        }
    }

    static changeCraftMinutes(target:HTMLInputElement, hoursInput:HTMLInputElement, secondsInput:HTMLInputElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        let previousMinutes = parseInt(target.value);
        target.onchange = (e) => {
            const minutes:number = parseInt(target.value);
            const hours = parseInt(hoursInput.value) * 3600;
            const seconds = parseInt(secondsInput.value);
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                if(!isNaN(minutes) && minutes >= 0) {
                    craft.changeDuration(hours + minutes*60 + seconds);
                    target.value = String(minutes)
                } else {
                    const duration = hours + previousMinutes*60 + seconds
                    craft.changeDuration(duration);
                    target.value = String(previousMinutes);
                }
            }
            previousMinutes = parseInt(target.value);
        }
    }

    static changeCraftSeconds(target:HTMLInputElement, hoursInput:HTMLInputElement, minutesInput:HTMLInputElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        let previousSeconds = parseInt(target.value);
        target.onchange = (e) => {
            const seconds:number = parseInt(target.value);
            const hours = parseInt(hoursInput.value) * 3600;
            const minutes = parseInt(minutesInput.value) * 60;
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                if(!isNaN(minutes) && minutes >= 0) {
                    craft.changeDuration(hours + minutes + seconds);
                    target.value = String(seconds)
                } else {
                    const duration = hours + minutes + previousSeconds
                    craft.changeDuration(duration);
                    target.value = String(previousSeconds);
                }
            }
            previousSeconds = parseInt(target.value);
        }
    }

    static registerAddCraftRewardItem(target:HTMLElement, wrapper:HTMLElement, stationId:string, stationLevel:number, rewardSelectWrapper:HTMLElement) {
        target.onclick = (e) => {
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(wrapper));

            if(craft) {
                let defaultItem:string = null;
                for(const item of ItemsElementUtils.getData().items) {
                    let alreadyTaken = false;
                    for(const itemReward of craft.craft.rewardItems) {
                        if(itemReward.item.id === item.id) {
                            alreadyTaken = true;
                        }
                    }
                    if(!alreadyTaken) {
                        defaultItem = item.id;
                        break;
                    }
                }
                const reward = craft.addNewReward(defaultItem);

                const component = HideoutBodyBuilder.createEditCraftRewardItem(craft.craft, reward, rewardSelectWrapper);
                wrapper.appendChild(component);
    
                HideoutBodyBuilder.updateSelect2();
            }

            e.stopPropagation()
        }
    }

    static removeCraftItemReward(target:HTMLElement, wrapper:HTMLElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement, selector:HTMLSelectElement) {
        target.onclick = (e) => {
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                const removed = craft.removeItemReward(selector.value);
                if(removed) {
                    wrapper.remove();
                }
            }
            e.stopPropagation();
        }
    }

    static registerCraftItemRewardSelector(target:HTMLSelectElement, image:HTMLImageElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        let previousRequirementId = target.value;
        target.onchange = (e) => {
            const rewards = this.getAllRewardsItemsFromWrapper(rewardWrapper)
            rewards.push(previousRequirementId)
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, rewards);
            if(craft) {
                let usedId = false;
                for(const item of craft.craft.rewardItems) {
                    if(item.item.id === target.value) {
                        usedId = true;
                        break;
                    }
                }
                if(!usedId) {
                    craft.changeItemRewardId(previousRequirementId, target.value);
                    ItemsElementUtils.getItemInformation(target.value).then(data => {
                        ImageUtils.loadImage(image, data.baseImageLink, 1);
                    })
                    previousRequirementId = target.value
                } else {
                    target.value = previousRequirementId;
                }
            }
            e.stopPropagation();
        }
    }

    static registerCraftItemRewardCount(target:HTMLInputElement, itemSelector:HTMLSelectElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        target.onchange = (e) => {
            const number:number = parseInt(target.value);
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                if(!isNaN(number) && number >= 1) {
                    craft.addItemReward(itemSelector.value, number);
                    target.value = String(number)
                } else {
                    craft.addItemReward(itemSelector.value, 1);
                    target.value = String(1);
                }
            }
            e.stopPropagation();
        }
    }

    static moveCraftItemRewardUp(target:HTMLElement, wrapper:HTMLElement, itemSelector:HTMLSelectElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        target.onclick = (e) => {
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                const swapped = craft.moveItemRewardUp(itemSelector.value);
                if(swapped) {
                    wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
                }
            }
            e.stopPropagation();
        }
    }

    static moveCraftItemRewardDown(target:HTMLElement, wrapper:HTMLElement, itemSelector:HTMLSelectElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        target.onclick = (e) => {
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                const swapped = craft.moveItemRewardDown(itemSelector.value);
                if(swapped) {
                    wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
                }
            }
            e.stopPropagation();
        }
    }

    static registerAddCraftRequiredItem(target:HTMLElement, wrapper:HTMLElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        target.onclick = (e) => {
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));

            if(craft) {
                let defaultItem:string = null;
                for(const item of ItemsElementUtils.getData().items) {
                    let alreadyTaken = false;
                    for(const itemRequired of craft.craft.requiredItems) {
                        if(itemRequired.item.id === item.id) {
                            alreadyTaken = true;
                        }
                    }
                    if(!alreadyTaken) {
                        defaultItem = item.id;
                        break;
                    }
                }
                const required = craft.addNewRequired(defaultItem);

                const component = HideoutBodyBuilder.createEditCraftRequiredItem(craft.craft, required, rewardWrapper);
                wrapper.insertBefore(component, target);
    
                HideoutBodyBuilder.updateSelect2();
            }

            e.stopPropagation()
        }
    }

    static removeCraftItemRequired(target:HTMLElement, wrapper:HTMLElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement, selector:HTMLSelectElement) {
        target.onclick = (e) => {
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                const removed = craft.removeItemRequired(selector.value);
                if(removed) {
                    wrapper.remove();
                }
            }
            e.stopPropagation();
        }
    }

    static registerCraftItemRequiredSelector(target:HTMLSelectElement, image:HTMLImageElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        let previousRequirementId = target.value;
        target.onchange = (e) => {
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                let usedId = false;
                for(const item of craft.craft.requiredItems) {
                    if(item.item.id === target.value) {
                        usedId = true;
                        break;
                    }
                }
                if(!usedId) {
                    craft.changeItemRequiredId(previousRequirementId, target.value);
                    ItemsElementUtils.getItemInformation(target.value).then(data => {
                        ImageUtils.loadImage(image, data.baseImageLink, 1);
                    })
                    previousRequirementId = target.value
                } else {
                    target.value = previousRequirementId;
                }
            }
            e.stopPropagation();
        }
    }

    static registerCraftItemRequiredCount(target:HTMLInputElement, itemSelector:HTMLSelectElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        target.onchange = (e) => {
            const number:number = parseInt(target.value);
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                if(!isNaN(number) && number >= 1) {
                    craft.addItemRequired(itemSelector.value, number);
                    target.value = String(number)
                } else {
                    craft.addItemRequired(itemSelector.value, 1);
                    target.value = String(1);
                }
            }
            e.stopPropagation();
        }
    }

    static moveCraftItemRequiredUp(target:HTMLElement, wrapper:HTMLElement, itemSelector:HTMLSelectElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        target.onclick = (e) => {
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                const swapped = craft.moveItemRequiredUp(itemSelector.value);
                if(swapped) {
                    wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
                }
            }
            e.stopPropagation();
        }
    }

    static moveCraftItemRequiredDown(target:HTMLElement, wrapper:HTMLElement, itemSelector:HTMLSelectElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        target.onclick = (e) => {
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));
            if(craft) {
                const swapped = craft.moveItemRequiredDown(itemSelector.value);
                if(swapped) {
                    wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
                }
            }
            e.stopPropagation();
        }
    }

    static registerCraftTaskUnlock(target:HTMLSelectElement, stationId:string, stationLevel:number, rewardWrapper:HTMLElement) {
        target.onchange = (e) => {
            const craft = EditSession.getEditedHideoutCraft(stationId, stationLevel, this.getAllRewardsItemsFromWrapper(rewardWrapper));

            if(craft) {
                craft.changeTaskUnlock(target.value)
            }

            e.stopPropagation();
        }
    }

    private static getAllRewardsItemsFromWrapper(requiredItemsWrapper:HTMLElement): string[] {
        const list:string[] = [];

        const selectList = requiredItemsWrapper.getElementsByClassName("quest-edit-reward-item-selector");
        for(const select of selectList) {
            if(select instanceof HTMLSelectElement) {
                list.push(select.value);
            }
        }

        return list;
    }

    static registerAddStationRequirement(target:HTMLElement, wrapper:HTMLElement, levelId:string) {
        target.onclick = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const hideoutLevel = editableHideout.getHideoutLevelById(levelId);
            let defaultStationId:string = null;
            for(const temp of HideoutUtils.getData().hideoutStations) {
                let alreadyTaken = false;
                for(const requirement of hideoutLevel.stationLevelRequirements) {
                    if(requirement.station.id === temp.id) {
                        alreadyTaken = true;
                    }
                }
                if(!alreadyTaken) {
                    defaultStationId = temp.id;
                    break;
                }
            }
            if(defaultStationId) {
                const stationRequirement:StationLevelRequirements = editableHideout.addStationRequirement(defaultStationId, 1, levelId);
                // If we have one, it did not exist before
                if(stationRequirement) {
                    const component = HideoutBodyBuilder.createEditHideoutStationRequirementComponent(hideoutLevel, stationRequirement);
                    wrapper.insertBefore(component, wrapper.lastChild);
                }
            }

            e.stopPropagation();
        }
    }

    static removeStationRequirement(target:HTMLElement, wrapper:HTMLElement, levelId:string, selector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const removed = editableHideout.removeStationRequirement(selector.value, levelId);
            if(removed) {
                wrapper.remove();
            }
            e.stopPropagation();
        }
    }

    static stationRequirementSelector(target:HTMLSelectElement, levelTarget:HTMLSelectElement, levelId:string, image:HTMLImageElement) {
        let previousStationId = target.value;
        target.onchange = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const hideoutLevel = editableHideout.getHideoutLevelById(levelId);
            let usedId = false;
            for(const stationRequirement of hideoutLevel.stationLevelRequirements) {
                if(stationRequirement.station.id === target.value) {
                    usedId = true;
                    break;
                }
            }
            if(!usedId) {
                editableHideout.changeStationRequirement(previousStationId, target.value, levelId, 1);
                for(const station of HideoutUtils.getData().hideoutStations) {
                    if(target.value === station.id) {
                        ImageUtils.loadImage(image, station.imageLink, 1);
                        break;
                    }
                }
                previousStationId = target.value

                const station = HideoutUtils.getStation(target.value);
                while (levelTarget.options.length > 0) {
                    levelTarget.remove(0);
                }
                for(const stationLevel of station.levels) {
                    if(stationLevel.level === 1) {
                        levelTarget.appendChild(new Option(String(stationLevel.level), stationLevel.id, true, true));
                    } else {
                        levelTarget.appendChild(new Option(String(stationLevel.level), stationLevel.id));
                    }
                }
            } else {
                target.value = previousStationId;
            }
            e.stopPropagation();
        }
    }

    static stationRequirementLevelSelector(target:HTMLSelectElement, stationTarget:HTMLSelectElement, levelId:string) {
        target.onchange = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            editableHideout.changeStationRequirementLevel(Number.parseInt(target.value), stationTarget.value, levelId);
            e.stopPropagation();
        }
    }

    static registerAddTraderRequirement(target:HTMLElement, wrapper:HTMLElement, levelId:string) {
        target.onclick = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const hideoutLevel = editableHideout.getHideoutLevelById(levelId);
            let defaultTraderId:string = null;
            for(const temp of TraderList) {
                let alreadyTaken = false;
                for(const requirement of hideoutLevel.traderRequirements) {
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
                const traderRequirement:TraderRequirements = editableHideout.addTraderRequirement(defaultTraderId, 1, levelId);
                // If we have one, it did not exist before
                if(traderRequirement) {
                    const component = HideoutBodyBuilder.createEditTraderStandingComponent(hideoutLevel, traderRequirement);
                    wrapper.insertBefore(component, wrapper.lastChild);
                }
            }

            e.stopPropagation();
        }
    }

    static removeTraderRequirement(target:HTMLElement, wrapper:HTMLElement, levelId:string, selector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const removed = editableHideout.removeTraderRequirement(selector.value, levelId);
            if(removed) {
                wrapper.remove();
            }
            e.stopPropagation();
        }
    }

    static traderRequirementSelector(target:HTMLSelectElement, levelId:string, image:HTMLImageElement) {
        let previousTraderId = target.value;
        target.onchange = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const hideoutLevel = editableHideout.getHideoutLevelById(levelId);
            let usedId = false;
            for(const traderRequirement of hideoutLevel.traderRequirements) {
                if(traderRequirement.trader.id === target.value) {
                    usedId = true;
                    break;
                }
            }
            if(!usedId) {
                editableHideout.changeTraderRequirement(previousTraderId, target.value, levelId);
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

    static traderRequirementCount(target:HTMLSelectElement, levelId:string, traderSelector:HTMLSelectElement) {
        target.onchange = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            editableHideout.addTraderRequirement(traderSelector.value, Number.parseInt(target.value), levelId);
            e.stopPropagation();
        }
    }

    static moveTraderRequirementUp(target:HTMLElement, wrapper:HTMLElement, levelId:string, traderSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const swapped = editableHideout.moveTraderRequirementUp(traderSelector.value, levelId);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
            }
            e.stopPropagation();
        }
    }

    static moveTraderRequirementDown(target:HTMLElement, wrapper:HTMLElement, levelId:string, traderSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const swapped = editableHideout.moveTraderRequirementDown(traderSelector.value, levelId);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
            }
            e.stopPropagation();
        }
    }

    static registerAddItemReward(target:HTMLElement, wrapper:HTMLElement, levelId:string) {
        target.onclick = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const level = editableHideout.getHideoutLevelById(levelId);
            let defaultItem:string = null;
            for(const item of ItemsElementUtils.getData().items) {
                let alreadyTaken = false;
                for(const itemRequirement of level.itemRequirements) {
                    if(itemRequirement.item.id === item.id) {
                        alreadyTaken = true;
                    }
                }
                if(!alreadyTaken) {
                    defaultItem = item.id;
                    break;
                }
            }
            const itemRequirement = editableHideout.addItemRequirement(defaultItem, 1, level.id);
            // If we have one, it did not exist before
            if(itemRequirement) {
                const component = HideoutBodyBuilder.createEditItem(level, itemRequirement);
                wrapper.insertBefore(component, wrapper.lastChild);
                HideoutBodyBuilder.updateSelect2();
            }
            e.stopPropagation();
        }
    }

    static removeItemRequirement(target:HTMLElement, wrapper:HTMLElement, levelId:string, selector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const removed = editableHideout.removeItemRequirement(selector.value, levelId);
            if(removed) {
                wrapper.remove();
            }
            e.stopPropagation();
        }
    }

    static itemRequirementSelector(target:HTMLSelectElement, levelId:string, image:HTMLImageElement) {
        let previousRequirementId = target.value;
        target.onchange = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const level = editableHideout.getHideoutLevelById(levelId);
            let usedId = false;
            for(const item of level.itemRequirements) {
                if(item.item.id === target.value) {
                    usedId = true;
                    break;
                }
            }
            if(!usedId) {
                editableHideout.changeItemRequirementId(previousRequirementId, target.value, levelId);
                ItemsElementUtils.getItemInformation(target.value).then(data => {
                    ImageUtils.loadImage(image, data.baseImageLink, 1);
                })
                previousRequirementId = target.value
            } else {
                target.value = previousRequirementId;
            }
            e.stopPropagation();
        }
    }

    static itemRequirementCount(target:HTMLInputElement, levelId:string, itemSelector:HTMLSelectElement) {
        target.onchange = (e) => {
            const number:number = parseInt(target.value);
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            if(!isNaN(number) && number >= 1) {
                editableHideout.addItemRequirement(itemSelector.value, number, levelId);
                target.value = String(number)
            } else {
                editableHideout.addItemRequirement(itemSelector.value, 1, levelId);
                target.value = String(1);
            }
            e.stopPropagation();
        }
    }

    static moveItemRequirementUp(target:HTMLElement, wrapper:HTMLElement, levelId:string, itemSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const swapped = editableHideout.moveItemRequirementUp(itemSelector.value, levelId);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper, wrapper.previousSibling)
            }
            e.stopPropagation();
        }
    }

    static moveItemRequirementDown(target:HTMLElement, wrapper:HTMLElement, levelId:string, itemSelector:HTMLSelectElement) {
        target.onclick = (e) => {
            const editableHideout = EditSession.getModifiedHideoutByLevelId(levelId);
            const swapped = editableHideout.moveItemRequirementDown(itemSelector.value, levelId);
            if(swapped) {
                wrapper.parentElement.insertBefore(wrapper.nextSibling, wrapper)
            }
            e.stopPropagation();
        }
    }

}