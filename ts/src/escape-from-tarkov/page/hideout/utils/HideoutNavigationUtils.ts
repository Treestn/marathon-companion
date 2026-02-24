import { ScrollAnimationUtils } from "../../../utils/ScrollAnimationUtils";
import { HideoutBodyUtils } from "./HideoutBodyUtils";
import { HideoutHeaderUtils } from "./HideoutHeaderUtils"

export class HideoutNavigationUtils {

    static async navigateToStation(stationId:string, scroll?:boolean):Promise<HTMLElement> {
        const target = HideoutHeaderUtils.getHideoutElementFromId(stationId, HideoutHeaderUtils.getElementHeaderList());
        if(target) {
            this.openStationContent(target);
            if(scroll) {
                setTimeout(function() {
                    HideoutNavigationUtils.scrollToElement(target);
                }, 10)
            }
            return target;
        }
    }

    static async navigateToStationLevel(stationId:string, levelId:string, scroll?:boolean):Promise<HTMLElement> {
        const headerTarget = HideoutHeaderUtils.getHideoutElementFromId(stationId, HideoutHeaderUtils.getElementHeaderList());
        if(headerTarget) {
            const contentTarget = HideoutBodyUtils.getHideoutBody(stationId);
            if(contentTarget) {
                await this.openStationContent(contentTarget);
                
                const headerLevelTarget = HideoutBodyUtils.getHideoutLevelHeader(stationId, levelId, contentTarget)
                const requirementTarget = HideoutBodyUtils.getRequirementLevelContent(stationId, levelId, contentTarget);
                const craftTarget = HideoutBodyUtils.getCraftLevelContent(stationId, levelId, contentTarget);

                if(headerLevelTarget && !requirementTarget && !craftTarget) {
                    headerLevelTarget.click();
                    if(scroll) {
                        setTimeout(function() {
                            HideoutNavigationUtils.scrollToElement(headerLevelTarget);
                        }, 10)
                    }
                }
                return headerLevelTarget
            }
        }
        return null
    }

    static async navigateToStationLevelRequirement(stationId:string, levelId:string, scroll?:boolean):Promise<HTMLElement> {
        const headerTarget = HideoutHeaderUtils.getHideoutElementFromId(stationId, HideoutHeaderUtils.getElementHeaderList());
        const stationLevelTarget = await this.navigateToStationLevel(stationId, levelId, false);
        if(stationLevelTarget && headerTarget) {
            const target = await this.openStationLevelRequirement(stationLevelTarget, levelId);
            if(scroll) {
                setTimeout(function() {
                    HideoutNavigationUtils.scrollToElement(target);
                }, 100)
            }
            return target;
        }
        return null;
    }

    static async navigateToStationLevelCraft(stationId:string, levelId:string, craftId:string, scroll?:boolean):Promise<HTMLElement> {
        // const headerTarget = HideoutHeaderUtils.getHideoutElementFromId(stationId, HideoutHeaderUtils.getElementHeaderList());
        const stationLevelTarget = await this.navigateToStationLevel(stationId, levelId, false);
        if(stationLevelTarget) {
            const target = await this.openStationLevelCraft(stationLevelTarget, levelId);
            if(scroll) {
                setTimeout(function() {
                    HideoutNavigationUtils.scrollToElement(target);
                }, 10)
                // this.scrollToElement(target);
            }
            return target;
        }
        return null;
    }

    private static async openStationContent(target:HTMLElement) {
        if(target.style.display === "none") {
            target.style.display = "flex";
        }
    }

    private static async openStationLevelRequirement(stationLevelTarget:HTMLElement, levelId:string):Promise<HTMLElement> {
        const requirementHeaderList = stationLevelTarget.parentElement.getElementsByClassName("hideout-requirement-header");
        const target = this.getRequirementHeader(requirementHeaderList, levelId);
        if(target) {
            if(!target.nextElementSibling 
                    || (target.nextElementSibling && !target.nextElementSibling.classList.contains("hideout-station-level-requirements-wrapper"))) {
                target.click();
            }
        }
        return target
    }

    private static async openStationLevelCraft(stationLevelTarget:HTMLElement, levelId:string):Promise<HTMLElement> {
        const requirementHeaderList = stationLevelTarget.parentElement.getElementsByClassName("hideout-requirement-header");
        const target = this.getCrafttHeader(requirementHeaderList, levelId);
        if(target) {
            if(target.nextElementSibling && !target.nextElementSibling.classList.contains("hideout-station-level-requirements-wrapper")) {
                target.click();
            }
        }
        return target
    }

    private static async scrollToElement(target:HTMLElement) {
        const scrollContainer = document.getElementById("hideout-page-scroll-div")
        if(scrollContainer) {
            ScrollAnimationUtils.scrollToElement(target, scrollContainer);
            // target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // scrollContainer.scrollTop = target.offsetTop - scrollContainer.offsetTop
        }
        
    }

    private static getRequirementHeader(targetList:HTMLCollectionOf<Element>, levelId:string):HTMLElement {
        return this.getSubLevelHeader(targetList, levelId, "hideout-requirement-header")
    }

    private static getCrafttHeader(targetList:HTMLCollectionOf<Element>, levelId:string):HTMLElement {
        return this.getSubLevelHeader(targetList, levelId, "hideout-crafts-header")
    }

    private static getSubLevelHeader(targetList:HTMLCollectionOf<Element>, levelId:string, class_:string):HTMLElement {
        for(const target of targetList) {
            if(target.id === levelId && target.classList.contains(class_) && target instanceof HTMLElement) {
                return target
            }
        }
    }
}