import { I18nHelper } from "../../../../locale/I18nHelper";
import { TraderMapper } from "../../../../adapter/TraderMapper";
import { ImageCyclingController } from "../../../controller/ImageCyclingController";
import { HelperCreation } from "../../../service/MainPageCreator/HelperCreation";
import { IMapsComponent } from "../components/IMapsComponent";
import { IconComponent } from "../components/impl/IconComponent";
import { PopupFloorComponent } from "../components/impl/PopupFloorComponent";
import { PopupIconComponent } from "../components/impl/PopupIconComponent";
import { QuestIconComponent } from "../components/impl/QuestIconComponent";
import { IndexConst } from "../const/IndexConst";
import { PopupController } from "../controller/PopupController";
import { IconUtils } from "./IconUtils";
import { ImageUtils } from "./ImageUtils";

export class PopupUtils {

    static containerClass = "iconOverlay";
    static arrowClass = "popup-arrow"
    static titleContainerClass = "title-div"
    static questTitleContainerClass = "quest-title-div"
    static titleClass = "overlay-title";
    static clickableClass = "clickable";
    static titleSectionContainerClass = "title-section-container";
    static traderImageContainerClass = "popup-trader-image-container";
    static imageTempClass = "popup-temp-image";
    static imageClass = "popup-image";
    static imageSectionContainerClass = "popup-image-section-container";
    static imageDescriptionContainerClass = "popup-image-section-description-container";
    static imageDescriptionImageContainerClass = "popup-image-section-description-image-container";
    static imageDescriptionImageClass = "popup-image-section-description-image";
    static imageDescriptionTextClass = "popup-image-description";
    static imageSpawnChanceContainerClass = "popup-spawn-chance-container";
    static imageSpawnChanceTextClass = "popup-spawn-chance-text";
    static imageInfoContainerContainerClass = "popup-info-section-container";
    static imageDescriptionCheckmarkWrapperClass = "popup-image-description-checkmark-wrapper";
    static imageDescriptionCheckmarkClass = "popup-image-description-checkmark";
    static imageLongDescriptionTextClass = "popup-image-long-description";
    static imageContainerClass = "popup-image-container";
    static floorPopupContainerClass = "floorPopup";

    static arrowTop = "popup-top"
    static arrowRight = "popup-right"
    static arrowLeft = "popup-left"
    static arrowBottom = "popup-bottom"

    static overlayTop = "overlay-top"
    static overlayRight = "overlay-right"
    static overlayLeft = "overlay-left"
    static overlayBottom = "overlay-bottom"

    // private static top = "top";
    // private static bottom = "bottom";
    // private static right = "right";
    // private static left = "left";
    private static minWidth = 420;
    private static minHeight = 400;

    static show(popupWrapper:HTMLElement, component:PopupIconComponent) {
        popupWrapper.parentElement.style.zIndex = IndexConst.OVERLAY
        popupWrapper.style.display = "flex";
        if(component.icon instanceof QuestIconComponent) {
            this.handleQuestPopup(popupWrapper, component, component.icon)
        } else if(component.icon instanceof IconComponent) {
            this.handleIconPopup(popupWrapper, component, component.icon)
        }
    }

