import { MapAdapter } from "../../../../adapter/MapAdapter";
import { FilterConst } from "../../../constant/FilterConst";
import { Elements, FilterElementsData, HighLevelElement, ListElementEntity } from "../../../../model/IFilterElements";
import { StorageHelper } from "../../../service/helper/StorageHelper";

export class FilterUtils {

    private static keySuffix = "_filter"

    static idSuffix = "-filter";

    static filterAmountDivClass = "filter-amount-div";
    static filterAmountClass = "filter-amount";
    static filterSelectorClass = 'filter-selector';
    static checkmarkClass = 'checkmark';
    static filterDropdownContentId = "filter-dropdown-content";
    static secondDropdownContentClass = "second-dropdown-content";
    static dropdownContainerFilterId = "dropdown-container-filter";
    static dropdownClass = "dropdown";
    static dropdownContentClass = "dropdown-content";
    static filterEntityClass = "filter-entity";
    static filterLabelClass = 'filter-label';
    static filterLiClass = 'filter-li';

    static filterSearchClass = "filter-search";
    static filterImageClass = "filter-search-image";


    static save(data:FilterElementsData) {
        const storageKey = `${MapAdapter.getMapFromId(MapAdapter.getIdFromMap(data.map))}${this.keySuffix}`;
        StorageHelper.save(storageKey, data)
    }

    static getStoredData(mapId:string):any {
        const storageKey = `${MapAdapter.getMapFromId(mapId)}${this.keySuffix}`;
        return StorageHelper.getStoredData(storageKey)
    }

    static getFilterWrapper(filterName:string):HTMLElement {
        const filter = document.getElementById(filterName + this.idSuffix);
        if(filter) {
            return filter.parentElement as HTMLElement;
        }
        return null;
    }

    static getQuestFromFilter(filters:FilterElementsData):ListElementEntity[] {
        return filters.highLevelElements.find(hle => hle.name === FilterConst.QUESTS.name)
            .elements.find(e => e.name === FilterConst.QUESTS.name).listElements;
    }

    static isFilterActive(filter:FilterElementsData, name:string):boolean {
        return filter.highLevelElements.find(hle => hle.name === name).active
    }

    static deactivateFilter(filterDiv:HTMLElement) {
        filterDiv.getElementsByClassName(this.checkmarkClass)[0].children[0].setAttribute('style', "text-decoration:line-through;opacity:60%;");
        (filterDiv.getElementsByClassName(this.filterSelectorClass)[0] as HTMLInputElement).setAttribute('checked', "true");
    }

    static activateFilter(filterDiv:HTMLElement) {
        filterDiv.getElementsByClassName(this.checkmarkClass)[0].children[0].setAttribute('style', "text-decoration:none;opacity:100%;");
        (filterDiv.getElementsByClassName(this.filterSelectorClass)[0] as HTMLInputElement).setAttribute('checked', "false");
    }

    static getEntityFromId(filter:FilterElementsData, hleType:string, type:string, entityId:string):ListElementEntity {
        return this.getEntityFromElementsList(this.getFilterElementsByType(filter, hleType), type, entityId);
    }

    static getEntityWithId(filter:FilterElementsData, entityId:number):ListElementEntity {
        for(const hle of filter.highLevelElements) {
            for(const element of hle.elements) {
                for(const entity of element.listElements) {
                    if(entity.id === entityId) {
                        return entity;
                    }
                }
            }
        }
        return null;
    }

    private static getNumberOfActiveQuestsEntity(filter:FilterElementsData) {
        let activeQuestsAmount:number = 0;
        filter.highLevelElements.forEach(hle => {
            if(hle.name === FilterConst.QUESTS.name) {
                hle.elements.forEach(e => {
                    e.listElements.forEach(entity => {
                        if(entity.active) {
                            activeQuestsAmount++;
                        }
                    })
                })
            }
        })
        return activeQuestsAmount;
    }

