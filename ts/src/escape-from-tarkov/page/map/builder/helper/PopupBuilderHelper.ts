import { I18nHelper } from "../../../../../locale/I18nHelper";
import { BucketConst } from "../../../../constant/BucketConst";
import { LogoPathConst } from "../../../../constant/ImageConst";
import { IconInfo } from "../../../../../model/IFilterElements";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import endpoints from "../../../../service/tarkov-companion-api/config/endpoint";
import { ItemsElementUtils } from "../../../../utils/ItemsElementUtils";
import { IMapsComponent } from "../../components/IMapsComponent";
import { IconComponent } from "../../components/impl/IconComponent";
import { PopupFloorComponent } from "../../components/impl/PopupFloorComponent";
import { PopupIconComponent } from "../../components/impl/PopupIconComponent";
import { QuestIconComponent } from "../../components/impl/QuestIconComponent";
import { IndexConst } from "../../const/IndexConst";
import { PopupController } from "../../controller/PopupController";
import { ImageUtils } from "../../utils/ImageUtils";
import { PopupUtils } from "../../utils/PopupUtils";

export class PopupBuilderHelper {

    static createPopupShell(popupComponent:PopupIconComponent | PopupFloorComponent, component:IMapsComponent, pointerEvent:string): HTMLDivElement {

        const container:HTMLDivElement = HelperCreation.createDiv(popupComponent.id, PopupUtils.containerClass, "")

        if(component instanceof IconComponent) {
            this.initIconValues(container, component)
        } else if(component instanceof PopupFloorComponent) {
            this.initFloorValues(container, component)
        }

        container.style.pointerEvents = pointerEvent;

        container.style.zIndex = IndexConst.HIDDEN;
        container.style.display = "none";

        const arrow = HelperCreation.createDiv("", PopupUtils.arrowClass, "")
        arrow.id = popupComponent.id;
        container.appendChild(arrow);

        const titleSection = HelperCreation.createDiv("", PopupUtils.titleSectionContainerClass, "");
        titleSection.id = popupComponent.id;
        container.appendChild(titleSection);

        return container
    }

    private static initIconValues(container:HTMLElement, component:IconComponent) {
        const iconDiv = document.getElementById(String(component.entity.id))
            if(iconDiv) {
                const iconElement = iconDiv.getElementsByClassName("iconCanvas")[0] as HTMLElement
                if(iconElement) {
                    const offsetX = iconElement.clientWidth - (iconDiv.clientWidth/2);
                    const offsetY = component.element.centered ? iconElement.clientHeight + (iconDiv.clientHeight/2) + 10 : iconElement.clientHeight + iconDiv.clientHeight + 10
                    container.style.transform = `translate(-${offsetX}px, -${offsetY}px)`;
                }
            } else {
                container.style.transform = `translate(-${component.element.width}px, -${component.element.height}px)`;
            }
    }

    private static initFloorValues(container:HTMLElement, component:PopupFloorComponent) {
        const floorDiv = document.getElementById(String(component.building.UUID))
            if(floorDiv) {
                const floorElement = floorDiv.getElementsByClassName("floorLevelImg")[0] as HTMLElement
                if(floorElement) {
                    const offsetX = floorElement.clientWidth - (floorDiv.clientWidth/2);
                    const offsetY = floorElement.clientHeight - (floorDiv.clientHeight/2);
                    container.style.transform = `translate(-${offsetX}px, -${offsetY}px)`;
                }
            } else {
                container.style.transform = `translate(-${component.building.width}px, -${component.building.height}px)`;
            }
    }

    static addTitle(wrapper:HTMLElement, title:string, id:string, quest?:boolean, questComponent?:QuestIconComponent) {
        const titleDiv = HelperCreation.createDiv(id, PopupUtils.titleContainerClass, "");
        const titleElement = HelperCreation.createB(PopupUtils.titleClass, title)

        if(quest) {
            titleDiv.classList.add(PopupUtils.questTitleContainerClass)
            titleElement.classList.add(PopupUtils.clickableClass);
            if(questComponent instanceof QuestIconComponent) {
                PopupController.registerPopupTitleEventListener(titleDiv, questComponent)
            }
        }

        titleElement.id = id
        titleDiv.appendChild(titleElement)
        wrapper.appendChild(titleDiv)
    }