    static positionPopup(popupWrapper:HTMLElement, component:PopupIconComponent) {
        const iconCanvas = IconUtils.getIconCanvas(popupWrapper.parentElement);

        if(iconCanvas) {
            let offsetX;
            let offsetY
            const mapDiv = document.getElementById("mapDiv");
            const mapData = document.getElementById("map-data");
            const popupArrow = this.getArrow(popupWrapper);
            if(mapDiv && mapData) {

                const iconCanvasRect = iconCanvas.getBoundingClientRect();
                const mapDivRect = mapDiv.getBoundingClientRect();

                if(popupWrapper.classList.length > 1 && this.hasSpace(mapDivRect, iconCanvasRect, popupWrapper)) {
                    return;
                }

                popupWrapper.style.transform = "";

                // Position the offset at the top left of the icon
                offsetX = -iconCanvas.width;
                offsetY = component.icon.element.centered ? -iconCanvas.height/2*3 : -iconCanvas.height*2;

                popupArrow.classList.remove('popup-top', 'popup-bottom', 'popup-left', 'popup-right');
                popupWrapper.classList.remove(this.overlayTop, this.overlayRight, this.overlayLeft, this.overlayBottom);

                // Check if we have enough space at the top
                if(this.hasSpaceTop(mapDivRect, iconCanvasRect, popupWrapper) 
                        && this.hasHalfSpaceRight(mapDivRect, iconCanvasRect, popupWrapper) 
                        && this.hasHalfSpaceLeft(mapDivRect, iconCanvasRect, popupWrapper)) {
                    popupArrow.classList.add(this.arrowBottom)
                    popupWrapper.classList.add(this.overlayTop)
                    // offsetX = iconCanvas.clientWidth - (iconCanvas.clientWidth/2);
                    offsetX += iconCanvas.width/2;
                    offsetY -= 10;
                    popupWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

                } else if(this.hasSpaceRight(mapDivRect, iconCanvasRect, popupWrapper) 
                        && this.hasHalfSpaceTop(mapDivRect, iconCanvasRect, popupWrapper)
                        && this.hasHalfSpaceBottom(mapDivRect, iconCanvasRect, popupWrapper)) {
                    // We have enough space to the right
                    popupArrow.classList.add(this.arrowLeft);
                    popupWrapper.classList.add(this.overlayRight)
                    offsetX += iconCanvas.width + popupWrapper.clientWidth/2 + 10;
                    offsetY += popupWrapper.clientHeight/2 + iconCanvas.height/2
                    popupWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

                } else if(this.hasSpaceLeft(mapDivRect, iconCanvasRect, popupWrapper) 
                        && this.hasHalfSpaceTop(mapDivRect, iconCanvasRect, popupWrapper)
                        && this.hasHalfSpaceBottom(mapDivRect, iconCanvasRect, popupWrapper)) {
                    //Position to the left
                    popupArrow.classList.add(this.arrowRight)
                    popupWrapper.classList.add(this.overlayLeft)
                    offsetX -= popupWrapper.clientWidth/2 + 10
                    offsetY += popupWrapper.clientHeight/2 + iconCanvas.height/2
                    popupWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

                } else {
                    // Position at the bottom
                    popupArrow.classList.add(this.arrowTop)
                    popupWrapper.classList.add(this.overlayBottom)
                    offsetX += iconCanvas.width/2;
                    offsetY += iconCanvasRect.height + popupWrapper.clientHeight + 10;
                    popupWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                }
            }
        }
    }

    private static hasSpace(mapDivRect:DOMRect, iconCanvasRect:DOMRect, popupWrapper:HTMLElement):boolean {
        if(popupWrapper.classList.contains(this.overlayTop)) {
            return this.hasSpaceTop(mapDivRect, iconCanvasRect, popupWrapper) 
                && this.hasHalfSpaceRight(mapDivRect, iconCanvasRect, popupWrapper) 
                && this.hasHalfSpaceLeft(mapDivRect, iconCanvasRect, popupWrapper);
        } else if(popupWrapper.classList.contains(this.overlayRight)) {
            return this.hasSpaceRight(mapDivRect, iconCanvasRect, popupWrapper) 
                && this.hasHalfSpaceTop(mapDivRect, iconCanvasRect, popupWrapper)
                && this.hasHalfSpaceBottom(mapDivRect, iconCanvasRect, popupWrapper);
        } else if(popupWrapper.classList.contains(this.overlayLeft)) {
            return this.hasSpaceLeft(mapDivRect, iconCanvasRect, popupWrapper) 
                && this.hasHalfSpaceTop(mapDivRect, iconCanvasRect, popupWrapper)
                && this.hasHalfSpaceBottom(mapDivRect, iconCanvasRect, popupWrapper);
        } else if(popupWrapper.classList.contains(this.overlayBottom)) {
            return this.hasSpaceBottom(mapDivRect, iconCanvasRect, popupWrapper) 
                && this.hasHalfSpaceRight(mapDivRect, iconCanvasRect, popupWrapper) 
                && this.hasHalfSpaceLeft(mapDivRect, iconCanvasRect, popupWrapper);
        } else {
            return false;
        }
    }

