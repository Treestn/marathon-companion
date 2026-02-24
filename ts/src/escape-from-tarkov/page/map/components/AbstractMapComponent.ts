import { IMapMediator } from "../mediator/IMapMediator";
import { IMapsComponent } from "./IMapsComponent";

export abstract class AbstractMapComponent implements IMapsComponent {
    mediator: IMapMediator;
    targetType: string;

    constructor(mediator:IMapMediator, targetType:string) {
        this.mediator = mediator;
        this.targetType = targetType;
    }

    isTargeted(targetId:string) {
        return this.targetType === targetId;
    }

    abstract onclick(e);
    abstract onhover(e);
    abstract onmousedown(e);
    abstract onmouseup(e);
    abstract onmousemove(e);
    abstract onmouseleave(e);
    abstract onwheel(e);
}