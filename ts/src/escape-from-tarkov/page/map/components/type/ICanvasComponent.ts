import { IMapsComponent } from "../IMapsComponent";

export interface ICanvasComponent extends IMapsComponent {
    isCentered();
    getDimension();
}