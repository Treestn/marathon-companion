import { HideoutLevels, HideoutStations } from "../../../../model/HideoutObject";
import { StationLevelState } from "../../../../model/IPlayerProgression";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { HideoutBodyBuilder } from "../builder/helper/HideoutBodyBuilder";
import { HideoutStationPageBuilder } from "../builder/helper/HideoutStationPageBuilder";
import { HideoutBodyUtils } from "./HideoutBodyUtils";
import { HideoutMapUtils } from "./HideoutMapUtils";
import { HideoutUtils } from "./HideoutUtils";

export class HideoutStationPageUtils {

    static readonly BORDER_SIZE = 4;
    static readonly LEVEL_INACTIVE_CLASS = "hideout-level-button-inactive";
    static readonly LEVEL_ACTIVE_CLASS = "hideout-level-button-active";
    static readonly LEVEL_COMPLETED_CLASS = "hideout-level-button-completed";
    static readonly BUTTON_ACTIVE_STATE_CLASS = "hideout-level-button-state-active";
    static readonly INFO_WRAPPER_INACTIVE_CLASS = "hideout-info-wrapper-inactive";
    static readonly INFO_WRAPPER_ACTIVE_CLASS = "hideout-info-wrapper-active";
    static readonly INFO_WRAPPER_COMPLETED_CLASS = "hideout-info-wrapper-completed";

    static selectedLevelId:string = null;

    static openLevelRequirementsInfo(stationLevel:HideoutLevels) {
        const wrapper = document.getElementById("hideoutStationPageInfoWrapper");
        if(wrapper) {

        }
    }

    static openStationPage(station: HideoutStations, stationLevel?:HideoutLevels) {
        HideoutStationPageBuilder.openStationPage(station);
        if(!stationLevel) {
            for(const level of station.levels) {
                const state = PlayerProgressionUtils.getStationLevelState(station.id, level.id);
                // If we get a station level that is active and not completed
                // populate instantly
                if(state.active && !state.completed) {
                    this.populateInfoSection(station, level);
                    return;
                }
            }
            //If we get here, populate the first one
            this.populateInfoSection(station, station.levels[0]);
        } else {
            this.populateInfoSection(station, stationLevel);
        }
    }

    private static populateInfoSection(station:HideoutStations, stationLevel:HideoutLevels) {
        this.selectedLevelId = stationLevel.id;
        HideoutBodyBuilder.createLevelRequirementsInformation(stationLevel, true);
        HideoutBodyUtils.resolveRequirements(station, stationLevel);
        HideoutStationPageUtils.refreshStationPageState(stationLevel);
    }

    static refreshStationPageState(stationLevel:HideoutLevels, station?:HideoutStations) {
        if(!station) {
            station = this.getStation();
            if(!station) {
                console.log(`Could not retrieve station while resolving Hideout Station Page`);
            }
        }
        this.resolveLevelButtons(station);
        this.resolveHideoutLevelHeaders(station);

        if(stationLevel.id !== this.selectedLevelId) {
            stationLevel = HideoutUtils.getStationLevelWithId(this.selectedLevelId);
        }
        if(stationLevel) {
            this.resolveSelectedHideoutLevel(stationLevel, station);
            this.resolveInfoBorderColor(station, stationLevel);
        }
    }

    static resolveLevelButtons(station:HideoutStations) {
        station.levels.forEach(stationLevel => {
            const levelWrapper = document.getElementById(stationLevel.id);
            const state = PlayerProgressionUtils.getStationLevelState(station.id, stationLevel.id);
            if(levelWrapper && state) {
                const buttonsList = levelWrapper.getElementsByClassName("hideout-station-page-state-button");
                if(buttonsList && buttonsList.length === 3) {
                    for(let button of buttonsList) {
                        if(button instanceof HTMLElement) {
                            this.resolveButtonState(button, state)
                        }
                    }
                }
            }
        })
    }

    private static resolveButtonState(button:HTMLElement, state:StationLevelState) {
        // Remove active state class first
        button.classList.remove(HideoutStationPageUtils.BUTTON_ACTIVE_STATE_CLASS);
        
        if(button.classList.contains(HideoutStationPageUtils.LEVEL_INACTIVE_CLASS)) {
            if(!state.active && !state.completed) {
                // Active state - matches the status
                button.classList.add(HideoutStationPageUtils.BUTTON_ACTIVE_STATE_CLASS);
                button.style.background = `linear-gradient(135deg, ${HideoutMapUtils.ACTIVATED_INACTIVE_COLOR}, rgba(251, 47, 54, 0.8))`;
                button.style.borderColor = "rgba(251, 47, 54, 0.6)";
                button.style.color = "#ffffff";
            } else {
                // Inactive state - doesn't match the status
                button.style.background = "";
                button.style.borderColor = "rgba(251, 47, 54, 0.2)";
                button.style.color = "#b8b8b8";
            }
        } else if(button.classList.contains(HideoutStationPageUtils.LEVEL_ACTIVE_CLASS)) {
            if(state.active && !state.completed) {
                // Active state - matches the status
                button.classList.add(HideoutStationPageUtils.BUTTON_ACTIVE_STATE_CLASS);
                button.style.background = `linear-gradient(135deg, ${HideoutMapUtils.ACTIVATED_ACTIVE_COLOR}, rgba(108, 183, 178, 0.9))`;
                button.style.borderColor = "rgba(108, 183, 178, 0.6)";
                button.style.color = "#ffffff";
            } else {
                // Inactive state - doesn't match the status
                button.style.background = "";
                button.style.borderColor = "rgba(108, 183, 178, 0.2)";
                button.style.color = "#b8b8b8";
            }
        } else if(button.classList.contains(HideoutStationPageUtils.LEVEL_COMPLETED_CLASS)) {
            if(state.completed) {
                // Active state - matches the status
                button.classList.add(HideoutStationPageUtils.BUTTON_ACTIVE_STATE_CLASS);
                button.style.background = `linear-gradient(135deg, ${HideoutMapUtils.ACTIVATED_COMPLETED_COLOR}, rgba(123, 95, 150, 0.9))`;
                button.style.borderColor = "rgba(123, 95, 150, 0.6)";
                button.style.color = "#ffffff";
            } else {
                // Inactive state - doesn't match the status
                button.style.background = "";
                button.style.borderColor = "rgba(123, 95, 150, 0.2)";
                button.style.color = "#b8b8b8";
            }
        }
    }