    static async addTraderImage(wrapper:HTMLElement) {
        const traderImageWrapper = HelperCreation.createDiv("", PopupUtils.traderImageContainerClass, "");

        const tempImage = new Image();
        tempImage.style.opacity = "50%"
        tempImage.classList.add(PopupUtils.imageTempClass)
        tempImage.src = LogoPathConst.LOGO_WHITE_256_BLUE_SIDE;
        traderImageWrapper.appendChild(tempImage);

        wrapper.appendChild(traderImageWrapper);
    }

    static addImageSection(popupWrapper:HTMLElement) {
        let divContainer = HelperCreation.createDiv(popupWrapper.id, PopupUtils.imageSectionContainerClass, "");

        this.createImageDescriptionSection(divContainer, popupWrapper.id, null)
        this.createImageSection(divContainer, popupWrapper.id);

        popupWrapper.appendChild(divContainer);
    }

    public static addDescriptionCheckmark(wrapper:HTMLElement):HTMLElement {
        const descriptionList = wrapper.getElementsByClassName(PopupUtils.imageDescriptionTextClass)
        if(descriptionList) {
            const descriptionElement:HTMLElement = descriptionList[0] as HTMLElement
            if(descriptionElement) {
                const checkmarkWrapper = HelperCreation.createDiv(wrapper.id, PopupUtils.imageDescriptionCheckmarkWrapperClass, "")
                const checkmark = new Image();
                checkmark.classList.add(PopupUtils.imageDescriptionCheckmarkClass);
                checkmark.src = "./img/side-nav-quest-icon.png"
                checkmarkWrapper.appendChild(checkmark);
                descriptionElement.parentElement.appendChild(checkmarkWrapper)
                return checkmarkWrapper
            }
        } else {
            console.log(`No description built for this popup, id: ${wrapper.id}`);
        }
        return null;
    }

    static createSpawnChanceSection(wrapper:HTMLElement, spawnChance:string) {
        if(spawnChance) {
            const div = HelperCreation.createDiv("", PopupUtils.imageSpawnChanceContainerClass, "");
            const text = HelperCreation.createB(PopupUtils.imageSpawnChanceTextClass, `Spawn Chance: ${spawnChance}%`);
            div.appendChild(text);
            wrapper.appendChild(div);
        }
    }

    static createSpawnChance(wrapper:HTMLElement, spawnChance:string) {
        const container = HelperCreation.createDiv("", "popup-info-section-container", "");
        this.createInfoTitle(container, "Spawn Chance");
        this.createInfoDescription(container, spawnChance + "%");
        wrapper.appendChild(container)
    }

    static createBtrSpawnChance(wrapper:HTMLElement, spawnChance:string) {
        const container = HelperCreation.createDiv("", "popup-info-section-container", "");
        this.createInfoTitle(container, I18nHelper.get("pages.maps.btr.guaranteed"));
        this.createInfoDescription(container, spawnChance === "100" ? I18nHelper.get("pages.maps.btr.yes") :  I18nHelper.get("pages.maps.btr.no"));
        wrapper.appendChild(container)
    }

    static createIconInfosSection(wrapper:HTMLElement, infoList:IconInfo[]) {
        if(infoList && infoList.length > 0) {
            infoList.forEach(info => {
                const container = HelperCreation.createDiv("", "popup-info-section-container", "");
                this.createInfoTitle(container, info.titleLocales?.[I18nHelper.currentLocale()] ?? info.title);
                this.createInfoDescription(container, info.descriptionLocales?.[I18nHelper.currentLocale()] ?? info.description);
                this.createInfoItem(container, info.itemId, info.cost);
                wrapper.appendChild(container)
            })
        }
    }

    private static createInfoTitle(wrapper:HTMLElement, title:string) {
        if(title) {
            const container = HelperCreation.createDiv("", "popup-info-title-container", "");

            const text = HelperCreation.createB("popup-info-title-text", title);
            container.appendChild(text);
    
            wrapper.appendChild(container);
        }
    }

