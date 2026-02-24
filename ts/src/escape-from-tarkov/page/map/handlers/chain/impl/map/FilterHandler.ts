import { FilterComponent } from "../../../../components/impl/FilterComponent";
import { ParentFilterComponent } from "../../../../components/impl/ParentFilterComponent";
import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { FilterUtils } from "../../../../utils/FilterUtils";
import { IconUtils } from "../../../../utils/IconUtils";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";
import { MapRequest } from "../../../request/impl/MapRequest";
import { Elements, HighLevelElement } from "../../../../../../../model/IFilterElements";
import { FilterConst, MiscConst } from "../../../../../../constant/FilterConst";
import { QuestsUtils } from "../../../../../quests/utils/QuestsUtils";
import { PlayerProgressionUtils } from "../../../../../../utils/PlayerProgressionUtils";

export class FilterHandler extends AbstractMapChainHandler {

    handle(request: MapRequest) {
        if(EventConst.FILTER_EVENT === request.event) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleMouseClick(request); break;
            }
        }
        if(EventConst.PARENT_FILTER_EVENT === request.event) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleParentMouseClick(request); break;
            }
        }
        if(EventConst.SELECT_ICON === request.event) {
            switch(request.subEvent) {
                case DataEventConst.ZOOM_ON_ICON: this.enableQuestFilter(request); break;
            }
        }
        if(EventConst.SELECT_KEY_ICON === request.event) {
            switch(request.subEvent) {
                case DataEventConst.ZOOM_ON_ICON: this.enableKeyFilter(request); break;
            }
        }
    }

    private handleMouseClick(request:MapRequest) {
        if(request.mouseEvent.target instanceof HTMLInputElement 
                && request.mouseEvent.target.classList.contains(FilterUtils.filterSelectorClass)
                && !FilterUtils.isSearchIconClicked(request.mouseEvent.target)) {
            if(request.component instanceof FilterComponent) {
                if(request.component.filter.active) {
                    this.changeChildFilter(request.component.filter, false);
                } else {
                    this.changeChildFilter(request.component.filter, true);
                    this.changeParentFilter(request.component.parentFilter, true)
                }
    
                if(this.areFiltersAllInactive(request.component.parentFilter)) {
                    // All the filters are inactive, so we disable the parent and everything
                    this.changeChildFiltersState(request.component.parentFilter, false)
                } else if(this.areFiltersAllActive(request.component.parentFilter)) {
                    // All the filters are active, so we enable the parent and everything
                    this.changeChildFiltersState(request.component.parentFilter, true)
                }
            }
        } else if(request.mouseEvent.target instanceof HTMLElement 
                && FilterUtils.isSearchIconClicked(request.mouseEvent.target)) {
            this.handleSearchMouseClick(request);
        }
        FilterUtils.save(request.mediator.getFilter())
    }

    private enableQuestFilter(request:MapRequest) {
        for(const component of request.mediator.getComponentList()) {
            if(component instanceof ParentFilterComponent && component.parentFilter.name === FilterConst.QUESTS.name) {
                this.changeChildFiltersState(component.parentFilter, true);
                FilterUtils.save(request.mediator.getFilter())
            } 
        }
    }

    private enableKeyFilter(request:MapRequest) {
        for(const component of request.mediator.getComponentList()) {
            if(component instanceof ParentFilterComponent 
                    && component.parentFilter.name === FilterConst.MISC.name) {
                for(const iconElement of component.parentFilter.elements) {
                    if(iconElement.name === MiscConst.LOCKED_DOOR.name) {
                        this.changeParentFilter(component.parentFilter, true);
                        this.changeChildFilter(iconElement, true);
                        FilterUtils.save(request.mediator.getFilter())
                    }
                }
            } 
        }
    }

    private handleParentMouseClick(request:MapRequest) {
        if(request.mouseEvent.target instanceof HTMLInputElement 
                && request.mouseEvent.target.classList.contains(FilterUtils.filterSelectorClass)
                && !FilterUtils.isSearchIconClicked(request.mouseEvent.target)) {
            this.handleFilterMouseClick(request);
        } else if(request.mouseEvent.target instanceof HTMLElement 
               && FilterUtils.isSearchIconClicked(request.mouseEvent.target)) {
            this.handleSearchMouseClick(request);
        }
    }

    private handleFilterMouseClick(request:MapRequest) {
        if(request.component instanceof ParentFilterComponent) {
            if(request.component.parentFilter.active) {
                this.changeChildFiltersState(request.component.parentFilter, false)
            } else {
                this.changeChildFiltersState(request.component.parentFilter, true)
            }
        }
        FilterUtils.save(request.mediator.getFilter())
    }

    private handleSearchMouseClick(request:MapRequest) {
        IconUtils.glowAllIconsByType(request.component.targetType.split(FilterUtils.idSuffix).join(""), 
            request.mediator.getFilter(), request.mediator.getFloors());
    }

    private areFiltersAllInactive(parentFilter:HighLevelElement):boolean {
        let areAllInactive = true;
        for(let element of parentFilter.elements) {
            if(element.active) {
                areAllInactive = false;
                break;
            }
        }
        return areAllInactive;
    }

    private areFiltersAllActive(parentFilter:HighLevelElement):boolean {
        let areAllActive = true;
        for(let element of parentFilter.elements) {
            if(!element.active) {
                areAllActive = false;
                break;
            }
        }
        return areAllActive;
    }

    private changeChildFiltersState(parentFilter:HighLevelElement, desiredState:boolean) {

        this.changeParentFilter(parentFilter, desiredState)
    
        // Chnage UI and actual state of all children
        parentFilter.elements.forEach(element => {
            this.changeChildFilter(element, desiredState)
        });
    }

    private changeChildFilter(element:Elements, desiredState:boolean) {
        element.active = desiredState;
        const filterDiv = FilterUtils.getFilterWrapper(element.name)
        if(desiredState) {
            FilterUtils.activateFilter(filterDiv)
        } else {
            FilterUtils.deactivateFilter(filterDiv)
        }
        // All of the entity are being be changed
        if(element.name === FilterConst.QUESTS.name) {
            QuestsUtils.getActiveQuests().forEach(quest => {
                for(const entity of element.listElements) {
                    if(String(entity.id) === String(quest.id) && PlayerProgressionUtils.isQuestActive(quest.id)) {
                        entity.active = true;
                    }
                }
            })
        } else {
            element.listElements.forEach(entity => {
                entity.active = desiredState
            })
        }
    }

    private changeParentFilter(parentFilter:HighLevelElement, desiredState:boolean) {
        //Change Actual State
        parentFilter.active = desiredState;

        // Change UI state
        const parentFilterDiv = FilterUtils.getFilterWrapper(parentFilter.name)
        if(desiredState) {
            FilterUtils.activateFilter(parentFilterDiv)
        } else {
            FilterUtils.deactivateFilter(parentFilterDiv)
        }
    }
}