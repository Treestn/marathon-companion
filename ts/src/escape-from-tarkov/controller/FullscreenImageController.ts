import { HelperCreation } from "../../escape-from-tarkov/service/MainPageCreator/HelperCreation";
import { ImageCyclingController } from "./ImageCyclingController";

export class FullscreenImageController {

    static fullScreenQuestImageByUuid(uuid:string) {
        let src:string = document.getElementById(uuid).getAttribute('src')
        let fullScreenDiv:HTMLElement = FullscreenImageController.createFullScreenImageDiv(src);
        let parentDiv:HTMLElement = document.getElementsByClassName("runner")[0] as HTMLElement
        parentDiv.insertBefore(fullScreenDiv, (parentDiv.children[0] as HTMLElement));
    }

    static fullScreenImageElement(image:HTMLImageElement) {
        let fullScreenDiv:HTMLElement = FullscreenImageController.createFullScreenImageDiv(image.getAttribute('src'));
        let parentDiv:HTMLElement = document.getElementsByClassName("runner")[0] as HTMLElement
        parentDiv.insertBefore(fullScreenDiv, (parentDiv.children[0] as HTMLElement));
    }

    static fullScreenImageElementWithCycling(image:HTMLImageElement, paths:string[]) {
        let fullScreenDiv:HTMLElement = FullscreenImageController.createFullScreenImageDiv(image.getAttribute('src'));

        ImageCyclingController.addImageCyclingEventListener(paths, 
            fullScreenDiv.getElementsByClassName('fullScreenImage')[0] as HTMLImageElement, 
            fullScreenDiv, false)

        let parentDiv:HTMLElement = document.getElementsByClassName("runner")[0] as HTMLElement
        parentDiv.insertBefore(fullScreenDiv, (parentDiv.children[0] as HTMLElement));
    }

    static removeFullScreenQuestImage() {
        document.getElementById("fullScreenImage").remove();
    }

    private static createFullScreenImageDiv(src:string): HTMLElement {
        let fsImageDiv = HelperCreation.createDiv("fullScreenImage", "fullScreenImageDiv", "");
        let imageContainer = HelperCreation.createDiv("", "full-screen-image-container", "")
        imageContainer.appendChild(HelperCreation.createImage("", "fullScreenImage", src, ""))
        fsImageDiv.appendChild(imageContainer);

        fsImageDiv.appendChild(this.createExitButton());
        fsImageDiv.appendChild(HelperCreation.createDiv("", "fullScreenImageBg", ""));
        return fsImageDiv;
    }

    private static createExitButton():HTMLElement {
        let exitButton:HTMLElement = HelperCreation.createImage("", "exitFullScreenImage", "../../img/x_icon.png", "")
        this.createExitEventListener(exitButton);
        return exitButton;
    }

    private static createExitEventListener(exitButton:HTMLElement) {
        exitButton.addEventListener('click', e => {
            FullscreenImageController.removeFullScreenQuestImage();
        })
    }
}