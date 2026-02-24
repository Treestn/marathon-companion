import { TsSelect2 } from "ts-select2/dist/core"
import { ExternalLinkController } from "../../../../../warning/ExternalLinkController"
import { MapAdapter } from "../../../../../adapter/MapAdapter"
import { TraderMapper } from "../../../../../adapter/TraderMapper"
import { LogoPathConst } from "../../../../constant/ImageConst"
import { PageConst } from "../../../../constant/PageConst"
import { ObjectiveTypeConst, ObjectiveTypeList, QuestConditionConst, QuestConditionList } from "../../../../constant/EditQuestConst"
import { ImageCyclingController } from "../../../../controller/ImageCyclingController"
import { Item, NeededKeys, Object, Objectives, Quest, SkillReward, TaskObject, TraderStanding, TraderUnlock, WeaponBuilder } from "../../../../../model/quest/IQuestsElements"
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation"
import { UuidGenerator } from "../../../../service/helper/UuidGenerator"
import { AppConfigUtils } from "../../../../utils/AppConfigUtils"
import { ItemsElementUtils } from "../../../../utils/ItemsElementUtils"
import { PlayerProgressionUtils } from "../../../../utils/PlayerProgressionUtils"
import { WeaponImageUtils } from "../../../../utils/WeaponImageUtils"
import { ItemBuilder } from "../../../items/builder/helper/ItemBuilder"
import { ItemsBodyUtils } from "../../../items/utils/ItemsBodyUtils"
import { ImageUtils } from "../../../map/utils/ImageUtils"
import { QuestBodyController } from "../../controller/QuestBodyController"
import { QuestEditController } from "../../controller/QuestEditController"
import { QuestHeaderController } from "../../controller/QuestHeaderController"
import { QuestImageController } from "../../controller/QuestImageController"
import { QuestSearchController } from "../../controller/QuestSearchController"
import { QuestsFiltersUtils } from "../../utils/QuestsFiltersUtils"
import { QuestsUtils } from "../../utils/QuestsUtils"
import { QuestHeaderBuilder } from "./QuestHeaderBuilder"
import { MapsExtendedList } from "../../../../constant/MapsConst"
import { TraderList } from "../../../../constant/TraderConst"
import { EditSession } from "../../edit/EditSession"
import { HideoutUtils } from "../../../hideout/utils/HideoutUtils"
import { HideoutCrafts } from "../../../../../model/HideoutObject"
import { ProgressionTypesList } from "../../../../constant/ProgressionConst"
import { FactionList } from "../../../../constant/FactionConst"
import { GameEditionList } from "../../../../constant/GameEditionConst"
import { I18nHelper } from "../../../../../locale/I18nHelper"
import { rarityToColor } from "../../../../utils/RarityColorUtils"

export class QuestBodyBuilder {

    static addQuestEntity(wrapper: HTMLElement, quest: Quest):HTMLElement {
        let questEntityDiv = HelperCreation.createDiv(quest.id.toString(), "quest-entity", "")

        QuestHeaderBuilder.createQuestHeader(questEntityDiv, quest)

        wrapper.appendChild(questEntityDiv)

        return questEntityDiv
    }

    static updateQuestCheckmark(wrapper: HTMLElement, quest:Quest) {
        let questsButtons = wrapper.getElementsByClassName('quest-selector-container')
        if(questsButtons.length > 0) {
            for(let i = 0; i < questsButtons.length; i++){
                QuestHeaderController.createQuestCheckmarkEventListener((questsButtons[i] as HTMLElement), quest)
                if(PlayerProgressionUtils.isQuestActive(quest.id)) {
                    const questButton = questsButtons[i].getElementsByClassName('quest-selector')[0] as HTMLInputElement
                    questButton.checked = true;
                    
                }
            }
        }
    }

    static updateQuestBodyEntity(create:boolean, quest:Quest) {
        if(create) {
            let questEntityDiv = document.getElementById(quest.id)
            let questRequirement = this.createQuestDropdownContainer(quest)
            questEntityDiv.appendChild(questRequirement)
            if(EditSession.isSessionOpen()) {
                this.updateSelect2();
            }
        }
    }

    static updateSelect2() {
        const list = document.getElementsByClassName("quest-edit-unlock-selection");
        for(const select of list) {
            if(select instanceof HTMLSelectElement) {
                const select2 = new TsSelect2(select, {
                    width: `250px`, 
                    multiple: false,
                })
            }
        }
        
        const list2 = document.getElementsByClassName("quest-edit-objective-item-selector");
        for(const select of list2) {
            if(select instanceof HTMLSelectElement) {
                const select2 = new TsSelect2(select, { 
                    width: `70%`, 
                    multiple: false,
                })
            }
        }

        const list3 = document.getElementsByClassName("quest-edit-reward-item-selector");
        for(const select of list3) {
            if(select instanceof HTMLSelectElement) {
                const select2 = new TsSelect2(select, { 
                    width: `70%`, 
                    multiple: false,
                })
            }
        }

        const list4 = document.getElementsByClassName("quest-edit-needed-keys-selector");
        for(const select of list4) {
            if(select instanceof HTMLSelectElement) {
                const select2 = new TsSelect2(select, { 
                    width: `70%`, 
                    multiple: false,
                })
            }
        }
    }

    static removeQuestBodyFromPage(id: string) {
        const body = document.getElementById(id);
        if(body) {
            const dropdownContainer = body.getElementsByClassName("quest-dropdown-container")
            if(dropdownContainer.length > 0) {
                for(let container of dropdownContainer) {
                    container.remove()
                }
            }
        }
    }