    private static createInfoDescription(wrapper:HTMLElement, description:string) {
        if(description) {
            const container = HelperCreation.createDiv("", "popup-info-description-container", "");

            const text = HelperCreation.createB("popup-info-description-text", description);
            container.appendChild(text);
    
            wrapper.appendChild(container);
        }
    }

    private static createInfoCost(wrapper:HTMLElement, cost:string) {
        if(cost) {
            const text = HelperCreation.createB("popup-info-cost-text", cost);
            wrapper.appendChild(text);
        }
    }

    private static createInfoItem(wrapper:HTMLElement, itemId:string, cost:string) {
        if(itemId) {
            const container = HelperCreation.createDiv("", "popup-info-item-container", "");

            this.addDescriptionImage("", itemId, container);
    
            const itemInfoContainer = HelperCreation.createDiv("", "popup-info-item-info-container", "")
            this.createInfoCost(itemInfoContainer, cost);

            const itemName = ItemsElementUtils.getItemName(itemId);
            const text = HelperCreation.createB("popup-info-item-text", itemName);
            itemInfoContainer.appendChild(text);

            container.appendChild(itemInfoContainer)
    
            wrapper.appendChild(container);
        }
    }

    static createImageDescriptionSection(wrapper:HTMLElement, id:string, itemId:string) {
        let descriptionContainer = HelperCreation.createDiv(id, PopupUtils.imageDescriptionContainerClass, "");
        let descriptionElement = HelperCreation.createB(PopupUtils.imageDescriptionTextClass, "")

        if(itemId && itemId !== "") {
            this.addDescriptionImage(id, itemId, descriptionContainer);
        }

        descriptionElement.id = id;
        descriptionContainer.appendChild(descriptionElement);

        wrapper.appendChild(descriptionContainer);
    }

    // static createLongDescriptionSection(wrapper:HTMLElement, id:string, description:string) {
    //     let longDescriptionContainer = HelperCreation.createDiv(id, PopupUtils.imageDescriptionContainerClass, "");
    //     let longDescriptionElement = HelperCreation.createB(PopupUtils.imageDescriptionTextClass, description)

    //     longDescriptionElement.id = id;
    //     longDescriptionContainer.appendChild(longDescriptionElement);
    //     wrapper.appendChild(longDescriptionContainer);
    // }

    private static addDescriptionImage(id:string, itemId:string, descriptionContainer:HTMLElement) {
        let imageContainer = HelperCreation.createDiv(id, PopupUtils.imageDescriptionImageContainerClass, "")
            let image = new Image();
            image.className = PopupUtils.imageDescriptionImageClass;
            image.src = LogoPathConst.LOADING_GIF;
            ItemsElementUtils.getItemInformation(itemId).then(item => {
                if(!item.baseImageLink) {
                    item.baseImageLink = BucketConst.BASE_URI + BucketConst.TARKOV_ICONS + id + ".webp";
                }
                image.crossOrigin = "Anonymous"
                try {
                    let tempImg = new Image();
                    const ttl = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 48)) // Cached for 48 hours
                    item.baseImageLink = item.baseImageLink + `?${ttl}`
                    tempImg.crossOrigin = "Anonymous";
                    tempImg.src = item.baseImageLink
                    tempImg.onload = () => {
                        image.src = item.baseImageLink
                    }
                } catch(e) {
                    ImageUtils.onImageLoadError(image, item.baseImageLink);
                }
            })
            imageContainer.appendChild(image);
            descriptionContainer.appendChild(imageContainer);
    }

    private static createImageSection(wrapper:HTMLElement, id:string) {
        const container = HelperCreation.createDiv(id, PopupUtils.imageContainerClass, "")

        const tempImage = new Image();
        tempImage.id = id;
        tempImage.style.opacity = "50%"
        tempImage.classList.add(PopupUtils.imageTempClass)
        tempImage.src = LogoPathConst.LOADING_GIF;
        container.appendChild(tempImage);

        wrapper.appendChild(container);
    }
}