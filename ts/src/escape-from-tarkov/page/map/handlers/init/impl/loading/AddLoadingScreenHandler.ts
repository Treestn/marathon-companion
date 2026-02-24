import { AnimationHelper } from "../../../../../../service/helper/AnimationHelper";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { IMapInitRequest } from "../../../request/IMapInitRequest";

export class AddLoadingScreenHandler extends AbstractChainHandler {
    
    handle(request: IMapInitRequest) {
        AnimationHelper.addLoadingMapGif();
    }
}