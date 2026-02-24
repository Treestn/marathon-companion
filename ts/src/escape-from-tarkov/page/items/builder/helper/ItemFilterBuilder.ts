import { I18nHelper } from "../../../../../locale/I18nHelper";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { ItemFilterController } from "../../controller/ItemFilterController";
import { ItemFilterUtils } from "../../utils/ItemFilterUtils";

export class ItemFilterBuilder {

    static createItemFilters():HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-filtering-wrapper", "");

        const searchBar = this.createSearchBar();
        wrapper.appendChild(searchBar);

        // const removeDone = this.createRemoveDoneButton();
        // wrapper.appendChild(removeDone);

        const showNotEnoughItemsOnly = this.createShowEnoughItemsOnlyButton();
        wrapper.appendChild(showNotEnoughItemsOnly);

        const questToo = this.createQuestButton();
        wrapper.appendChild(questToo);

        const hideoutToo = this.createHideoutButton();
        wrapper.appendChild(hideoutToo);

        ItemFilterController.registerQuestButtonController(questToo, questToo.children[0] as HTMLInputElement, hideoutToo.children[0] as HTMLInputElement);
        ItemFilterController.registerHideoutButtonController(hideoutToo, hideoutToo.children[0] as HTMLInputElement, questToo.children[0] as HTMLInputElement);

        return wrapper;
    }


    static createSearchBar():HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-search-bar-wrapper", "");

        const input = HelperCreation.createInput("", "", "item-search-input");
        input.placeholder = I18nHelper.get("pages.items.search.placeholder");
        ItemFilterController.registerItemSearchBarController(input);
        wrapper.appendChild(input);

        const button = HelperCreation.createButton("", "submit", "", "item-search-bar-button", "");
        const buttonImage = new Image();
        buttonImage.src = "../img/search-sharp-white.png";
        buttonImage.classList.add("item-search-bar-button-image");
        button.appendChild(buttonImage);

        wrapper.appendChild(button);

        return wrapper;
    }

    static createShowEnoughItemsOnlyButton():HTMLElement {
        const label = HelperCreation.createLabel("", "item-filter-label");
        const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
        input.setAttribute("value", I18nHelper.get("pages.items.filters.missing"));
        input.checked = ItemFilterUtils.getShowMissingOnly();

        label.appendChild(input);
        label.appendChild(document.createTextNode(I18nHelper.get("pages.items.filters.missing")))

        ItemFilterController.registerShowMissingButtonController(label, input);
        return label;
    }

    static createQuestButton():HTMLLabelElement {
        const label = HelperCreation.createLabel("", "item-filter-label");
        const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
        input.setAttribute("value", I18nHelper.get("pages.items.filters.quest"));
        input.checked = ItemFilterUtils.getQuest();

        label.appendChild(input);
        label.appendChild(document.createTextNode(I18nHelper.get("pages.items.filters.quest")))

        // ItemFilterController.registerQuestButtonController(label, input);
        return label;
    }

    static createHideoutButton():HTMLLabelElement {
        const label = HelperCreation.createLabel("", "item-filter-label");
        const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
        input.setAttribute("value", I18nHelper.get("pages.items.filters.hideout"));
        input.checked = ItemFilterUtils.getHideout();

        label.appendChild(input);
        label.appendChild(document.createTextNode(I18nHelper.get("pages.items.filters.hideout")))

        // ItemFilterController.registerHideoutButtonController(label, input);
        return label;
    }
}