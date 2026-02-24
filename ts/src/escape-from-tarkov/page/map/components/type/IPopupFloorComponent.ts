import { Building } from "../../../../../model/floor/IMapFloorElements";
import { IMapsComponent } from "../IMapsComponent";
import { IFloorComponent } from "./IFloorComponent";

export interface IPopupFloorComponent extends IMapsComponent {
    building:Building;
    floorsComponent:IFloorComponent[];
    isDisplayed:boolean;
    id:string;
}