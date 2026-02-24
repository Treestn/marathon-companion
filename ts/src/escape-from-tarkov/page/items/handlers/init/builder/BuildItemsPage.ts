import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { ItemsInitRequest } from "../../request/ItemsInitRequest";

export class BuildItemsPage extends AbstractChainHandler {

    handle(request: ItemsInitRequest) {
        request.builder.build();
    }
    
}