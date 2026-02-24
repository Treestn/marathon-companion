import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { ItemFilterBuilder } from "./ItemFilterBuilder";

export class ItemsPageBuilder {

    static createItemsRunner() {
        const runner = document.getElementById("runner-container");
        if(runner) {
            let itemsDiv = HelperCreation.createDiv("items-runner", "items-container main-runner-container", "")
            let itemsRunner = HelperCreation.createDiv("itemsDiv", "itemsRunner runner", "");

            let scrollDiv = HelperCreation.createDiv("items-page-scroll-div", "scroll-div", "")
            scrollDiv.appendChild(this.createItemsEntity())

            itemsRunner.appendChild(this.createFilters());
            itemsRunner.appendChild(scrollDiv)
    
            itemsDiv.appendChild(itemsRunner)
    
            runner.insertBefore(itemsDiv, document.getElementsByClassName("side-page-container")[0]);
        }
    }

    private static createItemsEntity(): HTMLElement {
        return HelperCreation.createDiv("items-entity-parent", "items-entity", "")
    }

    private static createFilters(): HTMLElement {
        return ItemFilterBuilder.createItemFilters();
    }
}