import { I18nHelper } from "../../../../../locale/I18nHelper"
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation"
import { IMapComponent } from "../../components/type/IMapComponent"
import { DomUtils } from "../../utils/DomUtils"

export class MapBuilderHelper {

    private static containerTemplate:string = 
    `
    <div id="maps-runner" class="map-container main-runner-container" style="">
        <div id="mapDiv" class="mapRunner runner" style="position: relative; z-index:100;">
            <div id="zoom" class="mapsInfo">
            </div>
            <div id="map-data" class="mapsInfo">
            </div>
        </div>
    </>
    `

    private static createMapImage(map:IMapComponent) {
        return `
        <img src=${map.src} alt="zoom">
        `
    }

    static getTemplate():HTMLDivElement {
        return DomUtils.stringToHtmlElement(this.containerTemplate) as HTMLDivElement
    }

    static createMapDiv(map:IMapComponent): HTMLImageElement {
        const img = new Image();
        img.src = map.src
        return img
    }

    static addAuthorDiv(wrapper:HTMLElement, authorText:string) {
        let container = HelperCreation.createDiv("", "author-container", "");
        container.appendChild(HelperCreation.createB("author", `${I18nHelper.get("pages.maps.author")}: ${authorText}`));
        container.setAttribute("id", "author");
        wrapper.appendChild(container)
    }

    static createAddIconReminder(wrapper:HTMLElement) {
        let container = HelperCreation.createDiv("", "add-icon-reminder-container", "");
        container.appendChild(HelperCreation.createB("add-icon-reminder", `${I18nHelper.get("pages.maps.icon.add")}: CTRL+SHIFT+CLICK`))
        container.setAttribute("id", "icon-reminder");
        wrapper.appendChild(container);
    }

    static createEditModeReminder(wrapper:HTMLElement) {
        let container = HelperCreation.createDiv("icon-reminder", "add-icon-reminder-container", "");

        const legend = HelperCreation.createB("", I18nHelper.get("pages.maps.edit.mode"));
        legend.style.marginBottom = "5px"
        legend.style.color = "red";

        const addIcon = HelperCreation.createB("", `${I18nHelper.get("pages.maps.edit.addOrRemove")}: CTRL+SHIFT+CLICK`);
        addIcon.style.fontSize = ""

        const editIcon = HelperCreation.createB("", `${I18nHelper.get("pages.maps.edit.edit")}: CTRL+CLICK`);
        addIcon.style.fontSize = ""

        const moveIcon = HelperCreation.createB("", `${I18nHelper.get("pages.maps.edit.move")}: ALT+CLICK`);
        addIcon.style.fontSize = ""

        const disclaimer = HelperCreation.createB("", I18nHelper.get("pages.maps.edit.disclaimer"));
        disclaimer.style.color = "grey"

        container.appendChild(legend);
        container.appendChild(addIcon);
        container.appendChild(editIcon);
        container.appendChild(moveIcon);
        container.appendChild(disclaimer)

        wrapper.appendChild(container);
        
    }

}