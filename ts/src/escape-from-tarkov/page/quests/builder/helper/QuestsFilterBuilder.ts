import { I18nHelper } from "../../../../../locale/I18nHelper";
import { MapAdapter } from "../../../../../adapter/MapAdapter";
import { TraderMapper } from "../../../../../adapter/TraderMapper";
import { MapsList } from "../../../../constant/MapsConst";
import { QuestState, QuestType } from "../../../../constant/QuestConst";
import { TraderList } from "../../../../constant/TraderConst";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation"
import { QuestFilterController } from "../../controller/QuestFilterController";
import { QuestsFiltersUtils } from "../../utils/QuestsFiltersUtils";

export class QuestFilterBuilder {
    
    static createQuestsFilteringElementsDiv(wrapper:HTMLElement) {
        
        let questFilteringContainer = HelperCreation.createDiv("", "quest-filtering-checkbox-div", "")

        this.createTraderFilter(questFilteringContainer);
        // this.createQuestTypeFilter(questFilteringContainer);
        this.createQuestStateFilter(questFilteringContainer);
        this.createQuestMapFilter(questFilteringContainer);
        this.createQuestCounter(questFilteringContainer);
        // this.createKappaRequiredFilter(questFilteringContainer);

        wrapper.appendChild(questFilteringContainer)
    }

    private static createQuestCounter(wrapper:HTMLElement) {
        const container = HelperCreation.createDiv("", "quest-filter-count-wrapper", "");

        const infoContainer = HelperCreation.createDiv("", "quest-filter-count-legent-container", "");
        const text = HelperCreation.createB("", I18nHelper.get("pages.quests.indicator.label"))
        text.style.fontSize = "13px";
        infoContainer.appendChild(text);
        container.appendChild(infoContainer);

        const div = HelperCreation.createDiv("", "quest-filter-count-container", "");

        const parenthesesLeft = HelperCreation.createB("", "(")
        parenthesesLeft.style.fontSize = "13px";

        const activeCount = HelperCreation.createB("", "");
        activeCount.id = "quest-active-counter-text";
        activeCount.style.fontSize = "13px";

        const slash1 = HelperCreation.createB("", "|");
        slash1.style.fontSize = "13px";

        const completedCount = HelperCreation.createB("", "");
        completedCount.id = "quest-completed-counter-text";
        completedCount.style.fontSize = "13px";

        const slash2 = HelperCreation.createB("", "|");
        slash2.style.fontSize = "13px";

        const totalCount = HelperCreation.createB("", "");
        totalCount.id = "quest-total-counter-text";
        totalCount.style.fontSize = "13px";

        const parenthesesRight = HelperCreation.createB("", ")")
        parenthesesRight.style.fontSize = "13px";
        
        div.appendChild(parenthesesLeft);
        div.appendChild(activeCount);
        div.appendChild(slash1);
        div.appendChild(completedCount);
        div.appendChild(slash2);
        div.appendChild(totalCount);
        div.appendChild(parenthesesRight);

        container.appendChild(div);

        wrapper.appendChild(container);
    }

    private static createKappaRequiredFilter(wrapper:HTMLElement) {
        const label = HelperCreation.createLabel("", "quest-filter-label-filter");
        const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
        input.setAttribute("value", "Kappa");
        input.checked = QuestsFiltersUtils.getKappaFilter();

        label.appendChild(input);
        label.appendChild(document.createTextNode("Kappa"))

        QuestFilterController.createKappaRequiredFilterEventListener(label, input);

        wrapper.appendChild(label);
    }

    private static createTraderFilter(wrapper:HTMLElement) {
        const container = HelperCreation.createDiv("", "quest-filter-container", "");

        const headerDiv = HelperCreation.createDiv("", "quest-filter-header", "");

        const arrow = new Image();
        arrow.src = "../img/line-angle-right-icon.png";
        arrow.classList.add("filter-dropdown-arrow-image")
        headerDiv.appendChild(arrow);

        container.appendChild(headerDiv);
    
        const dropdownSelection = HelperCreation.createDiv("filter-trader-options", "quest-filter-dropdown", "")
        dropdownSelection.setAttribute("id", "multi-select-trader");

        this.createOrderContainer(dropdownSelection);
        this.createSelectDeselect(headerDiv, dropdownSelection, QuestsFiltersUtils.traderFilter, I18nHelper.get("pages.quests.filters.traders.label"))

        for(const trader of TraderList) {
            const option = this.createOption(TraderMapper.getLocalizedTraderName(trader.id), trader.id, QuestsFiltersUtils.traderFilter.get(trader.id));
            const input = option.getElementsByClassName("quest-filter-input")[0] as HTMLInputElement;
            if(input) {
                input.checked = QuestsFiltersUtils.getTraderFilter(trader.id);
            }
            QuestFilterController.createTraderFilterEventListener(headerDiv, input, trader.id)
            dropdownSelection.appendChild(option);
        }

        container.appendChild(dropdownSelection)

        const filterAmount = QuestsFiltersUtils.getNumberOfActiveTraderFilter()
        headerDiv.appendChild(document.createTextNode(`${I18nHelper.get("pages.quests.filters.traders.label")} (${filterAmount})`))
        QuestFilterController.createFilterHeaderEventListener(headerDiv, container, dropdownSelection);

        wrapper.appendChild(container);
    }

