import { IMapsComponent } from "../../components/IMapsComponent";
import { IRequest } from "../../../../types/IRequest";

export interface IMapRequest extends IRequest {
    event: string;
    subEvent: string;
    mouseEvent:MouseEvent;
    component:IMapsComponent;
    time:number
}