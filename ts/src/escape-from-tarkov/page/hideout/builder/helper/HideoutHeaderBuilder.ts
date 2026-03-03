import { I18nHelper } from "../../../../../locale/I18nHelper";
import { HideoutStations } from "../../../../../model/HideoutObject";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { ImageUtils } from "../../../map/utils/ImageUtils";
import { HideoutComponent } from "../../component/HideoutComponent";
import { HideoutBodyController } from "../../controller/HideoutBodyController";
import { HideoutHeaderControllers } from "../../controller/HideoutHeaderControllers";

export class HideoutHeaderBuilder {

    static createHeader(component:HideoutComponent, class_:string):HTMLElement {
        const wrapper = HelperCreation.createDiv(component.getStation().id, "hideout-station-header-wrapper", "");
        wrapper.classList.add(class_);
        wrapper.appendChild(this.createHideoutIconSection(component.getStation().imageLink))
        wrapper.appendChild(this.createHideoutTitle(component.getStation().locales?.[I18nHelper.currentLocale()] ?? component.getStation().name));
        wrapper.appendChild(this.createActiveButton(component, "hideout-station-activation"))
        wrapper.appendChild(this.createCompletedButton(component, "hideout-station-completed"))

        return wrapper
    }

    private static createHideoutIconSection(src:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-station-image-wrapper", "");
        let image = new Image()
        image.classList.add("hideout-station-image")
        wrapper.appendChild(image);
        ImageUtils.loadImage(image, src, 1);
        return wrapper
    }

    private static createHideoutTitle(title:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-station-title-wrapper", "");
        let textEl = HelperCreation.createB("hideout-station-title", title);
        wrapper.appendChild(textEl);
        return wrapper;
    }

    static createActiveButton(component:HideoutComponent, class_:string, levelId?:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-station-active-wrapper", "");
        const imgWrapper = HelperCreation.createDiv("", "hideout-station-icon-wrapper", "");

        let image = new Image();
        image.src = "./img/checkmark-icon.png"
        image.id = levelId ? levelId : component.getStation().id;
        image.classList.add(class_, "button-low-opacity");

        const popup = this.createPopup("Activate/Deactivate", "hideout-station-popup-activate", "rgb(129 159 129)")
        imgWrapper.appendChild(popup);
        imgWrapper.appendChild(image);

        HideoutBodyController.registerIconPopupController(popup, imgWrapper);

        wrapper.appendChild(imgWrapper);

        HideoutHeaderControllers.registerActiveButton(component, image, levelId)

        return wrapper;
    }

    static createCompletedButton(component:HideoutComponent, class_:string, levelId?:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-station-completed-wrapper", "");
        const imgWrapper = HelperCreation.createDiv("", "hideout-station-icon-wrapper", "");

        let image = new Image();
        image.src = "../../icons/logo-256x256.png"
        image.id = levelId ? levelId : component.getStation().id;
        image.classList.add(class_, "button-low-opacity");

        const popup = this.createPopup("Completed", "hideout-station-popup-completed", "var(--main-btn-active-color)");

        imgWrapper.appendChild(popup)
        imgWrapper.appendChild(image);

        HideoutBodyController.registerIconPopupController(popup, imgWrapper);

        wrapper.appendChild(imgWrapper);

        HideoutHeaderControllers.registerCompletedButton(component, image, levelId)

        return wrapper;

        // const wrapper = HelperCreation.createDiv("", "hideout-station-completed-wrapper", "");
        // let button = HelperCreation.createButton(stationId, "", "", "hideout-station-completed", "Completed");
        // wrapper.appendChild(button);
        // return wrapper;
    }

    private static createPopup(text:string, popupClass:string, color:string):HTMLDivElement {
        const wrapper = HelperCreation.createDiv("", "hideout-station-popup-wrapper", "");
        wrapper.classList.add(popupClass);
        wrapper.style.color = color;
        wrapper.style.display = "none"

        const textPopup = HelperCreation.createB("hideout-station-popup-text", text);
        wrapper.appendChild(textPopup);

        return wrapper;
    }
}