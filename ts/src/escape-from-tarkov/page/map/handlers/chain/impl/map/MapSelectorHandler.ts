import { MapSelectorComponent } from "../../../../components/impl/MapSelectorComponent";
import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";
import { MapRequest } from "../../../request/impl/MapRequest";

export class MapSelectorHandler extends AbstractMapChainHandler {

    async handle(request: MapRequest) {
        if(request.event === EventConst.MAP_SELECTOR_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: await this.handleMouseClick(request); break;
            }
        }
    }

    private async handleMouseClick(request: MapRequest) {
        if(request.component instanceof MapSelectorComponent) {
            await request.mediator.init(request.component.targetType);
        }
    }

}