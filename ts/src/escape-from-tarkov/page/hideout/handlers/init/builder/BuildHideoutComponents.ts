import { HideoutStations } from "../../../../../../model/HideoutObject";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { HideoutComponent } from "../../../component/HideoutComponent";
import { HideoutUtils } from "../../../utils/HideoutUtils";
import { HideoutInitRequest } from "../../request/HideoutInitRequest";

export class BuildHideoutComponents extends AbstractChainHandler {

    handle(request: HideoutInitRequest) {
        if(HideoutUtils.getData() && HideoutUtils.getData().hideoutStations) {
            HideoutUtils.getData().hideoutStations.forEach(station => {
                const component = this.createHideoutComponent(station);
                request.builder.addHideoutStation(component);
                request.mediator.add(component);
            })
        } else {
            console.log(`Issue with retrieving the Hideout data`);
        }
    }
    
    private createHideoutComponent(station:HideoutStations):HideoutComponent {
        return new HideoutComponent(station);
    }
}