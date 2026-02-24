import { IAmmoElements } from "../../../../../model/ammo/IAmmoElements";
import { IMediator } from "../../../../types/IMediator";
import { IRequest } from "../../../../types/IRequest";
import { AmmoPageMediator } from "../../AmmoPageMediator";
import { AmmoBuilder } from "../../builder/impl/AmmoBuilder";
import { AmmoMediator } from "../../mediator/AmmoMediator";
import { AmmoUtils } from "../../utils/AmmoUtils";

export class AmmoInitRequest implements IRequest {
    event: string;
    subEvent: string;
    mediator: IMediator;
    builder:AmmoBuilder
    pageMediator: AmmoPageMediator;
    mouseEvent: MouseEvent;

    ammo: IAmmoElements;
    storedAmmo: IAmmoElements;

    constructor(mediator:AmmoMediator) {
        this.mediator = mediator;
        this.builder = new AmmoBuilder();
    }
}