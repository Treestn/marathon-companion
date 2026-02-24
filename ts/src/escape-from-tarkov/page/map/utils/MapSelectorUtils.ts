import { I18nHelper } from "../../../../locale/I18nHelper";
import { MapAdapter } from "../../../../adapter/MapAdapter";
import { MapsList } from "../../../constant/MapsConst";
import { HelperCreation } from "../../../service/MainPageCreator/HelperCreation";

export class MapSelectorUtils {

    static disableCurrentlySelectedMap(mapId:string) {
        const element = document.getElementById(mapId)
        if(element) {
            const child = element.children[0] as HTMLElement
            if(child) {
                child.style.color = "grey";
                child.style.pointerEvents = "none";
            }
            element.style.backgroundColor = "var(--header-color)"
            element.style.pointerEvents = "none";
        }
    }

    static createDropdownContainerMapDiv(): HTMLElement {
        let dropdownEntities: Node[] = this.createDropDownEntities();
        let mapDropDown = HelperCreation.createUl("", "dropdown-content");
        dropdownEntities.forEach(n => {
            mapDropDown.appendChild(n);
        });
        let dropdownButton = HelperCreation.createButton("", "", "", "dropbtn", I18nHelper.get("pages.maps.filters.maps"));
        
        let dropdownContainerMapDiv = HelperCreation.createDiv("dropdown-container-map", "dropdown", "");
        dropdownContainerMapDiv.appendChild(dropdownButton);
        dropdownContainerMapDiv.appendChild(mapDropDown);

        return dropdownContainerMapDiv;
    }

    private static createDropDownEntities(): Array<HTMLElement> {
        var dropdownEntities: Array<HTMLElement> = new Array();
        for(let map of MapsList) {
            let newElement: HTMLElement = this.createDropDownEntity(map.id)
            dropdownEntities.push(newElement)
        }
        return dropdownEntities;
    }

    private static createDropDownEntity(mapId:string): HTMLElement {
        let li = HelperCreation.createLi(mapId, "map-li");
        let element = document.createElement('a');
        element.setAttribute('id', mapId);
        element.setAttribute('class', "mapSelector");
        element.text = MapAdapter.getLocalizedMap(mapId);
        li.appendChild(element)
        return li;
    }
}