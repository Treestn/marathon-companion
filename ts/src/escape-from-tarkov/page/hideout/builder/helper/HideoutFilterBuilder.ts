import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { HideoutFilterController } from "../../controller/HideoutFilterController";
import { HideoutFilterUtils } from "../../utils/HideoutFilterUtils";

export class HideoutFilterBuilder {

    static createHideoutFilters():HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-filtering-wrapper", "");

        // const searchBar = this.createSearchBar();
        // wrapper.appendChild(searchBar);

        // const removeDone = this.createRemoveDoneButton();
        // wrapper.appendChild(removeDone);

        const inactiveButton = this.createInactiveButton();
        wrapper.appendChild(inactiveButton);

        const activeButton = this.createActiveButton();
        wrapper.appendChild(activeButton);

        const completedButton = this.createCompletedButton();
        wrapper.appendChild(completedButton);

        // ItemFilterController.registerQuestButtonController(questToo, questToo.children[0] as HTMLInputElement, hideoutToo.children[0] as HTMLInputElement);
        // ItemFilterController.registerHideoutButtonController(hideoutToo, hideoutToo.children[0] as HTMLInputElement, questToo.children[0] as HTMLInputElement);

        return wrapper;
    }


    static createSearchBar():HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-search-bar-wrapper", "");

        const input = HelperCreation.createInput("", "", "item-search-input");
        input.placeholder = "Search Item by Name";
        // ItemFilterController.registerItemSearchBarController(input);
        wrapper.appendChild(input);

        const button = HelperCreation.createButton("", "submit", "", "item-search-bar-button", "");
        const buttonImage = new Image();
        buttonImage.src = "../img/search-sharp-white.png";
        buttonImage.classList.add("item-search-bar-button-image");
        button.appendChild(buttonImage);

        wrapper.appendChild(button);

        return wrapper;
    }

    // static createRemoveDoneButton():HTMLElement {
    //     const label = HelperCreation.createLabel("", "item-filter-label");
    //     const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
    //     input.setAttribute("value", "RemoveDone");
    //     input.checked = ItemFilterUtils.getRemoveDoneState();

    //     label.appendChild(input);
    //     label.appendChild(document.createTextNode("Remove Done"))

    //     ItemFilterController.registerRemoveDoneButtonController(label, input);
    //     return label;
    // }

    static createInactiveButton():HTMLElement {
        const label = HelperCreation.createLabel("", "item-filter-label");
        const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
        input.setAttribute("value", "Inactive");
        input.checked = HideoutFilterUtils.getInactiveState();

        label.appendChild(input);
        label.appendChild(document.createTextNode("Inactive"))

        HideoutFilterController.registerInactiveController(label, input);
        return label;
    }

    static createActiveButton():HTMLLabelElement {
        const label = HelperCreation.createLabel("", "item-filter-label");
        const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
        input.setAttribute("value", "Active");
        input.checked = HideoutFilterUtils.getActiveState();

        label.appendChild(input);
        label.appendChild(document.createTextNode("Active"))

        HideoutFilterController.registerActiveController(label, input);
        return label;
    }

    static createCompletedButton():HTMLLabelElement {
        const label = HelperCreation.createLabel("", "item-filter-label");
        const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
        input.setAttribute("value", "Completed");
        input.checked = HideoutFilterUtils.getCompletedState();

        label.appendChild(input);
        label.appendChild(document.createTextNode("Completed"))

        HideoutFilterController.registerCompletedController(label, input);
        return label;
    }
}