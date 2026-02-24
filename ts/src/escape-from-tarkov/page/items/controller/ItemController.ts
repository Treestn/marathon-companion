import { PageConst } from "../../../constant/PageConst";
import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { HideoutLevels, HideoutStations } from "../../../../model/HideoutObject";
import { Quest } from "../../../../model/quest/IQuestsElements";
import { HideoutRequest } from "../../hideout/handlers/request/HideoutRequest";
import { HideoutMediator } from "../../hideout/mediator/HideoutMediator";
import { QuestRequest } from "../../quests/handlers/request/QuestRequest";
import { QuestMediator } from "../../quests/mediator/QuestMediator";
import { ItemsComponent } from "../component/ItemsComponent";
import { ItemsRequest } from "../handlers/request/ItemsRequest";
import { ItemsMediator } from "../mediator/ItemsMediator";
import { ItemUtils } from "../utils/ItemUtils";

export class ItemController {

    private static hideoutMediator:HideoutMediator;
    private static questMediator:QuestMediator;
    private static itemMediator:ItemsMediator;

    static setHideoutMeditor(mediator:HideoutMediator) {
        this.hideoutMediator = mediator;
    }

    static setQuestMediator(mediator:QuestMediator) {
        this.questMediator = mediator;
    }

    static setItemsMediator(mediator:ItemsMediator) {
        this.itemMediator = mediator;
    }

    static registerItemClick(component:ItemsComponent, element:HTMLElement) {
        element.onclick = (e) => {
            this.itemMediator.update(new ItemsRequest(this.itemMediator, EventConst.ITEMS_EVENT, 
                DataEventConst.ITEM_CLICK, component.itemId, null, element, component
            ))
            e.stopPropagation()
        }
    }

    static registerMinusItemController(itemId:string, element:HTMLElement, inputElement:HTMLInputElement, runner:string, header?:HTMLElement) {
        element.onclick = (e) => {
            ItemUtils.decreaseQuantity(itemId, 1);
            inputElement.value = String(ItemUtils.getItemCurrentQuantity(itemId));
            switch(runner) {
                case PageConst.QUESTS_PAGE: this.updateQuestPage(element, itemId); break;
                case PageConst.HIDEOUT_PAGE: this.updateHideoutPage(element, itemId); break;
                case PageConst.ITEMS_PAGE: this.updateItemsPage(element, itemId, header); break;
            }
            e.stopPropagation()
        }
    }

    static registerPlusItemController(itemId:string, element:HTMLElement, inputElement:HTMLInputElement, runner:string, header?:HTMLElement) {
        element.onclick = (e) => {
            ItemUtils.increaseQuantity(itemId, 1);
            inputElement.value = String(ItemUtils.getItemCurrentQuantity(itemId));
            switch(runner) {
                case PageConst.QUESTS_PAGE: this.updateQuestPage(element, itemId); break;
                case PageConst.HIDEOUT_PAGE: this.updateHideoutPage(element, itemId); break;
                case PageConst.ITEMS_PAGE: this.updateItemsPage(element, itemId, header); break;
            }
            e.stopPropagation()
        }
    }

    static registerSetItemAmountController(itemId:string, inputElement:HTMLInputElement, runner:string, header?:HTMLElement) {
        inputElement.onkeyup = (e) => {
            if(inputElement.value === "") {
                return;
            }
            const quantity = parseInt(inputElement.value);
            if(Number.isInteger(quantity)) {
                ItemUtils.setItemQuantity(itemId, quantity);
                inputElement.value = String(ItemUtils.getItemCurrentQuantity(itemId));
                switch(runner) {
                    case PageConst.QUESTS_PAGE: this.updateQuestPage(inputElement, itemId); break;
                    case PageConst.HIDEOUT_PAGE: this.updateHideoutPage(inputElement, itemId); break;
                    case PageConst.ITEMS_PAGE: this.updateItemsPage(inputElement, itemId, header); break;
                }
            } else {
                inputElement.value = String(ItemUtils.getItemCurrentQuantity(itemId));
            }
            e.stopPropagation()
        }
        inputElement.onclick = (e) => {
            e.stopPropagation()
        }
        inputElement.addEventListener("focusout", (e) => {
            console.log("focus out");
            if(inputElement.value === "") {
                inputElement.value = String(ItemUtils.getItemCurrentQuantity(itemId));
            }
            e.stopPropagation()
        });
    }

    static registerHideoutClick(element:HTMLElement, hideoutStation:HideoutStations, hideoutLevel:HideoutLevels) {
        element.onclick = () => {
            const request = new ItemsRequest(this.itemMediator, EventConst.HIDEOUT_SEARCH, DataEventConst.MOUSE_CLICK,
                null, null, element);
            request.hideoutStation = hideoutStation;
            request.hideoutLevel = hideoutLevel;
            request.notifyOthers = true;
            this.itemMediator.update(request)
        };
    }

    static registerQuestClick(element:HTMLElement, quest:Quest) {
        element.onclick = () => {
            const request = new ItemsRequest(this.itemMediator, EventConst.QUEST_SEARCH, DataEventConst.MOUSE_CLICK,
                null, null, element);
            request.quest = quest
            request.notifyOthers = true;
            this.itemMediator.update(request)
        };
    }

    private static updateQuestPage(element:HTMLElement, itemId:string) {
        const request = new QuestRequest(this.itemMediator, EventConst.QUEST_UPDATE, DataEventConst.ITEM_STATE_CHANGED,
            null, null, element)
        request.itemId = itemId
        this.questMediator.update(request)
    }

    private static updateHideoutPage(element:HTMLElement, itemId:string) {
        const request = new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
            DataEventConst.ITEM_STATE_CHANGED, null, null, element
        );
        request.itemId = itemId;
        this.hideoutMediator.update(request)
    }

    private static updateItemsPage(element:HTMLElement, itemId:string, header?:HTMLElement) {
        this.itemMediator.update(new ItemsRequest(this.itemMediator, EventConst.ITEMS_EVENT, 
            DataEventConst.ITEM_STATE_CHANGED, itemId, null, header
        ))
    }
    
} 