import { IMapsComponent } from "../../../../components/IMapsComponent";
import { FloorComponent } from "../../../../components/impl/FloorComponent";
import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { IndexConst } from "../../../../const/IndexConst";
import { FloorUtils } from "../../../../utils/FloorUtils";
import { IMapRequest } from "../../../request/IMapRequest";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";
import { MapRequest } from "../../../request/impl/MapRequest";
import { Floor } from "../../../../../../../model/floor/IMapFloorElements";
import { IconComponent } from "../../../../components/impl/IconComponent";
import { MapMediator } from "../../../../mediator/impl/MapMediator";

export class FloorHandler extends AbstractMapChainHandler {

    private static lastMouseDown:number;
    static clickDelay = 150;

    handle(request: MapRequest) {
        if(request.event === EventConst.FLOOR_EVENT 
                && !(request.mouseEvent.ctrlKey && request.mouseEvent.shiftKey) && !request.mouseEvent.altKey) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_DOWN: this.handleMouseDown(request); break;
                case DataEventConst.MOUSE_CLICK: this.handleFloorClick(request); break;
                // case DataEventConst.MOUSE_UP: this.handleFloorClick(request.component, request)
            }
        } else if(request.event === EventConst.SELECT_ICON || request.event === EventConst.SELECT_KEY_ICON) {
            switch(request.subEvent) {
                case DataEventConst.ZOOM_ON_ICON: this.setIconFloor(request); break;
            }
        }
    }

    private handleFloorClick(request:MapRequest) {
        this.setNextFloor(request.component, request.time);
        FloorUtils.save(request.mediator.getFloors());
    }

    private setNextFloor(component:IMapsComponent, time:number) {
        if(FloorHandler.lastMouseDown + FloorHandler.clickDelay <= time) {
            return;
        }
        if(component instanceof FloorComponent) {
            for(let i = 0; i < component.building.floors.length; i++) {
                if(component.building.floors[i].active) {
                    component.building.floors[i].active = false;
                    this.hideFloor(component.building.floors[i].UUID)
                    if(i === component.building.floors.length - 1) {
                        component.building.floors[0].active = true
                        this.unhideFloor(component.building.floors[0])
                    } else {
                        component.building.floors[i + 1].active = true
                        this.unhideFloor(component.building.floors[i + 1])
                    }
                    break;
                }
            }
        }
    }

    private handleMouseDown(request:IMapRequest) {
        FloorHandler.lastMouseDown = request.time
    }

    private setIconFloor(request:MapRequest) {
        if(request.component instanceof IconComponent && request.mediator instanceof MapMediator && request.component.entity.floor) {
            let floorComponent:FloorComponent;
            let floorId = request.component.entity.floor.toString();
            for(const component of request.mediator.getComponentList()) {
                if(component instanceof FloorComponent && component.floor.UUID.toString() === floorId) {
                    floorComponent = component
                    break;
                }
            }
            if(floorComponent && request.component instanceof IconComponent) {
                while(!floorComponent.floor.active) {
                    this.setNextFloor(floorComponent, request.time)
                }
                FloorUtils.save(request.mediator.getFloors());
            } else {
                console.log(`Floor component could not be found for id: ${request.component.entity.floor}`);
            }
        }
    }

    private hideFloor(floorId:string) {
        const floor = document.getElementById(floorId) 
        if(floor) {
            floor.style.visibility = 'hidden'
            floor.style.zIndex = IndexConst.HIDDEN;
        }
    }

    private unhideFloor(floor:Floor) {
        const floorElement = document.getElementById(floor.UUID) 
        if(floor) {
            floorElement.style.visibility = ''
            floorElement.style.zIndex = floor.z_index ? String(floor.z_index) : IndexConst.FLOOR;
        }
    }
}