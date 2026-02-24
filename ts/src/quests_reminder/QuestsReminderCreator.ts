import { progressionTypes } from "../consts";
import { MapAdapter } from "../adapter/MapAdapter";
import { TraderMapper } from "../adapter/TraderMapper";
import { ObjectiveTypeConst } from "../escape-from-tarkov/constant/EditQuestConst";
import { LogoPathConst } from "../escape-from-tarkov/constant/ImageConst";
import { MapsList } from "../escape-from-tarkov/constant/MapsConst";
import { HideoutLevels, HideoutStations } from "../model/HideoutObject";
import { NeededKeys, Objectives, Quest } from "../model/IQuestsElements";
import { HideoutUtils } from "../escape-from-tarkov/page/hideout/utils/HideoutUtils";
import { ImageUtils } from "../escape-from-tarkov/page/map/utils/ImageUtils";
import { QuestsUtils } from "../escape-from-tarkov/page/quests/utils/QuestsUtils";
import { HelperCreation } from "../escape-from-tarkov/service/MainPageCreator/HelperCreation";
import { AppConfigUtils } from "../escape-from-tarkov/utils/AppConfigUtils";
import { ItemsElementUtils } from "../escape-from-tarkov/utils/ItemsElementUtils";
import { PlayerProgressionUtils } from "../escape-from-tarkov/utils/PlayerProgressionUtils";
import { I18nHelper } from "../locale/I18nHelper";

export class QuestsReminderCreator {

    static createReminder(quest:Quest, selectedMapId:string) {
        let container = HelperCreation.createDiv("", "reminder-container", "")
        const reminder = this.createReminderBody(quest, selectedMapId);
        if(reminder) {
            container.appendChild(this.createReminderHeader(quest.locales?.[I18nHelper.currentLocale()] ?? quest.name, quest.trader.id))
            container.appendChild(reminder);
            return container;
        }
        return null
    }

