import { HideoutCrafts, HideoutStations, HideoutLevels, RequiredItems, RewardItems, StationLevelRequirements, TraderRequirements, ItemRequirements } from "../../../../../model/HideoutObject";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { HideoutComponent } from "../../component/HideoutComponent";
import { ImageUtils } from "../../../map/utils/ImageUtils";
import { TraderMapper } from "../../../../../adapter/TraderMapper";
import { HideoutUtils } from "../../utils/HideoutUtils";
import { ItemsElementUtils } from "../../../../utils/ItemsElementUtils";
import { LogoPathConst } from "../../../../constant/ImageConst";
import { HideoutHeaderBuilder } from "./HideoutHeaderBuilder";
import { HideoutBodyController } from "../../controller/HideoutBodyController";
import { ItemBuilder } from "../../../items/builder/helper/ItemBuilder";
import { PageConst } from "../../../../constant/PageConst";
import { ItemsBodyUtils } from "../../../items/utils/ItemsBodyUtils";
import { QuestsUtils } from "../../../quests/utils/QuestsUtils";
import { PlayerProgressionUtils } from "../../../../utils/PlayerProgressionUtils";
import { HideoutStationPageUtils } from "../../utils/HideoutStationPageUtils";
import { EditSession } from "../../../quests/edit/EditSession";
import { HideoutEditController } from "../../controller/HideoutEditController";
import { TsSelect2 } from "ts-select2/dist/core"
import { TraderList } from "../../../../constant/TraderConst";
import { EditableHideoutCrafts } from "../../../quests/edit/EditableHideoutCrafts";
import { AppConfigUtils } from "../../../../utils/AppConfigUtils";
import { progressionTypes } from "../../../../../consts";
import { I18nHelper } from "../../../../../locale/I18nHelper";

export class HideoutBodyBuilder {

    static updateSelect2() {
        // const list = document.getElementsByClassName("quest-edit-unlock-selection");
        // for(const select of list) {
        //     if(select instanceof HTMLSelectElement) {
        //         const select2 = new TsSelect2(select, {
        //             width: `250px`, 
        //             multiple: false,
        //         })
        //     }
        // }
        
        // const list2 = document.getElementsByClassName("quest-edit-objective-item-selector");
        // for(const select of list2) {
        //     if(select instanceof HTMLSelectElement) {
        //         const select2 = new TsSelect2(select, { 
        //             width: `70%`, 
        //             multiple: false,
        //         })
        //     }
        // } 

        const list3 = document.getElementsByClassName("quest-edit-reward-item-selector");
        for(const select of list3) {
            if(select instanceof HTMLSelectElement) {
                const select2 = new TsSelect2(select, { 
                    width: `70%`, 
                    multiple: false,
                })
            }
        }

        // const list4 = document.getElementsByClassName("quest-edit-needed-keys-selector");
        // for(const select of list4) {
        //     if(select instanceof HTMLSelectElement) {
        //         const select2 = new TsSelect2(select, { 
        //             width: `70%`, 
        //             multiple: false,
        //         })
        //     }
        // }
    }

    static createBody(component:HideoutComponent):HTMLElement {
        const wrapper = HelperCreation.createDiv(component.getStation().id, "hideout-station-body-wrapper", "");
        wrapper.style.display = "none";

        wrapper.appendChild(this.createStationRequirements(component))
        
        if(component.getStation().levels) {
            const orderedLevels = this.orderLevels(component.getStation().levels)
            orderedLevels.forEach(level => {
                wrapper.appendChild(this.createLevelSection(component, level))
            })
        }

        return wrapper
    }

    private static createStationRequirements(component:HideoutComponent):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-station-requirements-wrapper", "");

        component.getStation().levels.forEach(level => {
            if(level.level === 1) {
                this.createLevelRequirementsInformation(level, false);
            }
        })

