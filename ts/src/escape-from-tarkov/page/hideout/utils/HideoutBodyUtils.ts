import { progressionTypes } from "../../../../consts";
import { HideoutLevels, HideoutStations, ItemRequirements } from "../../../../model/HideoutObject";
import { StationLevelState } from "../../../../model/IPlayerProgression";
import { AppConfigUtils } from "../../../utils/AppConfigUtils";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { ItemUtils } from "../../items/utils/ItemUtils";
import { HideoutComponent } from "../component/HideoutComponent";
import { HideoutHeaderUtils } from "./HideoutHeaderUtils";
import { HideoutStationPageUtils } from "./HideoutStationPageUtils";
import { HideoutUtils } from "./HideoutUtils";

export class HideoutBodyUtils {

    static showHideout(header:HTMLElement) {
        header.style.display = ""
    }

    static hideHideout(header:HTMLElement) {
        header.style.display = "none"
    }

    static resolveLevelsGlow(component:HideoutComponent) {
        const elementList = component.getHtmlBodyElement().getElementsByClassName("hideout-station-level-header-title-wrapper");
        for(const element of elementList) {
            if(element instanceof HTMLElement) {
                const state = PlayerProgressionUtils.getStationLevelState(component.getStation().id, element.id);
                if(state) {
                    if(state.active && !state.completed) {
                        element.style.boxShadow = "rgba(0, 255, 0, 0.08) 10px -11px 30px -0.5px inset";
                    } else if(state.completed) {
                        element.style.boxShadow = "rgba(167, 167, 146, 0.3) 10px -11px 30px -0.5px inset";
                    } else {
                        element.style.boxShadow = "rgba(255, 0, 0, 0.08) 10px -11px 30px -0.5px inset";
                    }
                }
            }
        }
    }

    static getElementBodyList() {
        return document.getElementsByClassName("hideout-station-body-wrapper");
    }

    static resolveRequirements(station?:HideoutStations, stationLevel?:HideoutLevels) {
        const elementList = document.getElementsByClassName("item-requirement-image");
        this.resolveStationsRequirement(elementList);

        if(!stationLevel) {
            stationLevel = HideoutUtils.getStationLevelWithId(HideoutStationPageUtils.selectedLevelId);
        }
        if(!station && stationLevel) {
            station = HideoutUtils.getStationWithLevelId(stationLevel.id);
        }
        if(station && stationLevel) {
            this.resolveItemsRequirement(station, stationLevel, elementList);
        }
    }

    static resolveStationsRequirement(elementList:HTMLCollectionOf<Element>) {
        for(const element of elementList) {
            if(element instanceof HTMLElement) {
                const level = HideoutUtils.getStationLevelWithId(element.id);
                const station = HideoutUtils.getStationWithLevelId(element.id);
                if(station && level) {
                    const levelState = PlayerProgressionUtils.getStationLevelState(station.id, level.id)
                    if(levelState) {
                        if(levelState.completed) {
                            element.parentElement.style.boxShadow = `inset 0 0 28px 3px rgb(74 57 91)`;
                        } else if(levelState.active) {
                            element.parentElement.style.boxShadow = `inset 0 0 28px 3px rgb(37 69 68)`;
                        } else {
                            element.parentElement.style.boxShadow = `inset 0 0 28px 3px #2f1115`;
                        }
                    }
                }
            }
        }
    }