    private static hasSpaceTop(mapDivRect:DOMRect, iconCanvasRect:DOMRect, popupWrapper:HTMLElement):boolean {
        return mapDivRect.top < (iconCanvasRect.y - popupWrapper.clientHeight);
    }

    private static hasHalfSpaceTop(mapDivRect:DOMRect, iconCanvasRect:DOMRect, popupWrapper:HTMLElement):boolean {
        return mapDivRect.top < (iconCanvasRect.y - popupWrapper.clientHeight/2);
    }

    private static hasSpaceRight(mapDivRect:DOMRect, iconCanvasRect:DOMRect, popupWrapper:HTMLElement):boolean {
        return mapDivRect.right > (iconCanvasRect.x + iconCanvasRect.width + popupWrapper.clientWidth);
    }

    private static hasHalfSpaceRight(mapDivRect:DOMRect, iconCanvasRect:DOMRect, popupWrapper:HTMLElement):boolean {
        return mapDivRect.right > (iconCanvasRect.x + iconCanvasRect.width + popupWrapper.clientWidth/2);
    }

    private static hasSpaceLeft(mapDivRect:DOMRect, iconCanvasRect:DOMRect, popupWrapper:HTMLElement):boolean {
        return mapDivRect.left < (iconCanvasRect.x - popupWrapper.clientWidth);
    }

    private static hasHalfSpaceLeft(mapDivRect:DOMRect, iconCanvasRect:DOMRect, popupWrapper:HTMLElement):boolean {
        return mapDivRect.left < (iconCanvasRect.x - popupWrapper.clientWidth/2);
    }

    private static hasSpaceBottom(mapDivRect:DOMRect, iconCanvasRect:DOMRect, popupWrapper:HTMLElement):boolean {
        return mapDivRect.bottom > (iconCanvasRect.y + iconCanvasRect.height + popupWrapper.clientHeight);
    }

    private static hasHalfSpaceBottom(mapDivRect:DOMRect, iconCanvasRect:DOMRect, popupWrapper:HTMLElement):boolean {
        return mapDivRect.bottom > (iconCanvasRect.y + iconCanvasRect.height + popupWrapper.clientHeight/2);
    }

    static getArrow(parentDiv:HTMLElement):HTMLElement {
        const list = parentDiv.getElementsByClassName(this.arrowClass);
        if(list) {
            const arrow = list[0] as HTMLElement;
            if(arrow) {
                return arrow
            }
        }
        return null;
    }

    private static async handleQuestPopup(popupWrapper:HTMLElement, component:PopupIconComponent, questIcon:QuestIconComponent) {
        const traderSrc = TraderMapper.getImageFromTraderId(questIcon.quest.trader.id);
        if(traderSrc) {
            this.setTraderImage(popupWrapper, traderSrc, component.imageEventListenersLoaded);
        } else {
            console.log(`Trader image src could not be found: ${questIcon.quest.trader.name}`);
        }

        for(const obj of questIcon.quest.objectives) {
            if(!obj.questImages) {
                continue;
            }
            for(const questImg of obj.questImages) {
                if(String(questImg.id) === String(questIcon.entity.id)) {
                    this.setDescription(popupWrapper, questImg.description)
                    await this.setIconImage(popupWrapper, questImg.paths[component.nextImage], component.imageEventListenersLoaded)
                    const imgWrapperList = popupWrapper.getElementsByClassName(this.imageContainerClass);
                    if(!component.imageEventListenersLoaded) {
                        component.imageEventListenersLoaded = true;
                        if(questImg.paths.length === 1) {
                            PopupController.registerImageFullscreenEventListener(imgWrapperList[0].firstChild);
                        } else {
                            ImageCyclingController.addImageCyclingEventListener(questImg.paths, 
                                imgWrapperList[0].firstChild as HTMLImageElement, imgWrapperList[0] as HTMLElement, false)
                            PopupController.registerQuestImageCyclingEventListener(imgWrapperList[0].firstChild as HTMLImageElement, 
                                obj.questImages);
                        }
                    }
                }
            }
        }
    }

