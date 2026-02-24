import { ItemState } from "../../../../model/IPlayerProgression";
import { AppConfigUtils } from "../../../utils/AppConfigUtils";
import { ItemsUtils } from "../../../utils/ItemsUtils";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils"
import { ItemFilterUtils } from "./ItemFilterUtils";

export class ItemsHeaderUtils {

    static resolveAllHeaderState() {
        const headerList = document.getElementsByClassName("item-component-wrapper");
        const progressionType = AppConfigUtils.getAppConfig().userSettings.getProgressionType();
        for(const header of headerList) {
            if(header instanceof HTMLElement) {
                this.resolveHeaderState(header.id, header, null, true, ItemsUtils.getQuestRequiredAmount(), ItemsUtils.getHideoutRequiredAmount(null, progressionType))
            }
        }
    }

    static resolveHeaderState(itemId:string, headerElement:HTMLElement, completed?:boolean, 
            isItemPage?:boolean, questRequirement?:Map<string, number>, hideoutRequirement?:Map<string, number>) {
        const itemState = PlayerProgressionUtils.getItemState(itemId);
        if(itemState) {
            this.resolveInputText(headerElement, itemState)
            if(isItemPage) {
                if(ItemFilterUtils.getQuest() && questRequirement) {
                    const requiredQuantity:number = this.resolveText(headerElement, itemState, completed, isItemPage, questRequirement.get(itemId));
                    this.resolveImageState(headerElement, itemState, requiredQuantity, completed);
                    return;
                } else if(ItemFilterUtils.getHideout() && hideoutRequirement) {
                    const requiredQuantity:number = this.resolveText(headerElement, itemState, completed, isItemPage, hideoutRequirement.get(itemId));
                    this.resolveImageState(headerElement, itemState, requiredQuantity, completed);
                    return;
                }
            } 
            const requiredQuantity:number = this.resolveText(headerElement, itemState, completed, isItemPage);
            this.resolveImageState(headerElement, itemState, requiredQuantity, completed);
        }
    }

    private static resolveImageState(headerElement:HTMLElement, itemState:ItemState, requiredQuantity:number, completed?:boolean) {
        const imgList = headerElement.getElementsByClassName("item-requirement-image")
        if(imgList && imgList.length > 0 && imgList[0] instanceof HTMLElement) {
            if(completed || itemState.requiredQuantity === 0) {
                imgList[0].parentElement.style.boxShadow = `inset 0 0 28px 3px rgb(74 57 91)`;
            } else if(itemState.currentQuantity >= requiredQuantity) {
                imgList[0].parentElement.style.boxShadow = `inset 0 0 28px 3px rgb(37 69 68)`;
            } else {
                imgList[0].parentElement.style.boxShadow = `inset 0 0 28px 3px #2f1115`;
            }

        }
    }

    private static resolveInputText(headerElement:HTMLElement, itemState:ItemState) {
        const inputList = headerElement.getElementsByClassName("item-amount-input");
        if(inputList && inputList.length > 0 && inputList[0] instanceof HTMLInputElement) {
            inputList[0].value = String(itemState.currentQuantity < 0 ? 0 : itemState.currentQuantity);
        }
    }

    private static resolveText(headerElement:HTMLElement, itemState:ItemState, completed?:boolean, isItemPage?:boolean, requiredAmount?:number):number {
        const itemQuantityTextList = headerElement.getElementsByClassName("item-required-amount");
        if(itemQuantityTextList && itemQuantityTextList.length > 0 && itemQuantityTextList[0] instanceof HTMLElement) {
            const text = itemQuantityTextList[0].textContent.split(" / ");
            if(isItemPage) {
                return this.resolveItemPageText(itemQuantityTextList[0], text, itemState, completed, requiredAmount)
            } else {
                return this.resolveOtherPageText(itemQuantityTextList[0], text, itemState, completed)
            }
        }
    }

    private static resolveItemPageText(itemQuantityText:HTMLElement, text:string[], itemState:ItemState, completed?:boolean, requiredAmount?:number):number {
        let requiredQuantity:number = itemState.requiredQuantity;
        if(requiredAmount) {
            requiredQuantity = requiredAmount;
        }
        text[1] = String(requiredQuantity);
        if(completed) {
            text[0] = text[1];
        } else if(requiredQuantity === 0) {
            text[0] = String(itemState.overallQuantity);
            text[1] = String(itemState.overallQuantity);
        } else {
            text[0] = (itemState.currentQuantity < 0 ? 0 : itemState.currentQuantity).toString();
        }

        itemQuantityText.textContent = text.join(" / ");
        if(completed || requiredQuantity === 0) {
            itemQuantityText.style.color = "rgb(123 95 150)";
        } else if(itemState.currentQuantity >= requiredQuantity) {
            itemQuantityText.style.color = "rgb(95 173 170)";
        } else {
            itemQuantityText.style.color = "rgb(195 70 87)";
        }
        return requiredQuantity;
    }

    private static resolveOtherPageText(itemQuantityText:HTMLElement, text:string[], itemState:ItemState, completed?:boolean):number {
        let requiredQuantity:number = Number(text[1]);

        if(completed) {
            text[0] = text[1];
        } else {
            text[0] = (itemState.currentQuantity < 0 ? 0 : itemState.currentQuantity).toString();
        }

        itemQuantityText.textContent = text.join(" / ");
        if(completed) {
            itemQuantityText.style.color = "#9f9f85";
        } else if(itemState.currentQuantity >= requiredQuantity) {
            itemQuantityText.style.color = "#53af53";
        } else {
            itemQuantityText.style.color = "#ff7373";
        }
        return requiredQuantity;
    }
}