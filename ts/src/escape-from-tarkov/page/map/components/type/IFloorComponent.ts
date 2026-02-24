import { Building, Floor } from "../../../../../model/floor/IMapFloorElements";
import { IMapsComponent } from "../IMapsComponent";
import { IPopupFloorComponent } from "./IPopupFloorComponent";

export interface IFloorComponent extends IMapsComponent {
    building: Building;
    floor: Floor;
    popupComponent:IPopupFloorComponent;
    popupDivRef:HTMLElement;

    onmousemovealpha(e);
}