    private static createQuestTypeFilter(wrapper:HTMLElement) {
        const container = HelperCreation.createDiv("", "quest-filter-container", "");
        // container.style.marginLeft = "5px";

        const headerDiv = HelperCreation.createDiv("", "quest-filter-header", "");

        const arrow = new Image();
        arrow.src = "../img/line-angle-right-icon.png";
        arrow.classList.add("filter-dropdown-arrow-image")
        headerDiv.appendChild(arrow);

        container.appendChild(headerDiv);
    
        const dropdownSelection = HelperCreation.createDiv("filter-quest-type-options", "quest-filter-dropdown", "")
        dropdownSelection.setAttribute("id", "multi-select-trader");

        this.createSelectDeselect(headerDiv, dropdownSelection, QuestsFiltersUtils.questTypeFilter, I18nHelper.get("pages.quests.filters.type.label"))

        for(const type of Object.values(QuestType)) {
            const option = this.createOption(type, type, QuestsFiltersUtils.questTypeFilter.get(type));
            const input = option.getElementsByClassName("quest-filter-input")[0] as HTMLInputElement;
            if(input) {
                input.checked = QuestsFiltersUtils.getQuestTypeFilter(type);
            }
            QuestFilterController.createQuestTypeFilterEventListener(headerDiv, input, type)
            dropdownSelection.appendChild(option);
        }

        container.appendChild(dropdownSelection)

        const filterAmount = QuestsFiltersUtils.getNumberOfActiveQuestTypeFilter()
        headerDiv.appendChild(document.createTextNode(`${I18nHelper.get("pages.quests.filters.type.label")} (${filterAmount})`))
        QuestFilterController.createFilterHeaderEventListener(headerDiv, container, dropdownSelection);

        wrapper.appendChild(container);
    }

    private static createOrderContainer(container:HTMLElement) {
        const orderTraderLabel = HelperCreation.createLabel("quest-page-order-trader-filter-label", "side-page-map-filter-label")
        const traderInput = HelperCreation.createInput("quest-page-order-trader-filter-input", "checkbox", "quest-map-filter-input");
        traderInput.checked = QuestsFiltersUtils.getOrderByTrader();
        orderTraderLabel.appendChild(traderInput);
        orderTraderLabel.appendChild(document.createTextNode(I18nHelper.get("pages.quests.filters.traders.order.byTrader")));
        container.appendChild(orderTraderLabel);
        QuestFilterController.createOrderByTraderController(traderInput);

        const orderQuestNameLabel = HelperCreation.createLabel("quest-page-order-trader-filter-label", "side-page-map-filter-label")
        const questNameInput = HelperCreation.createInput("quest-page-order-trader-filter-input", "checkbox", "quest-map-filter-input");
        questNameInput.checked = QuestsFiltersUtils.getOrderByQuestName();
        orderQuestNameLabel.appendChild(questNameInput);
        orderQuestNameLabel.appendChild(document.createTextNode(I18nHelper.get("pages.quests.filters.traders.order.byName")));
        container.appendChild(orderQuestNameLabel);
        QuestFilterController.createOrderByQuestNameController(questNameInput);
    }

    private static createSelectDeselect(header:HTMLElement, dropdownContainer:HTMLElement, map:Map<string, boolean>, headerText:string) {
        const selectDeselectWrapper = HelperCreation.createDiv("", "select-deselect-container", "");

        const selectWrapper = HelperCreation.createDiv("", "select-deselect-image-container", "")
        const select:HTMLImageElement = new Image();
        select.src = "../img/checkmark-icon.png";
        select.classList.add("select-deselect-all");
        selectWrapper.appendChild(select);
        selectDeselectWrapper.appendChild(selectWrapper)
        QuestFilterController.createSelectAllEventListener(header, selectWrapper, dropdownContainer, map, headerText)

        const deselectWrapper = HelperCreation.createDiv("", "select-deselect-image-container", "")
        const deselect:HTMLImageElement = new Image();
        deselect.src = "../img/x-icon-red.png";
        deselect.classList.add("select-deselect-all");
        deselect.style.width = "18px"
        deselectWrapper.appendChild(deselect);
        selectDeselectWrapper.appendChild(deselectWrapper)
        QuestFilterController.createDeselectAllEventListener(header, deselectWrapper, dropdownContainer, map, headerText)


        dropdownContainer.appendChild(selectDeselectWrapper);
    }

