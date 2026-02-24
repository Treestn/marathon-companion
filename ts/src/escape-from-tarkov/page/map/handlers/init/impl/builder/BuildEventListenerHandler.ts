import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { ComponentEventListenerUtils } from "../../../../utils/ComponentEventListenerUtils";

export class BuildEventListenerHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        if(request.mediator.getComponentList().length > 0) {
            const mapDiv = document.getElementById("mapDiv") as HTMLDivElement;
            if(mapDiv) {
                ComponentEventListenerUtils.setMapMediator(request.mediator);
                ComponentEventListenerUtils.delegateMapDataEvent();
                ComponentEventListenerUtils.registerMouseClick(mapDiv);
                ComponentEventListenerUtils.registerMouseHover(mapDiv);
                ComponentEventListenerUtils.registerMouseDown(mapDiv);
                ComponentEventListenerUtils.registerMouseUp(mapDiv);
                ComponentEventListenerUtils.registerMouseMove(mapDiv);
                ComponentEventListenerUtils.registerOnWheel(mapDiv);
                // We register this for every component, because it is component specific
                ComponentEventListenerUtils.registerMouseLeave()
                ComponentEventListenerUtils.registerWindowResize(request.mediator)
            }
        }
    }
}