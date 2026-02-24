import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { HideoutRequest } from "../handlers/request/HideoutRequest";
import { HideoutMediator } from "../mediator/HideoutMediator";
import { HideoutFilterUtils } from "../utils/HideoutFilterUtils";

export class HideoutFilterController {

    private static hideoutMediator:HideoutMediator;

    static setHideoutMeditor(mediator:HideoutMediator) {
        this.hideoutMediator = mediator;
    }

    static registerInactiveController(label:HTMLLabelElement, input:HTMLInputElement) {
        label.onclick = (e) => {
            HideoutFilterUtils.setInactiveState(input.checked);
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_FILTER_CHANGE, null, null, null
            ))
            e.stopPropagation();
        }
    }

    static registerActiveController(label:HTMLLabelElement, input:HTMLInputElement) {
        label.onclick = (e) => {
            HideoutFilterUtils.setActiveState(input.checked);
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_FILTER_CHANGE, null, null, null
            ))
            e.stopPropagation();
        }
    }

    static registerCompletedController(label:HTMLLabelElement, input:HTMLInputElement) {
        label.onclick = (e) => {
            HideoutFilterUtils.setCompletedState(input.checked);
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_FILTER_CHANGE, null, null, null
            ))
            e.stopPropagation();
        }
    }
    
}