import { LogoPathConst } from "../../../../constant/ImageConst";
import { PageConst } from "../../../../constant/PageConst";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { ItemsElementUtils } from "../../../../utils/ItemsElementUtils";
import { PlayerProgressionUtils } from "../../../../utils/PlayerProgressionUtils";
import { rarityToColor } from "../../../../utils/RarityColorUtils";
import { ImageUtils } from "../../../map/utils/ImageUtils";
import { ItemsComponent } from "../../component/ItemsComponent";
import { ItemController } from "../../controller/ItemController";
import { ItemUtils } from "../../utils/ItemUtils";

export class ItemBuilder {

    static createItemForItemPage(component:ItemsComponent):HTMLElement {
        const wrapper = HelperCreation.createDiv(component.itemId, "item-component-wrapper", "");
        wrapper.style.width = "200px"
        wrapper.style.maxHeight = "300px"
        const itemState = PlayerProgressionUtils.getItemState(component.itemId);
        if(itemState) {
            const item = this.createItem(component.itemId, itemState.requiredQuantity, PageConst.ITEMS_PAGE, wrapper);
            wrapper.appendChild(item);
            ItemController.registerItemClick(component, wrapper);
            return wrapper
        }
        return null
    }

    static createItem(itemId:string, requiredQuantity:number, runner:string, 
            header?:HTMLElement, wrapperId?:string):HTMLElement {
        if(!itemId) {
            console.log(`Item id missing`);
            return;
        }
        const wrapper = HelperCreation.createDiv(wrapperId || "", "item-requirement-wrapper", "");

        const imageWrapper = HelperCreation.createDiv("", "item-requirement-image-wrapper", "");

        const image = new Image();
        const amountController = this.createItemQuantityController(itemId, runner, header);
        const name = HelperCreation.createB("item-requirement-description", "-")
        image.id = itemId;
        image.src = LogoPathConst.LOADING_GIF;
        image.classList.add("item-requirement-image")

        ItemsElementUtils.getItemInformation(itemId).then(itemData => {
            if(!itemData) {
                console.log(`Could not get the item data for item id: ${itemId}`);
                return;
            }
            name.textContent = itemData.name

            const color = rarityToColor(itemData.rarity);
            if(color) {
                imageWrapper.style.borderColor = color;
                imageWrapper.style.borderStyle = "solid";
                imageWrapper.style.background = `radial-gradient(
                        circle at top right,
                        transparent 0 104px,
                        ${color} 110px
                    )`
                // imageWrapper.style.background = `radial-gradient(130px at right top, ${color} 0 150px, transparent 100px), #111;`;
            }
            

            if(!itemData.baseImageLink || itemData.baseImageLink.includes("undefined")) {
                ImageUtils.loadImage(image, LogoPathConst.LOGO_WHITE_256_BLUE_SIDE, 1);
            } else {
                ImageUtils.loadImage(image, itemData.baseImageLink, 1);
            }
        })

        imageWrapper.appendChild(image);
        wrapper.appendChild(imageWrapper);
        wrapper.appendChild(amountController)
        wrapper.appendChild(name);
        wrapper.appendChild(this.createItemAmount(requiredQuantity, itemId))

        return wrapper
    }

    private static createItemQuantityController(itemId:string, runner:string, header?:HTMLElement):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-amount-controller-wrapper", "");

        const minusWrapper = HelperCreation.createDiv("", "item-amount-controller item-minus-controller", "");
        const minusSign = HelperCreation.createB("item-sign", "-");
        minusWrapper.appendChild(minusSign);
        

        const amountInputWrapper = HelperCreation.createDiv("", "item-amount-wrapper", "");
        const amountInput:HTMLInputElement = HelperCreation.createInput("", "", "item-amount-input item-input-controller");
        amountInput.value = String(ItemUtils.getItemCurrentQuantity(itemId)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");;
        amountInputWrapper.appendChild(amountInput);
        

        const plusWrapper = HelperCreation.createDiv("", "item-amount-controller item-plus-controller", "");
        const plusSign = HelperCreation.createB("item-sign", "+");
        plusWrapper.appendChild(plusSign);

        ItemController.registerMinusItemController(itemId, minusWrapper, amountInput, runner, header)
        ItemController.registerSetItemAmountController(itemId, amountInput, runner, header)
        ItemController.registerPlusItemController(itemId, plusWrapper, amountInput, runner, header)

        wrapper.appendChild(minusWrapper);
        wrapper.appendChild(amountInputWrapper);
        wrapper.appendChild(plusWrapper);

        return wrapper
    }

    private static createItemAmount(requiredQuantity:number, itemId:string):HTMLElement {
        const currentQuantity = ItemUtils.getItemCurrentQuantity(itemId);
        const text = HelperCreation.createB("item-requirement-description-level item-required-amount",
             (currentQuantity < 0 ? "0" : currentQuantity.toString()).replace(/\B(?=(\d{3})+(?!\d))/g, "'") 
             + " / " 
             + requiredQuantity.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'"))
        text.id = itemId;
        return text
    }

}