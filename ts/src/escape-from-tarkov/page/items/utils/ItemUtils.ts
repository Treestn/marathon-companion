import { IProgression, Progression } from "../../../../model/IPlayerProgression";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";

export class ItemUtils {

    static isEnough(itemId:string, requiredQuantity:number) {
        const itemState = PlayerProgressionUtils.getItemState(itemId);
        return itemState && itemState.currentQuantity >= requiredQuantity
    }

    static getItemCurrentQuantity(itemId:string) {
        const itemState = PlayerProgressionUtils.getItemState(itemId);
        return itemState ? itemState.currentQuantity : 0;
    }

    static increaseQuantity(itemId:string, quantity:number) {
        const itemState = PlayerProgressionUtils.getItemState(itemId);
        if(itemState) {
            if(itemState.currentQuantity < 0) {
                itemState.currentQuantity = 0;
            }
            itemState.currentQuantity += quantity;
            PlayerProgressionUtils.save();
        } else {
            console.log(`Could not increase item quantity for id: ${itemId}`);
        }
    }

    static decreaseQuantity(itemId:string, quantity:number) {
        const itemState = PlayerProgressionUtils.getItemState(itemId);
        if(itemState) {
            if(itemState.currentQuantity - quantity < 0) {
                itemState.currentQuantity = 0;
            } else {
                itemState.currentQuantity -= quantity;
            }
            PlayerProgressionUtils.save();
        } else {
            console.log(`Could not decrease item quantity for id: ${itemId}`);
        }
    }

    static decreaseQuantityRequired(itemId:string, quantity:number) {
        const itemState = PlayerProgressionUtils.getItemState(itemId);
        if(itemState) {
            itemState.requiredQuantity -= quantity;
            PlayerProgressionUtils.save();
        } else {
            console.log(`Could not decrease item quantity required for id: ${itemId}`);
        }
    }

    static giveItemBack(itemId:string, quantity:number, progression?:IProgression) {
        const itemState = PlayerProgressionUtils.getItemState(itemId, progression);
        if(itemState) {
            itemState.currentQuantity += quantity;
            itemState.requiredQuantity += quantity;
            PlayerProgressionUtils.save();
        } else {
            console.log(`Could not give item quantity back required for id: ${itemId}`);
        }
    }

    static giveItem(itemId:string, quantity:number, progression?:IProgression, stopAtZero?:boolean) {
        const itemState = PlayerProgressionUtils.getItemState(itemId, progression);
        if(itemState) {
            if(stopAtZero) {
                if(itemState.currentQuantity - quantity < 0) {
                    itemState.currentQuantity = 0;
                } else {
                    itemState.currentQuantity -= quantity;
                }
            } else {
                itemState.currentQuantity -= quantity;
            }
            
            if(itemState.requiredQuantity - quantity < 0) {
                itemState.requiredQuantity = 0;
            } else {
                itemState.requiredQuantity -= quantity;
            }
            PlayerProgressionUtils.save();
        } else {
            console.log(`Could not give item quantity required for id: ${itemId}`);
        }
    }

    static setItemQuantity(itemId:string, quantity:number) {
        const itemState = PlayerProgressionUtils.getItemState(itemId);
        if(itemState) {
            if(quantity < 0) {
                itemState.currentQuantity = 0;
            } else {
                itemState.currentQuantity = quantity;
            }
            PlayerProgressionUtils.save();
        } else {
            console.log(`Could not set item quantity for id: ${itemId}`);
        }
    }

}