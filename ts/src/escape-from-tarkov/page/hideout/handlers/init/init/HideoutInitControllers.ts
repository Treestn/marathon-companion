import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { ItemController } from "../../../../items/controller/ItemController";
import { HideoutBodyController } from "../../../controller/HideoutBodyController";
import { HideoutFilterController } from "../../../controller/HideoutFilterController";
import { HideoutHeaderControllers } from "../../../controller/HideoutHeaderControllers";
import { HideoutLevelStateController } from "../../../controller/HideoutLevelStateController";
import { HideoutMapControllers } from "../../../controller/HideoutMapControllers";
import { HideoutStationPageController } from "../../../controller/HideoutStationPageController";
import { HideoutInitRequest } from "../../request/HideoutInitRequest";

export class HideoutInitControllers extends AbstractChainHandler {

    handle(request: HideoutInitRequest) {
        HideoutHeaderControllers.setHideoutMeditor(request.mediator);
        HideoutBodyController.setHideoutMeditor(request.mediator);
        HideoutFilterController.setHideoutMeditor(request.mediator);
        HideoutMapControllers.setHideoutMeditor(request.mediator);
        HideoutStationPageController.setHideoutMeditor(request.mediator);
        HideoutLevelStateController.setHideoutMeditor(request.mediator);
        ItemController.setHideoutMeditor(request.mediator);

        HideoutMapControllers.registerWindowResize(request.mediator);
        // request.builder.hideoutComponentList.forEach(component => {
        //     this.registerComponentControllers(component)
        // })
    }

    // registerComponentControllers(component:HideoutComponent):void {
    //     HideoutHeaderControllers.registerHeaderController(component);
    //     const levelsList = component.getHtmlHeaderElement().getElementsByClassName("hideout-station-level-header-title-wrapper");
    //     for(const element of levelsList) {
    //         if(element instanceof HTMLElement) {
    //             HideoutBodyController.registerStationController(component, element);
    //         }
    //     }
    // }
}