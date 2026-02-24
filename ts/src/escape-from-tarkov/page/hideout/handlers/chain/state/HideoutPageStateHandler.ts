import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { HideoutLevels } from "../../../../../../model/HideoutObject";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { PlayerProgressionUtils } from "../../../../../utils/PlayerProgressionUtils";
import { ItemUtils } from "../../../../items/utils/ItemUtils";
import { HideoutUtils } from "../../../utils/HideoutUtils";
import { HideoutRequest } from "../../request/HideoutRequest";

export class HideoutPageStateHandler extends AbstractChainHandler {
    
    handle(request: HideoutRequest) {
        if(request.event === EventConst.HIDEOUT_STATE_EVENT) {
            switch(request.subEvent) {
                // case DataEventConst.HIDEOUT_COMPLETED: this.handleStationCompleted(request); break;
                case DataEventConst.HIDEOUT_LEVEL_COMPLETED: this.handleStationLevelCompleted(request); break;
                // case DataEventConst.HIDEOUT_ACTIVE: this.handleStationActivation(request); break;
                case DataEventConst.HIDEOUT_LEVEL_ACTIVE: this.handleStationLevelActivation(request); break;
                case DataEventConst.HIDEOUT_LEVEL_INACTIVE: this.handleStationLevelDeactivation(request); break;
            }
        }
    }

    // private handleStationActivation(request: HideoutRequest) {
    //     if(!request.hideoutComponent) {
    //         return;
    //     }
    //     const stationState = PlayerProgressionUtils.getHideoutStationState(request.hideoutStation.id);
    //     if(stationState) {
    //         if(stationState.active) {
    //             stationState.active = false;
    //         } else {
    //             stationState.active = true;
    //             stationState.completed = false;
    //         }
    //         PlayerProgressionUtils.save();
    //     }
    // }

    private handleStationLevelActivation(request: HideoutRequest) {
        if(!request.hideoutStation || !request.hideoutLevel) {
            return;
        }
        const levelState = PlayerProgressionUtils.getStationLevelState(request.hideoutStation.id, request.hideoutLevel.id);
        if(levelState) {
            if(!levelState.active) {
                levelState.active = true;
            }
            if(levelState.completed) {
                levelState.completed = false
                HideoutUtils.giveItemsBack(request.hideoutLevel);
            }
            const stationState = PlayerProgressionUtils.getHideoutStationState(request.hideoutStation.id);
            if(stationState) {
                stationState.active = true;
                if(stationState.completed) {
                    stationState.completed = false;
                }
            }
            PlayerProgressionUtils.save();
        }
    }

    private handleStationLevelDeactivation(request: HideoutRequest) {
        if(!request.hideoutStation || !request.hideoutLevel) {
            return;
        }
        const levelState = PlayerProgressionUtils.getStationLevelState(request.hideoutStation.id, request.hideoutLevel.id);
        if(levelState) {
            if(levelState.active) {
                levelState.active = false;
            }
            if(levelState.completed) {
                levelState.completed = false;
                HideoutUtils.giveItemsBack(request.hideoutLevel)
            }
            const stationState = PlayerProgressionUtils.getHideoutStationState(request.hideoutStation.id);
            if(stationState && stationState.completed) {
                stationState.completed = false;
            }
            if(stationState && stationState.active) {
                let active = false;
                // Set the station active if we have a station level active 
                request.hideoutStation.levels.forEach(stationLevel => {
                    const state = PlayerProgressionUtils.getStationLevelState(request.hideoutStation.id, stationLevel.id);
                    if(state && state.active) {
                        active = true;
                    }
                })
                stationState.active = active;
            }
            PlayerProgressionUtils.save();
        }
    }

    private handleStationLevelCompleted(request: HideoutRequest) {
        if(!request.hideoutStation || !request.hideoutLevel) {
            return;
        }
        
        const levelState = PlayerProgressionUtils.getStationLevelState(request.hideoutStation.id, request.hideoutLevel.id);
        if(levelState && !levelState.completed) {
            levelState.active = false;
            levelState.completed = true;
            HideoutUtils.giveItems(request.hideoutLevel);
            PlayerProgressionUtils.resolveHideoutStates(HideoutUtils.getData().hideoutStations);
        }
        if(levelState && levelState.active) {
            levelState.active = false;
        }
        const nextLevel = HideoutUtils.getNextStationLevel(request.hideoutStation.id, request.hideoutLevel.id);
        if(nextLevel) {
            const stationState = PlayerProgressionUtils.getHideoutStationState(request.hideoutStation.id);
            const nextLevelState = PlayerProgressionUtils.getStationLevelState(request.hideoutStation.id, nextLevel.id);
            if(nextLevelState && !nextLevelState.completed && stationState) {
                nextLevelState.active = true;
                stationState.active = true
            }
        } else {
            // There is no level after this one
            if(levelState.completed) {
                const stationState = PlayerProgressionUtils.getHideoutStationState(request.hideoutStation.id);
                if(stationState && !stationState.completed) {
                    stationState.active = false;
                    stationState.completed = true;
                }
            }
        }
        PlayerProgressionUtils.save();
    }

    // private activateNextStations() {
    //     HideoutUtils.getData().hideoutStations.forEach(station => {
    //         if(HideoutUtils.areStationRequirementsCompleted(station)) {
    //             const stationState = PlayerProgressionUtils.getHideoutStationState(station.id) 
    //             if(!stationState.active && !stationState.completed) {
    //                 stationState.active = true;
    //             }
    //             const level1 = HideoutUtils.getStationLevelWithNumber(station.id, 1);
    //             if(level1) {
    //                 const level1State = PlayerProgressionUtils.getStationLevelState(station.id, level1.id);
    //                 if(!level1State.active && !level1State.completed) {
    //                     level1State.active = true;
    //                 }
    //             }
    //         }
    //     })
    // }
}