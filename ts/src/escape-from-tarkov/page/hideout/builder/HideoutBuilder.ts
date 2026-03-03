import { I18nHelper } from "../../../../locale/I18nHelper";
import { HideoutLevels } from "../../../../model/HideoutObject";
import { HelperCreation } from "../../../service/MainPageCreator/HelperCreation";
import { ImageUtils } from "../../map/utils/ImageUtils";
import { HideoutComponent } from "../component/HideoutComponent";
import { HideoutMapControllers } from "../controller/HideoutMapControllers";
import { HideoutHeaderUtils } from "../utils/HideoutHeaderUtils";
import { HideoutMapUtils } from "../utils/HideoutMapUtils";
import { HideoutUtils } from "../utils/HideoutUtils";
import { HideoutPageBuilder } from "./helper/HideoutPageBuilder";

export class HideoutBuilder {
    
    hideoutComponentList:HideoutComponent[] = [];
    static readonly HEXAGON_DIM = 40;

    addHideoutStation(component:HideoutComponent) {
        this.hideoutComponentList.push(component)
    }

    build() {
        HideoutPageBuilder.createHideoutRunner();
        HideoutPageBuilder.createHideoutLegend();
        const layoutWrapper = HideoutPageBuilder.createHideoutLayout();
        const filtredComponent = this.filterAndSortComponents(this.hideoutComponentList)
        if(layoutWrapper) {
            for(const component of filtredComponent) {

                this.buildHideoutStation(layoutWrapper, component);
                this.buildHideoutLogo(layoutWrapper, component);
            }
        } else {
            console.log(`Could not build the hideout page because the hideout-entity-parent HtmlElement was not found`);
        }
        HideoutHeaderUtils.refreshAllPageStates();
    }

    private filterAndSortComponents(components: HideoutComponent[]): HideoutComponent[] {
        return components.sort((a, b) => a.getStation().name.localeCompare(b.getStation().name));
    }

    private buildHideoutStation(wrapper:HTMLElement, component:HideoutComponent) { 
        const station = component.getStation();

        const image = new Image();
        ImageUtils.loadImage(image, `https://companions-assets.treestn-dev.ca/hideout/images/bench/${station.id}.webp`, 3600);
        image.onload = () => {
            const canvas = document.createElement('canvas') as HTMLCanvasElement;
            canvas.className = 'hideout-station-image';
            canvas.width = station.location.width;
            canvas.height = station.location.height;
            let context = canvas.getContext('2d', { willReadFrequently: true })
            context.drawImage(image, 0, 0, station.location.width, station.location.height)

            const scale = HideoutUtils.getHideoutScale();
            canvas.style.transform = `translate(${station.location.x * scale}px, ${station.location.y * scale}px)`;
            canvas.style.width = station.location.width * scale + "px";
            canvas.style.height = station.location.height * scale + "px";
            canvas.style.zIndex = "2";
            
            wrapper.insertBefore(canvas, wrapper.firstChild);

            component.setCanvasElement(canvas);

            HideoutMapControllers.registerHideoutStationClick(component, canvas)
            HideoutMapControllers.registerHideoutStationHover(component, canvas);
        }
    }

    private buildHideoutLogo(wrapper:HTMLElement, component:HideoutComponent) {
        const hexagon = this.buildHexagon(component);
        const popup = this.buildLogoPopup(component);
        hexagon.appendChild(popup);

        // Set popup wrapper color after popup is appended
        HideoutMapUtils.resolvePopupWrapperColor(hexagon);

        wrapper.insertBefore(hexagon, wrapper.firstChild);
        
        HideoutMapControllers.registerHideoutLogoHover(component, hexagon);
    }

    private buildHexagon(component:HideoutComponent):HTMLDivElement {
        const station = component.getStation();
        const hexagon = HelperCreation.createDiv(component.getStation().id, "hideout-hexagon", "");
        hexagon.style.clipPath = HideoutMapUtils.HEXAGON_CLIP_PATH;

        const image = new Image();
        image.classList.add("hideout-logo")
        ImageUtils.loadImage(image, station.imageLink, 3600);

        image.onload = () => {
            const scale = HideoutUtils.getHideoutScale();
            const x = (station.location.x * scale) + (station.location.width * scale)/2 - HideoutBuilder.HEXAGON_DIM/2;
            const y = (station.location.y * scale) + (station.location.height * scale)/2 - HideoutBuilder.HEXAGON_DIM/2;
            hexagon.style.transform = `translate(${x}px, ${y}px)`;
            image.style.width = 30 + "px";
            image.style.height = 30 + "px";
            image.style.zIndex = "4";
            hexagon.appendChild(image);
        }

        hexagon.style.width = HideoutBuilder.HEXAGON_DIM + "px";
        hexagon.style.height = HideoutBuilder.HEXAGON_DIM + "px";
        hexagon.style.zIndex = "4";

        HideoutMapUtils.resolveStation(hexagon);

        component.setLogoWrapperElement(hexagon);
        return hexagon;
    }

    private buildLogoPopup(component:HideoutComponent):HTMLDivElement {
        const popupWrapper = HelperCreation.createDiv("", "hideout-logo-popup-wrapper", "");


        const titleWrapper = HelperCreation.createDiv("", "hideout-logo-popup-title-wrapper", "");
        const text = HelperCreation.createB("hideout-logo-popup-title", component.getStation().locales?.[I18nHelper.currentLocale()] ?? component.getStation().name);
        titleWrapper.appendChild(text);

        const levelsWrapper = HelperCreation.createDiv("", "hideout-logo-popup-levels-wrapper", "");
        component.getStation().levels.forEach(stationLevel => {
            const popupLevel = this.popupLevel(stationLevel);
            HideoutMapControllers.registerLevelLogo(component, stationLevel, popupLevel);
            levelsWrapper.appendChild(popupLevel);
        })

        popupWrapper.appendChild(titleWrapper);
        popupWrapper.appendChild(levelsWrapper);

        HideoutMapControllers.registerHideoutStationClick(component, popupWrapper)

        return popupWrapper;
    }

    private popupLevel(stationLevel:HideoutLevels):HTMLDivElement {
        const wrapper = HelperCreation.createDiv(stationLevel.id, "hideout-logo-popup-level-wrapper", "");

        const text = HelperCreation.createB("hideout-logo-popup-level", `${I18nHelper.get("pages.hideout.station.level.label")} ${stationLevel.level}`);
        wrapper.appendChild(text);

        return wrapper;
    }
}