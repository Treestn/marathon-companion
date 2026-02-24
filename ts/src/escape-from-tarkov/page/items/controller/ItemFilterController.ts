import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { ItemsRequest } from "../handlers/request/ItemsRequest";
import { ItemsMediator } from "../mediator/ItemsMediator";
import { ItemFilterUtils } from "../utils/ItemFilterUtils";

export class ItemFilterController {

    private static itemMediator:ItemsMediator;

    static setItemsMediator(mediator:ItemsMediator) {
        this.itemMediator = mediator;
    }

    static registerItemSearchBarController(input:HTMLInputElement) {
        ItemFilterUtils.setSearchBarInputElement(input)
        input.onkeyup = () => {
            this.itemMediator.update(new ItemsRequest(this.itemMediator, EventConst.ITEMS_EVENT, 
                DataEventConst.ITEM_PAGE_REFRESH, null, null, input))
        }
    }

    static registerShowMissingButtonController(label:HTMLLabelElement, input:HTMLInputElement) {
        label.onclick = () => {
            ItemFilterUtils.setShowMissingOnly(input.checked);
            this.itemMediator.update(new ItemsRequest(this.itemMediator, EventConst.ITEMS_EVENT, 
                DataEventConst.ITEM_PAGE_REFRESH, null, null, input))
        }
    }

    // static registerRemoveDoneButtonController(label:HTMLLabelElement, input:HTMLInputElement) {
    //     label.onclick = () => {
    //         ItemFilterUtils.setRemoveDoneState(input.checked);
    //         this.itemMediator.update(new ItemsRequest(this.itemMediator, EventConst.ITEMS_EVENT, 
    //             DataEventConst.ITEM_PAGE_REFRESH, null, null, input))
    //     }
    // }
    
    static registerQuestButtonController(label:HTMLLabelElement, input:HTMLInputElement, hideoutInput:HTMLInputElement) {
        label.onclick = () => {
            if(ItemFilterUtils.getHideout()) {
                ItemFilterUtils.setHideout(false);
                hideoutInput.checked = false;
            }
            ItemFilterUtils.setQuest(input.checked);
            this.itemMediator.update(new ItemsRequest(this.itemMediator, EventConst.ITEMS_EVENT, 
                DataEventConst.ITEM_PAGE_REFRESH, null, null, input))
        }
    }

    static registerHideoutButtonController(label:HTMLLabelElement, input:HTMLInputElement, questInput:HTMLInputElement) {
        label.onclick = () => {
            if(ItemFilterUtils.getQuest()) {
                ItemFilterUtils.setQuest(false);
                questInput.checked = false;
            }
            ItemFilterUtils.setHideout(input.checked);
            this.itemMediator.update(new ItemsRequest(this.itemMediator, EventConst.ITEMS_EVENT, 
                DataEventConst.ITEM_PAGE_REFRESH, null, null, input))
        }
    }
}