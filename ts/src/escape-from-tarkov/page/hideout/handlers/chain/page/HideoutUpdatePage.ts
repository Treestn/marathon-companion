import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { HideoutBodyBuilder } from "../../../builder/helper/HideoutBodyBuilder";
import { HideoutBodyUtils } from "../../../utils/HideoutBodyUtils";
import { HideoutFilterUtils } from "../../../utils/HideoutFilterUtils";
import { HideoutMapUtils } from "../../../utils/HideoutMapUtils";
import { HideoutStationPageUtils } from "../../../utils/HideoutStationPageUtils";
import { HideoutUtils } from "../../../utils/HideoutUtils";
import { HideoutRequest } from "../../request/HideoutRequest";

export class HideoutUpdateHandler extends AbstractChainHandler {
    
    handle(request: HideoutRequest) {
        if(request.event === EventConst.HIDEOUT_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.HIDEOUT_HEADER_CLICK: this.handleHeaderClick(request); break;
                case DataEventConst.HIDEOUT_LEVEL_HEADER_CLICK: this.handleLevelHeaderClick(request); break;
                case DataEventConst.HIDEOUT_LEVEL_REQUIREMENT_CLICK: this.handleLevelRequirementClick(request); break;
                case DataEventConst.HIDEOUT_LEVEL_CRAFT_CLICK: this.handleLevelCraftClick(request); break;
                case DataEventConst.HIDEOUT_FILTER_CHANGE: this.refreshHeadersState(request); break;
                case DataEventConst.ITEM_STATE_CHANGED: this.refreshItemState(request); break;
                case DataEventConst.QUEST_UPDATE:
                case DataEventConst.PROGRESSION_CHANGED: this.rebuild(request); break;
            }
        }
        if(request.event === EventConst.HIDEOUT_STATE_EVENT) {
            this.refreshPage(request);
        }
    }

    private rebuild(request:HideoutRequest) {
        const levelRunner = document.getElementById("hideoutStationRunner");
        if(levelRunner) {
            const stationLevel = HideoutUtils.getStationLevelWithId(HideoutStationPageUtils.selectedLevelId);
            if(stationLevel) {
                const station = HideoutUtils.getStationWithLevelId(stationLevel.id);
                if(station) {
                    HideoutStationPageUtils.refreshStationPageState(stationLevel, station);
                    HideoutBodyUtils.resolveRequirements(station, stationLevel);
                }
            }
        }
        HideoutMapUtils.refreshMapState();
    }

    private refreshPage(request:HideoutRequest) {
        if(request.hideoutStation && request.hideoutLevel) {
            HideoutStationPageUtils.refreshStationPageState(request.hideoutLevel, request.hideoutStation);
            const stationLevel = HideoutUtils.getStationLevelWithId(HideoutStationPageUtils.selectedLevelId);
            // The button clicked could be another level which is not the one currently active
            if(stationLevel) {
                HideoutBodyUtils.resolveRequirements(request.hideoutStation, stationLevel);
            }
            HideoutMapUtils.refreshMapState();
        }
    }

    private refreshItemState(request:HideoutRequest) {
        if(request.itemId) {
            HideoutBodyUtils.resolveRequirements();
        }
    }

    private refreshHeadersState(request:HideoutRequest) {
        HideoutFilterUtils.resolveAllHideoutsHeader();
    }

    private handleHeaderClick(request: HideoutRequest) {
        const component = request.hideoutComponent;
        if(component.getHtmlBodyElement().style.display === "none") {
            component.getHtmlBodyElement().style.display = "flex";
            HideoutBodyUtils.resolveLevelsGlow(component);
            HideoutBodyUtils.resolveRequirements()
        } else {
            component.getHtmlBodyElement().style.display = "none";
        }
    }

    private handleLevelHeaderClick(request: HideoutRequest) {
        if(!request.htmlElement || !request.hideoutLevel || !request.hideoutComponent) {
            return;
        }
        if(request.htmlElement.nextElementSibling && request.htmlElement.nextElementSibling.classList.contains("hideout-station-level-requirements-wrapper")) {
            request.htmlElement.nextElementSibling.remove();
            HideoutBodyUtils.arrowUp(request.htmlElement);
        } else {
            HideoutBodyUtils.arrowDown(request.htmlElement);
            const stationLevel = HideoutBodyBuilder.createHideoutStationLevelRequirements(request.hideoutComponent, request.hideoutLevel)
            request.htmlElement.after(stationLevel);
            HideoutBodyUtils.resolveRequirements();
        }
    }

    private handleLevelRequirementClick(request: HideoutRequest) {
        if(!request.hideoutLevel || !request.hideoutStation) {
            return;
        }
        HideoutBodyBuilder.createLevelRequirementsInformation(request.hideoutLevel, true);
        HideoutBodyUtils.resolveRequirements(request.hideoutStation, request.hideoutLevel);
        HideoutStationPageUtils.refreshStationPageState(request.hideoutLevel);
    }

    private handleLevelCraftClick(request: HideoutRequest) {
        if(!request.hideoutLevel || !request.hideoutStation) {
            return;
        }
        HideoutBodyBuilder.createCraftsContent(request.hideoutStation, request.hideoutLevel);
        HideoutStationPageUtils.refreshStationPageState(request.hideoutLevel);
    }
}