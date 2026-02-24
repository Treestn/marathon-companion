import { FilterComponent } from "../../../../components/impl/FilterComponent";
import { FloorComponent } from "../../../../components/impl/FloorComponent";
import { IconComponent } from "../../../../components/impl/IconComponent";
import { ParentFilterComponent } from "../../../../components/impl/ParentFilterComponent";
import { QuestIconComponent } from "../../../../components/impl/QuestIconComponent";
import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { IndexConst } from "../../../../const/IndexConst";
import { FilterUtils } from "../../../../utils/FilterUtils";
import { FloorUtils } from "../../../../utils/FloorUtils";
import { IconUtils } from "../../../../utils/IconUtils";
import { MapUtils } from "../../../../utils/MapUtils";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";
import { MapRequest } from "../../../request/impl/MapRequest";
import { Elements, FilterElementsData, HighLevelElement } from "../../../../../../../model/IFilterElements";
import { PlayerProgressionUtils } from "../../../../../../utils/PlayerProgressionUtils";
import { EditSession } from "../../../../../quests/edit/EditSession";
import { FilterConst } from "../../../../../../constant/FilterConst";
import { QuestsUtils } from "../../../../../quests/utils/QuestsUtils";
import { LabelComponent } from "../../../../components/impl/LabelComponent";

export class IconHandler extends AbstractMapChainHandler {

