import { ScrollAnimationUtils } from "../../../utils/ScrollAnimationUtils";

export class ItemsNavigationUtils {

    static navigateToItems(itemId:string) {
        const target = document.getElementById(itemId);
        if(target) {
            const body = target.getElementsByClassName("item-body-wrapper");
            if(!body || body.length === 0) {
                target.click();
            }
            const scrollContainer = document.getElementById("items-page-scroll-div")
            if(scrollContainer) {
                setTimeout(() => {
                    ScrollAnimationUtils.scrollToElement(target, scrollContainer, 40);
                }, 50)
                // target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                // scrollContainer.scrollTop = target.offsetTop - scrollContainer.offsetTop
            }
            // target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        } else {
            console.log(`Could not navigate to item: ${itemId}`)
        }
    }

}