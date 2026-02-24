import { I18nHelper } from "../../../../../locale/I18nHelper";
import { LogoPathConst } from "../../../../constant/ImageConst";
import { HideoutLevels, HideoutStations } from "../../../../../model/HideoutObject";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { PlayerProgressionUtils } from "../../../../utils/PlayerProgressionUtils";
import { ImageUtils } from "../../../map/utils/ImageUtils";
import { EditSession } from "../../../quests/edit/EditSession";
import { HideoutLevelStateController } from "../../controller/HideoutLevelStateController";
import { HideoutStationPageController } from "../../controller/HideoutStationPageController";
import { HideoutMapUtils } from "../../utils/HideoutMapUtils";
import { HideoutStationPageUtils } from "../../utils/HideoutStationPageUtils";
import { HideoutUtils } from "../../utils/HideoutUtils";

export class HideoutStationPageBuilder {

    static openStationPage(station: HideoutStations) {
        //Make sure we are not doing a duplicate
        this.closeStationPage();

        const runner = this.buildRunner();
        if(runner) {
            const topSection = this.buildTopHeader(station);
            runner.appendChild(topSection);
            // const closeButton = this.buildCloseButton();
            // runner.appendChild(closeButton);

            const headers = this.buildHeaders(station);
            runner.appendChild(headers);

            let info = this.buildInfo();
            runner.appendChild(info);
        }
    }

    static closeStationPage() {
        const currentRunner = document.getElementById("hideoutStationRunner");
        if(currentRunner) {
            currentRunner.remove();
        }
    }

    private static buildCloseButton():HTMLDivElement {
        const wrapper = HelperCreation.createDiv("", "hideout-station-page-close-button-wrapper", "");

        const image = new Image();
        image.src = LogoPathConst.X_ICON_WHITE;
        image.classList.add("hideout-station-page-close-button")
        wrapper.appendChild(image)

        HideoutStationPageController.registerCloseStationPage(wrapper);
        
        return wrapper;
    }

    private static buildRunner():HTMLElement {
        const hideoutDiv = document.getElementById("hideoutDiv");
        if(hideoutDiv) {
            const runner = HelperCreation.createDiv("hideoutStationRunner", "hideout-station-runner", "");
            hideoutDiv.insertBefore(runner, hideoutDiv.firstChild);
            return runner;
        } else {
            console.log('Could not find hideoutDiv while opening station page');
        }
    }

    private static buildHeaders(station:HideoutStations):HTMLDivElement {
        const wrapper = HelperCreation.createDiv("", "hideout-station-page-headers-wrapper", "");

        station.levels.forEach(stationLevel => {
            const headerWrapper = this.buildHeader(station, stationLevel);

            wrapper.appendChild(headerWrapper);
        })

        return wrapper;
    }

    private static buildHeader(station:HideoutStations, stationLevel:HideoutLevels):HTMLDivElement {
        const wrapper = HelperCreation.createDiv(stationLevel.id, "hideout-station-page-header-wrapper", "");
        
        // const topSection = this.buildTopHeader(station, stationLevel);
        const levelSection = this.buildLevelHeader(station, stationLevel);
        const stateSection = this.buildStateSection(station, stationLevel);
        const infoSection = this.buildInfoHeader(station, stationLevel);

        // wrapper.appendChild(topSection);
        wrapper.appendChild(levelSection);
        wrapper.appendChild(stateSection);
        wrapper.appendChild(infoSection);

        const state = PlayerProgressionUtils.getStationLevelState(station.id, stationLevel.id)
        if(state.active && !state.completed) {
            wrapper.style.border = `${HideoutStationPageUtils.BORDER_SIZE}px solid ${HideoutMapUtils.ACTIVE_COLOR}`;
        } else if(state.completed) {
            wrapper.style.border = `${HideoutStationPageUtils.BORDER_SIZE}px solid ${HideoutMapUtils.COMPLETED_COLOR}`;
        } else {
            wrapper.style.border = `${HideoutStationPageUtils.BORDER_SIZE}px solid ${HideoutMapUtils.INACTIVE_COLOR}`;;
        }
        wrapper.style.borderBottom = "none";
        wrapper.style.backgroundColor = "var(--loading-background-color)";

        return wrapper;
    }