    private static async handleIconPopup(popupWrapper:HTMLElement, component:PopupIconComponent, iconComponent:IconComponent) {
        if(iconComponent.entity.imageList && iconComponent.entity.imageList.length > 0) {
            if(iconComponent.entity.longDescription) {
                this.setLongDescription(popupWrapper,iconComponent.entity.longDescriptionLocales?.[I18nHelper.currentLocale()] ?? iconComponent.entity.longDescription)
            } else {
                this.removeLongDescription(popupWrapper)
            }
            
            await this.setIconImage(popupWrapper, iconComponent.entity.imageList[0], component.imageEventListenersLoaded)

            const imgWrapperList = popupWrapper.getElementsByClassName(this.imageContainerClass);
            if(!component.imageEventListenersLoaded) {
                component.imageEventListenersLoaded = true;
                if(iconComponent.entity.imageList.length === 1) {
                    PopupController.registerImageFullscreenEventListener(imgWrapperList[0].firstChild);
                } else {
                    ImageCyclingController.addImageCyclingEventListener(iconComponent.entity.imageList, 
                        imgWrapperList[0].firstChild as HTMLImageElement, imgWrapperList[0] as HTMLElement, false)
                    PopupController.registerImageCyclingEventListener(imgWrapperList[0].firstChild as HTMLImageElement, 
                        iconComponent.entity.imageList);
                }
            }
        }
    }

    static hide(popupWrapper:HTMLElement) {
        popupWrapper.parentElement.style.zIndex = IndexConst.ICON
        popupWrapper.style.display = "none";
    }

    static hideFloorPopup(popupWrapper:HTMLElement) {
        // popupWrapper.parentElement.style.zIndex = IndexConst.HIDDEN
        // popupWrapper.parentElement.style.display = "none";
        popupWrapper.style.transform = "";
        popupWrapper.style.zIndex = IndexConst.HIDDEN
        popupWrapper.style.display = "none";
        // popupWrapper.style.visibility = "hidden";
    }

    private static setDescription(wrapper:HTMLElement, description:string) {
        const descriptionList = wrapper.getElementsByClassName(this.imageDescriptionTextClass)
        if(descriptionList) {
            const descriptionElement:HTMLElement = descriptionList[0] as HTMLElement
            if(descriptionElement && descriptionElement.textContent !== description) {
                descriptionElement.textContent = description
            }
        } else {
            console.log(`No description built for this popup, id: ${wrapper.id}`);
        }
    }

    private static setLongDescription(wrapper:HTMLElement, description:string) {
        const descriptionList = wrapper.getElementsByClassName(this.imageDescriptionTextClass)
        if(descriptionList && descriptionList.length >= 2) {
            const descriptionElement:HTMLElement = descriptionList[1] as HTMLElement
            if(!descriptionElement.classList.contains(this.imageLongDescriptionTextClass)) {
                descriptionElement.classList.add(this.imageLongDescriptionTextClass);
            }
            if(descriptionElement && descriptionElement.textContent !== description) {
                descriptionElement.textContent = description
            }
        } else {
            console.log(`No description built for this popup, id: ${wrapper.id}`);
        }
    }

    private static removeLongDescription(wrapper:HTMLElement) {
        const descriptionList = wrapper.getElementsByClassName(this.imageDescriptionTextClass)
        if(descriptionList && descriptionList.length >= 2) {
            const descriptionElement:HTMLElement = descriptionList[1] as HTMLElement
            descriptionElement.remove();
        } else {
            console.log(`No description built for this popup, id: ${wrapper.id}`);
        }
    }

    private static async setTraderImage(wrapper:HTMLElement, src:string, loaded:boolean) {
        const imgWrapperList = wrapper.getElementsByClassName(this.traderImageContainerClass)
        if(imgWrapperList) {
            if(loaded) {
                this.setImage(imgWrapperList[0] as HTMLElement, wrapper.id, src)
            } else {
                this.replacePlaceHolderImage(imgWrapperList[0] as HTMLElement, wrapper.id, src, [this.imageClass])
            }
            
        }
    }

