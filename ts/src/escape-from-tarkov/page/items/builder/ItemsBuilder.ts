import { ItemsComponent } from "../component/ItemsComponent";
import { ItemFilterUtils } from "../utils/ItemFilterUtils";
import { ItemsBodyUtils } from "../utils/ItemsBodyUtils";
import { ItemsHeaderUtils } from "../utils/ItemsHeaderUtils";
import { ItemBuilder } from "./helper/ItemBuilder";
import { ItemsPageBuilder } from "./helper/ItemsPageBuilder";

export class ItemsBuilder {
    itemsComponentList:ItemsComponent[] = [];

    addItemComponent(component:ItemsComponent) {
        this.itemsComponentList.push(component)
    }

    build() {
        ItemsPageBuilder.createItemsRunner();
        const sortedComponents = this.filterAndSortComponents(this.itemsComponentList);
        const wrapper = document.getElementById("items-entity-parent");
        if(wrapper) {
            for(const component of sortedComponents) {
                const itemComponentWrapper = ItemBuilder.createItemForItemPage(component);
                wrapper.appendChild(itemComponentWrapper);
            }
        } else {
            console.log(`Could not build the hideout page because the hideout-entity-parent HtmlElement was not found`);
        }
        ItemsBodyUtils.refreshBodyWithFilter(this.itemsComponentList);
        ItemsHeaderUtils.resolveAllHeaderState();
    }

    private filterAndSortComponents(components: ItemsComponent[]): ItemsComponent[] {
        return components.sort((a, b) => a.itemData.name.localeCompare(b.itemData.name));
    }
}