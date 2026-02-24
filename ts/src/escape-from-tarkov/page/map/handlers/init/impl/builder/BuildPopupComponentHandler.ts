import { MapBuilder } from "../../../../builder/impl/MapBuilder";
import { IconComponent } from "../../../../components/impl/IconComponent";
import { PopupFloorComponent } from "../../../../components/impl/PopupFloorComponent";
import { PopupIconComponent } from "../../../../components/impl/PopupIconComponent";
import { IFloorComponent } from "../../../../components/type/IFloorComponent";
import { IPopupFloorComponent } from "../../../../components/type/IPopupFloorComponent";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { UuidGenerator } from "../../../../../../service/helper/UuidGenerator";

export class BuildPopupComponentHandler extends AbstractChainHandler {
    handle(request: IMapInitRequest) {
        (request.mapBuilder as MapBuilder).iconsList.forEach(component => {
            request.mapBuilder.addIconPopup(this.createPopupIconComponent(request, component))
        });
        (request.mapBuilder as MapBuilder).floorsList.forEach(component => {
            const newPopup = this.createPopupFloorComponent(request, component, request.mapBuilder as MapBuilder)
            if(newPopup) {
                request.mapBuilder.addFloorPopup(newPopup)
            }
        });
    }

    private createPopupIconComponent(request:IMapInitRequest, component:IconComponent):PopupIconComponent {
        return new PopupIconComponent(request.mediator, UuidGenerator.generateSimple(), component);
    }

    private createPopupFloorComponent(request:IMapInitRequest, component:IFloorComponent, builder:MapBuilder):PopupFloorComponent {
        if(!this.floorPopupAlreadyCreated(component, builder.popupsFloorList)) {
            const popupComponent = new PopupFloorComponent(request.mediator, UuidGenerator.generateSimple(), component.building);
            popupComponent.floorsComponent.push(component);
            component.popupComponent = popupComponent;
            return popupComponent
        } else {
            this.addFloorToPopupComponent(component, builder.popupsFloorList);
        }
    }

    private floorPopupAlreadyCreated(component:IFloorComponent, popups:IPopupFloorComponent[]):boolean {
        for(const popup of popups) {
            if(popup.building.UUID === component.building.UUID) {
                return true;
            }
        }
        return false;
    }

    private addFloorToPopupComponent(component:IFloorComponent, popups:IPopupFloorComponent[]) {
        for(const popup of popups) {
            if(popup.building.UUID === component.building.UUID) {
                component.popupComponent = popup
                popup.floorsComponent.push(component);
            }
        }
    }
}