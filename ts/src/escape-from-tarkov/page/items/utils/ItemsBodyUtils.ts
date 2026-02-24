import { I18nHelper } from "../../../../locale/I18nHelper";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { HideoutUtils } from "../../hideout/utils/HideoutUtils";
import { QuestsUtils } from "../../quests/utils/QuestsUtils";
import { ItemBodyBuilder } from "../builder/helper/ItemBodyBuilder";
import { ItemsComponent } from "../component/ItemsComponent";
import { ItemFilterUtils } from "./ItemFilterUtils";
import { ItemsNavigationUtils } from "./ItemsNavigationUtils";

export class ItemsBodyUtils {

    static addItemBody(component:ItemsComponent) {
        const header = document.getElementById(component.itemId);
        if(header) {
            header.classList.add("expanded-width");
            header.style.width = "100%"
            header.style.maxHeight = ""
            header.appendChild(ItemBodyBuilder.buildItemBody(component))
            setTimeout(function() {
                ItemsNavigationUtils.navigateToItems(component.itemId)
            }, 500)
        }
    }

    static removeItemBodyWithId(itemId:string, header?:HTMLElement) {
        const body = this.getItemBody(itemId, header)
        if(body) {
            const parentElement = body.parentElement;
            if(parentElement) {
                parentElement.classList.remove("expanded-width");
                parentElement.style.width = "200px"
                parentElement.style.maxHeight = "300px"
            }
            body.remove();
        }
    }

    static getItemBody(itemId:string, htmlElement?:HTMLElement):HTMLElement {
        let bodyList;
        if(htmlElement) {
            bodyList = htmlElement.getElementsByClassName("item-body-wrapper");
        } else {
            const header = document.getElementById(itemId);
            if(header) {
                bodyList = header.getElementsByClassName("item-body-wrapper");
            }
        }
        if(bodyList && bodyList.length > 0) {
            return bodyList[0]
        }
        return null;
    }

    static getItemNameElement(itemWrapper:HTMLElement):HTMLElement {
        const text = itemWrapper.getElementsByClassName("item-requirement-description");
        if(text && text.length > 0 && text[0] instanceof HTMLElement) {
            return text[0]
        }
    }

    static refreshBodyWithFilter(components:ItemsComponent[]) {
        components.forEach(component => {
            this.hideItem(component.itemId);
        })
        ItemFilterUtils.filterComponents(components).forEach(component => {
            this.showItem(component.itemId);
        })
    }

    static refreshAllBodies() {
        const list = document.getElementsByClassName("item-body-content-wrapper");
        for(const wrapper of list) {
            const hideoutStation = HideoutUtils.getStationWithLevelId(wrapper.id);
            if(hideoutStation) {
                const hideoutLevelState = PlayerProgressionUtils.getStationLevelState(hideoutStation.id, wrapper.id);
                if(hideoutLevelState) {
                    this.updateBodyState(wrapper as HTMLElement, hideoutLevelState.active, hideoutLevelState.completed)
                }
            } else {
                const quest = QuestsUtils.getQuestFromObjectiveId(wrapper.id);
                if(quest) {
                    const objectiveState = PlayerProgressionUtils.getObjectiveState(quest.id, wrapper.id);
                    const questState = PlayerProgressionUtils.getQuestState(quest.id);
                    if(objectiveState && questState) {
                        this.updateBodyState(wrapper as HTMLElement, questState.active, objectiveState.completed);
                        if(questState.noTracking) {
                            (wrapper as HTMLElement).style.display = "none";
                        } else {
                            (wrapper as HTMLElement).style.display = "";
                        }
                    }
                }
            }
        }
    }

    private static updateBodyState(wrapper:HTMLElement, active:boolean, completed:boolean) {
        const itemWrapper = wrapper.children[0]
        if(itemWrapper && itemWrapper instanceof HTMLElement) {
            for(let class_ of itemWrapper.classList) {
                if(class_ === "item-content-completed" || class_ === "item-content-active" || class_ === "item-content-blocked") {
                    itemWrapper.classList.remove(class_);
                }
            }
            if(completed) {
                itemWrapper.classList.add("item-content-completed")
            } else if(active) {
                itemWrapper.classList.add("item-content-active")
            } else {
                itemWrapper.classList.add("item-content-blocked")
            }
            
            // Update status indicator text
            const statusIndicator = itemWrapper.querySelector(".item-content-status-indicator");
            if(statusIndicator && statusIndicator instanceof HTMLElement) {
                // Remove old status classes
                statusIndicator.classList.remove("status-active", "status-blocked", "status-completed");
                
                if(completed) {
                    statusIndicator.textContent = I18nHelper.get("pages.hideout.filters.completed");
                    statusIndicator.classList.add("status-completed");
                } else if(active) {
                    statusIndicator.textContent = I18nHelper.get("pages.hideout.filters.active");
                    statusIndicator.classList.add("status-active");
                } else {
                    statusIndicator.textContent = I18nHelper.get("pages.hideout.station.legend.blocked");
                    statusIndicator.classList.add("status-blocked");
                }
            }
        }
    }

    static hideItem(itemId:string) {
        const element = document.getElementById(itemId);
        if(element) {
            element.style.display = "none";
        }
    }

    static showItem(itemId:string) {
        const element = document.getElementById(itemId);
        if(element) {
            element.style.display = "";
        }
    }
}