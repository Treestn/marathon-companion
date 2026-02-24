import { AnimationHelper } from "../../../../../../service/helper/AnimationHelper";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { IMapInitRequest } from "../../../request/IMapInitRequest";

export class RemoveLoadingScreenHandler extends AbstractChainHandler {
    
    handle(request: IMapInitRequest) {
        AnimationHelper.removeLoadingMapGif()
    }
}