import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { HideoutLevels } from "../../../../model/HideoutObject";
import { HideoutComponent } from "../component/HideoutComponent";
import { HideoutRequest } from "../handlers/request/HideoutRequest";
import { HideoutMediator } from "../mediator/HideoutMediator";
import { HideoutUtils } from "../utils/HideoutUtils";

export class HideoutHeaderControllers {

    private static hideoutMediator:HideoutMediator;

    static setHideoutMeditor(mediator:HideoutMediator) {
        this.hideoutMediator = mediator;
    }

    static registerHeaderController(component:HideoutComponent) {
        component.getHtmlHeaderElement().onclick = () => {
            this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                DataEventConst.HIDEOUT_HEADER_CLICK, component, null, component.getHtmlBodyElement())
            )
            // if(component.getHtmlBodyElement().style.display === "none") {
            //     component.getHtmlBodyElement().style.display = "flex";
            //     HideoutBodyUtils.resolveLevelsGlow(component);
            //     HideoutBodyUtils.resolveRequirements(component)
            // } else {
            //     component.getHtmlBodyElement().style.display = "none";
            // }
        }
    }

    static registerActiveButton(component:HideoutComponent, element:HTMLImageElement, levelId?:string) {
        let level:HideoutLevels;
        if(levelId) {
            level = HideoutUtils.getStationLevel(component.getStation().id, levelId);
        }
        element.onclick = e => {
            if(levelId) {
                this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                    DataEventConst.HIDEOUT_LEVEL_ACTIVE, component, null, element, level)
                )
            } else {
                this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                    DataEventConst.HIDEOUT_ACTIVE, component, null, element)
                )
            }
            e.stopPropagation();
            // HideoutHeaderUtils.resolveHeaderGlow()
        }
    }

    static registerCompletedButton(component:HideoutComponent, element:HTMLImageElement, levelId?:string) {
        let level:HideoutLevels;
        if(levelId) {
            level = HideoutUtils.getStationLevel(component.getStation().id, levelId);
        }
        element.onclick = e => {
            if(levelId) {
                this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                    DataEventConst.HIDEOUT_LEVEL_COMPLETED, component, null, element, level)
                )
            } else {
                this.hideoutMediator.update(new HideoutRequest(this.hideoutMediator, EventConst.HIDEOUT_EVENT, 
                    DataEventConst.HIDEOUT_COMPLETED, component, null, element)
                )
            }
            e.stopPropagation();
        }
    }

}