    async handle(request: MapRequest) {
        if(request.subEvent === DataEventConst.WHEEL) {
            this.handleMapWheel(request);
        } 
        if(request.event === EventConst.ICON_EVENT || request.event === EventConst.QUEST_ICON_EVENT) {
            switch(request.subEvent) {        
                case DataEventConst.MOUSE_CLICK: this.handleMouseClick(request); break;
                case DataEventConst.MOUSE_HOVER: this.handleMouseHover(request); break;
                case DataEventConst.MOUSE_LEAVE: this.handleMouseLeave(request); break;
                case DataEventConst.QUEST_UPDATE: this.resolveAllQuestIcons(request); break;
                // case DataEventConst.MOUSE_MOVE_ALPHA: this.handleMouseMoveAlpha(request); break;
            }
        }
        if(request.event === EventConst.FLOOR_EVENT) {
            switch(request.subEvent) {        
                case DataEventConst.MOUSE_CLICK: this.handleFloorChange(request); break;
            }
        }
        if(request.event === EventConst.FILTER_EVENT 
                && request.mouseEvent.target instanceof HTMLInputElement 
                && !FilterUtils.isSearchIconClicked(request.mouseEvent.target)) {
            switch(request.subEvent) {        
                case DataEventConst.MOUSE_CLICK: this.handleFilterClick(request); break;
            }
        }
        if(request.event === EventConst.PARENT_FILTER_EVENT 
                && request.mouseEvent.target instanceof HTMLInputElement 
                && !FilterUtils.isSearchIconClicked(request.mouseEvent.target)) {
            switch(request.subEvent) {        
                case DataEventConst.MOUSE_CLICK: this.handleParentFilterClick(request); break;
            }
        }
        if(request.event === EventConst.ICON_UPDATE && request.subEvent === DataEventConst.ADD_ICON) {
            if(request.component instanceof IconComponent) {
                this.resolveIcon(request, request.component as IconComponent);
                this.resolveLabel(request);
            }
        }
        if(request.event === EventConst.ICON_UPDATE && request.subEvent === DataEventConst.QUEST_UPDATE) {
            this.resolveAllQuestIcons(request);
            this.resolveLabel(request);
        }
        if((request.event === EventConst.SELECT_ICON || request.event === EventConst.SELECT_KEY_ICON) 
                && request.component instanceof IconComponent) {
            switch(request.subEvent) {
                case DataEventConst.ZOOM_ON_ICON:
                    this.handlePossibleFloorChange(request, request.component);
                    if(EventConst.SELECT_ICON === request.event) {
                        this.resolveAllQuestIcons(request);
                    }
                    this.zoomOnIcon(request, request.component);
                    this.handleIcons(request, request.component.hle, request.component.element); break;
            }
        }
        if(request.event === EventConst.MAP_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.EDIT_MODE_CHANGED: this.resolveAllIcons(request); break;
            }
        }
    }

    private handleMouseClick(request:MapRequest) {

    }

    private handleMouseHover(request:MapRequest) {
        this.setIconOpacity(request, "100%")
        if(request.mouseEvent.ctrlKey 
                && request.mouseEvent.shiftKey 
                && request.component instanceof IconComponent) {
            if(request.component.entity.protectedEntity) {
                this.setIconGlow(request, `drop-shadow(0 0 0.5rem ${IconUtils.hoveringDeniedGlowColor})`);
            } else {
                this.setIconGlow(request, `drop-shadow(0 0 0.5rem ${IconUtils.hoveringAllowedGlowColor})`);
            }
        } else {
            this.setIconGlow(request, `drop-shadow(0 0 0.5rem ${IconUtils.hoveringGlowColor})`);
        }
    }

    private handleMouseLeave(request:MapRequest) {
        this.setIconOpacity(request, IconUtils.iconBaseOpacity)
        this.setIconGlow(request, "");
    }

    private setIconGlow(request:MapRequest, filter:string) {
        if(request.component instanceof IconComponent) {
            const iconDiv = document.getElementById(String(request.component.entity.id))
            if(iconDiv) {
                const iconCanvas =  IconUtils.getIconCanvas(iconDiv);
                if(iconCanvas) {
                    iconCanvas.style.filter = filter
                }
            }
        }
    }

    private setIconOpacity(request:MapRequest, opacity:string) {
        if(request.component instanceof IconComponent) {
            const iconDiv = document.getElementById(String(request.component.entity.id))
            if(iconDiv) {
                const iconCanvas =  IconUtils.getIconCanvas(iconDiv);
                if(iconCanvas) {
                    iconCanvas.style.opacity = opacity
                }
            }
        }
    }

    private handleFloorChange(request:MapRequest) {
        if(request.component instanceof FloorComponent) {
            for(const floor of request.component.building.floors) {
                for(let icon of FilterUtils.getAllFloorRelatedIcons(request.mediator.getFilter(), String(floor.UUID))) {
                    if(floor.active) {
                        if(icon.questId) {
                            const quest = QuestsUtils.getQuestFromID(icon.questId);
                            if(PlayerProgressionUtils.isQuestObjectiveCompletedByIconId(quest, icon.id.toString())) {
                                IconUtils.hideIcon(String(icon.id));
                            } else {
                                IconUtils.unhideIcon(String(icon.id), request.mediator.getFilter().map);
                            }
                        } else {
                            IconUtils.unhideIcon(String(icon.id), request.mediator.getFilter().map);
                        }
                    } else {
                        IconUtils.hideIcon(String(icon.id));
                    }
                }
            }
        }
    }
    
    private handlePossibleFloorChange(request:MapRequest, component:IconComponent) {
        if(component.entity.floor) {
            const requestCopy = Object.assign({}, request);
            let floorComponent:FloorComponent;
            let floorId = component.entity.floor.toString();
            for(const component of request.mediator.getComponentList()) {
                if(component instanceof FloorComponent && component.floor.UUID.toString() === floorId) {
                    floorComponent = component
                    break;
                }
            }
            if(floorComponent) {
                requestCopy.component = floorComponent
                this.handleFloorChange(requestCopy)
            } else {
                console.log(`Could not find floor from floor id: ${floorId}`);
            }
        }
    }

    private handleMapWheel(request:MapRequest, delay?:number) {
        let offsets: {x:number, y:number} = MapUtils.getOffsets();

        if(MapUtils.isZoomBlocked(request.mouseEvent)) {
            return;
        }
        
        for(const component of request.mediator.getComponentList()) {
            if(component instanceof IconComponent) {
                MapUtils.repositionIcon(component.entity, offsets, component.iconDivRef, component, component.entity.active, delay)
            }
        }

        MapUtils.startAnimationTimeline();

        MapUtils.blockNextZoomIfNeeded(request.mouseEvent)
    }

    private handleParentFilterClick(request:MapRequest) {
        if(request.component instanceof ParentFilterComponent) {
            if(request.component.parentFilter.name === FilterConst.QUESTS.name) {
                this.resolveAllQuestIcons(request);
            }
            if(request.component.parentFilter.name === FilterConst.LABEL.name) {
                this.resolveLabel(request);
            }
            for(let element of request.component.parentFilter.elements) {
                this.handleIcons(request, request.component.parentFilter, element);
            }
        }
    }

    private handleFilterClick(request:MapRequest) {
        if(request.component instanceof FilterComponent) {
            this.handleIcons(request, request.component.parentFilter, request.component.filter);
        }
    }

    private async resolveAllIcons(request:MapRequest) {
        await this.removeEditIcons(request);
        this.resolveAllIconsExceptQuests(request);
        this.resolveAllQuestIcons(request);
    }

    private async removeEditIcons(request:MapRequest) {
        const componentList = request.mediator.getComponentList();
        const filter = request.mediator.getFilter();
        for(let i = componentList.length - 1; i >= 0; i--) {
            if(componentList[i] instanceof IconComponent) {
                const entity = FilterUtils.getEntityWithId(filter, (componentList[i] as IconComponent).entity.id);
                if(!entity) {
                    (componentList[i] as IconComponent).iconDivRef.remove();
                    componentList.splice(i, 1);
                }
            }
        }
    }

    private resolveAllIconsExceptQuests(request:MapRequest) {
        request.mediator.getComponentList().forEach(component => {
            if(component instanceof IconComponent && !(component instanceof QuestIconComponent)) {
                this.resolveIcon(request, component);
            }
        })
    }

    private handleIcons(request:MapRequest, parentFilter:HighLevelElement, filter:Elements) {
        for(let iconDiv of IconUtils.getAllIconsByType(filter.name)) {
            // If related to a floor, the floor needs to be active
            // If not related to a floor, then we are good
            if(filter.active) {
                // Get the entity object
                const entity = FilterUtils.getEntityFromId(request.mediator.getFilter(), 
                    parentFilter.name, filter.name, iconDiv.id);
                if(entity.active) {
                    // Related to a floor
                    if(entity.floor) {
                        //The floor needs to be active for the icon to appear
                        if(FloorUtils.isFloorActive(request.mediator.getFloors(), entity.floor)) {
                            iconDiv.style.visibility = '';
                            iconDiv.style.zIndex = IndexConst.ICON;
                        }
                    } else {
                        // Not related to a floor, we make it appear
                        iconDiv.style.visibility = '';
                        iconDiv.style.zIndex = IndexConst.ICON;
                    }
                }
            } else {
                // The filter is not active, icon disappear
                iconDiv.style.visibility = 'hidden';
                iconDiv.style.zIndex = IndexConst.HIDDEN;
            }
        }
    }

    private resolveAllQuestIcons(request:MapRequest) {
        for(const icon of request.mediator.getComponentList()) {
            if(icon instanceof QuestIconComponent) {
                if(!icon.entity || !icon.entity.id || !icon.entity.questId) {
                    console.log(`Data missing while resolving icon with id: ${icon.entity.id}`);
                    continue;
                }
                const iconDiv = document.getElementById(String(icon.entity.id))
                if(iconDiv && icon.quest && icon.quest.id) {
                    if(PlayerProgressionUtils.isQuestActive(icon.quest.id) 
                        && (!this.isObjectiveCompleted(icon) || PlayerProgressionUtils.isQuestCompleted(icon.quest.id))) {
                        icon.entity.active = true;
                        if(icon.entity.floor) {
                            //The floor needs to be active for the icon to appear
                            if(FloorUtils.isFloorActive(request.mediator.getFloors(), icon.entity.floor)) {
                                iconDiv.style.visibility = '';
                                iconDiv.style.zIndex = IndexConst.ICON;
                            }
                        } else {
                            iconDiv.style.visibility = '';
                            iconDiv.style.zIndex = IndexConst.ICON;
                        }
                    } else {
                        if(EditSession.isSessionOpen()) {
                            const editedQuest = EditSession.getModifiedQuest(icon.quest.id);
                            if(editedQuest && editedQuest.isNewQuest()) {
                                icon.entity.active = true;
                                iconDiv.style.visibility = '';
                                iconDiv.style.zIndex = IndexConst.ICON;
                            } else {
                                icon.entity.active = false;
                                iconDiv.style.visibility = 'hidden';
                                iconDiv.style.zIndex = IndexConst.HIDDEN;
                            }
                        } else {
                            icon.entity.active = false;
                            iconDiv.style.visibility = 'hidden';
                            iconDiv.style.zIndex = IndexConst.HIDDEN;
                        }
                    }
                } else {
                    console.log(`Problem resolving icon with id: ${icon.entity.id}`);
                }
            }
        }
    }

    private resolveBtrPath(request:MapRequest) {
        const btrPathImage = document.getElementById("btrPathImage");
        if(btrPathImage && request.component instanceof ParentFilterComponent) {
            if(request.component.parentFilter.active) {
                btrPathImage.style.display = "";
            } else {
                btrPathImage.style.display = "none";
            }
        }
    }

    private resolveLabel(request:MapRequest) {
        for(const component of request.mediator.getComponentList()) {
            if(component instanceof LabelComponent) {
                if(component.entity.active) {
                    component.iconDivRef.style.display = ""
                    component.iconDivRef.style.visibility = '';
                    component.iconDivRef.style.zIndex = IndexConst.LABEL;
                } else {
                    component.iconDivRef.style.display = "none"
                    component.iconDivRef.style.visibility = 'hidden';
                    component.iconDivRef.style.zIndex = IndexConst.HIDDEN;
                }
                
            }
        }
    }

    private isObjectiveCompleted(icon:QuestIconComponent):boolean {
        if(icon.quest) {
            return PlayerProgressionUtils.isQuestObjectiveCompletedByIconId(icon.quest, icon.entity.id.toString())
        } else {
            console.log(`Could not find quest with id: ${icon.entity.questId} caused by icon id: ${icon.entity.id}`);
        }
        return false;
    }

    // Needs to be async to wait for the builder to finish
    private async resolveIcon(request:MapRequest, component:IconComponent) {
        if(EditSession.isSessionOpen() 
            && EditSession.isIconRemoved(request.mediator.activeMap, component.entity.id)) {
            // The filter is not active, icon disappear
            component.iconDivRef.style.visibility = 'hidden';
            component.iconDivRef.style.zIndex = IndexConst.HIDDEN;
            return;
        }
        if(component instanceof IconComponent) {
            request.mediator.getFilter().highLevelElements.forEach(hle => {
                if(hle.name === component.hle.name && hle.active) {
                    hle.elements.forEach(e => {
                        if(e.name === component.element.name && e.active) {
                            if(component instanceof QuestIconComponent) {
                                if(EditSession.isSessionOpen()) {
                                    component.entity.active = true;
                                    this.showComponent(request, component)
                                } else {
                                    if(PlayerProgressionUtils.isQuestActive(component.quest.id) && !this.isObjectiveCompleted(component)) {
                                        component.entity.active = true;
                                        this.showComponent(request, component)
                                    }
                                }
                            } else {
                                component.entity.active = true;
                                this.showComponent(request, component)
                            }
                        }
                    })
                }
            })
        }
    }

    private showComponent(request:MapRequest, component:IconComponent) {
        const iconDiv = document.getElementById(String(component.entity.id))
        if(iconDiv) {
            // Related to a floor
            if(component.entity.floor) {
                //The floor needs to be active for the icon to appear
                if(FloorUtils.isFloorActive(request.mediator.getFloors(), component.entity.floor)) {
                    iconDiv.style.visibility = '';
                    iconDiv.style.zIndex = IndexConst.ICON;
                }
            } else {
                iconDiv.style.visibility = '';
                iconDiv.style.zIndex = IndexConst.ICON;
            }
        }
    }

    private async zoomOnIcon(request:MapRequest, component:IconComponent) {
        const zoom = document.getElementById("zoom")
        const icon = document.getElementById("" + component.entity.id)
        if(icon) {
            await MapUtils.centerMapOnPosition(zoom, icon);
            const iconRect = icon.getBoundingClientRect()
            const delta = MapUtils.getDeltaZoomForIcon()
            const modifiedEvent = new WheelEvent('wheel', {
                deltaY: Math.round(delta/100)*100,
                clientX: iconRect.x,
                clientY: iconRect.y
                // ...currentEvent // Copy other properties from the original event
            });
            request.mouseEvent = modifiedEvent
            MapUtils.zoom(request.mouseEvent, zoom, 0.6, component)
            this.handleMapWheel(request, 0.6)
            // MapUtils.zoomOnIcon(zoom, icon)
        }
    }
}