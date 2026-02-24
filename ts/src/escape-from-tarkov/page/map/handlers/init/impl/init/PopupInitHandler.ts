import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { PopupController } from "../../../../controller/PopupController";

export class PopupInitHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        PopupController.setMapMediator(request.mediator);
    }
    
}