import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { SessionUtils } from "../../../utils/SessionUtils";
import { HideoutBodyUtils } from "./HideoutBodyUtils";

export class HideoutFilterUtils {

    static resolveAllHideoutsHeader() {
        const hideoutList = document.getElementsByClassName("hideout-station-header-wrapper")
        if(hideoutList) {
            for(const hideoutHeader of hideoutList) {
                const hideoutState = PlayerProgressionUtils.getHideoutStationState(hideoutHeader.id);
                if(hideoutState && hideoutHeader instanceof HTMLElement) {
                    HideoutBodyUtils.hideHideout(hideoutHeader)
                    if(!hideoutState.active && this.getInactiveState()) {
                        HideoutBodyUtils.showHideout(hideoutHeader);
                        continue;
                    }
                    if(hideoutState.active && this.getActiveState()) {
                        HideoutBodyUtils.showHideout(hideoutHeader);
                        continue;
                    }
                    if(hideoutState.completed && this.getCompletedState()) {
                        HideoutBodyUtils.showHideout(hideoutHeader);
                        continue;
                    }
                }
            }
        }
    }
    
    static setInactiveState(state:boolean) {
        SessionUtils.getFilterStates().hideoutFilter.inactiveState = state
        SessionUtils.setFilterState()
    }

    static setActiveState(state:boolean) {
        SessionUtils.getFilterStates().hideoutFilter.activeState = state
        SessionUtils.setFilterState()
    }

    static setCompletedState(state:boolean) {
        SessionUtils.getFilterStates().hideoutFilter.completedState = state
        SessionUtils.setFilterState()
    }

    static getInactiveState() {
        return SessionUtils.getFilterStates().hideoutFilter.inactiveState
    }

    static getActiveState() {
        return SessionUtils.getFilterStates().hideoutFilter.activeState
    }

    static getCompletedState() {
        return SessionUtils.getFilterStates().hideoutFilter.completedState
    }
}