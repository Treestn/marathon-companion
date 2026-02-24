import { IMapsComponent } from "../../../../components/IMapsComponent";
import { FloorComponent } from "../../../../components/impl/FloorComponent";
import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { FilterUtils } from "../../../../utils/FilterUtils";
import { FloorUtils } from "../../../../utils/FloorUtils";
import { MapUtils } from "../../../../utils/MapUtils";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";
import { MapRequest } from "../../../request/impl/MapRequest";
import { QuestIconComponent } from "../../../../components/impl/QuestIconComponent";
import { FilterConst } from "../../../../../../constant/FilterConst";
import { ParentFilterComponent } from "../../../../components/impl/ParentFilterComponent";
import { IconUtils } from "../../../../utils/IconUtils";
import { PlayerProgressionUtils } from "../../../../../../utils/PlayerProgressionUtils";
import { QuestsUtils } from "../../../../../quests/utils/QuestsUtils";

export class FloorGlowHandler extends AbstractMapChainHandler {

    handle(request: MapRequest) {
        if(request.event === EventConst.FLOOR_EVENT) {
            switch(request.subEvent) {        
                case DataEventConst.MOUSE_DOWN: this.addFloorGlow(request.component, FloorUtils.clickGlowColor); break;
                case DataEventConst.MOUSE_MOVE: this.clearHoveringFloorGlow(request);this.addFloorGlow(request.component, FloorUtils.hoveringGlowColor); break;
                case DataEventConst.MOUSE_CLICK: this.addFloorGlow(request.component, FloorUtils.hoveringGlowColor); break;
                case DataEventConst.MOUSE_MOVE_ALPHA: this.clearHoveringFloorGlow(request); break;
                case DataEventConst.MOUSE_UP: this.addFloorGlow(request.component, FloorUtils.hoveringGlowColor); break;
                case DataEventConst.MOUSE_LEAVE: this.clearHoveringFloorGlow(request); break; 
            }
        }
        if(request.event === EventConst.ICON_EVENT || request.event === EventConst.QUEST_ICON_EVENT) {
            switch(request.subEvent) { 
                case DataEventConst.MOUSE_HOVER: this.clearHoveringFloorGlow(request); break;
                // case DataEventConst.QUEST_UPDATE: this.
                // case DataEventConst.MOUSE_MOVE: this.clearHoveringFloorGlow(request); break;
            }
        }
        if((request.event === EventConst.ICON_UPDATE || request.event === EventConst.QUEST_ICON_EVENT) 
                && request.subEvent === DataEventConst.QUEST_UPDATE) {
            if(request.mediator.getFilter() && FilterUtils.isFilterActive(request.mediator.getFilter(), FilterConst.QUESTS.name)) {
                this.resolveAllQuestIcons(request);
            } 
        }
        if(EventConst.PARENT_FILTER_EVENT === request.event) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleFilterParentClick(request); break;
            }
        }
        if(request.event === EventConst.MAP_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.EDIT_MODE_CHANGED: this.resolveAllQuestIcons(request); break;
            }
        }
    }

    private addFloorGlow(component:IMapsComponent, color:string) {
        if(component instanceof FloorComponent) {
            component.building.floors.forEach(floor => {
                if(floor.active) {
                    const div = document.getElementById(floor.UUID)
                    div.style.filter = `drop-shadow(0 0 12px ${color})`;
                }
            })
        }
    }

    private clearHoveringFloorGlow(request:MapRequest) {
        const componentList = request.mediator.getComponentList()
        for(const component of componentList) {
            if(component instanceof FloorComponent) {
                const div = document.getElementById(component.floor.UUID)
                if(div && div.style.filter.includes(MapUtils.hexToRgb(FloorUtils.hoveringGlowColor))) {
                    div.style.filter = "";            
                }
                const questsActive:boolean = FilterUtils.isFilterActive(request.mediator.getFilter(), FilterConst.QUESTS.name)
                // If we clear the color, we need to make sure we put the flow from the quest if needed
                if(!div.style.filter && questsActive) {
                    FloorUtils.resolveQuestFloorGlow(FilterUtils.getQuestFromFilter(request.mediator.getFilter()), request.mediator.getFloors())
                }
            }
        }
    }

    private handleFilterParentClick(request:MapRequest) {
        if(request.component instanceof ParentFilterComponent 
            && request.component.parentFilter.name === FilterConst.QUESTS.name) {
            if(request.component.parentFilter.active) {
                this.resolveAllQuestIcons(request)
            } else {
                this.clearQuestFloorGlow(request);
            }
        }
    }

    private clearQuestFloorGlow(request:MapRequest) {
        const componentList = request.mediator.getComponentList()
        for(const component of componentList) {
            if(component instanceof FloorComponent) {
                const div = document.getElementById(component.floor.UUID)
                if(div && div.style.filter.includes(FloorUtils.questGlowColor)) {
                    div.style.filter = "";      
                }
            }
        }
    }

    private resolveAllQuestIcons(request:MapRequest) {
        this.clearQuestFloorGlow(request)
        for(const icon of request.mediator.getComponentList()) {
            if(icon instanceof QuestIconComponent) {
                const iconDiv = document.getElementById(String(icon.entity.id))
                if(iconDiv && icon.entity.active) {
                    if(PlayerProgressionUtils.isQuestActive(icon.quest.id) ) {
                        if(icon.entity.floor) {
                            //The floor needs to be active for the icon to appear
                            if(!FloorUtils.isFloorActive(request.mediator.getFloors(), icon.entity.floor)
                                && !PlayerProgressionUtils.isQuestObjectiveCompletedByIconId(icon.quest, String(icon.entity.id))) {
                                for(const floorComponent of request.mediator.getComponentList()) {
                                    if(floorComponent instanceof FloorComponent 
                                            && String(floorComponent.floor.UUID) === String(icon.entity.floor)) {
                                        this.addFloorGlow(floorComponent, FloorUtils.questGlowColor)
                                    }
                                }
                            }
                        } 
                    }
                }
            }
        }
    }
}