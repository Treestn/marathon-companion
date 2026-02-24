import { ObjectiveTypeConst } from "../../../constant/EditQuestConst";
import { Quest } from "../../../../model/quest/IQuestsElements";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { ItemsHeaderUtils } from "../../items/utils/ItemsHeaderUtils";
import { QuestsUtils } from "./QuestsUtils";

export class QuestBodyUtils {

    static changeQuestGoalState(container:HTMLElement, completed:boolean) {
        if(completed) {
            container.classList.add("quest-goal-completed")
        } else {
            container.classList.remove("quest-goal-completed");
        }
    }

    static changeQuestObjectiveLocationState(imageId:string, completed:boolean) {
        const image = document.getElementById(imageId);
        if(image) {
            if(completed) {
                image.parentElement.classList.add("quest-image-location-container-completed")
            } else {
                image.parentElement.classList.remove("quest-image-location-container-completed")
            }
        } else {
            console.log(`Could not find the image with id: ${imageId}`);
        }
    }

    static refreshItemState(itemId:string, quest?:Quest) {
        const itemsElementList = document.getElementsByClassName("item-requirement-image");
        for(const itemElement of itemsElementList) {
            if(itemElement && itemElement.id === itemId && itemElement instanceof HTMLElement) {
                if(quest) {
                    this.resolveItemElementState(itemElement.parentElement.parentElement, itemId, quest);
                } else {
                    const questFromId = QuestsUtils.getQuestFromID(itemElement.parentElement.parentElement.id);
                    if(questFromId) {
                        this.resolveItemElementState(itemElement.parentElement.parentElement, itemId, questFromId);
                    } else {
                        console.log(`Couldnt find quest with id: ${itemElement.parentElement.parentElement.id} using the element`);
                    }
                }
            }
        }
    }

    static refreshAllItemState() {
        const itemsElementList = document.getElementsByClassName("item-requirement-image");
        for(const itemElement of itemsElementList) {
            if(itemElement && itemElement instanceof HTMLElement) {
                const quest = QuestsUtils.getQuestFromID(itemElement.parentElement.parentElement.id);
                if(quest) {
                    this.resolveItemElementState(itemElement.parentElement.parentElement, itemElement.id, quest);
                } else {
                    console.log(`Couldnt find quest with id: ${itemElement.parentElement.parentElement.id} using the element while refreshing all elements`);
                }
            }
        }
    }

    static resolveItemElementState(itemElement:HTMLElement, itemId:string, quest:Quest) {
        const questState = PlayerProgressionUtils.getQuestState(quest.id);
        if(!questState) {
            console.log(`Quest state not found for quest id: ${quest.id}`);
            return;
        }
        for(const obj of quest.objectives) {
            if(obj.item && obj.item.id === itemId) {
                const objState = PlayerProgressionUtils.getObjectiveState(quest.id, obj.id);
                if(!objState) {
                    console.log(`Quest objective state not found for quest id: ${quest.id} and obj id: ${obj.id}`);
                    return;
                }
                if(obj.type === ObjectiveTypeConst.GIVE_ITEM.type || obj.type === ObjectiveTypeConst.FIND_ITEM.type) {
                    if(questState.completed || objState.completed) {
                        ItemsHeaderUtils.resolveHeaderState(itemId, itemElement, true);
                    } else {
                        ItemsHeaderUtils.resolveHeaderState(itemId, itemElement);
                    }
                    continue;
                }
            } 
        }
    }
}