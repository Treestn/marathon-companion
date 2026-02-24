import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { HideoutInitRequest } from "../../request/HideoutInitRequest";

export class BuildHideoutPage extends AbstractChainHandler {

    handle(request: HideoutInitRequest) {
        request.builder.build();
    }
    
}