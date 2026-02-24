
import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { HideoutLevels } from "../../../../model/HideoutObject";
import { ItemUtils } from "../../items/utils/ItemUtils";
import { QuestsUtils } from "../../quests/utils/QuestsUtils";
import { HideoutComponent } from "../component/HideoutComponent";
import { HideoutRequest } from "../handlers/request/HideoutRequest";
import { HideoutMediator } from "../mediator/HideoutMediator";

export class HideoutBodyController {

    private static hideoutMediator:HideoutMediator;

    static setHideoutMeditor(mediator:HideoutMediator) {
        this.hideoutMediator = mediator;
    }

    static registerStationController(component:HideoutComponent, element:HTMLElement) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_LEVEL_HEADER_CLICK, component, null, element
            ))
            e.stopPropagation();
        }
    }


    static registerStationLevelController(component:HideoutComponent, level:HideoutLevels, element:HTMLElement) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_LEVEL_HEADER_CLICK, component, null, element, level
            ))
            e.stopPropagation();
        }
    }

    static registerRequirementsController(component:HideoutComponent, level:HideoutLevels, element:HTMLElement) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_LEVEL_REQUIREMENT_CLICK, component, null, element, level
            ))
            e.stopPropagation();
        }
    }

    static registerCraftsController(component:HideoutComponent, level:HideoutLevels, element:HTMLElement) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_LEVEL_CRAFT_CLICK, component, null, element, level
            ))
            e.stopPropagation();
        }
    }

    static registerHideoutNavigationClick(level:HideoutLevels, element:HTMLElement) {
        element.onclick = (e) => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_NAVIGATION, 
                DataEventConst.HIDEOUT_STATION_LEVEL_REQUIREMENT_NAVIGATION, null, null, element, level
            ))
            e.stopPropagation();
        }
    }

    static registerQuestSearch(element:HTMLElement, questId:string) {
        const quest = QuestsUtils.getQuestFromID(questId);
        element.onclick = (e) => {
            const request = new HideoutRequest(this.hideoutMediator, EventConst.QUEST_SEARCH, 
                DataEventConst.MOUSE_CLICK, null, null, element, null);
            request.quest = quest
            this.hideoutMediator.update(request);
            e.stopPropagation();
        }
    }

    // static registerMinusItemController(itemId:string, element:HTMLElement, inputElement:HTMLInputElement) {
    //     element.onclick = (e) => {
    //         ItemUtils.decreaseQuantity(itemId, 1);
    //         inputElement.value = String(ItemUtils.getItemCurrentQuantity(itemId));
    //         this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
    //             DataEventConst.HIDEOUT_PAGE_STATE_REFRESH, null, null, element
    //         ))
    //         e.stopPropagation();
    //     }
    // }

    // static registerPlusItemController(itemId:string, element:HTMLElement, inputElement:HTMLInputElement) {
    //     element.onclick = (e) => {
    //         ItemUtils.increaseQuantity(itemId, 1);
    //         inputElement.value = String(ItemUtils.getItemCurrentQuantity(itemId));
    //         this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
    //             DataEventConst.HIDEOUT_PAGE_STATE_REFRESH, null, null, element
    //         ))
    //         e.stopPropagation();
    //     }
    // }

    // static registerSetItemAmountController(itemId:string, inputElement:HTMLInputElement) {
    //     inputElement.onkeyup = (e) => {
    //         const quantity = parseInt(inputElement.value);
    //         if(Number.isInteger(quantity)) {
    //             ItemUtils.setItemQuantity(itemId, quantity);
    //             inputElement.value = String(ItemUtils.getItemCurrentQuantity(itemId));
    //             this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
    //                 DataEventConst.HIDEOUT_PAGE_STATE_REFRESH, null, null, inputElement
    //             ))
    //         }
    //         e.stopPropagation()
    //     }
    // }

    static registerItemNavigationController(itemId:string, element:HTMLElement) {
        element.onclick = (e) => {
            const request = new HideoutRequest(this.hideoutMediator, EventConst.ITEM_SEARCH, DataEventConst.MOUSE_CLICK
                , null, null, null, null, null, null);
            request.itemId = itemId
            request.notifyOthers = true;
            this.hideoutMediator.update(request);
            e.stopPropagation();
        }
    }

    static registerIconPopupController(div:HTMLDivElement, targetIcon:HTMLElement) {
        targetIcon.onmouseover = () => {
            div.style.display = ""
        }

        targetIcon.onmouseleave = () => {
            div.style.display = "none"
        }

        targetIcon.onmouseout = () => {
            div.style.display = "none"
        }
    }
}