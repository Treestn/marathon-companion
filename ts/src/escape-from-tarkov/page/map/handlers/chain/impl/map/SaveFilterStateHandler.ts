import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { IMapRequest } from "../../../request/IMapRequest";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";

export class SaveFilterStateHandler extends AbstractMapChainHandler {

    handle(request: IMapRequest) {
        if(request.event === EventConst.MAP_SELECTOR_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleMouseClick(request); break;
            }
        }

    }

    private handleMouseClick(request: IMapRequest) {
        // TODO this needs to be reviewed because the newly loaded filters cannot be set right now (if not loaded)
        // we need to find a reference that was loaded (maybe the default map)

        // if(request.component instanceof MapSelectorComponent && request.mediator instanceof MapMediator) {
        //     const currentFilter = request.mediator.getFilter();
        //     currentFilter.highLevelElements.forEach(hle => {
        //         (request.mediator as MapMediator).getFiltersMap().forEach((value:FilterElementsData, key:string) => {
        //             value.highLevelElements.forEach(filterHle => {
        //                 if(hle.name === filterHle.name) {
        //                     filterHle.active = hle.active
        //                 }
        //             })
        //         })
        //         hle.elements.forEach(element => {
        //             (request.mediator as MapMediator).getFiltersMap().forEach((value:FilterElementsData, key:string) => {
        //                 value.highLevelElements.forEach(filterHle => {
        //                     if(hle.name === filterHle.name) {
        //                         filterHle.elements.forEach(filterElement => {
        //                             if(filterElement.name === element.name) {
        //                                 filterElement.active = element.active
        //                             }
        //                         })
        //                     }
        //                 })
        //             })
        //         })
        //     })
        // }
    }
}