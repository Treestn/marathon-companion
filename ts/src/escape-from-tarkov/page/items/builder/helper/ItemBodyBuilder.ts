import { progressionTypes } from "../../../../../consts";
import { I18nHelper } from "../../../../../locale/I18nHelper";
import { TraderMapper } from "../../../../../adapter/TraderMapper";
import { ObjectiveTypeConst } from "../../../../constant/EditQuestConst";
import { HideoutLevels, HideoutStations } from "../../../../../model/HideoutObject";
import { Objectives, Quest } from "../../../../../model/quest/IQuestsElements";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { AppConfigUtils } from "../../../../utils/AppConfigUtils";
import { PlayerProgressionUtils } from "../../../../utils/PlayerProgressionUtils";
import { ImageUtils } from "../../../map/utils/ImageUtils";
import { ItemsComponent } from "../../component/ItemsComponent";
import { ItemController } from "../../controller/ItemController";

export class ItemBodyBuilder {

    static buildItemBody(component:ItemsComponent) {
        const wrapper = HelperCreation.createDiv("", "item-body-wrapper", "");

        const itemState = PlayerProgressionUtils.getItemState(component.itemId);
        if(itemState) {
            const overallQuantity = HelperCreation.createB("item-overall-needed", `${I18nHelper.get("pages.items.overall")} - ${itemState.overallQuantity}`);
            wrapper.appendChild(overallQuantity);
        }
        // const fullNameSection = this.buildFullNameSection(component);
        const requirementSection = this.buildRequirementSection(component);

        // wrapper.appendChild(fullNameSection);
        wrapper.appendChild(requirementSection);

        return wrapper;
    }

    private static buildFullNameSection(component:ItemsComponent):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-full-name-section-wrapper", "")

        const text = HelperCreation.createB("item-fullname-description", component.itemData.name);
        wrapper.appendChild(text);

