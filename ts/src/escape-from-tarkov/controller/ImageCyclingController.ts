import { HelperCreation } from "../../escape-from-tarkov/service/MainPageCreator/HelperCreation";
import { LogoPathConst } from "../constant/ImageConst";
import { ImageUtils } from "../page/map/utils/ImageUtils";

export class ImageCyclingController {


    static addImageCyclingEventListener(paths:string[], image:HTMLImageElement, imageContainer:HTMLElement, withBorder:boolean) {
        let leftIconContainer
        let rightIconContainer
        if(withBorder) {
            leftIconContainer = HelperCreation.createDiv("", "overlay-image-selector overlay-previous-image-container-border", "")
            rightIconContainer = HelperCreation.createDiv("", "overlay-image-selector overlay-next-image-container-border", "")
        } else {
            leftIconContainer = HelperCreation.createDiv("", "overlay-image-selector overlay-previous-image-container", "")
            rightIconContainer = HelperCreation.createDiv("", "overlay-image-selector overlay-next-image-container", "")
        }

        leftIconContainer.appendChild(HelperCreation.createImage("", "overlay-selector-icon", "../../img/line-angle-left-icon.png", ""))
        this.shortPressEventListener(leftIconContainer, paths, image, this.setPreviousImage)

        rightIconContainer.appendChild(HelperCreation.createImage("", "overlay-selector-icon", "../../img/line-angle-right-icon.png", ""))     
        this.shortPressEventListener(rightIconContainer, paths, image, this.setNextImage) 

        imageContainer.appendChild(leftIconContainer)
        imageContainer.appendChild(rightIconContainer)
    }

    private static setPreviousImage(paths:string[], image:HTMLImageElement) {
        let index = paths.indexOf(image.src.split('?')[0])
        if(index === 0 || index === -1) {
            ImageCyclingController.replaceImage(image, paths[paths.length - 1]);
        } else {
            ImageCyclingController.replaceImage(image, paths[index - 1]);
        }
    }

    private static setNextImage(paths:string[], image:HTMLImageElement) {
        let index = paths.indexOf(image.src.split('?')[0])
        if(index === paths.length - 1) {
            ImageCyclingController.replaceImage(image, paths[0]);
        } else {
            ImageCyclingController.replaceImage(image, paths[index + 1]);
        }
    }

    private static async replaceImage(image:HTMLImageElement, path:string) {
        const imagePath = image.src;
        const img = new Image();
        const parent:HTMLElement = image.parentElement
        const loading = new Image();
        try {
        
            loading.src = LogoPathConst.LOADING_GIF
            loading.classList.add("loading-image")
            parent.appendChild(loading);

            image.style.display = "none";
            const timestamp = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
            img.src = path + "?" + timestamp
            img.onload = () => {
                loading.remove();
                image.style.display = "";
                image.src = img.src
            }
            img.onerror = () => {
                loading.remove();
                image.style.display = "";
            }
        } catch(e) {
            ImageUtils.onImageLoadError(img, path)
        }
    }

    private static shortPressEventListener(element, paths, image, func) {
        var start, end;
        element.addEventListener('mousedown', () => {
            start = Date.now()
        })

        element.addEventListener('mouseup', () => {
            end = Date.now()
            if(((end - start) + 1) < 175) {
                func(paths, image);
            }
        })
    }

}