    private static async setIconImage(wrapper:HTMLElement, src:string, loaded:boolean) {
        const imgWrapperList = wrapper.getElementsByClassName(this.imageContainerClass)
        if(imgWrapperList) {
            if(imgWrapperList[0] as HTMLElement && !this.isImageDifferent(imgWrapperList[0] as HTMLElement, src)) {
                return;
            }
            const ttl = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 12)) // Cached for 12 hours
            if(loaded) {
                await this.setImage(imgWrapperList[0] as HTMLElement, wrapper.id, src, ttl);
            } else {
                await this.replacePlaceHolderImage(imgWrapperList[0] as HTMLElement, wrapper.id, src, [this.imageClass, this.clickableClass], ttl)
            }
        }
    }

    private static isImageDifferent(imageWrapper:HTMLElement, newSrc:string):boolean {
        const img = imageWrapper.getElementsByClassName(this.imageClass)
        if(img.length > 0 && img[0] instanceof HTMLImageElement && img[0].src.includes(newSrc)) {
            return false;
        }
        return true;
    }

    private static async replacePlaceHolderImage(imgWrapper:HTMLElement, overlayId:string, src:string, imgClass:string[], ttl?:number) {
        if(imgWrapper) { 
            const image = new Image();
            image.id = overlayId;
            image.classList.add(...imgClass);
            try{
                if(src.includes("overwolf-extension://elkagffjjeonbcmfpdndkckppafabjeklmdidong")) {
                    console.log("What is happening here");
                }
                image.src = src + "?" + (ttl ? ttl : 1);
                await image.decode()
            } catch(e) {
                await ImageUtils.onImageLoadError(image, src)
            }
            // We already have an image
            if(imgWrapper.children.length > 0) {
                // We clear all existing images (there should only be one)
                for(const child of imgWrapper.children) {
                    // We do not want to decode the same image again
                    if(child instanceof HTMLImageElement && child.src !== src) {
                        imgWrapper.removeChild(child)
                    }
                }
            }
            imgWrapper.appendChild(image);

        } else {
            console.log(`No image wrapper built for this popup, id: ${overlayId}`);
        }
    }

    private static async setImage(imgWrapper:HTMLElement, overlayId:string, src:string, ttl?:number) {
        if(imgWrapper) { 
            // We already have an image
            if(imgWrapper.children.length > 0) {
                // We clear all existing images (there should only be one)
                for(const child of imgWrapper.children) {
                    // We do not want to decode the same image again
                    if(child instanceof HTMLImageElement && child.src !== src) {
                        try{
                            if(src.includes("overwolf-extension://elkagffjjeonbcmfpdndkckppafabjeklmdidong")) {
                                console.log("What happened? The src is the app extension");
                            }
                            child.src = src + "?" + (ttl ? ttl : 1);
                            await child.decode()
                        } catch(e) {
                            await ImageUtils.onImageLoadError(child, src)
                        }
                    }
                }
            }
        } else {
            console.log(`No image wrapper built for this popup, id: ${overlayId}`);
        }
    }

    static getPopupFloorComponent(componentList:IMapsComponent[]) {
        let iconComponentList:PopupFloorComponent[] = []
        componentList.forEach(component => {
            if(component instanceof PopupFloorComponent) {
                iconComponentList.push(component)
            }
        })
        return iconComponentList
    }

    static setPopupDescription(wrapper:HTMLElement, description:string) {
        const list = wrapper.getElementsByClassName(this.imageDescriptionTextClass);
        if(list.length > 0) {
            if(list[0] instanceof HTMLElement) {
                list[0].textContent = description;
            }
        }
    }

    static addDescriptionNote(wrapper:HTMLElement, note:string) {
        const list = wrapper.getElementsByClassName(this.imageDescriptionContainerClass);
        if(list.length > 0) {
            if(list[0] instanceof HTMLElement) {
                const text = HelperCreation.createB("popup-description-note", note);
                list[0].appendChild(text);
            }
        }
    }
}