        return wrapper;
    }

    private static getInfoWrapper():HTMLElement {
        return document.getElementById("hideoutStationPageInfoWrapper");
    }

    private static removeOldInfoWrapper() {
        const oldWrapper = document.getElementById("hideoutStationPageInfo");
        if(oldWrapper) {
            oldWrapper.remove();
        }
    }

    static createLevelRequirementsInformation(level:HideoutLevels, addItems:boolean) {
        if(EditSession.isSessionOpen()) {
            const station = EditSession.getModifiedHideoutByLevelId(level.id)
            if(station) {
                for(const stationLevel of station.hideout.levels) {
                    if(stationLevel.id === level.id) {
                        level = stationLevel;
                    }
                }
            }
        }
        this.removeOldInfoWrapper();
        HideoutStationPageUtils.selectedLevelId = level.id;
        if(EditSession.isSessionOpen()) {
            HideoutEditController.addHideout(level);
        }

        const wrapper = this.getInfoWrapper();
        if(!wrapper) {
            console.log('Could not find hideout info wrapper while loading Requirements');
            return;
        }

        const container = HelperCreation.createDiv("hideoutStationPageInfo", "hideout-station-page-info", "");
        if(EditSession.isSessionOpen()) {
            const traderRequirements = this.createEditTraderRequirement(level);
            container.appendChild(traderRequirements)
        } else if(level.traderRequirements) {
            level.traderRequirements.forEach(traderRequirement => {
                const traderRequirements = this.createTraderRequirement(traderRequirement);
                container.appendChild(traderRequirements)
            })
        }

        if(EditSession.isSessionOpen()) {
            const stationRequirements = this.createEditHideoutStationRequirement(level)
            container.appendChild(stationRequirements);
        } else if(level.stationLevelRequirements) {
            level.stationLevelRequirements.forEach(stationRequirement => {
                const stationRequirements = this.createHideoutStationRequirement(stationRequirement)
                container.appendChild(stationRequirements);
            })
        }
        if(EditSession.isSessionOpen()) {
            const itemWrapper = this.createEditItemRequirement(level)
            container.appendChild(itemWrapper);
        } else if(addItems && level.itemRequirements) {
            if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
                level.itemPveRequirements.forEach(itemRequirement => {
                    const itemWrapper = ItemBuilder.createItem(itemRequirement.item.id, itemRequirement.quantity, PageConst.HIDEOUT_PAGE)
                    container.appendChild(itemWrapper);
                    const text = ItemsBodyUtils.getItemNameElement(itemWrapper);
                    if(itemWrapper) {
                        HideoutBodyController.registerItemNavigationController(itemRequirement.item.id, text as HTMLElement);
                    }
                })
            } else {
                level.itemRequirements.forEach(itemRequirement => {
                    const itemWrapper = ItemBuilder.createItem(itemRequirement.item.id, itemRequirement.quantity, PageConst.HIDEOUT_PAGE)
                    container.appendChild(itemWrapper);
                    const text = ItemsBodyUtils.getItemNameElement(itemWrapper);
                    if(itemWrapper) {
                        HideoutBodyController.registerItemNavigationController(itemRequirement.item.id, text as HTMLElement);
                    }
                })
            }
        }
        wrapper.appendChild(container);
        if(EditSession.isSessionOpen()) {
            HideoutBodyBuilder.updateSelect2();
        }
    }

    static createLevelCraftsInformation(station:HideoutStations, level:HideoutLevels) {
        this.removeOldInfoWrapper();
        HideoutStationPageUtils.selectedLevelId = level.id;
        
        const wrapper = this.getInfoWrapper();
        const container = HelperCreation.createDiv("hideoutStationPageInfo", "hideout-station-page-info", "");

        let crafts = HideoutUtils.getAllCraftsForStationIdWithLevel(station.id, level.level);
        if(EditSession.isSessionOpen()) {
            for(let i = crafts.length - 1; i >= 0; i--) {
                let removedString = crafts[i].station.id + "-" + crafts[i].level;
                for(const reward of crafts[i].rewardItems) {
                    removedString += "-" + reward.item.id
                }
                if(EditSession.getRemovedHideoutCrafts().includes(removedString)) {
                    crafts.splice(i, 1);
                }
            }
            for(let i = crafts.length - 1; i >= 0; i--) {
                let craftString = crafts[i].station.id + "-" + crafts[i].level;
                for(const reward of crafts[i].rewardItems) {
                    craftString += "-" + reward.item.id
                }
                for(const editedCraft of EditSession.getModifiedHideoutCraft(station.id, level.level)) {
                    let editedString = editedCraft.craft.station.id + "-" + editedCraft.craft.level;
                    for(const reward of editedCraft.craft.rewardItems) {
                        editedString += "-" + reward.item.id
                    }
                    if(craftString === editedString) {
                        crafts[i] = editedCraft.craft;
                    }
                }
            }
            // const editCrafts = EditSession.getModifiedHideoutCraft(station.id, level.level);
            // if(editCrafts.length > 0) {
            //     for(const craft of editCrafts) {
            //         crafts.push(craft.craft);
            //     }
            // }
        }
        if(crafts && crafts.length > 0) {
            let i = 0;
            crafts.forEach(craft => {
                if(EditSession.isSessionOpen()) {
                    EditSession.addModifiedHideoutCraft(new EditableHideoutCrafts(station.id, level.level, craft))
                    container.appendChild(this.createEditCraftInformation(craft, i%2 ? "rgb(57 31 67 / 16%)" : "rgb(0 0 0 / 68%)"));
                } else {
                    container.appendChild(this.createCraftInformation(craft, i%2 ? "rgb(57 31 67 / 16%)" : "rgb(0 0 0 / 68%)"));
                }
                i++;
            })
        }

        if(EditSession.isSessionOpen()) {
            const addButtonWrapper = HelperCreation.createDiv("", "", "");
            const addButton = this.createAddButton();
            HideoutEditController.registerAddCraft(addButton, container, station.id, level.level)
            addButtonWrapper.appendChild(addButton);
            container.appendChild(addButtonWrapper)
        }

        wrapper.appendChild(container);
        if(EditSession.isSessionOpen()) {
            HideoutBodyBuilder.updateSelect2();
        }
    }

    static createEditCraftInformation(craft:HideoutCrafts, color:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-craft-information-wrapper", "")
        wrapper.style.backgroundColor = color

        const rewardWrapper = HelperCreation.createDiv("", "hideout-edit-craft-reward-wrapper", "")
        const reward = this.addEditCraftRewardItem(craft);
        rewardWrapper.appendChild(reward);

        const rewardSelectWrapper = reward.getElementsByClassName("hideout-edit-item-reward-wrapper")[0] as HTMLElement

        const requiredWrapper = HelperCreation.createDiv("", "hideout-edit-craft-required-wrapper", "");
        const requiredItems = this.addEditCraftRequiredItem(craft, rewardSelectWrapper);
        requiredWrapper.appendChild(requiredItems);
        wrapper.appendChild(requiredWrapper);

        const timerWrapper = HelperCreation.createDiv("", "hideout-edit-craft-timer-wrapper", "")
        const timer = this.addEditCraftDuration(craft, rewardSelectWrapper);
        timerWrapper.appendChild(timer)
        wrapper.appendChild(timerWrapper);

        wrapper.appendChild(rewardWrapper);

        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-reward-image-top-right");
        wrapper.appendChild(removeImage);

        HideoutEditController.registerRemoveCraft(removeImage, wrapper, craft.station.id, craft.level, rewardWrapper)

        return wrapper
    }

    private static addEditCraftRequiredItem(craft:HideoutCrafts, rewardSelectWrapper:HTMLElement):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "", "");
        for(let i = 0; i < craft.requiredItems.length; i++) {
            if(craft.requiredItems[i].item) {
                const requiredItems = this.createEditCraftRequiredItem(craft, craft.requiredItems[i], rewardSelectWrapper);
                wrapper.appendChild(requiredItems);
            }
        }

        const addButton = this.createAddButton();
        HideoutEditController.registerAddCraftRequiredItem(addButton, wrapper, craft.station.id, craft.level, rewardSelectWrapper)
        wrapper.appendChild(addButton);

        return wrapper;
    }

    private static addEditCraftDuration(craft:HideoutCrafts, rewardSelectWrapper:HTMLElement) {
        const wrapper = HelperCreation.createDiv("", "hideout-edit-craft-duration-wrapper", "");

        const text = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.crafts.edit.duration"))
        wrapper.appendChild(text);

        const hours = Math.floor(craft.duration / 3600);
        const temp = craft.duration % 3600
        const minutes = Math.floor(temp / 60)
        const seconds = Math.floor(temp % 60)

        const inputHoursWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputHoursDescription = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.crafts.edit.hours"))
        inputHoursWrapper.appendChild(inputHoursDescription)
        const inputHours = HelperCreation.createInput("", "", "quest-edit-reward-input");
        inputHours.value = String(hours);
        inputHours.placeholder = "1";
        inputHoursWrapper.appendChild(inputHours);

        wrapper.appendChild(inputHoursWrapper);

        const inputMinutesWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputMinutesDescription = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.crafts.edit.minutes"))
        inputMinutesWrapper.appendChild(inputMinutesDescription)
        const inputMinutes = HelperCreation.createInput("", "", "quest-edit-reward-input");
        inputMinutes.value = String(minutes);
        inputMinutes.placeholder = "20";
        inputMinutesWrapper.appendChild(inputMinutes);

        wrapper.appendChild(inputMinutesWrapper);

        const inputSecondsWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputSecondsDescription = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.crafts.edit.seconds"))
        inputSecondsWrapper.appendChild(inputSecondsDescription)
        const inputSeconds = HelperCreation.createInput("", "", "quest-edit-reward-input");
        inputSeconds.value = String(seconds);
        inputSeconds.placeholder = "30";
        inputSecondsWrapper.appendChild(inputSeconds);

        wrapper.appendChild(inputSecondsWrapper);

        HideoutEditController.changeCraftHours(inputHours, inputMinutes, inputSeconds, craft.station.id, craft.level, rewardSelectWrapper)
        HideoutEditController.changeCraftMinutes(inputMinutes, inputHours, inputSeconds, craft.station.id, craft.level, rewardSelectWrapper)
        HideoutEditController.changeCraftSeconds(inputSeconds, inputHours, inputMinutes, craft.station.id, craft.level, rewardSelectWrapper)

        return wrapper;
    }

    private static addEditCraftRewardItem(craft:HideoutCrafts):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "", "");

        const rewardWrapper = HelperCreation.createDiv("", "hideout-edit-item-reward-wrapper", "");
        for(let i = 0; i < craft.rewardItems.length; i++) {
            if(craft.rewardItems[i].item) {
                const rewardItem = this.createEditCraftRewardItem(craft, craft.rewardItems[i], rewardWrapper);
                rewardWrapper.appendChild(rewardItem);
            }
        }
        wrapper.appendChild(rewardWrapper);

        const addButton = this.createAddButton();
        HideoutEditController.registerAddCraftRewardItem(addButton, rewardWrapper, craft.station.id, craft.level, rewardWrapper)
        wrapper.appendChild(addButton);

        const taskUnlockWrapper = HelperCreation.createDiv("", "hideout-edit-craft-task-unlock-wrapper", "")
        const taskUnlock = this.addEditCraftTaskUnlock(craft, rewardWrapper);
        taskUnlockWrapper.appendChild(taskUnlock);
        wrapper.appendChild(taskUnlockWrapper);

        return wrapper;
    }

    private static addEditCraftTaskUnlock(craft:HideoutCrafts, rewardSelectWrapper:HTMLElement):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "", "");
        const rewardItem = this.createEditCraftTaskUnlockComponent(craft, rewardSelectWrapper);
        wrapper.appendChild(rewardItem);
        return wrapper;
    }

    static createEditCraftRequiredItem(craft:HideoutCrafts, requiredItem: RequiredItems, rewardSelectWrapper:HTMLElement):HTMLElement {
        const container = HelperCreation.createDiv("", "quest-edit-reward-container", "");

        const rewardImageContainer = HelperCreation.createDiv("", "quest-edit-reward-control-wrapper", "")

        const arrowUp = this.createEditQuestRewardMoveUp();
        rewardImageContainer.appendChild(arrowUp);

        const arrowDown = this.createEditQuestRewardMoveDown();
        rewardImageContainer.appendChild(arrowDown);
        
        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-reward-image-top-right");
        rewardImageContainer.appendChild(removeImage);

        container.appendChild(rewardImageContainer);

        const selectorWrapper = HelperCreation.createDiv("", "quest-edit-reward-item-selector-wrapper", "");

        const selectorText = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.hideout.station.level.crafts.edit.item"));
        selectorWrapper.appendChild(selectorText);

        const image = new Image();
        image.classList.add("quest-edit-reward-item-image");
        
        const itemSelector = document.createElement("select");
        itemSelector.classList.add("quest-edit-reward-item-selector");

        let defaulted:boolean = true;
        ItemsElementUtils.getData().items.forEach(item => {
            if((requiredItem.item && item.id === requiredItem.item.id) || (!requiredItem.item.id && defaulted)) {
                defaulted = false;
                itemSelector.appendChild(new Option(item.name, item.id, true, true));
                ImageUtils.loadImage(image, item.imageLink, 1);
            } else {
                itemSelector.appendChild(new Option(item.name, item.id));
            }
        });

        selectorWrapper.appendChild(itemSelector);
        selectorWrapper.appendChild(image);

        const inputWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputDescription = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.crafts.edit.count"))
        inputWrapper.appendChild(inputDescription)
        const input = HelperCreation.createInput("", "", "quest-edit-reward-input");
        input.value = String(requiredItem.count);
        input.placeholder = I18nHelper.get("pages.hideout.station.level.requirements.edit.item.item");
        inputWrapper.appendChild(input);
        
        container.appendChild(selectorWrapper);
        container.appendChild(inputWrapper);

        
        HideoutEditController.moveCraftItemRequiredUp(arrowUp, container, itemSelector, craft.station.id, craft.level, rewardSelectWrapper);
        HideoutEditController.moveCraftItemRequiredDown(arrowDown, container, itemSelector, craft.station.id, craft.level, rewardSelectWrapper);
        HideoutEditController.removeCraftItemRequired(removeImage, container, craft.station.id, craft.level, rewardSelectWrapper, itemSelector);
        HideoutEditController.registerCraftItemRequiredSelector(itemSelector, image, craft.station.id, craft.level, rewardSelectWrapper);
        HideoutEditController.registerCraftItemRequiredCount(input, itemSelector, craft.station.id, craft.level, rewardSelectWrapper);

        return container;
    }

    static createEditCraftRewardItem(craft:HideoutCrafts, rewardItem: RewardItems, rewardSelectWrapper:HTMLElement):HTMLElement {
        const container = HelperCreation.createDiv("", "quest-edit-reward-container", "");

        const rewardImageContainer = HelperCreation.createDiv("", "quest-edit-reward-control-wrapper", "")

        const arrowUp = this.createEditQuestRewardMoveUp();
        rewardImageContainer.appendChild(arrowUp);

        const arrowDown = this.createEditQuestRewardMoveDown();
        rewardImageContainer.appendChild(arrowDown);
        
        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-reward-image-top-right");
        rewardImageContainer.appendChild(removeImage);

        container.appendChild(rewardImageContainer);

        const selectorWrapper = HelperCreation.createDiv("", "quest-edit-reward-item-selector-wrapper", "");

        const selectorText = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.hideout.station.level.crafts.edit.item"));
        selectorWrapper.appendChild(selectorText);

        const image = new Image();
        image.classList.add("quest-edit-reward-item-image");
        
        const itemSelector = document.createElement("select");
        itemSelector.classList.add("quest-edit-reward-item-selector");

        let defaulted:boolean = true;
        ItemsElementUtils.getData().items.forEach(item => {
            if((rewardItem.item && item.id === rewardItem.item.id) || (!rewardItem.item.id && defaulted)) {
                defaulted = false;
                itemSelector.appendChild(new Option(item.name, item.id, true, true));
                ImageUtils.loadImage(image, item.imageLink, 1);
            } else {
                itemSelector.appendChild(new Option(item.name, item.id));
            }
        })
        selectorWrapper.appendChild(itemSelector);
        selectorWrapper.appendChild(image);

        const inputWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputDescription = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.crafts.edit.count"))
        inputWrapper.appendChild(inputDescription)
        const input = HelperCreation.createInput("", "", "quest-edit-reward-input");
        input.value = String(rewardItem.count);
        input.placeholder = "Item";
        inputWrapper.appendChild(input);
        
        container.appendChild(selectorWrapper);
        container.appendChild(inputWrapper);

        
        HideoutEditController.moveCraftItemRewardUp(arrowUp, container, itemSelector, craft.station.id, craft.level, rewardSelectWrapper);
        HideoutEditController.moveCraftItemRewardDown(arrowDown, container, itemSelector, craft.station.id, craft.level, rewardSelectWrapper);
        HideoutEditController.removeCraftItemReward(removeImage, container, craft.station.id, craft.level, rewardSelectWrapper, itemSelector);
        HideoutEditController.registerCraftItemRewardSelector(itemSelector, image, craft.station.id, craft.level, rewardSelectWrapper);
        HideoutEditController.registerCraftItemRewardCount(input, itemSelector, craft.station.id, craft.level, rewardSelectWrapper);


        return container;
    }

    static createEditCraftTaskUnlockComponent(craft:HideoutCrafts, rewardSelectWrapper:HTMLElement):HTMLElement {
        const container = HelperCreation.createDiv("", "quest-edit-reward-container", "");

        const taskUnlockContainer = HelperCreation.createDiv("", "quest-edit-reward-control-wrapper", "")

        container.appendChild(taskUnlockContainer);

        const selectorWrapper = HelperCreation.createDiv("", "quest-edit-reward-item-selector-wrapper", "");

        const selectorText = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.hideout.station.level.crafts.edit.unlock"));
        selectorWrapper.appendChild(selectorText);
        
        const itemSelector = document.createElement("select");
        itemSelector.classList.add("quest-edit-reward-item-selector");

        let defaulted:boolean = true;
        if(!craft.taskUnlock?.id) {
            itemSelector.appendChild(new Option("", "", true, true));
        } else {
            itemSelector.appendChild(new Option("", ""));
        }
        QuestsUtils.getData().tasks.forEach(quest => {
            if(craft.taskUnlock?.id && quest.id === craft.taskUnlock.id && defaulted) {
                defaulted = false;
                itemSelector.appendChild(new Option(quest.locales?.[I18nHelper.currentLocale()] ?? quest.name, quest.id, true, true));
            } else {
                itemSelector.appendChild(new Option(quest.locales?.[I18nHelper.currentLocale()] ?? quest.name, quest.id));
            }
        })
        selectorWrapper.appendChild(itemSelector);

        container.appendChild(selectorWrapper);

        HideoutEditController.registerCraftTaskUnlock(itemSelector, craft.station.id, craft.level, rewardSelectWrapper);

        return container;
    }

    private static createCraftInformation(craft:HideoutCrafts, color:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-craft-information-wrapper", "")
        wrapper.style.backgroundColor = color
        const requiredWrapper = HelperCreation.createDiv("", "hideout-craft-required-wrapper", "");
        for(let i = 0; i < craft.requiredItems.length; i++) {
            if(craft.requiredItems[i].item) {
                requiredWrapper.appendChild(this.createCraftItemContent(craft.requiredItems[i]))
            }
            if(i !== craft.requiredItems.length - 1) {
                const plusSign = HelperCreation.createB("hideout-craft-sign", "+");
                requiredWrapper.appendChild(plusSign);
            }
        }
        wrapper.appendChild(requiredWrapper);

        const timerWrapper = HelperCreation.createDiv("", "hideout-craft-timer-wrapper", "")
        const timer = HelperCreation.createB("hideout-craft-timer", this.formatTime(craft.duration))
        const equalSign = HelperCreation.createB("hideout-craft-sign", "=>");
        timerWrapper.appendChild(timer)
        timerWrapper.appendChild(equalSign);

        wrapper.appendChild(timerWrapper);

        const rewardWrapper = HelperCreation.createDiv("", "hideout-craft-reward-wrapper", "")
        for(let i = 0; i < craft.rewardItems.length; i++) {
            if(craft.rewardItems[i].item) {
                rewardWrapper.appendChild(this.createCraftItemContent(craft.rewardItems[i], craft.taskUnlock ? craft.taskUnlock.id : null))
            }
            if(i !== craft.rewardItems.length - 1) {
                const plusSign = HelperCreation.createB("hideout-craft-sign", "+");
                rewardWrapper.appendChild(plusSign);
            }
        }
        wrapper.appendChild(rewardWrapper);

        if(craft.taskUnlock && craft.taskUnlock.id) {
            if(!PlayerProgressionUtils.isQuestCompleted(craft.taskUnlock.id)) {
                wrapper.style.backgroundColor = "rgb(45, 30, 30);"
            }
        }

        return wrapper
    }

    private static createCraftUnlockContent(questId:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-craft-unlock-wrapper", "");

        const image = new Image();
        image.classList.add("hideout-craft-unlock-image");
        image.src = "../../img/icons/unlock.png"
        wrapper.appendChild(image);

        const quest = QuestsUtils.getQuestFromID(questId);
        if(quest) {
            const text = HelperCreation.createB("hideout-craft-unlock-quest-text", quest.locales?.[I18nHelper.currentLocale()] ?? quest.name)
            wrapper.appendChild(text);
            HideoutBodyController.registerQuestSearch(text, questId);
        }

        return wrapper
    }

    private static formatTime(seconds: number): string {
        const days = Math.floor(seconds / (24 * 3600));
        seconds %= 24 * 3600;
        const hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        
        let text = "";
        text += days !== 0 ? `${days}d` : "";
        text += hours !== 0 ? `${hours}h` : "";
        text += minutes !== 0 ? `${minutes}m` : "";

        return text;
    }

    private static createCraftItemContent(item:RequiredItems|RewardItems, questUnlockId?:string):HTMLElement{
        const wrapper = HelperCreation.createDiv("", "hideout-craft-wrapper", "")

        if(!item || !item.item || !item.item.id) {
            console.log("Required/Reward item is missing the item");
            return;
        }

        if(questUnlockId) {
            wrapper.appendChild(this.createCraftUnlockContent(questUnlockId));
        }

        ItemsElementUtils.getItemInformation(item.item.id).then(itemData => {
            if(!itemData) {
                console.log(`Could not get the item data for item id: ${item.item.id}`);
                return;
            }
            const imageWrapper = HelperCreation.createDiv("", "hideout-craft-image-wrapper", "")
            const image = new Image();
            image.id = item.item.id
            image.classList.add("hideout-craft-image")
                
            const text = HelperCreation.createB("hideout-craft-description", itemData.name)
    
            imageWrapper.appendChild(image);
            const amountText = HelperCreation.createB("hideout-craft-amount", item.count + "x")
            imageWrapper.appendChild(amountText);

            wrapper.appendChild(imageWrapper);
            wrapper.appendChild(text);
            
    
            ImageUtils.loadImage(image, itemData.baseImageLink ? itemData.baseImageLink : LogoPathConst.LOGO_WHITE_BLUE_SIDE, 1);

        }).catch(e => {
            console.log(`Error with fetching hideout item data:${e}`);
        })

        return wrapper
    }

    static createEditTraderRequirement(hideoutLevel:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-edit-reward-wrapper", "");

        const headerText = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.requirements.edit.standing.label"));
        wrapper.appendChild(headerText);

        const template = this.createEditRewardTemplate();
        hideoutLevel.traderRequirements.forEach(standing => {
            const container = this.createEditTraderStandingComponent(hideoutLevel, standing);
            template.appendChild(container);
        })

        const addButton = this.createAddButton();
        HideoutEditController.registerAddTraderRequirement(addButton, template, hideoutLevel.id)
        template.appendChild(addButton);

        wrapper.appendChild(template);

        return wrapper;
    }

    static createEditTraderStandingComponent(hideoutLevel:HideoutLevels, traderRequirement:TraderRequirements):HTMLElement {
        const container = HelperCreation.createDiv("", "quest-edit-reward-container", "");

        const rewardImageContainer = HelperCreation.createDiv("", "quest-edit-reward-control-wrapper", "")

        const arrowUp = this.createEditQuestRewardMoveUp();
        rewardImageContainer.appendChild(arrowUp);

        const arrowDown = this.createEditQuestRewardMoveDown();
        rewardImageContainer.appendChild(arrowDown);
        
        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-reward-image-top-right");
        rewardImageContainer.appendChild(removeImage);

        container.appendChild(rewardImageContainer);

        const traderContainer = HelperCreation.createDiv("", "quest-edit-reward-trader-container", "");

        const image = new Image();
        image.classList.add("quest-edit-reward-item-image")

        const traderDropdown = document.createElement("select");
        traderDropdown.id = "quest-edit-selector";
        traderDropdown.classList.add("centered");
        traderDropdown.classList.add("quest-edit-dropdown");
        for(const trader of TraderList) {
            if(trader.id === traderRequirement.trader.id) {
                traderDropdown.appendChild(new Option(TraderMapper.getLocalizedTraderName(trader.id), trader.id, true, true));
                ImageUtils.loadImage(image,  TraderMapper.getImageFromTraderId(trader.id), 1);
            } else {
                traderDropdown.appendChild(new Option(TraderMapper.getLocalizedTraderName(trader.id), trader.id));
            }
        }
        traderContainer.appendChild(traderDropdown);
        traderContainer.appendChild(image);

        container.appendChild(traderContainer);

        const traderLevelContainer = HelperCreation.createDiv("", "quest-edit-reward-trader-container", "");
        traderLevelContainer.appendChild(HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.requirements.edit.standing.rep")))
        const traderLevelDropdown = document.createElement("select");
        traderLevelDropdown.id = "quest-edit-selector";
        traderLevelDropdown.classList.add("centered");
        traderLevelDropdown.classList.add("quest-edit-dropdown");
        for(let i = 1; i <= 4; i++) {
            if(i === traderRequirement.level) {
                traderLevelDropdown.appendChild(new Option(String(i), String(i), true, true));
            } else {
                traderLevelDropdown.appendChild(new Option(String(i), String(i)));
            }
        }
        traderLevelContainer.appendChild(traderLevelDropdown);

        container.appendChild(traderLevelContainer);

        HideoutEditController.moveTraderRequirementUp(arrowUp, container, hideoutLevel.id, traderDropdown);
        HideoutEditController.moveTraderRequirementDown(arrowDown, container, hideoutLevel.id, traderDropdown);
        HideoutEditController.removeTraderRequirement(removeImage, container, hideoutLevel.id, traderDropdown);
        HideoutEditController.traderRequirementSelector(traderDropdown, hideoutLevel.id, image);
        HideoutEditController.traderRequirementCount(traderLevelDropdown, hideoutLevel.id, traderDropdown);

        return container;
    }

    private static createTraderRequirement(requirement:TraderRequirements):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "item-requirement-wrapper", "");
        const traderName = TraderMapper.getLocalizedTraderName(requirement.trader.id);

        const imageWrapper = HelperCreation.createDiv("", "item-requirement-image-wrapper", "")
        const image = new Image();
        image.classList.add("item-requirement-image")
        const src = TraderMapper.getImageFromTraderId(requirement.trader.id);
        
        const text = HelperCreation.createB("item-requirement-description", traderName)

        imageWrapper.appendChild(image);
        wrapper.appendChild(imageWrapper);
        wrapper.appendChild(text);
        wrapper.appendChild(this.createRequirementLevel(requirement.level))

        ImageUtils.loadImage(image, src, 1);
        return wrapper
    }

    static createEditHideoutStationRequirement(hideoutLevel:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-edit-reward-wrapper", "");

        const headerText = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.requirements.edit.station.label"));
        wrapper.appendChild(headerText);

        const template = this.createEditRewardTemplate();
        hideoutLevel.stationLevelRequirements.forEach(stationRequirement => {
            const container = this.createEditHideoutStationRequirementComponent(hideoutLevel, stationRequirement);
            template.appendChild(container);
        })

        const addButton = this.createAddButton();
        HideoutEditController.registerAddStationRequirement(addButton, template, hideoutLevel.id)
        template.appendChild(addButton);

        wrapper.appendChild(template);

        return wrapper;
    }

    static createEditHideoutStationRequirementComponent(hideoutLevel:HideoutLevels, stationRequirement:StationLevelRequirements):HTMLElement {
        const container = HelperCreation.createDiv("", "quest-edit-reward-container", "");

        const rewardImageContainer = HelperCreation.createDiv("", "quest-edit-reward-control-wrapper", "")

        // const arrowUp = this.createEditQuestRewardMoveUp();
        // rewardImageContainer.appendChild(arrowUp);

        // const arrowDown = this.createEditQuestRewardMoveDown();
        // rewardImageContainer.appendChild(arrowDown);
        
        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-reward-image-top-right");
        rewardImageContainer.appendChild(removeImage);

        container.appendChild(rewardImageContainer);

        const stationContainer = HelperCreation.createDiv("", "quest-edit-reward-trader-container", "");
        const image = new Image();
        image.classList.add("quest-edit-reward-item-image")

        const stationDropdown = document.createElement("select");
        stationDropdown.id = "quest-edit-selector";
        stationDropdown.classList.add("centered");
        stationDropdown.classList.add("quest-edit-dropdown");
        let defaultStation:HideoutStations = null;
        for(const station of HideoutUtils.getData().hideoutStations) {
            if(station.id === stationRequirement.station.id) {
                stationDropdown.appendChild(new Option(station.locales?.[I18nHelper.currentLocale()] ?? station.name, station.id, true, true));
                ImageUtils.loadImage(image, station.imageLink, 1);
                defaultStation = station;
            } else {
                stationDropdown.appendChild(new Option(station.locales?.[I18nHelper.currentLocale()] ?? station.name, station.id));
            }
        }
        stationContainer.appendChild(stationDropdown);
        stationContainer.appendChild(image);
        container.appendChild(stationContainer);

        const levelContainer = HelperCreation.createDiv("", "quest-edit-reward-trader-container", "");
        levelContainer.appendChild(HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.label")))
        const levelDropdown = document.createElement("select");
        levelDropdown.id = "quest-edit-selector";
        levelDropdown.classList.add("centered");
        levelDropdown.classList.add("quest-edit-dropdown");
        for(const stationLevel of defaultStation.levels) {
            if(stationLevel.level === stationRequirement.level) {
                levelDropdown.appendChild(new Option(String(stationLevel.level), String(stationLevel.level), true, true));
            } else {
                levelDropdown.appendChild(new Option(String(stationLevel.level), String(stationLevel.level)));
            }
        }
        levelContainer.appendChild(levelDropdown);

        container.appendChild(levelContainer);

        HideoutEditController.stationRequirementSelector(stationDropdown, levelDropdown, hideoutLevel.id, image);
        HideoutEditController.stationRequirementLevelSelector(levelDropdown, stationDropdown, hideoutLevel.id);
        HideoutEditController.removeStationRequirement(removeImage, container, hideoutLevel.id, stationDropdown)
        return container;
    }

    private static createHideoutStationRequirement(stationRequirement:StationLevelRequirements) {
        if(!stationRequirement.station) {
            console.log(`Station requirement does not contain a station`);
            return;
        }
        const requiredStation = HideoutUtils.getStation(stationRequirement.station.id);
        if(!requiredStation) {
            console.log(`Could not find station with id: ${stationRequirement.station.id}`);
            return;
        }
        const wrapper = HelperCreation.createDiv("", "item-requirement-wrapper", "");

        const imageWrapper = HelperCreation.createDiv("", "item-requirement-image-wrapper", "")
        const image = new Image();
        const hideoutLevel = HideoutUtils.getStationLevelWithNumber(stationRequirement.station.id, stationRequirement.level)
        if(hideoutLevel) {
            image.id = hideoutLevel.id
        } else {
            image.id = stationRequirement.station.id + stationRequirement.level
        }
        
        image.classList.add("item-requirement-image")
            
        const text = HelperCreation.createB("item-requirement-description", requiredStation.locales?.[I18nHelper.currentLocale()] ?? requiredStation.name)

        imageWrapper.appendChild(image);
        wrapper.appendChild(imageWrapper);
        wrapper.appendChild(text);
        wrapper.appendChild(this.createRequirementLevel(stationRequirement.level))

        HideoutBodyController.registerHideoutNavigationClick(hideoutLevel, text);

        ImageUtils.loadImage(image, requiredStation.imageLink, 1);

        return wrapper
    }

    private static createEditRewardTemplate():HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-edit-reward-template-wrapper", "");

        return wrapper
    }

    private static createAddButton():HTMLElement {
        const addWrapper = HelperCreation.createDiv("", "quest-edit-reward-add-wrapper", "");

        const text = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.hideout.station.level.requirements.edit.add"));
        addWrapper.appendChild(text);

        let image = new Image();
        image.src = LogoPathConst.ADD_ICON;
        image.classList.add("add-condition-image");
        addWrapper.appendChild(image);

        return addWrapper;
    }

    private static createEditItemRequirement(hideoutLevel:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "hideout-edit-reward-wrapper", "");

        const headerText = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.requirements.edit.item.label"));
        wrapper.appendChild(headerText);

        const template = this.createEditRewardTemplate();
        hideoutLevel.itemRequirements.forEach(item => {
            const container = this.createEditItem(hideoutLevel, item);
            template.appendChild(container);
        })

        const addButton = this.createAddButton();
        HideoutEditController.registerAddItemReward(addButton, template, hideoutLevel.id);
        template.appendChild(addButton);

        wrapper.appendChild(template);

        return wrapper;
    }


    static createEditItem(level:HideoutLevels, itemRequirement: ItemRequirements):HTMLElement {
        const container = HelperCreation.createDiv("", "quest-edit-reward-container", "");

        const rewardImageContainer = HelperCreation.createDiv("", "quest-edit-reward-control-wrapper", "")

        const arrowUp = this.createEditQuestRewardMoveUp();
        rewardImageContainer.appendChild(arrowUp);

        const arrowDown = this.createEditQuestRewardMoveDown();
        rewardImageContainer.appendChild(arrowDown);
        
        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-reward-image-top-right");
        rewardImageContainer.appendChild(removeImage);

        container.appendChild(rewardImageContainer);

        const selectorWrapper = HelperCreation.createDiv("", "quest-edit-reward-item-selector-wrapper", "");

        const selectorText = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.hideout.station.level.requirements.edit.item.item"));
        selectorWrapper.appendChild(selectorText);

        const image = new Image();
        image.classList.add("quest-edit-reward-item-image");
        
        const itemSelector = document.createElement("select");
        itemSelector.classList.add("quest-edit-reward-item-selector");

        let defaulted:boolean = true;
        ItemsElementUtils.getData().items.forEach(item => {
            if((itemRequirement.item && item.id === itemRequirement.item.id) || (!itemRequirement.item.id && defaulted)) {
                defaulted = false;
                itemSelector.appendChild(new Option(item.name, item.id, true, true));
                ImageUtils.loadImage(image, item.imageLink, 1);
            } else {
                itemSelector.appendChild(new Option(item.name, item.id));
            }
        })
        selectorWrapper.appendChild(itemSelector);
        selectorWrapper.appendChild(image);

        const inputWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputDescription = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.hideout.station.level.requirements.edit.item.count"))
        inputWrapper.appendChild(inputDescription)
        const input = HelperCreation.createInput("", "", "quest-edit-reward-input");
        input.value = String(itemRequirement.quantity);
        input.placeholder = I18nHelper.get("pages.hideout.station.level.requirements.edit.item.item");
        inputWrapper.appendChild(input);
        
        container.appendChild(selectorWrapper);
        container.appendChild(inputWrapper);

        
        HideoutEditController.moveItemRequirementUp(arrowUp, container, level.id, itemSelector);
        HideoutEditController.moveItemRequirementDown(arrowDown, container, level.id, itemSelector);
        HideoutEditController.removeItemRequirement(removeImage, container, level.id, itemSelector);
        HideoutEditController.itemRequirementSelector(itemSelector, level.id, image);
        HideoutEditController.itemRequirementCount(input, level.id, itemSelector);

        return container;
    }

    private static createEditQuestRewardMoveUp() {
        const arrowUp = new Image();
        arrowUp.src = LogoPathConst.ARROW;
        arrowUp.classList.add("move-quest-reward-top-right");
        arrowUp.classList.add("move-quest-reward-up");
        return arrowUp;
    }

    private static createEditQuestRewardMoveDown() {
        const arrowDown = new Image();
        arrowDown.src = LogoPathConst.ARROW;
        arrowDown.classList.add("move-quest-reward-top-right");
        arrowDown.classList.add("move-quest-reward-down");
        return arrowDown;
    }

    private static createRequirementLevel(level:number):HTMLElement {
        return HelperCreation.createB("item-requirement-description-level", `${I18nHelper.get("pages.hideout.station.level.required")} ${level}`)
    }

    private static orderLevels(levels:HideoutLevels[]):HideoutLevels[] {
        return levels.sort((a, b) => a.level.toString().localeCompare(b.level.toString()));
    }

    private static createLevelSection(component:HideoutComponent, level:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv(level.id, "hideout-station-level-wrapper", "");
        
        wrapper.appendChild(this.createLevelTitle(component, level, `${I18nHelper.get("pages.hideout.station.level.label")} ${level.level}`));

        HideoutBodyController.registerStationLevelController(component, level, wrapper);
        // wrapper.appendChild(this.createHideoutStationLevelRequirements(station, level));

        return wrapper
    }

    static createHideoutStationLevelRequirements(component:HideoutComponent, level:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv(level.id, "hideout-station-level-requirements-wrapper", "");
        
        wrapper.appendChild(this.createLevelRequirements(component, level));

        return wrapper
    }

    private static createLevelRequirements(component:HideoutComponent, level:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv(level.id, "hideout-station-level-content-wrapper", "");

        wrapper.appendChild(this.createLevelRequirementsHeader(component, level));

        const crafts = HideoutUtils.getAllCraftsForStationIdWithLevel(component.getStation().id, level.level);
        if(crafts && crafts.length > 0) {
            wrapper.appendChild(this.createCraftsHeader(component, level));
        }

        return wrapper;
    }

    private static createLevelRequirementsHeader(component:HideoutComponent, level:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv(level.id, "hideout-station-level-header-wrapper hideout-requirement-header", "");

        const arrowWrapper = this.createArrow();
        wrapper.appendChild(arrowWrapper)

        const textWrapper = HelperCreation.createDiv("", "hideout-station-level-requirements-header-text-wrapper", "");
        const text = HelperCreation.createB("hideout-content-header-wrapper", I18nHelper.get("pages.hideout.station.level.requirements"))
        textWrapper.appendChild(text)
        wrapper.appendChild(textWrapper)

        HideoutBodyController.registerRequirementsController(component, level, wrapper);

        return wrapper
    }

    static createLevelRequirementsContent(level:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv(level.id, "hideout-station-level-requirements-wrapper", "");

        const contentWrapper = HelperCreation.createDiv("", "hideout-station-level-requirements-content-wrapper", "")
        this.createLevelRequirementsInformation(level, true)
        wrapper.appendChild(contentWrapper)

        return wrapper;
    }

    static createCraftsContent(station:HideoutStations, level:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv(level.id, "hideout-station-level-requirements-wrapper", "");

        const contentWrapper = HelperCreation.createDiv("", "hideout-station-level-requirements-content-wrapper", "")
        this.createLevelCraftsInformation(station, level)
        wrapper.appendChild(contentWrapper)

        return wrapper;
    }

    private static createCraftsHeader(station:HideoutComponent, level:HideoutLevels):HTMLElement {
        const wrapper = HelperCreation.createDiv(level.id, "hideout-station-level-header-wrapper hideout-crafts-header", "");

        const arrowWrapper = this.createArrow();
        wrapper.appendChild(arrowWrapper)

        const textWrapper = HelperCreation.createDiv("", "hideout-station-level-requirements-header-text-wrapper", "");
        const text = HelperCreation.createB("hideout-content-header-wrapper", I18nHelper.get("pages.hideout.station.level.crafts"))
        textWrapper.appendChild(text)
        wrapper.appendChild(textWrapper)
        
        HideoutBodyController.registerCraftsController(station, level, wrapper);

        return wrapper;
    }

    private static createLevelTitle(component:HideoutComponent, level:HideoutLevels, text:string):HTMLElement {
        const wrapper = HelperCreation.createDiv(level.id, "hideout-station-level-header-title-wrapper", "");
        
        const arrowWrapper = this.createArrow();
        wrapper.appendChild(arrowWrapper)

        const textWrapper = HelperCreation.createDiv("", "hideout-station-level-title-wrapper", "");
        const textEl = HelperCreation.createB("hideout-station-level-title", text);
        textWrapper.appendChild(textEl);
        wrapper.appendChild(textWrapper);

        const activeImageButton = HideoutHeaderBuilder.createActiveButton(component, "hideout-station-level-activation", level.id)
        wrapper.appendChild(activeImageButton);

        const completedImageWrapper = HideoutHeaderBuilder.createCompletedButton(component, "hideout-station-level-completed", level.id)
        wrapper.appendChild(completedImageWrapper);

        return wrapper;
    }

    private static createArrow():HTMLElement {
        const arrowWrapper = HelperCreation.createDiv("", "hideout-arrow-wrapper", "");
        let image = new Image();
        image.src = "./img/line-angle-right-icon.png"
        image.classList.add("hideout-arrow");
        arrowWrapper.appendChild(image);
        return arrowWrapper
    }
}