        return wrapper
    }

    private static buildRequirementSection(component:ItemsComponent):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-requirements-wrapper", "")

        const questSection = this.buildQuestSection(component);
        const hideoutSection = this.buildHideoutSection(component);

        // Only append sections that have content (more than just the title)
        if(questSection.children.length > 1) {
            wrapper.appendChild(questSection);
        }
        
        if(hideoutSection.children.length > 1) {
            wrapper.appendChild(hideoutSection);
        }

        return wrapper
    }

    private static buildHideoutSection(component:ItemsComponent):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-body-section-wrapper", "")

        const text = HelperCreation.createB("item-body-section-title", I18nHelper.get("pages.items.hideout"));
        wrapper.appendChild(text);

        for(const hideoutStation of component.hideoutRequirement.keys()) {
            for(const hideoutLevel of component.hideoutRequirement.get(hideoutStation)) {
                const content = this.buildHideoutContent(hideoutStation, hideoutLevel, component.itemId);
                ItemController.registerHideoutClick(content, hideoutStation, hideoutLevel);
                wrapper.appendChild(content);
            }
        }

        return wrapper
    }

    private static buildQuestSection(component:ItemsComponent):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-body-section-wrapper", "")

        const text = HelperCreation.createB("item-body-section-title", I18nHelper.get("pages.items.quests"));
        wrapper.appendChild(text);

        for(const quest of component.questsRequirement.keys()) {
            for(const objective of component.questsRequirement.get(quest)) {
                if((objective.type === ObjectiveTypeConst.GIVE_ITEM.type || objective.type === ObjectiveTypeConst.FIND_ITEM.type)
                        && objective.item && objective.item.id === component.itemId) {
                    const content = this.buildQuestContent(quest, objective);
                    ItemController.registerQuestClick(content, quest);
                    wrapper.appendChild(content);
                }
            }
        }

        return wrapper
    }

    private static buildHideoutContent(hideoutStation:HideoutStations, hideoutLevel:HideoutLevels, itemId:string):HTMLElement {
        const wrapper = HelperCreation.createDiv(hideoutLevel.id, "item-body-content-wrapper", "")

        const hideoutState = PlayerProgressionUtils.getHideoutStationState(hideoutStation.id);
        for(const hideoutLevelState of hideoutState.stationLevelState) {
            if(hideoutLevelState.id === hideoutLevel.id) {
                let content:HTMLElement = this.hideoutContentBuilder(hideoutStation, hideoutLevel, itemId,
                    hideoutLevelState.active, hideoutState.completed || hideoutLevelState.completed)
                wrapper.appendChild(content);
            }
        }

        return wrapper
    }

    private static buildQuestContent(quest:Quest, objective:Objectives):HTMLElement {
        const wrapper = HelperCreation.createDiv(objective.id, "item-body-content-wrapper", "");

        const questState = PlayerProgressionUtils.getQuestState(quest.id);
        for(const objectiveState of questState.objectivesState) {
            if(objectiveState.id === objective.id) {
                const content:HTMLElement = this.questContentBuilder(quest, objective, questState.active, questState.completed || objectiveState.completed)
                if(questState.noTracking) {
                    content.style.display = "none";
                } else {
                    content.style.display = "";
                }
                wrapper.appendChild(content);
                break;
            }
        }

        return wrapper
    }

    private static hideoutContentBuilder(hideoutStation:HideoutStations, hideoutLevel:HideoutLevels, itemId:string, active:boolean, completed:boolean) {
        let itemCount = 0;
        if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
            itemCount = hideoutLevel.itemPveRequirements.find(item => item.item.id === itemId).quantity
        } else {
            itemCount = hideoutLevel.itemRequirements.find(item => item.item.id === itemId).quantity
        }
        return this.contentBuilder(hideoutStation.imageLink, hideoutStation.locales?.[I18nHelper.currentLocale()] ?? hideoutStation.name + " - " + hideoutLevel.level, itemCount, active, completed)
    }

    private static questContentBuilder(quest:Quest, objective:Objectives, active:boolean, completed:boolean):HTMLElement {
        return this.contentBuilder(TraderMapper.getImageFromTraderId(quest.trader.id), quest.locales?.[I18nHelper.currentLocale()] ?? quest.name, objective.count, active, completed);
    }

    private static contentBuilder(imageLink:string, title:string, requiredAmount:number, active:boolean, completed:boolean):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-content-wrapper", "");
        if(completed) {
            wrapper.classList.add("item-content-completed")
        } else if(active) {
            wrapper.classList.add("item-content-active")
        } else {
            wrapper.classList.add("item-content-blocked")
        }

        const informationWrapper = HelperCreation.createDiv("", "item-content-information-wrapper", "")
        const image = new Image();
        image.classList.add("item-content-image");
        informationWrapper.appendChild(image);
        
        // Add status indicator text - positioned relative to the image
        const statusText = document.createElement("span");
        statusText.className = "item-content-status-indicator";
        if(completed) {
            statusText.textContent = I18nHelper.get("pages.hideout.filters.completed");
            statusText.classList.add("status-completed");
        } else if(active) {
            statusText.textContent = I18nHelper.get("pages.hideout.filters.active");
            statusText.classList.add("status-active");
        } else {
            statusText.textContent = I18nHelper.get("pages.hideout.station.legend.blocked");
            statusText.classList.add("status-blocked");
        }
        informationWrapper.appendChild(statusText);
        
        wrapper.appendChild(informationWrapper)

        const requiredQuantityWrapper = HelperCreation.createDiv("", "item-content-required-quantity-wrapper", "")
        const text = HelperCreation.createB("item-content-title", title);
        const requiredQuantityText = HelperCreation.createB("item-content-required-quantity", `${I18nHelper.get("pages.items.required")} - ${requiredAmount}`);
        requiredQuantityWrapper.appendChild(text);
        requiredQuantityWrapper.appendChild(requiredQuantityText);
        
        wrapper.appendChild(requiredQuantityWrapper);

        ImageUtils.loadImage(image, imageLink);

        return wrapper
    }

}