    static createMapSelectionDropdown(selectedMapId:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "map-selector-dropdown", "");
        const mapDefaultPreferenceDropdown = document.createElement("select");
        mapDefaultPreferenceDropdown.id = "quest-reminder-map-selector";
        mapDefaultPreferenceDropdown.classList.add("centered");
        mapDefaultPreferenceDropdown.classList.add("reminder-map-selector-dropdown");
        if(selectedMapId && mapDefaultPreferenceDropdown) {
            for(const map of MapsList) {
                if(map.id === selectedMapId) {
                    mapDefaultPreferenceDropdown.appendChild(new Option(MapAdapter.getLocalizedMap(map.id), map.id, true, true));
                } else {
                    mapDefaultPreferenceDropdown.appendChild(new Option(MapAdapter.getLocalizedMap(map.id), map.id));
                }
            }    
        }
        wrapper.appendChild(mapDefaultPreferenceDropdown)
        return wrapper
    }

    private static createReminderHeader(questName:string, traderId:string):HTMLElement {
        let container = HelperCreation.createDiv("", "reminder-header-container", "")
        container.appendChild(HelperCreation.createImage("", "reminder-trader-image", TraderMapper.getImageFromTraderId(traderId), ""))
        container.appendChild(HelperCreation.createB("reminder-quest-title",  questName))
        return container
    }

    private static createReminderBody(quest:Quest, selectedMapId:string):HTMLElement {
        let container = HelperCreation.createDiv("", "reminder-body-container", "")

        this.addKeyElements(quest, container, selectedMapId);

        let show:boolean = false;
        const questState = PlayerProgressionUtils.getQuestState(quest.id);
        quest.objectives.forEach(obj => {
            const objState = PlayerProgressionUtils.getObjectiveState(quest.id, obj.id);
            if(!objState || objState.completed || questState.noTracking) {
                return;
            }
            
            const element = this.createReminderElement(obj, selectedMapId)
            if(element) {
                container.appendChild(element);
                show = true;
            }
        })
        if(show) {
            return container
        } else {
            return null;
        }
        
    }

    private static addKeyElements(quest:Quest, container:HTMLElement, selectedMapId:string) {
        if(quest.neededKeys) {
            const mapKeys:NeededKeys[] = []
            quest.neededKeys.forEach(keys => {
                if(keys.map && keys.map.id) {
                    if(keys.map.id === selectedMapId) {
                        mapKeys.push(keys);
                    }
                }
            })
            if(mapKeys.length > 0) {
                mapKeys.forEach(neededKeys => {
                    container.appendChild(this.createKeyElement(neededKeys));
                })
            }
        }
    }

    private static createKeyElement(neededKeys:NeededKeys):HTMLElement {
        let wrapper = HelperCreation.createDiv("", "reminder-item-wrapper", "")

        let i = 1;
        neededKeys.keys.forEach(key => {
            if(i > 1) {
                const orText = HelperCreation.createB("reminder-item-text", "or");
                wrapper.appendChild(orText);
            }
            const keyWrapper = HelperCreation.createDiv("", "reminder-key-wrapper", "");
            const image = new Image();
            image.src = LogoPathConst.LOADING_GIF;
            image.classList.add("reminder-item-image");
            keyWrapper.appendChild(image);
            
            const text = HelperCreation.createB("reminder-item-text", "~");
            keyWrapper.appendChild(text);
            ItemsElementUtils.getItemInformation(key.id).then(itemData => {
                image.src = itemData.baseImageLink;
                text.textContent = itemData.name
            })
            wrapper.appendChild(keyWrapper);
            i++;
        })
        
        return wrapper
    }

    private static createReminderElement(obj:Objectives, selectedMapId:string):HTMLElement {
        if(obj.description.includes("Hand over") 
                || !QuestsUtils.isObjectiveInMap(obj, selectedMapId)) {
            return null;
        }

        let wrapper = HelperCreation.createDiv("", "reminder-item-wrapper", "")

        wrapper.appendChild(this.createSubTaskElement(obj.description, obj))

        if(QuestsUtils.isMarkingPartOfObjective(obj) && obj.markerItem && obj.markerItem.id) {
            wrapper.appendChild(this.createMarkerElement(obj.markerItem.id))
            // container.appendChild(this.createReminderElement(obj.markerItem.id))
        } else if(QuestsUtils.isPlantingPartOfObjective(obj) && obj.item && obj.item.id) {
            wrapper.appendChild(this.createMarkerElement(obj.item.id))
            // container.appendChild(this.createReminderElement())
        } else if(QuestsUtils.isTaskObjectiveQuestItem(obj) && obj.questItem && obj.questItem.id) {
            wrapper.appendChild(this.createMarkerElement(obj.questItem.id))
        }
        // wrapper.appendChild(this.createMarkerElement(itemId))
        
        return wrapper
    }

    private static createSubTaskElement(description:string, objective:Objectives): HTMLElement {
        let container = HelperCreation.createDiv("", "reminder-item-subtask-container", "")

        // let buttonContainer = HelperCreation.createDiv("", "description-dropwdown-button", "");
        // let buttonImage = HelperCreation.createImage("", "description-dropwdown-button-image", "../../img/line-angle-right-icon.png", "")
        // buttonContainer.appendChild(buttonImage)
        // container.appendChild(buttonContainer)

        let text = HelperCreation.createB("reminder-item-subtask-text", QuestsUtils.normalizeQuestGoalText(description, objective));
        container.appendChild(text);
        return container
    }

    private static createMarkerElement(itemId:string):HTMLElement {
        let container = HelperCreation.createDiv("", "reminder-item-container", "")
        const image = new Image();
        image.src = LogoPathConst.LOGO_WHITE_256_BLUE_SIDE;
        image.classList.add("reminder-item-image");
        const path = ItemsElementUtils.getImagePath(itemId);
        ImageUtils.loadImage(image, path);
        container.appendChild(image);
        this.setItemName(container, itemId)
        return container
    }

    private static async setItemName(container:HTMLElement, itemId:string) {
        const item = await ItemsElementUtils.getItemInformation(itemId);
        if(item) {
            container.appendChild(HelperCreation.createB("reminder-item-text", item.name))
        }
    }

    static createItemReminder(itemId:string, idList:string[]):HTMLElement {
        const wrapper = HelperCreation.createDiv(itemId, "item-wrapper", "");

        // wrapper.appendChild(this.createAmountNeededSection(itemId));
        wrapper.appendChild(this.createImageSection(itemId, idList));
        wrapper.appendChild(this.createInformationSection(itemId, idList));

        return wrapper
    }

    private static createImageSection(itemId:string, idList:string[]):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-image-wrapper", "");

        const itemState = PlayerProgressionUtils.getItemState(itemId);
        if(itemId) {
            const quantityText = HelperCreation.createB("reminder-item-quantity", itemState.currentQuantity + " / " + this.getItemRequiredAmount(itemId, idList));
            wrapper.appendChild(quantityText);
        }

        const image = new Image();
        image.classList.add("reminder-items-image");
        image.src = LogoPathConst.LOADING_GIF;
        wrapper.appendChild(image);

        const itemName = HelperCreation.createB("reminder-item-name", "-");
        wrapper.appendChild(itemName);

        ItemsElementUtils.getItemInformation(itemId).then(data => {
            ImageUtils.loadImage(image, data.baseImageLink);
            itemName.textContent = data.name;
        })

        return wrapper
    }

    private static createInformationSection(itemId:string, idList:string[]):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-reminder-information-wrapper", "")
        for(const id of idList) {
            const quest = QuestsUtils.getQuestFromID(id);
            if(quest) {
                wrapper.appendChild(this.createQuestContent(itemId, quest));
            } else {
                const hideoutLevel = HideoutUtils.getStationLevelWithId(id);
                const hideoutStation = HideoutUtils.getStationWithLevelId(id);
                if(hideoutLevel && hideoutStation) {
                    wrapper.appendChild(this.createHideoutContent(itemId, hideoutStation, hideoutLevel));
                } else {
                    console.log(`Could not find relevant information for item id: ${id}`);
                }
            }
        }
        return wrapper;
    }

    private static getItemRequiredAmount(itemId:string, idList:string[]):number {
        let quantity = 0;
        for(const id of idList) {
            const quest = QuestsUtils.getQuestFromID(id);
            if(quest) {
                quantity += this.getQuestRequiredAmount(itemId, quest);
            } else {
                const hideoutLevel = HideoutUtils.getStationLevelWithId(id);
                if(hideoutLevel) {
                    quantity += this.getHideoutRequiredAmount(itemId, hideoutLevel);
                } else {
                    console.log(`Could not find relevant information for id: ${id}`);
                }
            }
        }
        return quantity
    }

    private static getQuestRequiredAmount(itemId:string, quest:Quest) {
        let quantity:number = 0; 
        quest.objectives.forEach(obj => {
            if((obj.type === ObjectiveTypeConst.GIVE_ITEM.type || obj.type === ObjectiveTypeConst.FIND_ITEM.type) && obj.item && obj.item.id === itemId) {
                quantity += obj.count;
            }
        })
        return quantity
    }

    private static getHideoutRequiredAmount(itemId:string, hideoutLevel:HideoutLevels) {
        let quantity:number = 0;
        if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
            hideoutLevel.itemPveRequirements.forEach(requirement => {
                if(requirement.item && requirement.item.id === itemId) {
                    quantity += requirement.quantity;
                }
            })
        } else {
            hideoutLevel.itemRequirements.forEach(requirement => {
                if(requirement.item && requirement.item.id === itemId) {
                    quantity += requirement.quantity;
                }
            })
        }
        return quantity
    }

    private static createQuestContent(itemId:string, quest:Quest):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-quest-reminder-wrapper", "");

        const quantityWrapper = HelperCreation.createDiv("", "reminder-quantity-wrapper", "");
        let quantity:number = 0; 
        quest.objectives.forEach(obj => {
            if((obj.type === ObjectiveTypeConst.GIVE_ITEM.type || obj.type === ObjectiveTypeConst.FIND_ITEM.type) && obj.item && obj.item.id === itemId) {
                quantity += obj.count;
            }
        })
        const quantityText = HelperCreation.createB("reminder-quantity", ""+quantity)
        quantityWrapper.appendChild(quantityText)

        const imageWrapper = HelperCreation.createDiv("", "item-information-image-wrapper", "");
        const image = new Image();
        image.classList.add("item-information-image");
        imageWrapper.appendChild(image);

        const traderPath = TraderMapper.getImageFromTraderId(quest.trader.id);
        ImageUtils.loadImage(image, traderPath, 1);

        const contentWrapper = HelperCreation.createDiv("", "item-information-content-wrapper", "");
        const text = HelperCreation.createB("item-content-title", quest.locales?.[I18nHelper.currentLocale()] ?? quest.name);
        contentWrapper.appendChild(text)

        wrapper.appendChild(quantityWrapper);
        wrapper.appendChild(imageWrapper);
        wrapper.appendChild(contentWrapper);

        return wrapper
    }

    private static createHideoutContent(itemId:string, hideoutStation:HideoutStations, hideoutLevel:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-hideout-reminder-wrapper", "");

        const quantityWrapper = HelperCreation.createDiv("", "reminder-quantity-wrapper", "");
        let quantity:number = 0; 
        hideoutLevel.itemRequirements.forEach(requirement => {
            if(requirement.item && requirement.item.id === itemId) {
                quantity += requirement.quantity;
            }
        })
        const quantityText = HelperCreation.createB("reminder-quantity", ""+quantity)
        quantityWrapper.appendChild(quantityText)

        const imageWrapper = HelperCreation.createDiv("", "item-information-image-wrapper", "");
        const image = new Image();
        image.classList.add("item-information-image");
        imageWrapper.appendChild(image);

        ImageUtils.loadImage(image, hideoutStation.imageLink, 1);

        const contentWrapper = HelperCreation.createDiv("", "item-information-content-wrapper", "");
        const text = HelperCreation.createB("item-content-information-title", `${hideoutStation.locales?.[I18nHelper.currentLocale()] ?? hideoutStation.name} - ${hideoutLevel.level}`);
        // const levelText = HelperCreation.createB("item-content-text", `${I18nHelper.get("pages.questReminder.items.hideout.level")} ${}`);
        contentWrapper.appendChild(text);
        // contentWrapper.appendChild(levelText);

        wrapper.appendChild(quantityWrapper)
        wrapper.appendChild(imageWrapper);
        wrapper.appendChild(contentWrapper);

        return wrapper
    }
}