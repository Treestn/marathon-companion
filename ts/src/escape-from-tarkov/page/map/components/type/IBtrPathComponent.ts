import { Dimension } from "../../../../utils/Dimension";
import { IMapsComponent } from "../IMapsComponent";

export interface IBtrPathComponent extends IMapsComponent {
    getDimension():Dimension;
    isCentered();
    getBtrPathImage();
}