    static refreshAllFilterAmount(filter:FilterElementsData) {
        filter.highLevelElements.forEach(hle => {
            const amount = FilterUtils.getHleAmountOfIcons(hle);
            const container = FilterUtils.getFilterEntityContainer(hle.name);
            if(amount > 0) {
                FilterUtils.setFilterEntityAmount(container, String(amount), hle.name === FilterConst.QUESTS.name ? "green" : null)
            } else {
                FilterUtils.setFilterEntityAmount(container, String(amount))
            }
            if(hle.elements.length > 1) {
                hle.elements.forEach(e => {
                    const amount = e.listElements.length;
                    const container = FilterUtils.getFilterEntityContainer(e.name);
                    FilterUtils.setFilterEntityAmount(container, String(amount))
                })
            }
        })
    }

    static refreshQuestEntityAmount(filter:FilterElementsData) {
        if(!filter) {
            console.log("Filters are not loaded yet, skipping the quest filter refresh");
            return;
        }
        const amount = FilterUtils.getNumberOfActiveQuestsEntity(filter);
        const container = FilterUtils.getFilterEntityContainer(FilterConst.QUESTS.name);
        if(amount > 0) {
            FilterUtils.setFilterEntityAmount(container, String(amount), "green")
        } else {
            FilterUtils.setFilterEntityAmount(container, String(amount))
        }
    }


    private static getFilterElementsByType(filter:FilterElementsData, type:string): Elements[] {
        for(let hle of filter.highLevelElements) {
            if(hle.name === type) {
                return hle.elements
            }
        }
        return [];
    }

    private static getEntityFromElementsList(elements:Elements[], type:string, entityId:string):ListElementEntity {
        for(let element of elements) {
            if(element.name === type) {
                for(let entity of element.listElements) {
                    if(String(entity.id) === entityId) {
                        return entity
                    }
                }
            }
        }
        return null;
    }

    private static readonly searchClassTargets:string[] = [FilterUtils.filterSearchClass, FilterUtils.filterImageClass]

    static isSearchIconClicked(target:HTMLElement):boolean {
        for(const c of target.classList) {
            if(this.searchClassTargets.includes(c)) {
                return true;
            }
        }
        return false;
    }

    static getAllFloorRelatedIcons(filter:FilterElementsData, floorId:string):ListElementEntity[] {
        let list:ListElementEntity[] = []
        for(let hle of filter.highLevelElements) {
            if(hle.active) {
                for(let element of hle.elements) {
                    if(element.active) {
                        for(let entity of element.listElements) {
                            if(entity.active && entity.floor && floorId === String(entity.floor)) {
                                list.push(entity);
                            }
                        }
                    }
                }
            }
        }
        return list;
    }

    private static getFilterElementsArray(filter:FilterElementsData): (Elements)[] {
        var elementsList:Elements[] = []
        filter.highLevelElements.forEach(e => {
            e.elements.forEach(element => elementsList.push(element))
        }) 
        return elementsList
    }

    static getFilterEntityContainer(name:string):HTMLElement {
        const dropdown = document.getElementById(this.filterDropdownContentId);
        if(dropdown) {
            const list = dropdown.getElementsByClassName(this.filterEntityClass)
            if(list.length > 0) {
                for(const textElement of list) {
                    if(textElement.textContent === name) {
                        return textElement.parentElement.parentElement.parentElement.parentElement
                    }
                }
            }
        }
        return null;
    }

    static setFilterEntityAmount(filterEntityContainer:HTMLElement, amount:string, color?:string) {
        if(filterEntityContainer) {
            const amoutElements = filterEntityContainer.getElementsByClassName(this.filterAmountClass)
            if(amoutElements.length > 0 && amoutElements[0] instanceof HTMLElement) {
                if(amount === "0") {
                    amount = "-"
                }
                amoutElements[0].textContent = `( ${amount} )`
                if(color) {
                    amoutElements[0].style.color = color;
                } else {
                    amoutElements[0].style.color = "";
                }
            }
        }
    }

    static getHleAmountOfIcons(hle:HighLevelElement):number {
        let amount = 0;
        hle.elements.forEach(e => {
            if(e.listElements) {
                amount += e.listElements.length;
            }
        })
        return amount
    }
}