import { MapBuilder } from "../../../../builder/impl/MapBuilder";
import { IconComponent } from "../../../../components/impl/IconComponent";
import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { FilterUtils } from "../../../../utils/FilterUtils";
import { MapUtils } from "../../../../utils/MapUtils";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";
import { MapRequest } from "../../../request/impl/MapRequest";
import { MarkerProperties } from "../../../../../../../marker_window/MarkerProperties";
import { PopupIconComponent } from "../../../../components/impl/PopupIconComponent";
import { UuidGenerator } from "../../../../../../service/helper/UuidGenerator";
import { ComponentEventListenerUtils } from "../../../../utils/ComponentEventListenerUtils";
import { QuestIconComponent } from "../../../../components/impl/QuestIconComponent";
import { IIconComponent } from "../../../../components/type/IIconComponent";
import { FloorUtils } from "../../../../utils/FloorUtils";
import { EditSession } from "../../../../../quests/edit/EditSession";
import { ListElementEntityImpl } from "../../../../../../../model/IFilterElements";

export class AddIconHandler extends AbstractMapChainHandler {

    private savedComponent:IIconComponent = null;

    async handle(request: MapRequest) {
        if(request.subEvent === DataEventConst.MOUSE_UP) {
            this.handleMouseUp(request);
        } 
        if(request.event === EventConst.ICON_UPDATE && request.subEvent === DataEventConst.ADD_ICON) {
            await this.handleAddIcon(request);
        }
    }
    
    private handleMouseUp(request:MapRequest) {
        if(!request.mouseEvent) {
            return;
        }
        if(EditSession.isSessionOpen() && request.mouseEvent.ctrlKey && !request.mouseEvent.shiftKey && request.component instanceof IconComponent) {
            new MarkerProperties(request.mediator, request.mouseEvent, request.component).open()
            request.mouseEvent.stopPropagation();
        }

        if(request.mouseEvent.shiftKey && request.mouseEvent.ctrlKey && !(request.component instanceof IconComponent)) {
            new MarkerProperties(request.mediator, request.mouseEvent).open()
            request.mouseEvent.stopPropagation();
        }

        if(EditSession.isSessionOpen()) {
            if(request.mouseEvent.altKey && (request.component instanceof IconComponent || request.component instanceof QuestIconComponent)) {
                this.savedComponent = request.component
            }
            
            if(request.mouseEvent.altKey && !(request.component instanceof IconComponent) && this.savedComponent) {
                const iconDiv = document.getElementById(String(this.savedComponent.entity.id))
                let found = false;
                let elementProp;
                for(const hle of request.mediator.getFilter().highLevelElements) {
                    if(found) break;
                    for(const e of hle.elements) {
                        if(found) break;
                        if(e.name === this.savedComponent.element.name) {
                            for(const entity of e.listElements) {
                                if(entity.id === this.savedComponent.entity.id) {
                                    entity.x = request.mouseEvent.offsetX 
                                    entity.y = request.mouseEvent.offsetY
                                    elementProp = {hleName: hle.name, src: e.imagePath, width: e.width, height: e.height, centered: e.centered}
                                    if(request.mouseEvent.target instanceof HTMLElement &&
                                            request.mouseEvent.target.classList.contains("floor-div")
                                            || (request.mouseEvent.target as HTMLElement).classList.contains("floorLevelImg")) {
                                        const building = FloorUtils.getBuildingFromFloorId(request.mediator.getFloors(), (request.mouseEvent.target as HTMLElement).id)
                                        entity.x += building.x
                                        entity.y += building.y
                                        found = true;
                                        break;
                                        // entity.floor = (request.mouseEvent.target as HTMLElement).id
                                    }
                                }
                            }
                        }
                    }
                }
                MapUtils.setIconPosition(this.savedComponent.entity, MapUtils.getOffsets(), iconDiv, this.savedComponent);
                FilterUtils.save(request.mediator.getFilter());
                const map = request.mediator.getFilter()
                EditSession.addNewMapFilterElement(map.map, map.mapImagePath, map.width, map.height, elementProp, this.savedComponent.element.name, new ListElementEntityImpl(this.savedComponent.entity))
                // request.mediator.update(new MapRequest(request.mediator, EventConst.ICON_UPDATE, null, this.savedComponent, DataEventConst.ADD_ICON, new Date().getTime()))
                this.savedComponent = null;
            }
        }
        
    }

    private async handleAddIcon(request:MapRequest) {
        const mapData = document.getElementById("map-data");
        if(mapData && request.component instanceof IconComponent) {

            const popupComponent = new PopupIconComponent(request.mediator, UuidGenerator.generateSimple(), request.component)
            request.component.popupComponent = popupComponent;
            popupComponent.icon = request.component;

            request.mediator.add(popupComponent);
            request.mediator.add(request.component);
            
            const mapBuilder = new MapBuilder().addIcon(request.component).addIconPopup(popupComponent)
            await mapBuilder.buildIcons();
            await mapBuilder.buildPopups();
            const iconDiv = document.getElementById(String(request.component.entity.id))
            MapUtils.setIconPosition(request.component.entity, MapUtils.getOffsets(), iconDiv, request.component)
            
            FilterUtils.save(request.mediator.getFilter());
            
            ComponentEventListenerUtils.registerOnMouseLeaveForComponent(request.component);
            ComponentEventListenerUtils.registerOnMouseLeaveForComponent(popupComponent);
        }
    }
}