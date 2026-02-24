import { LogoPathConst } from "../../../constant/ImageConst";

export class ImageUtils {

    static async loadImage(element:HTMLImageElement, path:string, ttl?:number) {
        try {
            // Mark the image as reloaded to prevent infinite loop
            element.dataset.reloaded = 'true';
            if(!ttl) {
                ttl = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));// Convert milliseconds to days
            }
            var newSrc = path + '?' + ttl;
            element.src = newSrc;
            await element.decode()
        } catch(e) {
            this.onImageLoadError(element, path);
        }
    }
    
    static async onImageLoadError(element:HTMLImageElement, path:string) {
        console.log("Failed decoding image");
        if(!path || path.includes("../")) {
            return;
        }
        if (element.tagName === 'IMG' && !element.dataset.reloaded) {
            // Mark the image as reloaded to prevent infinite loop
            element.dataset.reloaded = 'true';
            var timestamp = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
            var newSrc = path + '?' + timestamp;
            console.log("Reloading image with: " + newSrc);
            element.onload = await this.logReloadEvent
            element.onerror = await this.logReloadEvent
            element.src = newSrc;
            try {
                await element.decode()
            } catch(e) {
                element.src = LogoPathConst.LOGO_WHITE_256_BLUE_SIDE;
                await element.decode()
                return;
            }
            
        }
    }

    private static logReloadEvent(event) {
        if(event.type === "load") {
            console.log("Reload Sucessful")
        } else {
            console.log("Reload Failed")
        }   
    }
}