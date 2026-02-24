import { I18nHelper } from "../../../../../locale/I18nHelper";
import { FilterAdapter } from "../../../../../adapter/FilterAdapter";
import { HighLevelElement } from "../../../../../model/IFilterElements";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { FilterUtils } from "../../utils/FilterUtils";

export class FilterBuilderHelper {

    static createDropdownContainerFilterDiv(): HTMLElement {
        let button = HelperCreation.createButton("", "", "", "dropbtn", I18nHelper.get("pages.maps.filters.filter"));
        let _div = HelperCreation.createUl(FilterUtils.filterDropdownContentId, FilterUtils.dropdownContentClass)
        // this.createLabels(_div, request);

        let parentDiv = HelperCreation.createDiv(FilterUtils.dropdownContainerFilterId, FilterUtils.dropdownClass, "")
        parentDiv.appendChild(button)
        parentDiv.appendChild(_div)
        return parentDiv
    }

    static createLabel(parentDiv:HTMLElement, hle:HighLevelElement, enableSearch:boolean) {
        let ul = this.createLabelEntity(hle.name, hle.imagePath, FilterUtils.getHleAmountOfIcons(hle), enableSearch)
        if(hle.elements.length > 1) {
            let _ul = HelperCreation.createUl("", FilterUtils.secondDropdownContentClass)
            hle.elements.forEach(e => {
                _ul.appendChild(this.createLabelEntity(e.name, e.imagePath, e.listElements.length, true));
            })
            ul.appendChild(_ul);
        }
        parentDiv.appendChild(ul)
    }

    private static createLabelEntity(name:string, src:string, numberOfIcons:number, enableSearch:boolean): HTMLElement {
        const numberDiv = HelperCreation.createDiv("", FilterUtils.filterAmountDivClass, "")
        const amountText = HelperCreation.createB(FilterUtils.filterAmountClass, "");

        if(numberOfIcons === 0) {
            amountText.textContent = `( - )`;
        } else {
            amountText.textContent = `( ${numberOfIcons} )`;
        }
        
        numberDiv.appendChild(amountText)

        let iconDiv = HelperCreation.createDiv("", "filter-icon-image-div", "")
        let icon = HelperCreation.createImage("", "filter-icon-image", src, "");
        iconDiv.appendChild(icon)

        let b = HelperCreation.createA(FilterUtils.filterEntityClass, FilterAdapter.getLocalizedFilter(name))
        let span = HelperCreation.createSpan(FilterUtils.checkmarkClass)
        span.appendChild(b)

        let input = HelperCreation.createInput(`${name}${FilterUtils.idSuffix}`, "checkbox", FilterUtils.filterSelectorClass);

        let filterSelectorWrapper = HelperCreation.createDiv("", "filter-selector-container", "");
        filterSelectorWrapper.appendChild(iconDiv);
        filterSelectorWrapper.appendChild(input);
        filterSelectorWrapper.appendChild(span);

        let label = HelperCreation.createLabel('',FilterUtils.filterLabelClass)
        label.appendChild(filterSelectorWrapper)

        let li = HelperCreation.createLi('', FilterUtils.filterLiClass)
        li.appendChild(numberDiv);
        li.appendChild(label);

        if(enableSearch) {
            let searchWrapper = HelperCreation.createDiv(`${name}${FilterUtils.idSuffix}`, FilterUtils.filterSearchClass, "");
            let image = new Image();
            image.id = `${name}${FilterUtils.idSuffix}`;
            image.classList.add(FilterUtils.filterImageClass)
            image.src = "../img/search-sharp-white.png";
            searchWrapper.appendChild(image);
            li.appendChild(searchWrapper)
        }

        return li
    }

}