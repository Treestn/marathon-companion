import { IMapMediator } from "../mediator/IMapMediator";

export interface IMapsComponent {
    mediator: IMapMediator;
    targetType:string;

    isTargeted(target):boolean;
    onclick(e);
    onhover(e);
    onmousedown(e);
    onmouseup(e);
    onmousemove(e);
    onmouseleave(e);
    onwheel(e);
}