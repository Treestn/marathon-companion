import { I18nHelper } from "../../../../locale/I18nHelper";
import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { QuestRequest } from "../handlers/request/QuestRequest";
import { QuestMediator } from "../mediator/QuestMediator";
import { QuestsFiltersUtils } from "../utils/QuestsFiltersUtils";

export class QuestFilterController {

    private static questMediator;

    static setMediator(mediator:QuestMediator) {
        if(!this.questMediator) {
            this.questMediator = mediator
        }
    }

    static createKappaRequiredFilterEventListener(label:HTMLLabelElement, input:HTMLInputElement) {
        label.onclick = (e) => {
            QuestsFiltersUtils.setKappaFilter(input.checked);
            this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, DataEventConst.MOUSE_CLICK, null, e, null))
        }
    }

    static createFilterHeaderEventListener(header:HTMLElement, container:HTMLElement, dropwdown:HTMLElement) {
        header.onclick = (e) => {
            if(dropwdown.style.display === "block") {
                dropwdown.style.display = "none";
            } else {
                dropwdown.style.display = "block";
            }
        }
        container.onmouseleave = (e) => {
            dropwdown.style.display = "none";
        }
    }

    static createOrderByTraderController(input:HTMLInputElement) {
        input.onchange = (e) => {
            QuestsFiltersUtils.setOrderByTrader(input.checked);
            this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, DataEventConst.MOUSE_CLICK, null, null, null))
            e.stopPropagation()
        }
    }

    static createOrderByQuestNameController(input:HTMLInputElement) {
        input.onchange = (e) => {
            QuestsFiltersUtils.setOrderByQuestName(input.checked);
            this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, DataEventConst.MOUSE_CLICK, null, null, null))
            e.stopPropagation()
        }
    }

    static createTraderFilterEventListener(headerElement:HTMLElement, htmlElement:HTMLInputElement, traderName:string) {
        htmlElement.onclick = (e) => {
            QuestsFiltersUtils.setTraderFilter(traderName, htmlElement.checked);
            const filterAmount = QuestsFiltersUtils.getNumberOfActiveTraderFilter();
            for(const node of headerElement.childNodes) {
                if(node.nodeType === Node.TEXT_NODE) {
                    node.nodeValue = `${I18nHelper.get("pages.quests.filters.traders.label")} (${filterAmount})`;
                }
            }
            this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, DataEventConst.MOUSE_CLICK, null, e, null))
        }
    }

    static createQuestTypeFilterEventListener(headerElement:HTMLElement, htmlElement:HTMLInputElement, type:string) {
        htmlElement.onclick = (e) => {
            QuestsFiltersUtils.setQuestTypeFilter(type, htmlElement.checked);
            const filterAmount = QuestsFiltersUtils.getNumberOfActiveQuestTypeFilter();
            for(const node of headerElement.childNodes) {
                if(node.nodeType === Node.TEXT_NODE) {
                    node.nodeValue = `${I18nHelper.get("pages.quests.filters.type.label")} (${filterAmount})`;
                }
            }
            this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, DataEventConst.MOUSE_CLICK, null, e, null))
        }
    }

    static createQuestStateFilterEventListener(headerElement:HTMLElement, htmlElement:HTMLInputElement, type:string) {
        htmlElement.onclick = (e) => {
            QuestsFiltersUtils.setQuestStateFilter(type, htmlElement.checked);
            const filterAmount = QuestsFiltersUtils.getNumberOfActiveQuestStateFilter();
            for(const node of headerElement.childNodes) {
                if(node.nodeType === Node.TEXT_NODE) {
                    node.nodeValue = `${I18nHelper.get("pages.quests.filters.state.label")} (${filterAmount})`;
                }
            }
            this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, DataEventConst.MOUSE_CLICK, null, e, null))
        }
    }

    static createMapFilterEventListener(headerElement:HTMLElement, htmlElement:HTMLInputElement, mapId:string) {
        htmlElement.onclick = (e) => {
            QuestsFiltersUtils.setMapStateFilter(mapId, htmlElement.checked);
            const filterAmount = QuestsFiltersUtils.getNumberOfActiveMapStateFilter();
            for(const node of headerElement.childNodes) {
                if(node.nodeType === Node.TEXT_NODE) {
                    node.nodeValue = `${I18nHelper.get("pages.quests.filters.maps.label")} (${filterAmount})`;
                }
            }
            this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, DataEventConst.MOUSE_CLICK, null, e, null))
        }
    }

    static createSelectAllEventListener(headerElement:HTMLElement, button:HTMLElement, wrapper:HTMLElement, map:Map<string, boolean>, headerText:string) {
        button.onclick = (e) => {
            for(const [key, _] of map) {
                map.set(key, true);
            }
            QuestsFiltersUtils.saveAll();

            const list = wrapper.getElementsByClassName("quest-filter-label")
            for(const label of list) {
                for(const child of label.children) {
                    if(child instanceof HTMLInputElement) {
                        child.checked = true;
                    }
                }
            }

            for(const node of headerElement.childNodes) {
                if(node.nodeType === Node.TEXT_NODE) {
                    node.nodeValue = `${headerText} (${list.length})`;
                }
            }
            this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, DataEventConst.MOUSE_CLICK, null, e, null))
            wrapper.style.display = "block"
        }
    }

    static createDeselectAllEventListener(headerElement:HTMLElement, button:HTMLElement, wrapper:HTMLElement, map:Map<string, boolean>, headerText:string) {
        button.onclick = (e) => {
            for(const [key, _] of map) {
                map.set(key, false);
            }
            QuestsFiltersUtils.saveAll();

            const list = wrapper.getElementsByClassName("quest-filter-label")
            for(const label of list) {
                for(const child of label.children) {
                    if(child instanceof HTMLInputElement) {
                        child.checked = false;
                    }
                }
            }

            for(const node of headerElement.childNodes) {
                if(node.nodeType === Node.TEXT_NODE) {
                    node.nodeValue = `${headerText} (${0})`;
                }
            }
            this.questMediator.update(new QuestRequest(this.questMediator, EventConst.QUEST_FILTER, DataEventConst.MOUSE_CLICK, null, e, null))
            wrapper.style.display = "block"
        }
    }

    static getTradersState():Map<string, boolean> {
        const map = new Map();
        const optionsWrapper = document.getElementById("filter-trader-options")
        if(optionsWrapper) {
            const optionList = optionsWrapper.getElementsByClassName("quest-filter-input");
            for(const option of optionList) {
                if(option instanceof HTMLInputElement) {
                    map.set(option.value, option.checked);
                }
            }
        }
        return map;
    }
}