    static createQuestDropdownContainer(quest: Quest): HTMLElement {
        if(EditSession.isSessionOpen()) {
            QuestEditController.addQuest(quest);
        }
        let questDropdownContainerDiv = HelperCreation.createDiv("", "quest-dropdown-container", "")
        let questDropdownResizeDiv = HelperCreation.createDiv("", "quest-dropdown-resized", "");
        questDropdownContainerDiv.appendChild(questDropdownResizeDiv)

        //** Requirements **//
        let dropdownRequirementDiv = this.createDropdownRequirement(quest)
        questDropdownResizeDiv.appendChild(dropdownRequirementDiv)

        //** Items Needed **/
        if(!EditSession.isSessionOpen()) {
            const itemsNeeded = QuestsUtils.getRequiredItemsAmountForQuest(quest);
            if(itemsNeeded && itemsNeeded.size > 0) {
                questDropdownResizeDiv.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.itemsNeeded.label")))
                let dropdownItemsDiv = this.createItemsNeeded(itemsNeeded, quest.id);
                questDropdownResizeDiv.appendChild(dropdownItemsDiv)
            }
        }

        //** Quest Task **//
        questDropdownResizeDiv.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.tasks.label")))
        let questGoalsDiv = HelperCreation.createDiv("", "quest-goal-container", "")
        quest.objectives.forEach(objective => {
            const questGoalDiv = this.createQuestGoalDiv(quest, objective);
            questGoalsDiv.appendChild(questGoalDiv);
        })
        questDropdownResizeDiv.appendChild(questGoalsDiv);
        if(EditSession.isSessionOpen()) {
            const addObjective = this.createEditAddObjective();
            QuestEditController.addObjective(addObjective, questGoalsDiv, quest);
            questGoalsDiv.appendChild(addObjective);
        }

        //** Completed weapon **/
        if(quest.name.toLocaleLowerCase().includes("gunsmith") && !quest.objectives[0]?.weaponBuilder) {
            questDropdownResizeDiv.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.weapon.label")))
            let questImageDiv = HelperCreation.createDiv("", "main-quest-image-container", "")
            let baseGunPath = WeaponImageUtils.getBaseWeaponImage(quest.id);
            if(baseGunPath != null && baseGunPath != undefined && baseGunPath.length != 0) {

                questImageDiv.appendChild(this.createQuestImagesDiv(
                    UuidGenerator.generate(),
                    baseGunPath, 
                    "Base Gun",
                    quest)
                );
            }

            let moddingPath = WeaponImageUtils.getModdingViewImage(quest.id);
            if(moddingPath != null && moddingPath != undefined && moddingPath.length != 0) {
                questImageDiv.appendChild(this.createQuestImagesDiv(
                    UuidGenerator.generate(),
                    moddingPath, 
                    "Modding view",
                    quest)
                );
            }

            let inspectPath = WeaponImageUtils.getInspectViewImage(quest.id);
            if(inspectPath != null && inspectPath != undefined && inspectPath.length != 0) {
                questImageDiv.appendChild(this.createQuestImagesDiv(
                    UuidGenerator.generate(),
                    inspectPath, 
                    "Inspect view",
                    quest)
                );
            }

            questDropdownResizeDiv.appendChild(questImageDiv);
        }


        // ** Quest Locations/Gunsmith parts**//
        if((quest.objectives != null || quest.objectives != undefined) && !quest.objectives[0]?.weaponBuilder) {
            if(quest.name.toLocaleLowerCase().includes("gunsmith")) {
                questDropdownResizeDiv.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.weapon.parts.label")))
                let questImageContainer = HelperCreation.createDiv("", "quest-weapon-parts-image-container", "")
                quest.objectives[0].containsAll.forEach(weaponPart => {
                    let questImageDiv = HelperCreation.createDiv("", "quest-image-container", "")
                    // var srcList:string[] = []
                    // weaponPart.forEach(part => {srcList.push(part)});
                    let childElement = this.createQuestImageDiv("", LogoPathConst.LOGO_WHITE_256_BLUE_SIDE, "", quest);

                    ItemsElementUtils.getItemInformation(weaponPart.id).then(itemData => {
                        (childElement.getElementsByClassName("quest-img-description")[0] as HTMLElement).textContent = itemData.name;
                        const ttl = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 12)) // Cached for 12 hours
                        this.addImage((childElement.getElementsByClassName("quest-image")[0] as HTMLImageElement), itemData.baseImageLink, ttl);
                    })
                    // let childElement = this.createQuestImageDiv("", ItemsElement.getInstance().getImagePath(weaponPart.parts[0]), "");
                    questImageDiv.appendChild(childElement);

                    (childElement.getElementsByClassName("quest-image")[0] as HTMLImageElement).style.backgroundColor = "var(--main-btn-inactive-color2)";
                    (childElement.getElementsByClassName("quest-image")[0] as HTMLImageElement).style.borderRadius = "5px";
                    questImageContainer.appendChild(questImageDiv);
                })

                questDropdownResizeDiv.appendChild(questImageContainer)
            } else {
                // if(!EditSession.isSessionOpen() && quest.objectives.filter(obj => obj.questImages != undefined).length != 0) {
                //     questDropdownResizeDiv.appendChild(this.createSolidLineWithTitle("Locations"));
                //     let questImageDiv = HelperCreation.createDiv("", "quest-image-locations-container", "");
                //     questDropdownResizeDiv.appendChild(questImageDiv);
                //     quest.objectives.forEach(obj => {
                //         if(obj.questImages != undefined) {
                //             obj.questImages.forEach(img => {
                //                 if(img.paths != undefined) {
                //                     questImageDiv.appendChild(this.createQuestImagesDiv(img.id, img.paths, img.description ? img.description : "", quest, img.id));
                //                 } 
                //             })
                //         }
                //     })
                // }
            }
        }

        //** Quest Rewards **//
        questDropdownResizeDiv.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.rewards.label"))) 
        let questRewardDiv = this.createQuestReward(quest);
        questDropdownResizeDiv.appendChild(questRewardDiv)

        //** Miscellaneous **//
        let miscellaneous = HelperCreation.createDiv("", "quest-miscellaneous-container", "")

        // const penalties = this.createPenaltiesDiv(quest);
        // miscellaneous.appendChild(penalties)

        // if(!EditSession.isSessionOpen()) {
        //     const wiki = this.createWikiLink(quest.wikiLink);
        //     miscellaneous.appendChild(wiki);
        // }

        // const kappa = this.createKappaRequired(quest);
        // miscellaneous.appendChild(kappa)

        questDropdownResizeDiv.appendChild(miscellaneous)

        return questDropdownContainerDiv
    }

    private static createQuestReward(quest:Quest) {
        let questRewardDiv = HelperCreation.createDiv("", "quest-item-container", "") 
        let questRewardCenteredDiv = HelperCreation.createDiv("", "quest-item-center", "")
      
        if(EditSession.isSessionOpen()) {
            const exp = this.createEditExp(quest);
            const skills = this.createEditSkills(quest);
            const traderStanding = this.createEditTraderStanding(quest);
            const itemReward = this.createEditItemReward(quest);
            const itemUnlock = this.createEditItemUnlock(quest);

            questRewardCenteredDiv.appendChild(exp);
            questRewardCenteredDiv.appendChild(skills);
            questRewardCenteredDiv.appendChild(traderStanding);
            questRewardCenteredDiv.appendChild(itemReward);
            questRewardCenteredDiv.appendChild(itemUnlock);
        } else {
            const exp = this.createQuestItemTextDiv("+" + quest.experience.toString(), I18nHelper.get("pages.quests.quest.body.rewards.exp"));
            questRewardCenteredDiv.appendChild(exp)
            this.createSkillsReward(quest, questRewardCenteredDiv);
            this.createTraderStanding(quest, questRewardCenteredDiv);
            this.createQuestRewardItem(quest, questRewardCenteredDiv);
            this.createOfferUnlock(quest, questRewardCenteredDiv);
            this.createHideoutUnlock(quest, questRewardCenteredDiv);
        }

        questRewardDiv.appendChild(questRewardCenteredDiv)

        return questRewardDiv;
    }

    private static createEditExp(quest:Quest):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "quest-edit-reward-wrapper", "");

        const text = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.exp"));
        wrapper.appendChild(text);

        const exp = HelperCreation.createInput("", "", "quest-edit-reward-input");
        exp.value = String(quest.experience);
        exp.placeholder = String(quest.experience);
        wrapper.appendChild(exp)

        QuestEditController.registerExperience(exp, quest.id, quest.experience);

        return wrapper;
    }

    static createEditSkills(quest:Quest):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "quest-edit-reward-wrapper", "");

        const headerText = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.skills.label"));
        wrapper.appendChild(headerText);

        const template = this.createEditRewardTemplate();
        quest.finishRewards.skillLevelReward.forEach(skills => {
            const container = this.createEditSkillsComponent(quest, skills);
            template.appendChild(container);
        })

        const addButton = this.createAddButton();
        QuestEditController.registerAddSkill(addButton, template, quest)
        template.appendChild(addButton);

        wrapper.appendChild(template);

        return wrapper;
    }

    static createEditTraderStanding(quest:Quest):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "quest-edit-reward-wrapper", "");

        const headerText = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.standing.label"));
        wrapper.appendChild(headerText);

        const template = this.createEditRewardTemplate();
        quest.finishRewards.traderStanding.forEach(standing => {
            const container = this.createEditTraderStandingComponent(quest, standing);
            template.appendChild(container);
        })

        const addButton = this.createAddButton();
        QuestEditController.registerAddTraderStanding(addButton, template, quest)
        template.appendChild(addButton);

        wrapper.appendChild(template);

        return wrapper;
    }

    static createEditSkillsComponent(quest:Quest, skills:SkillReward):HTMLElement {
        const container = HelperCreation.createDiv("", "quest-edit-reward-container", "");

        const rewardImageContainer = HelperCreation.createDiv("", "quest-edit-reward-control-wrapper", "")
        
        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-reward-image-top-right");
        rewardImageContainer.appendChild(removeImage);

        container.appendChild(rewardImageContainer);

        const inputSkillBonusWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputSkillBonusDescription = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.skills.bonus"))
        inputSkillBonusWrapper.appendChild(inputSkillBonusDescription)
        const inputSkillBonus = HelperCreation.createInput("", "", "quest-edit-reward-input");
        inputSkillBonus.value = String(skills.level)
        inputSkillBonus.placeholder = "0"
        inputSkillBonusWrapper.appendChild(inputSkillBonus);
        container.appendChild(inputSkillBonusWrapper);

        const inputSkillWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputSkillDescription = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.skills.skill"))
        inputSkillWrapper.appendChild(inputSkillDescription)
        const inputSkill = HelperCreation.createInput("", "", "quest-edit-reward-input");
        inputSkill.value = String(skills.name)
        inputSkill.placeholder = "Skill Name"
        inputSkillWrapper.appendChild(inputSkill);
        container.appendChild(inputSkillWrapper);

        QuestEditController.registerChangeSkillBonus(inputSkillBonus, quest, inputSkill);
        QuestEditController.registerChangeSkillName(inputSkill, quest)
        QuestEditController.registerRemoveSkill(removeImage, container, quest, inputSkill);

        return container;
    }

    static createEditTraderStandingComponent(quest:Quest, standing:TraderStanding):HTMLElement {
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
            if(trader.id === standing.trader.id) {
                traderDropdown.appendChild(new Option(TraderMapper.getLocalizedTraderName(trader.id), trader.id, true, true));
                ImageUtils.loadImage(image,  TraderMapper.getImageFromTraderId(trader.id), 1);
            } else {
                traderDropdown.appendChild(new Option(TraderMapper.getLocalizedTraderName(trader.id), trader.id));
            }
        }
        traderContainer.appendChild(traderDropdown);
        traderContainer.appendChild(image);

        container.appendChild(traderContainer);

        const inputWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputDescription = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.standing.count"))
        inputWrapper.appendChild(inputDescription)
        const input = HelperCreation.createInput("", "", "quest-edit-reward-input");
        input.value = String(standing.standing)
        input.placeholder = "Trader Standing"
        inputWrapper.appendChild(input);
        container.appendChild(inputWrapper);

        QuestEditController.moveTraderStandingUp(arrowUp, container, quest.id, traderDropdown);
        QuestEditController.moveTraderStandingDown(arrowDown, container, quest.id, traderDropdown);
        QuestEditController.removeTraderStanding(removeImage, container, quest.id, traderDropdown);
        QuestEditController.traderStandingSelector(traderDropdown, quest.id, image);
        QuestEditController.traderStandingCount(input, quest.id, traderDropdown);

        return container;
    }

    private static createEditItemReward(quest:Quest):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "quest-edit-reward-wrapper", "");

        const headerText = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.item.label"));
        wrapper.appendChild(headerText);

        const template = this.createEditRewardTemplate();
        quest.finishRewards.items.forEach(item => {
            const container = this.createEditItemRewardComponent(quest, item);
            template.appendChild(container);
        })

        const addButton = this.createAddButton();
        QuestEditController.registerAddItemReward(addButton, template, quest);
        template.appendChild(addButton);

        wrapper.appendChild(template);

        return wrapper;
    }

    static createEditItemRewardComponent(quest:Quest, item:Item):HTMLElement {
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

        const selectorText = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.item.item"));
        selectorWrapper.appendChild(selectorText);

        const image = new Image();
        image.classList.add("quest-edit-reward-item-image");
        
        const itemSelector = document.createElement("select");
        itemSelector.classList.add("quest-edit-reward-item-selector");

        let defaulted:boolean = true;
        ItemsElementUtils.getData().items.forEach(itemObj => {
            if((item.item && itemObj.id === item.item.id) || (!item.item && defaulted)) {
                defaulted = false;
                itemSelector.appendChild(new Option(itemObj.name, itemObj.id, true, true));
                ImageUtils.loadImage(image, itemObj.imageLink, 1);
            } else {
                itemSelector.appendChild(new Option(itemObj.name, itemObj.id));
            }
        })
        selectorWrapper.appendChild(itemSelector);
        selectorWrapper.appendChild(image);

        const inputWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputDescription = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.item.count"))
        inputWrapper.appendChild(inputDescription)
        const input = HelperCreation.createInput("", "", "quest-edit-reward-input");
        input.value = String(item.count);
        input.placeholder = "Item";
        inputWrapper.appendChild(input);
        
        container.appendChild(selectorWrapper);
        container.appendChild(inputWrapper);

        
        QuestEditController.moveItemRewardUp(arrowUp, container, quest.id, itemSelector);
        QuestEditController.moveItemRewardDown(arrowDown, container, quest.id, itemSelector);
        QuestEditController.removeItemReward(removeImage, container, quest.id, itemSelector);
        QuestEditController.itemRewardSelector(itemSelector, quest.id, image);
        QuestEditController.itemRewardCount(input, quest.id, itemSelector);

        return container;
    }

    private static createEditItemUnlock(quest:Quest):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "quest-edit-reward-wrapper", "");

        const headerText = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.unlock.label"));
        wrapper.appendChild(headerText);

        const template = this.createEditRewardTemplate();
        quest.finishRewards.offerUnlock.forEach(item => {
            const container = this.createEditItemUnlockComponent(quest, item);
            template.appendChild(container);
        })
        
        const addButton = this.createAddButton();
        QuestEditController.registerAddItemUnlock(addButton, template, quest);
        template.appendChild(addButton);

        wrapper.appendChild(template);


        return wrapper;
    }

    static createEditItemUnlockComponent(quest:Quest, item:TraderUnlock):HTMLElement {
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

        const selectorText = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.unlock.item"));
        selectorWrapper.appendChild(selectorText);

        const image = new Image();
        image.classList.add("quest-edit-reward-item-image");

        const itemSelector = document.createElement("select");
        itemSelector.classList.add("quest-edit-reward-item-selector");

        let defaulted:boolean = true;
        ItemsElementUtils.getData().items.forEach(itemObj => {
            if((item.item && itemObj.id === item.item.id) || (!item.item && defaulted)) {
                defaulted = false;
                itemSelector.appendChild(new Option(itemObj.name, itemObj.id, true, true));
                ImageUtils.loadImage(image, itemObj.imageLink, 1);
            } else {
                itemSelector.appendChild(new Option(itemObj.name, itemObj.id));
            }
        })
        selectorWrapper.appendChild(itemSelector);
        selectorWrapper.appendChild(image);
        container.appendChild(selectorWrapper);


        const traderContainer = HelperCreation.createDiv("", "quest-edit-reward-trader-container", "");

        const traderImage = new Image();
        traderImage.classList.add("quest-edit-reward-item-image")

        const traderDropdown = document.createElement("select");
        traderDropdown.id = "quest-edit-selector";
        traderDropdown.classList.add("centered");
        traderDropdown.classList.add("quest-edit-dropdown");
        for(const trader of TraderList) {
            if(trader.id === item.trader.id) {
                traderDropdown.appendChild(new Option(TraderMapper.getLocalizedTraderName(trader.id), trader.id, true, true));
                ImageUtils.loadImage(traderImage, TraderMapper.getImageFromTraderId(trader.id), 1);
            } else {
                traderDropdown.appendChild(new Option(TraderMapper.getLocalizedTraderName(trader.id), trader.id));
            }
        }
        traderContainer.appendChild(traderDropdown);
        traderContainer.appendChild(traderImage);

        container.appendChild(traderContainer);

        const inputWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputDescription = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.unlock.rep"))
        inputWrapper.appendChild(inputDescription)
        const input = HelperCreation.createInput("", "", "quest-edit-reward-input");
        input.value = String(item.level)
        input.placeholder = "Trader Rep"
        inputWrapper.appendChild(input);
        container.appendChild(inputWrapper);
        

        QuestEditController.moveItemUnlockUp(arrowUp, container, quest.id, itemSelector);
        QuestEditController.moveItemUnlockDown(arrowDown, container, quest.id, itemSelector);
        QuestEditController.changeItemUnlockTrader(traderDropdown, quest.id, traderImage, itemSelector);
        QuestEditController.changeItemUnlockTraderLevel(input, quest.id, itemSelector);
        QuestEditController.removeItemUnlock(removeImage, container, quest.id, itemSelector);
        QuestEditController.itemUnlockSelector(itemSelector, quest.id, image);

        return container;
    }

    private static createEditRewardTemplate():HTMLElement {
        const wrapper = HelperCreation.createDiv("", "quest-edit-reward-template-wrapper", "");

        return wrapper
    }

    private static createEditWeaponBuilderPartsTemplate():HTMLElement {
        const wrapper = HelperCreation.createDiv("", "quest-edit-weapon-builder-parts-template-wrapper", "");

        return wrapper
    }


    private static createAddButton():HTMLElement {
        const addWrapper = HelperCreation.createDiv("", "quest-edit-reward-add-wrapper", "");

        const text = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.quests.quest.body.rewards.edit.add"));
        addWrapper.appendChild(text);

        let image = new Image();
        image.src = LogoPathConst.ADD_ICON;
        image.classList.add("add-condition-image");
        addWrapper.appendChild(image);

        return addWrapper;
    }

    private static createSkillsReward(quest:Quest, questRewardCenteredDiv:HTMLElement) {
        quest.finishRewards.skillLevelReward.forEach(skillReward => {
            const reward = this.createQuestItemTextDiv("+" + skillReward.level, I18nHelper.get("pages.quests.quest.body.rewards.skill"));
            const span = HelperCreation.createP("", skillReward.name);
            span.style.fontSize = "20px";
            span.style.margin = "0px";
            reward.getElementsByClassName("quest-item-text")[0].appendChild(span);
            reward.style.fontSize = "20px";
            questRewardCenteredDiv.appendChild(reward);
        })
    }

    private static createTraderStanding(quest:Quest, questRewardCenteredDiv:HTMLElement) {
        quest.finishRewards.traderStanding.forEach(trader => {
            let repModifier:string = trader.standing > 0 ? "+" : "";
            let repColor:string = trader.standing > 0 ? "green" : "red";
            questRewardCenteredDiv.appendChild(this.createQuestItemRepDiv(repModifier + trader.standing.toString(), repColor, 
                trader.trader.id, "Rep"))
        })
    }

    private static createQuestRewardItem(quest:Quest, questRewardCenteredDiv:HTMLElement) {
        quest.finishRewards.items.forEach(item => {
            let questDiv = this.createQuestItemDiv(item.item.id, LogoPathConst.LOGO_WHITE_256_BLUE_SIDE, " ", false, "")
            ItemsElementUtils.getItemInformation(item.item.id).then(itemData => {
                (questDiv.getElementsByClassName("quest-item-description")[0] as HTMLElement).textContent = itemData.name;
                (questDiv.getElementsByClassName("item-count")[0] as HTMLElement).textContent = item.count.toString() + "x";
                let img:HTMLImageElement = questDiv.getElementsByClassName("quest-item-img")[0] as HTMLImageElement;
                if(itemData.baseImageLink != null && itemData.baseImageLink.length > 0) {
                    this.addImage(img, itemData.baseImageLink, 1);
                }
            })
            questRewardCenteredDiv.appendChild(questDiv)
        })
    }

    private static createOfferUnlock(quest:Quest, questRewardCenteredDiv:HTMLElement) {
        quest.finishRewards.offerUnlock.forEach(traderUnlock => {
            let questDiv = this.createQuestItemDiv(traderUnlock.item.id, LogoPathConst.LOGO_WHITE_256_BLUE_SIDE, " ", true, "", false, null, traderUnlock)
            ItemsElementUtils.getItemInformation(traderUnlock.item.id).then(item => {
                (questDiv.getElementsByClassName("quest-item-description")[0] as HTMLElement).textContent = item.name;
                const img:HTMLImageElement = questDiv.getElementsByClassName("quest-item-img")[0] as HTMLImageElement;
                if(item.baseImageLink != null && item.baseImageLink.length > 0) {
                    this.addImage(img, item.baseImageLink, 1);
                }
            })
            questRewardCenteredDiv.appendChild(questDiv)
        })
    }

    private static createHideoutUnlock(quest:Quest, questRewardCenteredDiv:HTMLElement) {
        const crafts = HideoutUtils.getCraftsUnlockFromQuest(quest.id);
        if(crafts.length > 0) {
            for(const craft of crafts) {
                const itemId = craft.rewardItems[0]?.item?.id
                if(itemId) {
                    let questDiv = this.createQuestItemDiv(itemId, LogoPathConst.LOGO_WHITE_256_BLUE_SIDE, " ", false, "", true, craft)
                    ItemsElementUtils.getItemInformation(itemId).then(item => {
                        (questDiv.getElementsByClassName("quest-item-description")[0] as HTMLElement).textContent = item.name;
                        const img:HTMLImageElement = questDiv.getElementsByClassName("quest-item-img")[0] as HTMLImageElement;
                        if(item.baseImageLink != null && item.baseImageLink.length > 0) {
                            this.addImage(img, item.baseImageLink, 1);
                        }
                    })
                    questRewardCenteredDiv.appendChild(questDiv)
                }
            }
        }
    }

    private static createPenaltiesDiv(quest:Quest):HTMLElement {
        let container:HTMLElement = HelperCreation.createDiv("", "penalties-container", "")
        container.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.penalties.label")));
        
        
        if(EditSession.isSessionOpen()) {
            const penalties = this.createEditPenalties(quest);
            container.appendChild(penalties);
        } else {
            if(quest.failureOutcome != undefined) {
                quest.failureOutcome.traderStanding.forEach(outcome => {
                    container.appendChild(this.createQuestItemRepDiv(outcome.standing.toString(), "red", 
                        outcome.trader.id, I18nHelper.get("pages.quests.quest.body.penalties.rep")))
                })
            }
        }

        return container
    }

    private static createEditPenalties(quest:Quest) {
        const wrapper = HelperCreation.createDiv("", "quest-edit-reward-wrapper", "");

        const headerText = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.quests.quest.body.penalties.label"));
        wrapper.appendChild(headerText);

        const template = this.createEditRewardTemplate();
        quest.failureOutcome.traderStanding.forEach(penalty => {
            const container = this.createEditPenaltyComponent(quest, penalty);
            template.appendChild(container);
        })

        const addButton = this.createAddButton();
        QuestEditController.registerAddTraderPenalty(addButton, template, quest);
        template.appendChild(addButton);

        wrapper.appendChild(template);

        return wrapper;
    }

    static createEditPenaltyComponent(quest:Quest, penalty:TraderStanding):HTMLElement {
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
            if(trader.id === penalty.trader.id) {
                traderDropdown.appendChild(new Option(trader.name, trader.id, true, true));
                ImageUtils.loadImage(image, TraderMapper.getImageFromTraderId(trader.id), 1);
            } else {
                traderDropdown.appendChild(new Option(trader.name, trader.id));
            }
        }
        traderContainer.appendChild(traderDropdown);
        traderContainer.appendChild(image);

        container.appendChild(traderContainer);

        const inputWrapper = HelperCreation.createDiv("", "quest-edit-reward-input-wrapper", "");
        const inputDescription = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.quests.quest.body.penalties.edit.count"))
        inputWrapper.appendChild(inputDescription)
        const input = HelperCreation.createInput("", "", "quest-edit-reward-input");
        input.value = String(penalty.standing)
        input.placeholder = "Trader Penalty"
        inputWrapper.appendChild(input);
        container.appendChild(inputWrapper);

        QuestEditController.moveTraderPenaltyUp(arrowUp, container, quest.id, traderDropdown);
        QuestEditController.moveTraderPenaltyDown(arrowDown, container, quest.id, traderDropdown);
        QuestEditController.removeTraderPenalty(removeImage, container, quest.id, traderDropdown);
        QuestEditController.traderPenaltySelector(traderDropdown, quest.id, image);
        QuestEditController.traderPenaltyCount(input, quest.id, traderDropdown);

        return container;
    }

    private static createWikiLink(wikiLink:string) {
        let container:HTMLElement = HelperCreation.createDiv("", "wiki-container", "")
        container.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.wiki.label")));

        var link = HelperCreation.createA("quest-item-description quest-dropdown-text wiki-link", I18nHelper.get("pages.quests.quest.body.wiki.link"))
        ExternalLinkController.openExternalLinkEventListener(container, wikiLink);
        // link.setAttribute("href", wikiLink)
        container.appendChild(link)

        return container
    }

    private static createEditKappa(quest:Quest):HTMLElement {
        const label = HelperCreation.createLabel("", "quest-edit-filter-label");
        const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
        input.value = "Required for Kappa";
        input.checked = quest.kappaRequired

        label.appendChild(input);
        label.appendChild(document.createTextNode("Required for Kappa"))

        QuestEditController.registerKappa(input, quest.id);

        return label
    }

    private static createKappaRequired(quest:Quest):HTMLElement {
        let container:HTMLElement = HelperCreation.createDiv("", "kappa-container", "")
        container.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.kappa.label")));

        if(EditSession.isSessionOpen()) {
            const kappa = this.createEditKappa(quest);
            container.appendChild(kappa);
        } else {
            container.appendChild(HelperCreation.createB("quest-item-description quest-dropdown-text", quest.kappaRequired ? I18nHelper.get("pages.quests.quest.body.kappa.yes") : I18nHelper.get("pages.quests.quest.body.kappa.no")));
        }

        return container
    }

    private static createQuestImagesDiv(uuid:string, srcList:string[], text:string, quest:Quest, iconId?:string, addGlow?:boolean):HTMLElement {
        let questImageDiv = HelperCreation.createDiv("", "quest-image-location-div", "")
        let questImageContainer = HelperCreation.createDiv("", "quest-image-location-container", "")
        if(!addGlow) {
            questImageContainer.style.filter = "drop-shadow(0 0 0.25rem #b1b1b1b1)";
        }
        let questImage = HelperCreation.createImage(uuid, "quest-image-location", LogoPathConst.LOADING_GIF, "");
        this.loadImage(questImage, srcList[0], Math.floor(new Date().getTime() / (1000 * 60 * 60 * 48)));// Cached for 48 hours
        questImageContainer.appendChild(questImage)
        if(srcList.length > 1) {
            ImageCyclingController.addImageCyclingEventListener(srcList, questImage as HTMLImageElement, questImageContainer, false)
            QuestImageController.createQuestImageCyclingEventListener(srcList, questImage);
        } else {
            QuestImageController.createQuestImageEventListener(questImage);
        }
        if(PlayerProgressionUtils.isQuestObjectiveCompletedByIconId(quest, iconId)) {
            questImageContainer.classList.add("quest-image-location-container-completed")
        }

        let questImageDescriptionDiv = HelperCreation.createDiv("", "quest-img-description-div", "")
        let questImageDescriptionB = HelperCreation.createB("quest-img-description quest-dropdown-text", text)
        questImageDescriptionDiv.appendChild(questImageDescriptionB)
        if(iconId) {
            let findOnMapContainer = HelperCreation.createDiv(uuid, "quest-image-find-on-map-container", "")
            let findOnMapText = HelperCreation.createB("quest-image-find-on-map-text", I18nHelper.get("pages.quests.quest.body.tasks.find"))
            findOnMapContainer.appendChild(findOnMapText);
            if(PlayerProgressionUtils.isQuestActive(quest.id) && !PlayerProgressionUtils.isQuestObjectiveCompletedByIconId(quest, iconId)) {
                findOnMapContainer.style.display = "block"
            } else {
                findOnMapContainer.style.display = "none"
            }
            questImageDescriptionDiv.appendChild(findOnMapContainer);
            QuestImageController.createNavigateToMapIcon(findOnMapContainer, quest, uuid);
        }

        questImageDiv.appendChild(questImageContainer)
        questImageDiv.appendChild(questImageDescriptionDiv)

        return questImageDiv
    }

    private static async loadImage(image:HTMLImageElement, path:string, ttl:number) {
        try {
            const temp = new Image();
            temp.src = path + `?${ttl}`;
            await temp.decode();
            image.src = path + `?${ttl}`;
        } catch(e) {
            ImageUtils.onImageLoadError(image, path)
        }
    }

    private static createQuestImageDiv(uuid:string, srcList:string, text:string, quest?:Quest, iconId?:string):HTMLElement {
        let questImageDiv = HelperCreation.createDiv("", "quest-image-div", "")
        let questImageContainer = HelperCreation.createDiv("", "quest-image-container", "")
        let questImage = HelperCreation.createImage(uuid, "quest-image", srcList, "");
        questImageContainer.appendChild(questImage)
        // if(srcList.length > 1) {
        //     ImageCyclingController.addImageCyclingEventListener(srcList, questImage as HTMLImageElement, questImageContainer, false)
        //     this.createQuestImageCyclingEventListener(srcList, questImage);
        // } else {
        //     this.createQuestImageEventListener(uuid, questImage);
        // }
        

        let questImageDescriptionDiv = HelperCreation.createDiv("", "quest-img-description-div", "")
        let questImageDescriptionB = HelperCreation.createB("quest-img-description quest-dropdown-text", text)
        questImageDescriptionDiv.appendChild(questImageDescriptionB)
        if(iconId) {
            QuestImageController.createNavigateToMapIcon(questImageDescriptionB, quest, iconId)
        }

        questImageDiv.appendChild(questImageContainer)
        questImageDiv.appendChild(questImageDescriptionDiv)

        return questImageDiv
    }

    private static createDropdownRequirement(quest: Quest): HTMLElement {
        let parentContainer = HelperCreation.createDiv("", "dropdown-requirements-container", "")

        //* Requirements **//
        let dropdownRequirementDiv = HelperCreation.createDiv("", "dropdown-requirement quest-requirement", "")
        let requirementTextDiv = HelperCreation.createDiv("", "requirements-div", "");
        requirementTextDiv.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.requirements.label")));

        let requirementSkillDiv = HelperCreation.createDiv("", "requirement-skill-div quest-dropdown-wrapper", "")
        this.createRequirementSkillDiv(requirementSkillDiv, quest)

        requirementTextDiv.appendChild(requirementSkillDiv)
        // this.createRequirementSkillDiv(requirementSkillDiv, requirement)
        // dropdownRequirementDiv.appendChild(requirementSkillDiv)
        // quest.require.forEach(requirement => {
        //     this.createRequirementSkillDiv(requirementSkillDiv, requirement)
        //     // dropdownRequirementDiv.appendChild(requirementSkillDiv)
        // })
        dropdownRequirementDiv.appendChild(requirementTextDiv)
        


        let questRequirementDiv = HelperCreation.createDiv("", "dropdown-requirement quest-unlocked-by", "")
        let questRequirementTextDiv = HelperCreation.createDiv("", "requirements-div", "")
        questRequirementTextDiv.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.unlockedBy.label")))
        questRequirementDiv.appendChild(questRequirementTextDiv)
        let questUnlockerDiv = HelperCreation.createDiv("", "quest-dropdown-wrapper quest-link-text", "")
        // quest.quest_requirements.forEach(quest_requirement => {
        //     questUnlockerDiv.appendChild(this.createQuestRequiredDiv(questRequirementDiv, quest_requirement.quest_requirement))
        // })
        if(quest.taskRequirements != null) {
            quest.taskRequirements.forEach(requirement => {
                if(requirement.task && requirement.task.id) {
                    questUnlockerDiv.appendChild(this.createQuestRequiredDiv(QuestsUtils.getQuestFromID(requirement.task.id.toString()), true, quest.id, requirement))
                } else {
                    console.log(`Quest requirement does not have a quest task with id for quest id: ${quest.id}`);
                }
            })
            if(EditSession.isSessionOpen()) {
                const addUnlockerWrapper = this.addQuestRequiredWrapper();
                QuestEditController.registerAddConditionQuest(addUnlockerWrapper, questUnlockerDiv, quest)
                questUnlockerDiv.appendChild(addUnlockerWrapper);
            }
        }
        questRequirementDiv.appendChild(questUnlockerDiv)
        
        parentContainer.appendChild(dropdownRequirementDiv)
        parentContainer.appendChild(questRequirementDiv)

        if(!EditSession.isSessionOpen()) {
            let questUnlocksDiv = HelperCreation.createDiv("", "dropdown-requirement quest-unlocks", "")
            let questUnlocksTextDiv = HelperCreation.createDiv("", "requirements-div", "")
            questUnlocksTextDiv.appendChild(this.createSolidLineWithTitle(I18nHelper.get("pages.quests.quest.body.leadsTo.label")))
            questUnlocksDiv.appendChild(questUnlocksTextDiv)
            let questUnlocksByDiv = HelperCreation.createDiv("", "quest-dropdown-wrapper quest-link-text", "");
    
            let questsList:Quest[] = QuestsUtils.getQuestUnlocksFromId(quest.id.toString());
            questsList.forEach(questUnlock => {
                if(QuestsFiltersUtils.questAllowed(quest)) {
                    questUnlocksByDiv.appendChild(this.createQuestRequiredDiv(questUnlock, true, quest.id))
                }
            })
            questUnlocksDiv.appendChild(questUnlocksByDiv)
            parentContainer.appendChild(questUnlocksDiv)
        }

        return parentContainer
    }

    private static addQuestRequiredWrapper():HTMLDivElement {
        let wrapper = HelperCreation.createDiv("", "add-quest-required-wrapper", "");

        const button = this.addConditionButton(I18nHelper.get("pages.quests.quest.body.unlockedBy.edit.condition.label"));
        wrapper.appendChild(button);

        return wrapper
    }

    static createQuestRequiredDiv(quest:Quest, isColorized?:boolean, questUnlockId?:string, requirement?:TaskObject) {
        let questRequiredDiv = HelperCreation.createDiv("", "requirement-quest", "")

        if(EditSession.isSessionOpen() && requirement && questUnlockId) {
            let wrapper = this.createQuestEditRequiredQuest(quest, questUnlockId, requirement);
            questRequiredDiv.appendChild(wrapper)
        } else {

            let questRequiredB = HelperCreation.createB("quest-dropdown-text text-decorated", `${quest.locales?.[I18nHelper.currentLocale()] ?? quest.name}`)

            if(isColorized) {       
                if(PlayerProgressionUtils.isQuestCompleted(quest.id) || (questUnlockId && isColorized && PlayerProgressionUtils.isQuestRequirementCompleted(questUnlockId, quest.id))) {
                    questRequiredB.classList.add("quest-dropdown-text-reached")
                } else if(PlayerProgressionUtils.isQuestActive(quest.id)) {
                    questRequiredB.classList.add("quest-dropdown-text-active")
                } else if(PlayerProgressionUtils.isQuestFailed(quest.id)) {
                    questRequiredB.classList.add("quest-dropdown-text-fail")
                } else if(!PlayerProgressionUtils.isQuestTracked(quest.id)) {
                    questRequiredB.classList.add("quest-dropdown-text-not-tracked")
                } else {
                    questRequiredB.classList.add("quest-dropdown-text-not-reached")
                }
            } else {
                for(const requirement of quest.taskRequirements) {
                    if(requirement.task.id === questUnlockId && requirement.status.includes(QuestConditionConst.FAILED.name)) {
                        questRequiredB.classList.add("quest-dropdown-text-fail")
                    }
                }
            }
    
            QuestSearchController.addQuestEventListener(questRequiredB, quest)
            questRequiredDiv.appendChild(questRequiredB)
        }

        return questRequiredDiv
    }

    private static createQuestEditRequiredQuest(quest:Quest, questUnlockId:string, requirement:TaskObject) {
        let wrapper = HelperCreation.createDiv("", "quest-edit-unlock", "");

        const selectionWrapper = HelperCreation.createDiv("", "quest-edit-unlock-selection-wrapper", "");
        const questSelection:HTMLSelectElement = HelperCreation.createSelect("", "quest-edit-unlock-selection")
        QuestsUtils.getQuestsTitleMap().forEach((title:string, id:string) => {
            const preselected:boolean = id === quest.id;
            questSelection.appendChild(new Option(title, id, preselected, preselected));
        })
        EditSession.getEditedQuests().forEach(editedQuest => {
            if(editedQuest.isNewQuest()) {
                const preselected:boolean = editedQuest.getQuestId() === quest.id;
                questSelection.appendChild(new Option(editedQuest.quest.locales?.[I18nHelper.currentLocale()] ?? editedQuest.quest.name, editedQuest.quest.id, preselected, preselected));
            }
        })
        selectionWrapper.appendChild(questSelection);
        QuestEditController.registerQuestConditionId(questSelection, questUnlockId);

        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-condition-image-top-right");

        wrapper.appendChild(removeImage);
        QuestEditController.registerRemoveConditionQuest(removeImage, wrapper, questSelection, questUnlockId);

        let dropdownsWrapper = HelperCreation.createDiv("", "quest-edit-dropdowns-wrapper", "");

        const addButton = this.addConditionButton(I18nHelper.get("pages.quests.quest.body.unlockedBy.edit.condition.add"));
        QuestEditController.registerAddQuestConditionController(addButton, dropdownsWrapper, questUnlockId, questSelection);

        requirement.status.forEach(s => {
            const dropdown = this.createConditionDropdown(s, questUnlockId, questSelection);
            dropdownsWrapper.appendChild(dropdown);
        })
        
        dropdownsWrapper.appendChild(addButton)

        wrapper.appendChild(dropdownsWrapper);
        wrapper.appendChild(selectionWrapper);

        return wrapper;
    }

    private static addConditionButton(labelText:string):HTMLElement {
        let wrapper = HelperCreation.createDiv("", "add-quest-condition", "");

        let text = HelperCreation.createB("add-condtion-text", labelText);
        let image = new Image();
        image.src = LogoPathConst.ADD_ICON;
        image.classList.add("add-condition-image");

        wrapper.appendChild(text);
        wrapper.appendChild(image);

        return wrapper;
    }

    static createConditionDropdown(status:string, questId:string, select:HTMLSelectElement):HTMLElement {

        const dropdownWrapper = HelperCreation.createDiv("", "quest-edit-dropdown-wrapper", "");
        const conditionDropdown = document.createElement("select");
        conditionDropdown.id = "quest-edit-selector";
        conditionDropdown.classList.add("centered");
        conditionDropdown.classList.add("quest-edit-dropdown");
        QuestConditionList.forEach(questStatus => {
            if(questStatus.name === status) {
                conditionDropdown.appendChild(new Option(questStatus.displayName, questStatus.name, true, true));
            } else {
                conditionDropdown.appendChild(new Option(questStatus.displayName, questStatus.name));
            }
        })
        QuestEditController.registerChangeQuestConditionController(conditionDropdown, questId, select)

        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-condition-image");

        QuestEditController.registerRemoveQuestConditionController(removeImage, conditionDropdown, dropdownWrapper, questId, select);

        dropdownWrapper.appendChild(conditionDropdown);
        dropdownWrapper.appendChild(removeImage);

        // const conditionDropdown = document.createElement("select");
        // conditionDropdown.id = "quest-edit-selector";
        // conditionDropdown.classList.add("centered");
        // conditionDropdown.classList.add("quest-edit-dropdown");
        // for(const condition in QuestConditionConst) {
        //     if(QuestConditionConst[condition] === status) {
        //         conditionDropdown.appendChild(new Option(QuestConditionConst[condition], QuestConditionConst[condition], true, true));
        //     } else {
        //         conditionDropdown.appendChild(new Option(QuestConditionConst[condition], QuestConditionConst[condition]));
        //     }
        // }
        // return conditionDropdown
        return dropdownWrapper;
    }

    private static createQuestItemDiv(itemId:string, src:string, text:string, rewardUnlock:boolean, count:string, hideoutCraftUnlock?:boolean, craftUnlock?:HideoutCrafts, reward?:TraderUnlock) {
        let container = HelperCreation.createDiv("", "quest-item-image-div", "")
        let questImageDiv = HelperCreation.createDiv("", "quest-item-image-container", "")
        const imageWrapper = HelperCreation.createDiv("", "item-requirement-image-wrapper", "")
        let img:HTMLImageElement = HelperCreation.createImage("", "quest-item-img", "", "")
        const ttl = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 12)) // Cached for 12 hours
        this.addImage(img, src, ttl);

        ItemsElementUtils.getItemInformation(itemId).then(itemData => {
            const color = rarityToColor(itemData.rarity);
            if(color) {
                imageWrapper.style.borderColor = color;
                imageWrapper.style.borderStyle = "solid";
                imageWrapper.style.background = `radial-gradient(
                        circle at top right,
                        transparent 0 104px,
                        ${color} 110px
                    )`
            }
        })
        
        imageWrapper.appendChild(img)
        questImageDiv.appendChild(imageWrapper)
        questImageDiv.style.backgroundColor = "var(--loading-background-color)";
        questImageDiv.style.borderRadius = "5px"

        let itemCountDiv = HelperCreation.createB("item-count", count);
        questImageDiv.appendChild(itemCountDiv)

        let questImageDescriptionDiv = HelperCreation.createDiv("", "quest-item-description-div", "")
        let questImageDescriptionB = HelperCreation.createB("quest-item-description quest-dropdown-text", text == "" ? "~": text)
        questImageDescriptionDiv.appendChild(questImageDescriptionB)

        container.appendChild(questImageDiv)
        container.appendChild(questImageDescriptionDiv)
        if(rewardUnlock) {
            questImageDiv.appendChild(this.createUnlockImageContainer(reward))
        }
        if(hideoutCraftUnlock && craftUnlock) {
            questImageDiv.appendChild(this.createHideoutCraftUnlockImageContainer(craftUnlock))
        }
        return container
    }

    private static async addImage(img:HTMLImageElement, src:string, ttl:number) {
        img.crossOrigin = "Anonymous"
        try {
            if(src.includes("undefined")) {
                img.src = LogoPathConst.LOGO_WHITE_256_BLUE_SIDE
                await img.decode();
            } else {
                img.src = src + `?${ttl}`
                await img.decode();
            }
        } catch(e) {
            ImageUtils.onImageLoadError(img, src)
        }
    }

    private static createUnlockImageContainer(reward:TraderUnlock) {
        let container = HelperCreation.createDiv("", "unlock-lock-container", "")

        let popup = HelperCreation.createDiv("", "unlock-popup-container", "");

        const traderName = TraderMapper.getLocalizedTraderName(reward.trader.id)
        let stationText = HelperCreation.createB("", traderName)
        let levelText = HelperCreation.createB("", `${I18nHelper.get("pages.quests.quest.body.rewards.rep")} ${reward.level}`);
        popup.appendChild(stationText);
        popup.appendChild(levelText);
        popup.style.display = "none";

        container.onmouseover = (e) => {
            popup.style.display = "";
        }
        container.onmouseout = (e) => {
            popup.style.display = "none";
        }

        container.appendChild(popup);

        container.appendChild(HelperCreation.createImage("", "unlock-lock-image", "../../img/icons/unlock.png", ""))
        return container
    }

    private static createHideoutCraftUnlockImageContainer(craft:HideoutCrafts) {
        let container = HelperCreation.createDiv("", "unlock-lock-container", "")
        
        let popup = HelperCreation.createDiv("", "unlock-popup-container", "");
        const station = HideoutUtils.getStation(craft.station.id); 
        let stationText = HelperCreation.createB("", station.locales?.[I18nHelper.currentLocale()] ?? station.name)
        let levelText = HelperCreation.createB("", `${I18nHelper.get("pages.quests.quest.body.rewards.level")} ${craft.level}`)
        popup.appendChild(stationText);
        popup.appendChild(levelText);
        popup.style.display = "none";

        container.onmouseover = (e) => {
            popup.style.display = "";
        }
        container.onmouseout = (e) => {
            popup.style.display = "none";
        }

        container.appendChild(popup);

        container.appendChild(HelperCreation.createImage("", "unlock-lock-image", "../../img/icons/craft.png", ""))

        return container
    }

    private static createQuestItemTextDiv(item_text:string, text:string) {
        let container = HelperCreation.createDiv("", "quest-item-image-div", "")

        let questText = HelperCreation.createB("quest-item-text", item_text)

        questText.style.backgroundColor = "var(--loading-background-color)";
        questText.style.borderRadius = "5px"

        let questImageDescriptionDiv = HelperCreation.createDiv("", "quest-item-description-div", "")
        let questImageDescriptionB = HelperCreation.createB("quest-item-description quest-dropdown-text", text)
        questImageDescriptionDiv.appendChild(questImageDescriptionB)

        container.appendChild(questText)
        container.appendChild(questImageDescriptionDiv)

        return container
    }

    private static createItemsNeeded(itemsNeeded:Map<string, number>, questId:string):HTMLElement {

        let questItemsDiv = HelperCreation.createDiv("", "quest-items", "")
        itemsNeeded.forEach((quantity, itemId) => {
            const itemWrapper = ItemBuilder.createItem(itemId, quantity, PageConst.QUESTS_PAGE, null, questId)
            questItemsDiv.appendChild(itemWrapper);
            const text = ItemsBodyUtils.getItemNameElement(itemWrapper);
            if(itemWrapper) {
                QuestBodyController.registerItemNavigationController(itemId, text as HTMLElement);
            }
        })

        return questItemsDiv
    }

    private static createKeysRequired(keysRequired:NeededKeys[]):HTMLElement {
        let keysDiv = HelperCreation.createDiv("", "quest-keys-items", "")
        keysRequired.forEach(keyRequired => {
            keyRequired.keys.forEach(key => {
                let itemWrapper = this.createKeyRequired(key.id, ItemsElementUtils.getItemName(key.id), keyRequired.map.id);
                keysDiv.appendChild(itemWrapper);
            })
        })
        return keysDiv
    }

    private static createEditKeysRequired(quest:Quest, objectiveId:string, keysRequired:NeededKeys[]):HTMLElement {
        let keysDiv = HelperCreation.createDiv("", "quest-edit-keys-items", "")

        let keyDiv = HelperCreation.createDiv("", "quest-edit-key-items", "")

        if(keysRequired && keysRequired.length > 0) {
            keysRequired.forEach(keyRequired => {
                let itemWrapper = this.createEditKeyRequired(quest, objectiveId, keyRequired);
                keyDiv.appendChild(itemWrapper);
            })
        }

        keysDiv.appendChild(keyDiv);

        const addButton = this.createAddButton();
        keysDiv.appendChild(addButton);

        QuestEditController.registerAddKeys(addButton, keysDiv, quest, objectiveId);

        return keysDiv
    }

    private static createKeyRequired(id:string, name:string, mapId:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "key-item-wrapper", "");
        const image = new Image();
        image.classList.add("quest-key-image")
        image.src = LogoPathConst.LOADING_GIF;
        const keyNameElement = HelperCreation.createB("quest-key-name", name)
        const mapNameElement = HelperCreation.createB("quest-key-map", MapAdapter.getLocalizedMap(mapId))
        ItemsElementUtils.getItemInformation(id).then(data => {
            keyNameElement.textContent = data.name
            ImageUtils.loadImage(image, data.baseImageLink, 1);
        })
        let findOnMapContainer = HelperCreation.createDiv(id, "quest-image-find-on-map-container", "")
        let findOnMapText = HelperCreation.createB("quest-image-find-on-map-text", "Find on map")
        findOnMapContainer.appendChild(findOnMapText);
        findOnMapContainer.style.display = "block"
        QuestImageController.createNavigateToMapKey(findOnMapContainer, id, mapId);

        wrapper.appendChild(image);
        wrapper.appendChild(keyNameElement);
        wrapper.appendChild(mapNameElement);
        wrapper.appendChild(findOnMapContainer)
        return wrapper
    }

    static createEditKeyRequired(quest:Quest, objectiveId:string, neededKeys:NeededKeys):HTMLElement {

        const container = HelperCreation.createDiv("", "quest-edit-needed-keys-container", "");

        const mapSelector = document.createElement("select");

        const keysContainer = HelperCreation.createDiv("", "quest-edit-needed-keys-wrapper", "");

        neededKeys.keys.forEach(neededKey => {
            const keyContainer = this.addEditNeededKey(quest, objectiveId, neededKey, mapSelector);
            keysContainer.appendChild(keyContainer);
        })

        container.appendChild(keysContainer)

        mapSelector.classList.add("centered");
        mapSelector.classList.add("quest-edit-dropdown");

        MapsExtendedList.forEach(map => {
            if(map.id === neededKeys.map.id) {
                mapSelector.appendChild(new Option(MapAdapter.getLocalizedMap(map.id), map.id, true, true));
            } else {
                mapSelector.appendChild(new Option(MapAdapter.getLocalizedMap(map.id), map.id));
            }
        })
        container.appendChild(mapSelector);

        QuestEditController.keyMapSelector(mapSelector, quest.id, objectiveId)

        const addButton = this.createAddButton();
        container.appendChild(addButton);

        QuestEditController.registerAddKey(addButton, keysContainer, quest, objectiveId, mapSelector);

        return container;
    }

    static addEditNeededKey(quest:Quest, objectiveId:string, neededKey:Object, mapSelector:HTMLSelectElement) {
        const keyContainer = HelperCreation.createDiv("", "quest-edit-needed-key-wrapper", "");

        const rewardImageContainer = HelperCreation.createDiv("", "quest-edit-reward-control-wrapper", "")

        const arrowUp = this.createEditQuestRewardMoveUp();
        rewardImageContainer.appendChild(arrowUp);

        const arrowDown = this.createEditQuestRewardMoveDown();
        rewardImageContainer.appendChild(arrowDown);
        
        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-reward-image-top-right");
        rewardImageContainer.appendChild(removeImage);

        keyContainer.appendChild(rewardImageContainer);

        const selectorWrapper = HelperCreation.createDiv("", "quest-edit-reward-item-selector-wrapper", "");

        const selectorText = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.quests.quest.body.keysRequired.key"));
        selectorWrapper.appendChild(selectorText);

        const image = new Image();
        image.src = LogoPathConst.LOGO_WHITE_256_BLUE_SIDE
        image.classList.add("quest-edit-reward-item-image");
        
        const itemSelector = document.createElement("select");
        itemSelector.classList.add("quest-edit-needed-keys-selector");

        let defaulted:boolean = true;
        ItemsElementUtils.getData().items.forEach(item => {
            if(item.id === neededKey.id || defaulted) {
                defaulted = false;
                itemSelector.appendChild(new Option(item.name, item.id, true, true));
                ImageUtils.loadImage(image, item.imageLink, 1);
            } else {
                itemSelector.appendChild(new Option(item.name, item.id));
            }
        })
        selectorWrapper.appendChild(itemSelector);
        selectorWrapper.appendChild(image);
        
        keyContainer.appendChild(selectorWrapper);

        this.updateSelect2();

        QuestEditController.moveKeyUp(arrowUp, keyContainer, quest.id, objectiveId, itemSelector, mapSelector);
        QuestEditController.moveKeyDown(arrowDown, keyContainer, quest.id, objectiveId, itemSelector, mapSelector);
        QuestEditController.removeKey(removeImage, keyContainer, quest.id, objectiveId, itemSelector, mapSelector);
        QuestEditController.keySelector(itemSelector, quest.id, objectiveId, image, mapSelector);

        return keyContainer;
    }


    static createQuestGoalDiv(quest:Quest, objective:Objectives):HTMLElement {
        let questGoalDiv = HelperCreation.createDiv(objective.id, "quest-objective", "")

        if(EditSession.isSessionOpen()) {
            questGoalDiv.classList.add("quest-edit-goals")
            const wrapper = this.createEditQuestObjective(quest, objective);
            questGoalDiv.appendChild(wrapper);

            const moveUp = this.createEditQuestObjectiveMoveUp();
            QuestEditController.registerMoveObjectiveUp(moveUp, questGoalDiv, quest.id, objective.id);
            questGoalDiv.appendChild(moveUp);

            const moveDown = this.createEditQuestObjectiveMoveDown();
            QuestEditController.registerMoveObjectiveDown(moveDown, questGoalDiv, quest.id, objective.id);
            questGoalDiv.appendChild(moveDown);
        } else {
            questGoalDiv.classList.add("quest-goals");

            this.createObjectiveDescription(questGoalDiv, objective);
            this.createObjectiveCheckboxes(questGoalDiv, objective);
            this.createObjectiveInfo(questGoalDiv, objective);

            if(objective.type === ObjectiveTypeConst.BUILD_WEAPON.type) {
                this.createObjectiveWeaponBuilder(questGoalDiv, quest, objective);
            } else {
                this.createObjectiveQuestImages(questGoalDiv, quest, objective);
            }

            // let checkMarkImage = new Image();
            // checkMarkImage.src = "./img/side-nav-quest-icon.png";
            // checkMarkImage.classList.add("quest-goal-checkmark-image")
            // questGoalDiv.appendChild(checkMarkImage)
    
            if(PlayerProgressionUtils.isQuestObjectiveCompleted(quest, objective.id)) {
                questGoalDiv.classList.add("quest-goal-completed");
            }
            QuestBodyController.addObjectiveCompletionControllerEventListener(questGoalDiv, quest, objective)
        }
        return questGoalDiv;
    }

    private static createObjectiveDescription(container:HTMLElement, objective:Objectives) {
        let descriptionContainer = HelperCreation.createDiv("", "quest-dropdown-description-container", "");

        let questGoalB = HelperCreation.createB("quest-dropdown-text text-decorated", objective.locales?.[I18nHelper.currentLocale()] ?? objective.description)
        questGoalB.style.width = "75%";
        questGoalB.style.borderRight = "2px solid grey";

        descriptionContainer.appendChild(questGoalB);

        if(objective.count > 0) {
            let questGoalCount = HelperCreation.createB("quest-dropdown-text", `${I18nHelper.get("pages.quests.quest.body.tasks.count")}: ${objective.count}`)
            descriptionContainer.appendChild(questGoalCount);
        }

        container.appendChild(descriptionContainer);
    }

    private static createObjectiveCheckboxes(container:HTMLElement, objective:Objectives) {
        if(objective.foundInRaid || objective.optional) {
            let checkboxContainer = HelperCreation.createDiv("", "quest-dropdown-checkboxes-container", "");

            if(objective.foundInRaid) {
                this.createObjectiveCheckbox(checkboxContainer, objective.foundInRaid, I18nHelper.get("pages.quests.quest.body.tasks.fir"));
            }
            if(objective.optional) {
                this.createObjectiveCheckbox(checkboxContainer, objective.optional, I18nHelper.get("pages.quests.quest.body.tasks.optional"));
            }
    
            container.appendChild(checkboxContainer);
        }
    }

    private static createObjectiveCheckbox(container:HTMLElement, isChecked:boolean, text:string) {
        const wrapper = HelperCreation.createDiv("", "quest-objective-checkbox-container", "");

        const checkBox = HelperCreation.createDiv("", "quest-objective-checkbox", "")
        checkBox.style.backgroundColor = isChecked ? "var(--main-btn-active-color)" : "var(--main-btn-inactive-color)";
        
        const textB = HelperCreation.createB("quest-objective-checkbox-text", text);

        wrapper.appendChild(checkBox);
        wrapper.appendChild(textB);

        container.appendChild(wrapper);
    }

    private static createObjectiveInfo(container:HTMLElement, objective:Objectives) {
        if(objective.item?.id || objective.markerItem?.id || objective.maps?.length > 0) {
            let wrapper = HelperCreation.createDiv("", "quest-dropdown-objective-info-container", "");

            this.createObjectiveItem(wrapper, objective, objective.item?.id);
            this.createObjectiveItem(wrapper, objective, objective.markerItem?.id);
            this.createObjectiveMap(wrapper, objective);
    
            container.appendChild(wrapper);
        }
    }

    private static createObjectiveItem(container:HTMLElement, objective:Objectives, itemId:string) {
        if(itemId) {
            ItemsElementUtils.getItemInformation(itemId).then(data => {
                const image = new Image();
                image.classList.add("quest-objective-item-image")
                try {
                    if(data.baseImageLink?.length > 0 && !data.baseImageLink.includes("undefined")) {
                        ImageUtils.loadImage(image, data.baseImageLink);
                    } else {
                        image.src = LogoPathConst.LOGO_WHITE_256_BLUE_SIDE;
                    }
                } catch(e) {
                    ImageUtils.onImageLoadError(image, data.baseImageLink);
                }
                const wrapper = HelperCreation.createDiv("", "quest-objective-info-container", "");
                const title = HelperCreation.createB("quest-objective-info-title", "Item Info")
                wrapper.appendChild(title);

                const imageWrapper = HelperCreation.createDiv("", "quest-objective-item-image-container", "");
                ItemsElementUtils.getItemInformation(itemId).then(itemData => {
                    const color = rarityToColor(itemData.rarity);
                    if(color) {
                        imageWrapper.style.borderColor = color;
                        imageWrapper.style.borderStyle = "solid";
                        imageWrapper.style.background = `radial-gradient(circle at right top, transparent 0px, transparent 75px, ${color} 82px)`
                    }
                });
                imageWrapper.appendChild(image);

                const itemName = HelperCreation.createB("quest-objective-item-name", data.name);
                
                wrapper.appendChild(imageWrapper);
                wrapper.appendChild(itemName);

                container.appendChild(wrapper);
            })
        }
    }

    private static createObjectiveMap(container:HTMLElement, objective:Objectives) {
        if(objective.type === ObjectiveTypeConst.EXTRACT.type || objective.type === ObjectiveTypeConst.MARK.type
             || objective.type === ObjectiveTypeConst.FIND_QUEST_ITEM.type || objective.type === ObjectiveTypeConst.PLANT_ITEM.type 
             || objective.type === ObjectiveTypeConst.SHOOT.type || objective.type === ObjectiveTypeConst.VISIT.type) {

                const mapContainer = HelperCreation.createDiv("", "quest-objective-info-container", "");

                const title = HelperCreation.createB("quest-objective-info-title", I18nHelper.get("pages.quests.quest.body.tasks.maps"))
                mapContainer.appendChild(title);
                
                const mapsContainer = HelperCreation.createDiv("", "quest-objective-info-maps-container", "")
                if(objective.maps && objective.maps.length > 0) {
                    const sortedMaps = objective.maps.sort((a, b) => a.name.localeCompare(b.name));
                    sortedMaps.forEach(map => {
                        MapsExtendedList.forEach(mapInfo => {
                            if(mapInfo.id === map.id) {
                                const mapText = HelperCreation.createB("quest-objective-map-text", MapAdapter.getLocalizedMap(mapInfo.id));
                                mapsContainer.appendChild(mapText);
                            }
                        })
                    })
                } else {
                    const mapText = HelperCreation.createB("quest-objective-map-text", I18nHelper.get("pages.quests.quest.body.tasks.anyMaps"));
                    mapsContainer.appendChild(mapText);
                }
                mapContainer.appendChild(mapsContainer);
        
                container.appendChild(mapContainer);
        }
    }

    private static createObjectiveWeaponBuilder(container:HTMLElement, quest:Quest, objective:Objectives) {
        if(objective.weaponBuilder) {
            objective.weaponBuilder.forEach(weaponBuild => {
                if(weaponBuild.description) {
                    const description = HelperCreation.createB("quest-objective-info-title", weaponBuild.description);
                    container.appendChild(description)
                }

                const imageContainer = HelperCreation.createDiv("", "quest-weapon-builder-image-wrapper", "");

                imageContainer.appendChild(this.createQuestImagesDiv(
                    UuidGenerator.generate(),
                    [weaponBuild.moddingView],
                    "Modding view",
                    quest, null, false)
                );

                imageContainer.appendChild(this.createQuestImagesDiv(
                    UuidGenerator.generate(),
                    [weaponBuild.inspectView],
                    "Inspect view",
                    quest, null, false)
                );

                container.appendChild(imageContainer);

                const partsContainer = HelperCreation.createDiv("", "quest-weapon-builder-part-container", "");
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.muzzle, I18nHelper.get("pages.quests.quest.body.tasks.weapon.muzzle"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.gasBlock, I18nHelper.get("pages.quests.quest.body.tasks.weapon.gasBlock"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.handguard, I18nHelper.get("pages.quests.quest.body.tasks.weapon.handguard"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.barrel, I18nHelper.get("pages.quests.quest.body.tasks.weapon.barrel"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.rail, I18nHelper.get("pages.quests.quest.body.tasks.weapon.rail"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.attachment, I18nHelper.get("pages.quests.quest.body.tasks.weapon.attachment"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.grip, I18nHelper.get("pages.quests.quest.body.tasks.weapon.foregrip"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.receiver, I18nHelper.get("pages.quests.quest.body.tasks.weapon.receiver"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.mount, I18nHelper.get("pages.quests.quest.body.tasks.weapon.mounts"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.scope, I18nHelper.get("pages.quests.quest.body.tasks.weapon.scope"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.magazine, I18nHelper.get("pages.quests.quest.body.tasks.weapon.magazine"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.pistolGrip, I18nHelper.get("pages.quests.quest.body.tasks.weapon.pistolGrip"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.bolt, I18nHelper.get("pages.quests.quest.body.tasks.weapon.bolt"));
                this.createObjectiveWeaponPart(partsContainer, weaponBuild.stock, I18nHelper.get("pages.quests.quest.body.tasks.weapon.stock"));

                container.appendChild(partsContainer);
            })
        }
    }

    private static createObjectiveWeaponPart(container:HTMLElement, parts:Object[], name:string) {

        if(parts && parts.length > 0) {
            const wrapper = HelperCreation.createDiv("", "quest-weapon-builder-parts-wrapper", "");

            const textHeader = HelperCreation.createB("quest-weapon-builder-parts-header-text", name);
            wrapper.appendChild(textHeader);
    
            const partsWrapper = HelperCreation.createDiv("", "quest-weapon-builder-parts-content-wrapper", "");

            parts.forEach(part => {
                this.addWeaponBuilderPart(partsWrapper, part);
            })

            wrapper.appendChild(partsWrapper);

            container.appendChild(wrapper);
        }

    }

    private static addWeaponBuilderPart(container:HTMLElement, part:Object) {
        let questImageDiv = HelperCreation.createDiv("", "quest-image-container", "")
        let childElement = this.createQuestImageDiv("", LogoPathConst.LOGO_WHITE_256_BLUE_SIDE, "");

        ItemsElementUtils.getItemInformation(part.id).then(itemData => {
            const descriptionEl = (childElement.getElementsByClassName("quest-img-description")[0] as HTMLElement);
            descriptionEl.textContent = itemData.name;
            const ttl = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 12)) // Cached for 12 hours
            this.addImage((childElement.getElementsByClassName("quest-image")[0] as HTMLImageElement), itemData.baseImageLink, ttl);
            this.createFullNamePopupContainer(descriptionEl.parentElement, itemData.name);
        })
        // let childElement = this.createQuestImageDiv("", ItemsElement.getInstance().getImagePath(weaponPart.parts[0]), "");
        questImageDiv.appendChild(childElement);

        (childElement.getElementsByClassName("quest-image")[0] as HTMLImageElement).style.backgroundColor = "var(--main-btn-inactive-color2)";
        (childElement.getElementsByClassName("quest-image")[0] as HTMLImageElement).style.borderRadius = "5px";
        container.appendChild(questImageDiv);
    }

    private static createFullNamePopupContainer(container:HTMLElement, fullname:string) {
        let popup = HelperCreation.createDiv("", "fullname-popup-container", "");

        let textEl = HelperCreation.createB("", fullname)
        popup.appendChild(textEl);
        popup.style.display = "none";

        container.onmouseover = (e) => {
            popup.style.display = "";
        }
        container.onmouseout = (e) => {
            popup.style.display = "none";
        }

        container.appendChild(popup);
    }

    private static createObjectiveQuestImages(container:HTMLElement, quest:Quest, objective:Objectives) {
        if(!EditSession.isSessionOpen() && objective.questImages && objective.questImages.length > 0) {
            const wrapper = HelperCreation.createDiv("", "quest-dropdown-objective-locations-container", "")

            const title = HelperCreation.createB("quest-objective-info-title", I18nHelper.get("pages.quests.quest.body.tasks.location"))
            wrapper.appendChild(title);

            let questImageDiv = HelperCreation.createDiv("", "quest-objective-locations-container", "");
            objective.questImages.forEach(img => {
                if(img.paths != undefined) {
                    questImageDiv.appendChild(this.createQuestImagesDiv(img.id, img.paths, img.description ? img.description : "", quest, img.id));
                } 
            })
            wrapper.appendChild(questImageDiv)
            container.appendChild(wrapper);
        }
    }

    static createEditAddObjective() {
        let wrapper = HelperCreation.createDiv("", "add-quest-objective-wrapper", "");

        const button = this.addConditionButton(I18nHelper.get("pages.quests.quest.body.tasks.edit.add"));
        wrapper.appendChild(button);

        return wrapper
    }

    private static createEditQuestObjectiveMoveUp() {
        const arrowUp = new Image();
        arrowUp.src = LogoPathConst.ARROW;
        arrowUp.classList.add("move-quest-objective-top-right");
        arrowUp.classList.add("move-quest-objective-up");
        return arrowUp;
    }

    private static createEditQuestRewardMoveUp() {
        const arrowUp = new Image();
        arrowUp.src = LogoPathConst.ARROW;
        arrowUp.classList.add("move-quest-reward-top-right");
        arrowUp.classList.add("move-quest-reward-up");
        return arrowUp;
    }

    private static createEditQuestObjectiveMoveDown() {
        const arrowDown = new Image();
        arrowDown.src = LogoPathConst.ARROW;
        arrowDown.classList.add("move-quest-objective-top-right");
        arrowDown.classList.add("move-quest-objective-down");
        return arrowDown;
    }

    private static createEditQuestRewardMoveDown() {
        const arrowDown = new Image();
        arrowDown.src = LogoPathConst.ARROW;
        arrowDown.classList.add("move-quest-reward-top-right");
        arrowDown.classList.add("move-quest-reward-down");
        return arrowDown;
    }

    private static createEditQuestObjective(quest:Quest, objective:Objectives):HTMLElement {
        const wrapper = HelperCreation.createDiv(objective.id, "quest-edit-objective-wrapper", "");

        const removeImage = new Image();
        removeImage.src = LogoPathConst.REMOVE_ICON;
        removeImage.classList.add("remove-quest-objective-image-top-right");
        wrapper.appendChild(removeImage);
        QuestEditController.registerRemoveObjective(removeImage, wrapper, quest.id, objective.id)

        const type = this.createEditQuestObjectiveType(quest, objective);
        const description = this.createEditQuestObjectiveDescription(quest, objective);
        const map = this.createEditQuestObjectiveMaps(quest, objective);
        const optional = this.createEditQuestObjectiveOptional(quest, objective);
        const foundInRaid = this.createEditQuestObjectiveFoundInRaid(quest, objective);
        const count = this.createEditQuestObjectiveCount(quest, objective);
        const item = this.createEditQuestObjectiveItem(quest, objective);
        const markerItem = this.createEditQuestObjectiveMarkerItem(quest, objective);
        const weaponBuilder = this.createEditQuestWeaponBuilder(quest, objective);

        QuestEditController.registerObjectiveType(type.getElementsByClassName("quest-edit-dropdown")[0] as HTMLSelectElement, quest.id, objective.id, count, item, markerItem, foundInRaid)

        wrapper.appendChild(type);
        wrapper.appendChild(description);
        wrapper.appendChild(map);
        wrapper.appendChild(optional);
        wrapper.appendChild(foundInRaid);
        wrapper.appendChild(count);
        wrapper.appendChild(item);
        wrapper.appendChild(markerItem);
        if(weaponBuilder) {
            wrapper.appendChild(weaponBuilder);
        }

        QuestEditController.resolveObjective(type.getElementsByClassName("quest-edit-dropdown")[0] as HTMLSelectElement, quest.id, objective.id, count, item, markerItem, foundInRaid, false)

        return wrapper;
    }
    
    private static createEditQuestObjectiveType(quest:Quest, objective:Objectives):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "create-edit-objective-type-wrapper", "");

        const typeSelector = document.createElement("select");
        typeSelector.classList.add("centered");
        typeSelector.classList.add("quest-edit-dropdown");

        ObjectiveTypeList.forEach(type => {
            if(objective.type === type.type) {
                typeSelector.appendChild(new Option(type.text, type.type, true, true));
            } else {
                typeSelector.appendChild(new Option(type.text, type.type));
            }
        })
        wrapper.appendChild(typeSelector);

        return wrapper;
    }

    private static createEditQuestObjectiveDescription(quest:Quest, objective:Objectives):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "create-edit-objective-description-wrapper", "");

        const text = HelperCreation.createB("quest-edit-objective-description", I18nHelper.get("pages.quests.quest.body.tasks.edit.description"))
        wrapper.appendChild(text);

        const input = HelperCreation.createInput("", "", "quest-edit-objective-description-input");
        input.placeholder = objective.description;
        input.value = objective.description;

        QuestEditController.registerObjectiveDescription(input, quest.id, objective.id);

        wrapper.appendChild(input);

        return wrapper;
    }

    private static createEditQuestObjectiveMaps(quest:Quest, objective:Objectives):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "create-edit-objective-maps-wrapper", "");

        MapsExtendedList.forEach(map => {
            const label = HelperCreation.createLabel("", "quest-edit-filter-label");
            const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
            input.setAttribute("value", MapAdapter.getLocalizedMap(map.id));
            objective.maps.forEach(m => {
                if(m.id === map.id) {
                    input.checked = true
                }
            })
    
            label.appendChild(input);
            label.appendChild(document.createTextNode(MapAdapter.getLocalizedMap(map.id)))

            QuestEditController.registerObjectiveMap(input, quest.id, objective.id, map.id);

            wrapper.appendChild(label);
        })

        return wrapper;
    }

    private static createEditQuestObjectiveOptional(quest:Quest, objective:Objectives):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "create-edit-objective-optional-wrapper", "");

        const label = HelperCreation.createLabel("", "quest-edit-filter-label");
        const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
        input.setAttribute("value", I18nHelper.get("pages.quests.quest.body.tasks.edit.optional"));

        input.checked = objective.optional;

        label.appendChild(input);
        label.appendChild(document.createTextNode(I18nHelper.get("pages.quests.quest.body.tasks.edit.optional")));

        QuestEditController.registerObjectiveOptional(input, quest.id, objective.id);

        wrapper.appendChild(label)

        return wrapper;
    }

    private static createEditQuestObjectiveFoundInRaid(quest:Quest, objective:Objectives):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "create-edit-objective-optional-wrapper", "");

        const label = HelperCreation.createLabel("", "quest-edit-filter-label");
        const input = HelperCreation.createInput("", "checkbox", "item-filter-input");
        input.setAttribute("value", I18nHelper.get("pages.quests.quest.body.tasks.edit.fir"));

        input.checked = objective.foundInRaid;

        label.appendChild(input);
        label.appendChild(document.createTextNode(I18nHelper.get("pages.quests.quest.body.tasks.edit.fir")));

        QuestEditController.registerObjectiveFoundInRaid(input, quest.id, objective.id);

        wrapper.appendChild(label)

        return wrapper;
    }

    private static createEditQuestObjectiveCount(quest:Quest, objective:Objectives):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "create-edit-objective-count-wrapper", "");

        const text = HelperCreation.createB("quest-edit-objective-description", I18nHelper.get("pages.quests.quest.body.tasks.edit.count"))
        wrapper.appendChild(text);

        const input = HelperCreation.createInput("", "", "quest-edit-objective-count-input");
        input.placeholder = String(objective.count);
        input.value = String(objective.count);

        QuestEditController.registerObjectiveCount(input, quest.id, objective.id);

        wrapper.appendChild(input);

        return wrapper;
    }

    private static createEditQuestObjectiveItem(quest:Quest, objective:Objectives):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "create-edit-objective-item-wrapper", "");

        const text = HelperCreation.createB("quest-edit-objective-description", I18nHelper.get("pages.quests.quest.body.tasks.edit.item"))
        wrapper.appendChild(text);

        const itemSelector = document.createElement("select");
        itemSelector.classList.add("centered");
        itemSelector.classList.add("quest-edit-dropdown");
        itemSelector.classList.add("quest-edit-objective-item-selector");

        const image = new Image();
        image.classList.add("quest-edit-reward-item-image");

        let defaulted:boolean = true;
        ItemsElementUtils.getData().items.forEach(item => {
            if((objective.item && item.id === objective.item.id) || (!objective.item && defaulted)) {
                defaulted = false;
                itemSelector.appendChild(new Option(item.name, item.id, true, true));
                if(objective.item?.id) {
                    ImageUtils.loadImage(image, item.imageLink, 1);
                }
            } else {
                itemSelector.appendChild(new Option(item.name, item.id));
            }
        })

        QuestEditController.registerObjectiveItem(itemSelector, quest.id, objective.id, image);

        wrapper.appendChild(itemSelector);
        wrapper.appendChild(image);

        return wrapper;
    }

    private static createEditQuestObjectiveMarkerItem(quest:Quest, objective:Objectives):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "create-edit-objective-marker-item-wrapper", "");

        const text = HelperCreation.createB("quest-edit-objective-description",  I18nHelper.get("pages.quests.quest.body.tasks.edit.mark"))
        wrapper.appendChild(text);

        const itemSelector = document.createElement("select");
        itemSelector.classList.add("centered");
        itemSelector.classList.add("quest-edit-dropdown");
        itemSelector.classList.add("quest-edit-objective-item-selector");

        const image = new Image();
        image.classList.add("quest-edit-reward-item-image");

        let defaulted:boolean = true;
        ItemsElementUtils.getData().items.forEach(item => {
            if((objective.markerItem && item.id === objective.markerItem.id) || (!objective.markerItem && defaulted)) {
                defaulted = false;
                itemSelector.appendChild(new Option(item.name, item.id, true, true));
                if(objective.markerItem?.id) {
                    ImageUtils.loadImage(image, item.imageLink, 1);
                }
            } else {
                itemSelector.appendChild(new Option(item.name, item.id));
            }
        })

        QuestEditController.registerObjectiveMarkerItem(itemSelector, quest.id, objective.id, image);

        wrapper.appendChild(itemSelector);
        wrapper.appendChild(image);

        return wrapper;
    }

    public static createEditQuestWeaponBuilder(quest:Quest, objective:Objectives):HTMLElement {
        if(objective.type === ObjectiveTypeConst.BUILD_WEAPON.type) {
            return this.createEditQuestWeaponBuilderSection(quest, objective);
        }
    }

    private static createEditQuestWeaponBuilderSection(quest:Quest, objective:Objectives):HTMLElement {

        const wrapper = HelperCreation.createDiv("quest-edit-weapon-builder-wrapper", "quest-edit-weapon-builder-wrapper", "");
    
        const headerText = HelperCreation.createB("quest-edit-reward-text", I18nHelper.get("pages.quests.quest.body.tasks.weapon.label"));
        wrapper.appendChild(headerText);

        const template = this.createEditRewardTemplate();

        if(!objective.weaponBuilder || objective.weaponBuilder.length === 0) {
            this.createEditWeaponBuild(template, quest, objective, null, 0);
        } else {
            let index = 0;
            objective.weaponBuilder.forEach(builder => {
                this.createEditWeaponBuild(template, quest, objective, builder, index);
                index++;
            })
        }

        wrapper.appendChild(template);

        return wrapper;
    }

    private static createEditWeaponBuild(template:HTMLElement, quest:Quest, objective:Objectives, builder:WeaponBuilder, index:number) {
        const partsContainer = HelperCreation.createDiv("", "quest-weapon-builder-part-container", "");
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.muzzle, I18nHelper.get("pages.quests.quest.body.tasks.weapon.muzzle"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.gasBlock, I18nHelper.get("pages.quests.quest.body.tasks.weapon.gasBlock"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.handguard, I18nHelper.get("pages.quests.quest.body.tasks.weapon.handguard"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.barrel, I18nHelper.get("pages.quests.quest.body.tasks.weapon.barrel"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.rail, I18nHelper.get("pages.quests.quest.body.tasks.weapon.rail"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.attachment, I18nHelper.get("pages.quests.quest.body.tasks.weapon.attachment"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.grip, I18nHelper.get("pages.quests.quest.body.tasks.weapon.foregrip"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.receiver, I18nHelper.get("pages.quests.quest.body.tasks.weapon.receiver"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.mount, I18nHelper.get("pages.quests.quest.body.tasks.weapon.mounts"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.scope, I18nHelper.get("pages.quests.quest.body.tasks.weapon.scope"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.magazine, I18nHelper.get("pages.quests.quest.body.tasks.weapon.magazine"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.pistolGrip, I18nHelper.get("pages.quests.quest.body.tasks.weapon.pistolGrip"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.bolt, I18nHelper.get("pages.quests.quest.body.tasks.weapon.bolt"), index));
        partsContainer.appendChild(this.createEditQuestWeaponBuilderParts(quest, objective, builder?.stock, I18nHelper.get("pages.quests.quest.body.tasks.weapon.stock"), index));
        template.appendChild(partsContainer);
    }

    private static createEditQuestWeaponBuilderParts(quest:Quest, objective:Objectives, parts:Object[], name:string, index:number):HTMLElement {

        const template = this.createEditWeaponBuilderPartsTemplate();

        const text = HelperCreation.createB("quest-edit-reward-input-text", name);
        template.appendChild(text);

        if(!parts) {
            parts = []
        }

        parts.forEach(part => {
            template.appendChild(this.createEditQuestWeaponBuilderPart(quest, objective.id, part, name, index));
        })

        const addButton = this.createAddButton();
        QuestEditController.registerAddWeaponBuildPart(addButton, template, quest, objective.id, name, index);
        template.appendChild(addButton);

        return template;
    }

    public static createEditQuestWeaponBuilderPart(quest:Quest, objectiveId:string, part:Object, type:string, index:number):HTMLElement {
        
        const container = HelperCreation.createDiv("", "quest-edit-weapon-builder-part-container", "");

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

        const selectorText = HelperCreation.createB("quest-edit-reward-input-text", I18nHelper.get("pages.quests.quest.body.tasks.edit.item"));
        selectorWrapper.appendChild(selectorText);

        const image = new Image();
        image.classList.add("quest-edit-reward-item-image");
        
        const itemSelector = document.createElement("select");
        itemSelector.classList.add("quest-edit-reward-item-selector");

        let defaulted:boolean = true;
        ItemsElementUtils.getData().items.forEach(item => {
            if(item.id === part.id || defaulted) {
                defaulted = false;
                itemSelector.appendChild(new Option(item.name, item.id, true, true));
                ImageUtils.loadImage(image, item.imageLink, 1);
            } else {
                itemSelector.appendChild(new Option(item.name, item.id));
            }
        })
        selectorWrapper.appendChild(itemSelector);
        selectorWrapper.appendChild(image);
        
        container.appendChild(selectorWrapper);

        
        QuestEditController.moveWeaponBuilderPartUp(arrowUp, container, quest.id, objectiveId, itemSelector, type, index);
        QuestEditController.moveWeaponBuilderPartDown(arrowDown, container, quest.id, objectiveId, itemSelector, type, index);
        QuestEditController.removeWeaponPart(removeImage, container, quest.id, objectiveId, itemSelector, type, index);
        QuestEditController.weaponBuilderPartSelector(itemSelector, quest.id, objectiveId, image, type, index);

        return container;
    }

    private static createRequirementSkillDiv(parentDiv:HTMLElement, quest:Quest) {
        let requirementDiv = HelperCreation.createDiv("", "requirement-skill", "")

        if(EditSession.isSessionOpen()) {

            this.createEditRequirementLevel(requirementDiv, quest);
            this.createEditRequirementHoursDelay(requirementDiv, quest);
            this.createEditRequirementProgressionType(requirementDiv, quest);
            this.createEditRequirementFactionName(requirementDiv, quest);
            this.createEditRequirementGameEdition(requirementDiv, quest);

        } else {
            if(quest.minPlayerLevel) {
                let requirementB = HelperCreation.createB("quest-dropdown-text", `${I18nHelper.get("pages.quests.quest.body.requirements.level")} ${quest.minPlayerLevel}`)

                if(AppConfigUtils.getAppConfig().userSettings.isLevelRequired()) {
                    if(quest.minPlayerLevel <= PlayerProgressionUtils.getPlayerLevel()) {
                        requirementB.classList.add("quest-dropdown-text-reached");
                    } else {
                        requirementB.classList.add("quest-dropdown-text-not-reached");
                    }
                }
                
                requirementDiv.appendChild(requirementB)
            }
            if(quest.unlockHoursDelay) {
                let delay = HelperCreation.createB("quest-dropdown-text quest-dropdown-text-fail", `${I18nHelper.get("pages.quests.quest.body.requirements.delay")} ~${quest.unlockHoursDelay} ${I18nHelper.get("pages.quests.quest.body.requirements.hours")}`)
                requirementDiv.appendChild(delay)
            }
            if(quest.progressionType) {
                let progressionType = HelperCreation.createB("quest-dropdown-text quest-dropdown-text-fail", `${I18nHelper.get("pages.quests.quest.body.requirements.type")} ${quest.progressionType}`)
                requirementDiv.appendChild(progressionType)
            }
            if(quest.factionName && quest.factionName !== "Any") {
                let faction = HelperCreation.createB("quest-dropdown-text quest-dropdown-text-fail", `${quest.factionName} ${I18nHelper.get("pages.quests.quest.body.requirements.faction")}`)
                requirementDiv.appendChild(faction)
            }
            if(quest.gameEdition) {
                let gameEdition = HelperCreation.createB("quest-dropdown-text quest-dropdown-text-fail", `${I18nHelper.get("pages.quests.quest.body.requirements.leeditionvel")} ${quest.gameEdition}`)
                requirementDiv.appendChild(gameEdition);
            }
        }

        parentDiv.appendChild(requirementDiv)
    }

    private static createEditRequirementLevel(container:HTMLElement, quest:Quest) {
        const wrapper = HelperCreation.createDiv("", "quest-edit-requirement-wrapper", ""); 

        let requirementB = HelperCreation.createB("quest-dropdown-text", I18nHelper.get("pages.quests.quest.body.requirements.level"));
        wrapper.appendChild(requirementB);

        const input = HelperCreation.createInput("", "", "item-amount-input");
        input.placeholder = String(quest.minPlayerLevel);
        wrapper.appendChild(input);
        QuestEditController.registerLevelController(quest.id, input, quest.minPlayerLevel)

        container.appendChild(wrapper);
    }

    private static createEditRequirementHoursDelay(container:HTMLElement, quest:Quest) {
        const wrapper = HelperCreation.createDiv("", "quest-edit-requirement-wrapper", ""); 

        let requirementB = HelperCreation.createB("quest-dropdown-text", I18nHelper.get("pages.quests.quest.body.requirements.edit.delay"));
        wrapper.appendChild(requirementB);

        const input = HelperCreation.createInput("", "", "item-amount-input");
        input.placeholder = String(quest.unlockHoursDelay ?? "0");
        wrapper.appendChild(input);
        QuestEditController.registerUnlockDelayController(quest.id, input, quest.unlockHoursDelay)

        container.appendChild(wrapper);
    }

    private static createEditRequirementProgressionType(container:HTMLElement, quest:Quest) {
        const wrapper = HelperCreation.createDiv("", "quest-edit-requirement-wrapper", "");

        const text = HelperCreation.createB("quest-dropdown-text", I18nHelper.get("pages.quests.quest.body.requirements.edit.type"))
        wrapper.appendChild(text);

        const progessionTypeDropdown = document.createElement("select");
        progessionTypeDropdown.id = "quest-edit-selector";
        progessionTypeDropdown.classList.add("centered");
        progessionTypeDropdown.classList.add("quest-edit-dropdown");
        ProgressionTypesList.forEach(progressionType => {
            if(progressionType.storedString === quest.progressionType) {
                progessionTypeDropdown.appendChild(new Option(progressionType.displayedName, progressionType.storedString, true, true));
            } else {
                progessionTypeDropdown.appendChild(new Option(progressionType.displayedName, progressionType.storedString));
            }
        })

        QuestEditController.registerProgressionTypeController(progessionTypeDropdown, quest.id);

        wrapper.appendChild(progessionTypeDropdown);

        container.appendChild(wrapper);
    }

    private static createEditRequirementFactionName(container:HTMLElement, quest:Quest) {
        const wrapper = HelperCreation.createDiv("", "quest-edit-requirement-wrapper", "");

        const text = HelperCreation.createB("quest-dropdown-text", I18nHelper.get("pages.quests.quest.body.requirements.edit.faction"))
        wrapper.appendChild(text);

        const factionDropdown = document.createElement("select");
        factionDropdown.id = "quest-edit-selector";
        factionDropdown.classList.add("centered");
        factionDropdown.classList.add("quest-edit-dropdown");
        FactionList.forEach(faction => {
            if(faction === quest.factionName) {
                factionDropdown.appendChild(new Option(faction, faction, true, true));
            } else {
                factionDropdown.appendChild(new Option(faction, faction));
            }
        })

        QuestEditController.registerFactionController(factionDropdown, quest.id);

        wrapper.appendChild(factionDropdown);

        container.appendChild(wrapper);
    }

    private static createEditRequirementGameEdition(container:HTMLElement, quest:Quest) {
        const wrapper = HelperCreation.createDiv("", "quest-edit-requirement-wrapper", "");

        const text = HelperCreation.createB("quest-dropdown-text", I18nHelper.get("pages.quests.quest.body.requirements.edit.edition"))
        wrapper.appendChild(text);

        const gameEditionDropdown = document.createElement("select");
        gameEditionDropdown.id = "quest-edit-selector";
        gameEditionDropdown.classList.add("centered");
        gameEditionDropdown.classList.add("quest-edit-dropdown");
        GameEditionList.forEach(gameEdition => {
            if(gameEdition.normalizedName === quest.gameEdition) {
                gameEditionDropdown.appendChild(new Option(gameEdition.name, gameEdition.normalizedName, true, true));
            } else {
                gameEditionDropdown.appendChild(new Option(gameEdition.name, gameEdition.normalizedName));
            }
        })

        QuestEditController.registerGameEditionController(gameEditionDropdown, quest.id);

        wrapper.appendChild(gameEditionDropdown);

        container.appendChild(wrapper);
    }

    private static createQuestItemRepDiv(item_text:string, color:string, traderId:string, text:string) {
        let container = HelperCreation.createDiv("", "quest-item-image-div", "")
        let questImage = HelperCreation.createImage("", "quest-item-img", "", "")
        this.addImage(questImage, TraderMapper.getImageFromTraderId(traderId), 2);

        let questText = HelperCreation.createB("quest-item-rep-text " + color, item_text)
        questImage.style.borderRadius = "50px"
        let questImageDescriptionDiv = HelperCreation.createDiv("", "quest-item-description-div", "")
        let questImageDescriptionB = HelperCreation.createB("quest-item-description quest-dropdown-text", text)
        questImageDescriptionDiv.appendChild(questImageDescriptionB)

        container.appendChild(questImage)
        container.appendChild(questText)
        container.appendChild(questImageDescriptionDiv)

        return container
    }


    private static createSolidLineWithTitle(title:string): HTMLElement {
        let parent = HelperCreation.createDiv("", "solid-line-title-parent", "")
        let titleDiv = HelperCreation.createDiv("", "solid-line-title-div", "")

        let lineDiv = HelperCreation.createDiv("", "solid-line-div", "")
        lineDiv.appendChild(this.createSolidLineChild("solid-line-child"))
        parent.appendChild(lineDiv)

        let titleText = HelperCreation.createB("solid-line-title-text", title)
        titleDiv.appendChild(titleText)
        parent.appendChild(titleDiv)

        return parent
    }

    private static createSolidLineChild(_class:string): HTMLElement {
        return HelperCreation.createDiv("", _class, "")
    }

    // TODO: Move to controller
    // private static createQuestButtonEventListener(button: HTMLElement) {
    //     button.addEventListener('click', e => {
    //         this.handleCheckboxQuestActivation(e)
    //     })
    // }

    // // TODO: This is the controller, but we need to change the way it works
    // private handleCheckboxQuestActivation(e) {
    //     if(e.target instanceof HTMLInputElement) {
    //         let questUUID = (e.target as HTMLInputElement).getAttribute('id');
    //         let questState = (e.target as HTMLInputElement).checked
    //         QuestHandler.setActiveQuest(questUUID, questState)

    //         let event:Map<string, Object> = new Map<string, Object>();
    //         let data:Map<string, boolean> = new Map<string, boolean>();
    //         data.set(questUUID, questState)
    //         event.set(DataEventConst.QUEST_ACTIVATION, data)
    //         this.notify(event)
    //     }
    // }


}