    private static createQuestStateFilter(wrapper:HTMLElement) {
        const container = HelperCreation.createDiv("", "quest-filter-container", "");
        // container.style.marginLeft = "1px";
        const headerDiv = HelperCreation.createDiv("", "quest-filter-header", "");

        const arrow = new Image();
        arrow.src = "../img/line-angle-right-icon.png";
        arrow.classList.add("filter-dropdown-arrow-image")
        headerDiv.appendChild(arrow);

        container.appendChild(headerDiv);
    
        const dropdownSelection = HelperCreation.createDiv("filter-quest-state-options", "quest-filter-dropdown", "")
        dropdownSelection.setAttribute("id", "multi-select-trader");

        this.createSelectDeselect(headerDiv, dropdownSelection, QuestsFiltersUtils.questStateFilter, I18nHelper.get("pages.quests.filters.state.label"))

        for(const state of Object.values(QuestState)) {
            // QuestsFiltersUtils.setQuestStateFilter(state, true);
            
            const option = this.createOption(state, state, QuestsFiltersUtils.questStateFilter.get(state));
            const input = option.getElementsByClassName("quest-filter-input")[0] as HTMLInputElement;
            if(input) {
                input.checked = QuestsFiltersUtils.getQuestStateFilter(state);
            }
            QuestFilterController.createQuestStateFilterEventListener(headerDiv, input, state)
            dropdownSelection.appendChild(option);
        }

        container.appendChild(dropdownSelection)

        const filterAmount = QuestsFiltersUtils.getNumberOfActiveQuestStateFilter()
        headerDiv.appendChild(document.createTextNode(`${I18nHelper.get("pages.quests.filters.state.label")} (${filterAmount})`))
        QuestFilterController.createFilterHeaderEventListener(headerDiv, container, dropdownSelection);

        wrapper.appendChild(container);
    }

    private static createQuestMapFilter(wrapper:HTMLElement) {
        const container = HelperCreation.createDiv("", "quest-filter-container", "");
        // container.style.marginLeft = "1px";
        const headerDiv = HelperCreation.createDiv("", "quest-filter-header", "");

        const arrow = new Image();
        arrow.src = "../img/line-angle-right-icon.png";
        arrow.classList.add("filter-dropdown-arrow-image")
        headerDiv.appendChild(arrow);

        container.appendChild(headerDiv);
    
        const dropdownSelection = HelperCreation.createDiv("filter-quest-map-options", "quest-filter-dropdown", "")
        dropdownSelection.setAttribute("id", "multi-select-trader");

        this.createSelectDeselect(headerDiv, dropdownSelection, QuestsFiltersUtils.mapStateFilter, I18nHelper.get("pages.quests.filters.maps.label"))

        for(const map of MapsList) {
            const option = this.createOption(MapAdapter.getLocalizedMap(map.id), map.id, QuestsFiltersUtils.mapStateFilter.get(map.id));
            const input = option.getElementsByClassName("quest-filter-input")[0] as HTMLInputElement;
            if(input) {
                input.checked = QuestsFiltersUtils.getMapStateFilter(map.id);
            }
            QuestFilterController.createMapFilterEventListener(headerDiv, input, map.id)
            dropdownSelection.appendChild(option);
        }

        container.appendChild(dropdownSelection)

        const filterAmount = QuestsFiltersUtils.getNumberOfActiveMapStateFilter()
        headerDiv.appendChild(document.createTextNode(`${I18nHelper.get("pages.quests.filters.maps.label")} (${filterAmount})`))
        QuestFilterController.createFilterHeaderEventListener(headerDiv, container, dropdownSelection);

        wrapper.appendChild(container);
    }

    private static createOption(text:string, value:string, checked:boolean) {
        const label = HelperCreation.createLabel("", "quest-filter-label");


        const input = HelperCreation.createInput("", "checkbox", "quest-filter-input");
        input.setAttribute("value", value)
        input.checked = checked

        label.appendChild(input);
        label.appendChild(document.createTextNode(text))
        
        return label
    }

    private createQuestFileringElement(title:string): HTMLElement {
        // Checkbox
        let label = HelperCreation.createLabel("", "quest-filtering-selector-label")
        let labelDiv = HelperCreation.createDiv("","quest-filtering-selector-container", "")
        let labelInput = HelperCreation.createInput(title, "checkbox", "quest-filtering-selector")
        let labelSpan = HelperCreation.createSpan("quest-filtering-checkmark")
        labelDiv.appendChild(labelInput)
        labelDiv.appendChild(labelSpan)
        label.appendChild(labelDiv)

        // Text
        let textDiv = HelperCreation.createDiv("", "quest-filtering-text-div", "")
        let text = HelperCreation.createB("", title)
        textDiv.appendChild(text)
        label.appendChild(textDiv)

        let mainDiv = HelperCreation.createDiv("", "quest-filtering-checkbox-element-div", "")
        mainDiv.appendChild(label)

        return mainDiv
    }
}