import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { HideoutComponent } from "../component/HideoutComponent";
import { HideoutBodyUtils } from "./HideoutBodyUtils";
import { HideoutUtils } from "./HideoutUtils";

export class HideoutHeaderUtils {

    static refreshAllPageStates() {
        const hideoutElementHeaderList = this.getElementHeaderList();
        const hideoutElementBodyList = HideoutBodyUtils.getElementBodyList();
        HideoutUtils.getData().hideoutStations.forEach(station => {
            const stationHeader = this.getHideoutElementFromId(station.id, hideoutElementHeaderList);
            this.resolveStationGlow(stationHeader, station.id);
            station.levels.forEach(level => {
                const levelHeader = this.getHideoutElementFromId(station.id, hideoutElementBodyList);
                this.resolveLevelGlow(station.id, level.id, levelHeader);
            })
        })
    }

    static getElementHeaderList() {
        return document.getElementsByClassName("hideout-station-header-wrapper");
    }

    static getHideoutElementFromId(id:string, list:HTMLCollectionOf<Element>):HTMLElement {
        for(const element of list) {
            if(element.id === id && element instanceof HTMLElement) {
                return element
            } 
        }
        return null;
    }

    static resolveHeaderGlow(component:HideoutComponent) {
        const header = component.getHtmlHeaderElement();
        if(header instanceof HTMLElement) {
            const state = PlayerProgressionUtils.getHideoutStationState(component.getStation().id);
            if(state) {
                if(state.active && !state.completed) {
                    header.style.boxShadow = "rgba(0, 255, 0, 0.08) 10px -11px 30px -0.5px inset";
                } else if(state.completed) {
                    header.style.boxShadow = "rgba(167, 167, 146, 0.3) 10px -11px 30px -0.5px inset";
                } else {
                    header.style.boxShadow = "rgba(255, 0, 0, 0.08) 10px -11px 30px -0.5px inset";
                }
            }
        }
    }

    static resolveStationGlow(header:HTMLElement, stationId:string) {
        if(header) {
            const state = PlayerProgressionUtils.getHideoutStationState(stationId);
            if(state) {
                if(state.active && !state.completed) {
                    header.style.boxShadow = "rgba(0, 255, 0, 0.08) 10px -11px 30px -0.5px inset";
                } else if(state.completed) {
                    header.style.boxShadow = "rgba(167, 167, 146, 0.3) 10px -11px 30px -0.5px inset";
                } else {
                    header.style.boxShadow = "rgba(255, 0, 0, 0.08) 10px -11px 30px -0.5px inset";
                }
                const activationButton = header.getElementsByClassName("hideout-station-activation");
                if(activationButton && activationButton.length > 0 && activationButton[0] instanceof HTMLElement) {
                    if(state.active) {
                        activationButton[0].classList.remove("glow-green")
                        activationButton[0].classList.add("glow-red")
                    } else {
                        activationButton[0].classList.remove("glow-red")
                        activationButton[0].classList.add("glow-green")
                    }
                }
                const completedButton = header.getElementsByClassName("hideout-station-completed");
                if(completedButton && completedButton.length > 0 && completedButton[0] instanceof HTMLElement) {
                    if(state.completed) {
                        completedButton[0].classList.remove("glow-completed")
                        completedButton[0].classList.add("glow-red")
                    } else {
                        completedButton[0].classList.remove("glow-red")
                        completedButton[0].classList.add("glow-completed")
                    }
                } 
            }
        }
    }

    static resolveLevelGlow(stationId:string, levelId:string, header:HTMLElement) {
        if(header) {
            const target:HTMLElement = this.getTarget(header, levelId);

            if(target) {

                const state = PlayerProgressionUtils.getStationLevelState(stationId, levelId);
                if(state) {

                    if(state.active && !state.completed) {
                        target.style.boxShadow = "rgba(0, 255, 0, 0.08) 10px -11px 30px -0.5px inset";
                    } else if(state.completed) {
                        target.style.boxShadow = "rgba(167, 167, 146, 0.3) 10px -11px 30px -0.5px inset";
                    } else {
                        target.style.boxShadow = "rgba(255, 0, 0, 0.08) 10px -11px 30px -0.5px inset";
                    }

                    const activationButton = target.getElementsByClassName("hideout-station-level-activation");
                    if(activationButton && activationButton.length > 0 && activationButton[0] instanceof HTMLElement) {
                        if(state.active) {
                            activationButton[0].classList.remove("glow-green")
                            activationButton[0].classList.add("glow-red")
                        } else {
                            activationButton[0].classList.remove("glow-red")
                            activationButton[0].classList.add("glow-green")
                        }
                    } else {
                        console.log(`Hideout activation button not found for level id: ${levelId}`);
                    }

                    const completedButton = target.getElementsByClassName("hideout-station-level-completed");
                    if(completedButton && completedButton.length > 0 && completedButton[0] instanceof HTMLElement) {
                        if(state.completed) {
                            completedButton[0].classList.remove("glow-completed")
                            completedButton[0].classList.add("glow-red")
                        } else {
                            completedButton[0].classList.remove("glow-red")
                            completedButton[0].classList.add("glow-completed")
                        }
                    } else {
                        console.log(`Hideout completed button not found for level id: ${levelId}`);
                    }

                } else {
                    console.log(`Hideout level state not found for level id: ${levelId}`);
                }
            } else {
                console.log(`Hideout target element not found for level id: ${levelId}`);
            }
        } else {
            console.log(`Hideout level header body not found for level id: ${levelId}`);
        }
    }

    private static getTarget(header:HTMLElement, levelId:string) {
        const targets = header.getElementsByClassName("hideout-station-level-header-title-wrapper");
            for(const target of targets) {
                if(target.id === levelId && target instanceof HTMLElement) {
                    return target
                }
            }

    }
}