import { HideoutCrafts, HideoutCraftsImpl, RequiredItems, RewardItems } from "../../../../model/HideoutObject";
import { EditSession } from "./EditSession";

export class EditableHideoutCrafts {

    craft:HideoutCrafts;
    private changed:boolean = false;
    private readonly newCraft:boolean = false;

    constructor(stationId:string, level:number, craft?:HideoutCrafts) {
        if(craft) {
            this.craft = JSON.parse(JSON.stringify(craft));
        } else {
            this.craft = new HideoutCraftsImpl(stationId, level);
            this.newCraft = true;
            this.hasChanged();
        }
    }

    hasBeenChanged():boolean {
        return this.changed;
    }

    isNewCraft():boolean {
        return this.newCraft;
    }

    private hasChanged():void {
        this.changed = true
        EditSession.enableReviewButton()
    }

    addNewReward(itemId:string):RewardItems {
        const item = {id: itemId}
        const reward = {item: item, count: 1};
        this.craft.rewardItems.push(reward);
        this.hasChanged()
        return reward;
    }

    addNewRequired(itemId:string):RequiredItems {
        const item = {id: itemId}
        const reward = {item: item, count: 1, attributes: null};
        this.craft.requiredItems.push(reward);
        this.hasChanged()
        return reward;
    }

    changeTaskUnlock(questId:string) {
        if(questId === "") {
            this.craft.taskUnlock = null;
            return;
        }
        if(!this.craft.taskUnlock) {
            this.craft.taskUnlock = {id: ""}
        }
        this.craft.taskUnlock.id = questId;
        this.hasChanged()
    }

    changeDuration(duration:number) {
        this.craft.duration = duration
        this.hasChanged();
    }

    addItemRequired(itemId:string, count:number):RequiredItems {
        for(const requiredItem of this.craft.requiredItems) {
            if(requiredItem?.item?.id === itemId) {
                requiredItem.count = count;
                this.hasChanged();
                return null;
            }
        }
        const newItem = {id: itemId};
        const newRequiredItem = {item: newItem, count: count, attributes: null}
        if(count && count > 0) {
            newRequiredItem.count = count
        } else {
            newRequiredItem.count = 1
        }

        this.craft.requiredItems.push(newRequiredItem);
        this.hasChanged();
        return newRequiredItem;
    }

    removeItemRequired(itemId:string):boolean {
        for(let i = 0; i < this.craft.requiredItems.length; i++) {
            if(this.craft.requiredItems[i].item.id === itemId) {
                this.craft.requiredItems.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeItemRequiredId(previousId:string, newId:string):boolean {
        for(const requiredItem of this.craft.requiredItems) {
            if(requiredItem?.item?.id === previousId) {
                requiredItem.item.id = newId;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    moveItemRequiredUp(itemId:string):boolean {
        for(let i = 0; i < this.craft.requiredItems.length; i++) {
            if(this.craft.requiredItems[i].item.id === itemId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(this.craft.requiredItems, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    }

    moveItemRequiredDown(itemId:string):boolean {
        for(let i = 0; i < this.craft.requiredItems.length; i++) {
            if(this.craft.requiredItems[i].item.id === itemId) {
                if(this.craft.requiredItems.length === i + 1) {
                    return false;
                }
                this.swapElement(this.craft.requiredItems, i, i + 1);
                this.hasChanged();
                return true;
            }
        }
    }

    addItemReward(itemId:string, count:number):RewardItems {
        for(const rewardItem of this.craft.rewardItems) {
            if(rewardItem?.item?.id === itemId) {
                rewardItem.count = count;
                this.hasChanged();
                return null;
            }
        }
        const newItem = {id: itemId};
        const newRewardItem = {item: newItem, count: count}
        if(count && count > 0) {
            newRewardItem.count = count
        } else {
            newRewardItem.count = 1
        }

        this.craft.rewardItems.push(newRewardItem);
        this.hasChanged();
        return newRewardItem;
    }

    removeItemReward(itemId:string):boolean {
        for(let i = 0; i < this.craft.rewardItems.length; i++) {
            if(this.craft.rewardItems[i].item.id === itemId) {
                this.craft.rewardItems.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeItemRewardId(previousId:string, newId:string):boolean {
        for(const rewardItem of this.craft.rewardItems) {
            if(rewardItem?.item?.id === previousId) {
                rewardItem.item.id = newId;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    moveItemRewardUp(itemId:string):boolean {
        for(let i = 0; i < this.craft.rewardItems.length; i++) {
            if(this.craft.rewardItems[i].item.id === itemId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(this.craft.rewardItems, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    }

    moveItemRewardDown(itemId:string):boolean {
        for(let i = 0; i < this.craft.rewardItems.length; i++) {
            if(this.craft.rewardItems[i].item.id === itemId) {
                if(this.craft.rewardItems.length === i + 1) {
                    return false;
                }
                this.swapElement(this.craft.rewardItems, i, i + 1);
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

}