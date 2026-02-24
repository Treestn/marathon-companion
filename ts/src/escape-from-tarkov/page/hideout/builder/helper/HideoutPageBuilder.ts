import { I18nHelper } from "../../../../../locale/I18nHelper";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { ImageUtils } from "../../../map/utils/ImageUtils";
import { HideoutMapUtils } from "../../utils/HideoutMapUtils";
import { HideoutUtils } from "../../utils/HideoutUtils";
import { HideoutFilterBuilder } from "./HideoutFilterBuilder";

export class HideoutPageBuilder {

    static createHideoutRunner() {
        const runner = document.getElementById("runner-container");
        if(runner) {
            
            let hideoutRunner = HelperCreation.createDiv("hideout-runner", "hideout-container main-runner-container", "")
            let hideoutDiv = HelperCreation.createDiv("hideoutDiv", "hideoutRunner runner", "");
            
            const hideoutLayoutWrapper = HelperCreation.createDiv("hideoutLayoutWrapper", "hideout-layout-container", "");
            hideoutDiv.appendChild(hideoutLayoutWrapper);

            // hideoutRunner.appendChild(this.createFilters());
    
            hideoutRunner.appendChild(hideoutDiv)
    
            runner.insertBefore(hideoutRunner, document.getElementsByClassName("side-page-container")[0]);
        }
    }

    static createHideoutLayout():HTMLElement {
        const hideoutRunner = document.getElementById("hideoutLayoutWrapper");
        if(hideoutRunner) {
            const hideoutLayout = this.createHideoutLayoutDiv();
            const image = new Image();
            ImageUtils.loadImage(image, HideoutUtils.getLayout().layoutImage, 3600);
            image.onload = () => {
                const canvas = document.createElement('canvas') as HTMLCanvasElement;
                canvas.id = "hideoutLayoutImage";
                canvas.className = 'hideout-layout-image';
                canvas.width = HideoutUtils.getLayout().width;
                canvas.height = HideoutUtils.getLayout().height;
                let context = canvas.getContext('2d', { willReadFrequently: true })
                context.drawImage(image, 0, 0, HideoutUtils.getLayout().width, HideoutUtils.getLayout().height)
                
                const scale = HideoutUtils.getHideoutScale();
                canvas.style.width = HideoutUtils.getLayout().width * scale + "px";
                canvas.style.height = HideoutUtils.getLayout().height * scale + "px";
                canvas.style.zIndex = "1";
                
                hideoutLayout.appendChild(canvas);
            }
            
            hideoutRunner.appendChild(hideoutLayout);
            return hideoutLayout;
        }
    }

    static createHideoutLegend() {
        const hideoutRunner = document.getElementById("hideoutLayoutWrapper");
        if(hideoutRunner) {
            const legendWrapper = HelperCreation.createDiv("", "hideout-legends-wrapper", "");

            const inactive:HTMLDivElement = this.createLegend(I18nHelper.get("pages.hideout.station.legend.blocked"), HideoutMapUtils.INACTIVE_COLOR);
            const active:HTMLDivElement = this.createLegend(I18nHelper.get("pages.hideout.station.legend.tracking"), HideoutMapUtils.ACTIVE_COLOR);
            const completed:HTMLDivElement = this.createLegend(I18nHelper.get("pages.hideout.station.legend.completed"), HideoutMapUtils.COMPLETED_COLOR);

            legendWrapper.appendChild(inactive);
            legendWrapper.appendChild(active);
            legendWrapper.appendChild(completed);

            hideoutRunner.appendChild(legendWrapper);
        }
    }

    private static createLegend(text:string, color:string):HTMLDivElement {
        const wrapper = HelperCreation.createDiv("", "hideout-legend-wrapper", "");

        const coloredBox = HelperCreation.createDiv("", "hideout-legend-colored-box", "");
        coloredBox.style.backgroundColor = color;

        const textWrapper = HelperCreation.createDiv("", "hideout-legend-text-wrapper", "");
        console.log(text);
        
        const legendText = HelperCreation.createB("hideout-legend-text", text);
        textWrapper.appendChild(legendText);

        wrapper.appendChild(coloredBox);
        wrapper.appendChild(textWrapper);

        return wrapper
    }

    private static createHideoutLayoutDiv() {
        return HelperCreation.createDiv("hideout-layout", "hideout-layout-wrapper", "");
    }

    private static createHideoutEntity(): HTMLElement {
        return HelperCreation.createDiv("hideout-entity-parent", "hideout-entity", "")
    }

    private static createFilters():HTMLElement {
        return HideoutFilterBuilder.createHideoutFilters();
    }

}