    private static getStation():HideoutStations {
        const wrapper = document.getElementsByClassName("hideout-station-page-header-top-wrapper");
        if(wrapper && wrapper.length > 0 && wrapper[0] instanceof HTMLDivElement) {
            const stationId = wrapper[0].id
            return HideoutUtils.getStation(stationId);
        }
        return null
    }

    private static resolveSelectedHideoutLevel(stationLevel:HideoutLevels, station:HideoutStations) {
        const element = document.getElementById(stationLevel.id);
        const state = PlayerProgressionUtils.getStationLevelState(station.id, stationLevel.id)
        if(element && state) {
            element.classList.add("hideout-station-page-header-selected");
            element.style.zIndex = "1";
            element.style.height = `calc(100% + ` + (this.BORDER_SIZE + 1) + `px)`;
            element.style.backgroundColor = "";
            if(state.active && !state.completed) {
                element.style.border = `${this.BORDER_SIZE}px solid ${HideoutMapUtils.ACTIVATED_ACTIVE_COLOR}`;            
            } else if(state.completed) {
                element.style.border = `${this.BORDER_SIZE}px solid ${HideoutMapUtils.ACTIVATED_COMPLETED_COLOR}`;            
            } else {
                element.style.border = `${this.BORDER_SIZE}px solid ${HideoutMapUtils.ACTIVATED_INACTIVE_COLOR}`;            
            }
            element.style.borderBottom = 'none';
        }
    }

    private static resolveHideoutLevelHeaders(station:HideoutStations) {
        station.levels.forEach(stationLevel => {
            const element = document.getElementById(stationLevel.id);
            if(element) {
                this.resolveHideoutLevelState(station, stationLevel, element);
            }
        })
    }

    private static resolveHideoutLevelState(station:HideoutStations, stationLevel:HideoutLevels, element:HTMLElement) {
        element.classList.remove("hideout-station-page-header-selected");
        const state = PlayerProgressionUtils.getStationLevelState(station.id, stationLevel.id)
        if(state.active && !state.completed) {
            element.style.border = `${this.BORDER_SIZE}px solid ${HideoutMapUtils.ACTIVE_COLOR}`;
        } else if(state.completed) {
            element.style.border = `${this.BORDER_SIZE}px solid ${HideoutMapUtils.COMPLETED_COLOR}`;
        } else {
            element.style.border = `${this.BORDER_SIZE}px solid ${HideoutMapUtils.INACTIVE_COLOR}`;
        }
        element.style.borderBottom = "none";
        element.style.backgroundColor = "var(--loading-background-color)";
        element.style.zIndex = "0";
    }

    private static resolveInfoBorderColor(station:HideoutStations, stationLevel:HideoutLevels) {
        const wrapper = document.getElementById("hideoutStationPageInfoWrapper");
        if(wrapper) {
            // Remove all status classes first
            wrapper.classList.remove(
                HideoutStationPageUtils.INFO_WRAPPER_INACTIVE_CLASS,
                HideoutStationPageUtils.INFO_WRAPPER_ACTIVE_CLASS,
                HideoutStationPageUtils.INFO_WRAPPER_COMPLETED_CLASS
            );
            
            const state = PlayerProgressionUtils.getStationLevelState(station.id, stationLevel.id)
            if(state.active && !state.completed) {
                wrapper.style.borderTop = `${this.BORDER_SIZE}px solid ${HideoutMapUtils.ACTIVATED_ACTIVE_COLOR}`;
                wrapper.classList.add(HideoutStationPageUtils.INFO_WRAPPER_ACTIVE_CLASS);
            } else if(state.completed) {
                wrapper.style.borderTop = `${this.BORDER_SIZE}px solid ${HideoutMapUtils.ACTIVATED_COMPLETED_COLOR}`;
                wrapper.classList.add(HideoutStationPageUtils.INFO_WRAPPER_COMPLETED_CLASS);
            } else {
                wrapper.style.borderTop = `${this.BORDER_SIZE}px solid ${HideoutMapUtils.ACTIVATED_INACTIVE_COLOR}`;
                wrapper.classList.add(HideoutStationPageUtils.INFO_WRAPPER_INACTIVE_CLASS);
            }
        }
    }

}