    private static buildTopHeader(station:HideoutStations):HTMLDivElement {
        const headerWrapper = HelperCreation.createDiv("", "hideout-station-page-header-top-wrapper", "");
        headerWrapper.id = station.id;

        const closeButton = this.buildCloseButton();
        headerWrapper.appendChild(closeButton);

        const wrapper = HelperCreation.createDiv("", "hideout-station-page-header-top", "");
        
        const logoWrapper = HelperCreation.createDiv("", "hideout-station-page-header-top-logo-wrapper", "");
        const image = new Image();
        image.classList.add("hideout-station-page-header-top-logo")
        ImageUtils.loadImage(image, station.imageLink).then(result => {
            logoWrapper.appendChild(image);
        })
        const textWrapper = HelperCreation.createDiv("", "hideout-station-page-header-top-text-wrapper", "");
        const text = HelperCreation.createB("hideout-station-page-header-top-text", station.locales?.[I18nHelper.currentLocale()] ?? station.name);
        textWrapper.appendChild(text);

        wrapper.appendChild(logoWrapper);
        wrapper.appendChild(textWrapper);

        headerWrapper.appendChild(wrapper);

        return headerWrapper;
    }

    private static buildLevelHeader(station:HideoutStations, stationLevel:HideoutLevels):HTMLDivElement {
        const wrapper = HelperCreation.createDiv(stationLevel.id, "hideout-station-page-header-level-wrapper", "");
        
        const text = HelperCreation.createB("", `${I18nHelper.get("pages.hideout.station.level.label")} ${stationLevel.level}`);
        wrapper.appendChild(text);

        HideoutStationPageController.registerShowRequirementButton(wrapper, station, stationLevel);

        return wrapper;
    }

    private static buildStateSection(station:HideoutStations, stationLevel:HideoutLevels) {
        const wrapper = HelperCreation.createDiv(stationLevel.id, "hideout-station-page-state-level-wrapper", "");
        
        const inactivateButton = this.createStateButton(station, stationLevel, I18nHelper.get("pages.hideout.station.level.state.blocked"), HideoutMapUtils.INACTIVE_COLOR, HideoutStationPageUtils.LEVEL_INACTIVE_CLASS);
        HideoutLevelStateController.registerBlockedButton(inactivateButton, station, stationLevel);
        wrapper.appendChild(inactivateButton);
        
        const activateButton = this.createStateButton(station, stationLevel, I18nHelper.get("pages.hideout.station.level.state.track"), HideoutMapUtils.ACTIVE_COLOR, HideoutStationPageUtils.LEVEL_ACTIVE_CLASS);
        HideoutLevelStateController.registerActivateButton(activateButton, station, stationLevel);
        wrapper.appendChild(activateButton);
        
        const buildButton = this.createStateButton(station, stationLevel, I18nHelper.get("pages.hideout.station.level.state.build"), HideoutMapUtils.COMPLETED_COLOR, HideoutStationPageUtils.LEVEL_COMPLETED_CLASS);
        HideoutLevelStateController.registerBuildButton(buildButton, station, stationLevel);
        wrapper.appendChild(buildButton);

        return wrapper;
    }

    private static createStateButton(station:HideoutStations, stationLevel:HideoutLevels, text:string, color:string, extraClass:string) {
        const wrapper = HelperCreation.createDiv("", "hideout-station-page-state-button-wrapper", "");
        
        const button = HelperCreation.createButton(stationLevel.id, "", "", "hideout-station-page-state-button", text)
        button.classList.add(extraClass);
        // Don't set backgroundColor here - let CSS handle the default styling
        // resolveButtonState will set the active state when needed
        wrapper.appendChild(button);

        return wrapper;
    }

    private static buildInfoHeader(station:HideoutStations, stationLevel:HideoutLevels):HTMLDivElement {
        const wrapper = HelperCreation.createDiv(stationLevel.id, "hideout-station-page-header-info-wrapper", "");
        
        const requirementsButton = HelperCreation.createButton("", "", "", "hideout-station-page-header-info-button", I18nHelper.get("pages.hideout.station.level.requirements.button"))
        wrapper.appendChild(requirementsButton);
        HideoutStationPageController.registerShowRequirementButton(requirementsButton, station, stationLevel);

        if(EditSession.isSessionOpen() || HideoutUtils.getAllCraftsForStationIdWithLevel(station.id, stationLevel.level).length > 0) {
            const craftButton = HelperCreation.createButton("", "", "", "hideout-station-page-header-info-button", I18nHelper.get("pages.hideout.station.level.crafts.button"))
            
            HideoutStationPageController.registerShowCraftsButton(craftButton, station, stationLevel);

            wrapper.appendChild(craftButton);
        }

        return wrapper;
    }


    private static buildInfo():HTMLDivElement {
        const wrapper = HelperCreation.createDiv("hideoutStationPageInfoWrapper", "hideout-station-page-info-wrapper scroll-div", "");
        
        return wrapper;
    }

}