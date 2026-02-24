import { HideoutLevels } from "../../../../model/HideoutObject";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { HideoutBuilder } from "../builder/HideoutBuilder";
import { HideoutMediator } from "../mediator/HideoutMediator";
import { HideoutUtils } from "./HideoutUtils";

export class HideoutMapUtils {

    static readonly HEXAGON_CLIP_PATH = "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)"

    static readonly INACTIVE_COLOR:string = "rgba(251, 47, 54, 0.6)";
    static readonly ACTIVE_COLOR:string = "rgba(108, 183, 178, 0.8)";
    static readonly COMPLETED_COLOR:string = "rgba(123, 95, 150, 0.8)";

    static readonly ACTIVATED_INACTIVE_COLOR:string = "rgba(251, 47, 54, 0.9)";
    static readonly ACTIVATED_ACTIVE_COLOR:string = "rgba(108, 183, 178, 1)";
    static readonly ACTIVATED_COMPLETED_COLOR:string = "rgba(123, 95, 150, 1)";

    static readonly HOVER_INACTIVE_COLOR:string = "#751717";
    static readonly HOVER_ACTIVE_COLOR:string = "#61aeac";
    static readonly HOVER_COMPLETED_COLOR:string = "rgb(123 95 150)";

    static refreshMapState() {
        const hexagonList = document.getElementsByClassName("hideout-hexagon");
        for(let hexagon of hexagonList) {
            if(hexagon instanceof HTMLElement) {
               this.resolveStation(hexagon);
               // Also update popup wrapper color
               this.resolvePopupWrapperColor(hexagon);
            }
        }
    }

    static resolveStation(hexagon:HTMLElement) {
        const station = HideoutUtils.getStation(hexagon.id);
        if(station) {
            const state = PlayerProgressionUtils.getHideoutStationState(station.id);
            if(state) {
                let statusColor: string;
                if(state.active && !state.completed) {
                    statusColor = HideoutMapUtils.ACTIVE_COLOR;
                    hexagon.style.backgroundColor = HideoutMapUtils.ACTIVE_COLOR;
                } else if(state.completed) {
                    statusColor = HideoutMapUtils.COMPLETED_COLOR;
                    hexagon.style.backgroundColor = HideoutMapUtils.COMPLETED_COLOR;
                } else {
                    statusColor = HideoutMapUtils.INACTIVE_COLOR;
                    hexagon.style.backgroundColor = HideoutMapUtils.INACTIVE_COLOR;
                }
                // Set status color on popup wrapper by default (if it exists)
                const popupWrapper = hexagon.querySelector(".hideout-logo-popup-wrapper") as HTMLElement;
                if(popupWrapper) {
                    popupWrapper.style.background = statusColor;
                }
            }
        }
    }

    static resolvePopupWrapperColor(hexagon:HTMLElement) {
        // Set status color on popup wrapper - called after popup is appended
        const station = HideoutUtils.getStation(hexagon.id);
        if(station) {
            const state = PlayerProgressionUtils.getHideoutStationState(station.id);
            if(state) {
                let statusColor: string;
                if(state.active && !state.completed) {
                    statusColor = HideoutMapUtils.ACTIVE_COLOR;
                } else if(state.completed) {
                    statusColor = HideoutMapUtils.COMPLETED_COLOR;
                } else {
                    statusColor = HideoutMapUtils.INACTIVE_COLOR;
                }
                const popupWrapper = hexagon.querySelector(".hideout-logo-popup-wrapper") as HTMLElement;
                if(popupWrapper) {
                    popupWrapper.style.background = statusColor;
                }
            }
        }
    }

    static topMostPopup(logo:HTMLDivElement) {
        logo.style.zIndex = "10"
    }

    static addGlow(color:string, canvas:HTMLCanvasElement) {
        if(canvas.style.filter === "") {
            canvas.style.filter = `drop-shadow(0 0 .5rem ${color})`;
        }
    }

    static removeGlow(canvas:HTMLCanvasElement) {
        canvas.style.filter = ""
    }

    static logoActive(logo:HTMLDivElement) {
        // Set gradient background on popup wrapper when hovering
        const popupWrapper = logo.querySelector(".hideout-logo-popup-wrapper") as HTMLElement;
        if(popupWrapper) {
            // Use the gradient background from CSS when hovering
            popupWrapper.style.background = "linear-gradient(135deg, rgb(74 61 83), rgb(38 69 64))";
        }
    }

    static logoHovering(logo:HTMLDivElement) {
        logo.style.clipPath = "";
    }

    static logoHoverOut(color:string, logo:HTMLDivElement) {
        // Restore status color on popup wrapper when not hovering
        const popupWrapper = logo.querySelector(".hideout-logo-popup-wrapper") as HTMLElement;
        if(popupWrapper) {
            // Restore the status color (passed as parameter)
            popupWrapper.style.background = color;
        }
        logo.style.clipPath = HideoutMapUtils.HEXAGON_CLIP_PATH;
        logo.style.zIndex = "4"
    }

    static setLogoLevelColor(color:string, stationLevel:HideoutLevels) {
        const levelWrapper = document.getElementById(stationLevel.id);
        if(levelWrapper) {
            levelWrapper.style.backgroundColor = color;
        }
    }

    static resizeMap(mediator:HideoutMediator) {
        const scale = HideoutUtils.getHideoutScale();
        const mapLayout = document.getElementById("hideoutLayoutImage");
        if(mapLayout && mapLayout instanceof HTMLCanvasElement) {
            mapLayout.style.width = HideoutUtils.getLayout().width * scale + "px";
            mapLayout.style.height = HideoutUtils.getLayout().height * scale + "px";
        }

        mediator.getComponentList().forEach(component => {
            const station = component.getStation();
            const x = (station.location.x * scale) + (station.location.width * scale)/2 - HideoutBuilder.HEXAGON_DIM/2;
            const y = (station.location.y * scale) + (station.location.height * scale)/2 - HideoutBuilder.HEXAGON_DIM/2;
            component.getLogoWrapperElement().style.transform = `translate(${x}px, ${y}px)`;

            component.getCanvasElement().style.transform = `translate(${station.location.x * scale}px, ${station.location.y * scale}px)`;
            component.getCanvasElement().style.width = station.location.width * scale + "px";
            component.getCanvasElement().style.height = station.location.height * scale + "px";
        })
    }
}