    private static resolveItemsRequirement(station:HideoutStations, level:HideoutLevels, elementList:HTMLCollectionOf<Element>) {
        if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
            if(!level.itemPveRequirements || level.itemPveRequirements.length === 0) {
                return;
            }
            for(const element of elementList) {
                const itemPveRequirements:ItemRequirements = level.itemPveRequirements.find(item => item.item.id === element.id);
                if(itemPveRequirements && element instanceof HTMLElement) {
                    const hideoutLevelState = PlayerProgressionUtils.getStationLevelState(station.id, level.id);
                    if(level.itemPveRequirements && level.itemPveRequirements.length > 0 && hideoutLevelState) {

                        this.resolveHideoutItemBackground(element, itemPveRequirements, hideoutLevelState);

                        this.resolveItemText(element.parentElement.parentElement, itemPveRequirements, hideoutLevelState);

                        this.resolveItemInputText(element.parentElement.parentElement, itemPveRequirements);

                    } else {
                        element.parentElement.style.boxShadow = `inset 0 0 28px 3px rgb(74 57 91)`;
                    }
                }
            }
        } else {
            if(!level.itemRequirements || level.itemRequirements.length === 0) {
                return;
            }
            for(const element of elementList) {
                const itemRequirement:ItemRequirements = level.itemRequirements.find(item => item.item.id === element.id);
                if(itemRequirement && element instanceof HTMLElement) {
                    const hideoutLevelState = PlayerProgressionUtils.getStationLevelState(station.id, level.id);
                    if(level.itemRequirements && level.itemRequirements.length > 0 && hideoutLevelState) {

                        this.resolveHideoutItemBackground(element, itemRequirement, hideoutLevelState);

                        this.resolveItemText(element.parentElement.parentElement, itemRequirement, hideoutLevelState);

                        this.resolveItemInputText(element.parentElement.parentElement, itemRequirement);

                    } else {
                        element.parentElement.style.boxShadow = `inset 0 0 28px 3px rgb(74 57 91)`;
                    }
                }
            }
        }
    }

    private static resolveHideoutItemBackground(element:HTMLElement, itemRequirement:ItemRequirements, hideoutLevelState:StationLevelState) {
        if(hideoutLevelState.completed) {
            element.parentElement.style.boxShadow = `inset 0 0 28px 3px rgb(74 57 91)`;
        } else if(ItemUtils.isEnough(itemRequirement.item.id, itemRequirement.quantity)) {
            element.parentElement.style.boxShadow = `inset 0 0 28px 3px rgb(37 69 68)`;
        } else {
            element.parentElement.style.boxShadow = `inset 0 0 28px 3px #2f1115`;
        }
    }

    private static resolveItemText(itemWrapper:HTMLElement, itemRequirement:ItemRequirements, hideoutLevelState:StationLevelState) {
        const currentItemQuantity = ItemUtils.getItemCurrentQuantity(itemRequirement.item.id);
        const itemQuantityTextList = itemWrapper.getElementsByClassName("item-required-amount");
        if(itemQuantityTextList && itemQuantityTextList.length > 0 && itemQuantityTextList[0] instanceof HTMLElement) {
            const text = itemQuantityTextList[0].textContent.split(" / ");
            
            text[0] = (currentItemQuantity < 0 ? 0 : currentItemQuantity).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
            if(hideoutLevelState.completed) {
                text[0] = text[1];
            }
            itemQuantityTextList[0].textContent = text.join(" / ")
            if(hideoutLevelState.completed) {
                itemQuantityTextList[0].style.color = "var(--main-btn-active-color)";
            } else if(ItemUtils.isEnough(itemRequirement.item.id, itemRequirement.quantity)) {
                itemQuantityTextList[0].style.color = "#53af53";
            } else {
                itemQuantityTextList[0].style.color = "#ff7373";
            }
        }
    }

    private static resolveItemInputText(itemWrapper:HTMLElement, itemRequirement:ItemRequirements) {
        const currentItemQuantity = ItemUtils.getItemCurrentQuantity(itemRequirement.item.id);
        const inputList = itemWrapper.getElementsByClassName("item-amount-input");
        if(inputList && inputList.length > 0 && inputList[0] instanceof HTMLInputElement) {
            inputList[0].value = String(currentItemQuantity < 0 ? 0 : currentItemQuantity)
        }
    }

    static getRequirementLevelContent(stationId:string, levelId:string, contentTarget?:HTMLElement):HTMLElement {
        if(!contentTarget) {
            const bodyList = HideoutBodyUtils.getElementBodyList();
            contentTarget = HideoutHeaderUtils.getHideoutElementFromId(stationId, bodyList);
        }
        if(contentTarget) {
            const levelRequirementHeaders = contentTarget.getElementsByClassName("hideout-station-level-requirements-wrapper");
            return HideoutHeaderUtils.getHideoutElementFromId(levelId, levelRequirementHeaders);
        }
        return null;
    }

    static getCraftLevelContent(stationId:string, levelId:string, contentTarget?:HTMLElement):HTMLElement {
        if(!contentTarget) {
            const bodyList = HideoutBodyUtils.getElementBodyList();
            contentTarget = HideoutHeaderUtils.getHideoutElementFromId(stationId, bodyList);
        }
        
        if(contentTarget) {
            const levelCraftHeaders = contentTarget.getElementsByClassName("hideout-station-level-crafts-wrapper");
            return HideoutHeaderUtils.getHideoutElementFromId(levelId, levelCraftHeaders);
        }
        return null;
    }

    static getHideoutLevelHeader(stationId:string, levelId:string, contentTarget?:HTMLElement) {
        if(!contentTarget) {
            const bodyList = HideoutBodyUtils.getElementBodyList();
            contentTarget = HideoutHeaderUtils.getHideoutElementFromId(stationId, bodyList);
        }
        const levelHeaders = contentTarget.getElementsByClassName("hideout-station-level-wrapper")
        return HideoutHeaderUtils.getHideoutElementFromId(levelId, levelHeaders);
    }

    static getHideoutBody(stationId:string):HTMLElement {
        const bodyList = HideoutBodyUtils.getElementBodyList();
        return HideoutHeaderUtils.getHideoutElementFromId(stationId, bodyList);
    }

    static arrowDown(element:HTMLElement) {
        const arrow = element.getElementsByClassName("hideout-arrow");
        if(arrow && arrow[0] instanceof HTMLElement && !arrow[0].classList.contains("hideout-arrow-down")) {
            arrow[0].classList.add("hideout-arrow-down")
        }
    }

    static arrowUp(element:HTMLElement) {
        const arrow = element.getElementsByClassName("hideout-arrow");
        if(arrow && arrow[0] instanceof HTMLElement) {
            arrow[0].classList.remove("hideout-arrow-down")
        }
    }
}