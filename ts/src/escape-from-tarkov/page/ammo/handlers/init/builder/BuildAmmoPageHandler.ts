import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { AmmoInitRequest } from "../../request/AmmoInitRequest";

export class BuildAmmoPageHandler extends AbstractChainHandler {

    handle(request: AmmoInitRequest) {
        request.builder.build();
    }

}