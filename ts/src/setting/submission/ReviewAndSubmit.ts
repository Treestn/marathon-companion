import { LogoPathConst } from "../../escape-from-tarkov/constant/ImageConst";
import { Quest } from "../../model/IQuestsElements";
import { EditSession } from "../../escape-from-tarkov/page/quests/edit/EditSession";
import { QuestsUtils } from "../../escape-from-tarkov/page/quests/utils/QuestsUtils";
import { HelperCreation } from "../../escape-from-tarkov/service/MainPageCreator/HelperCreation";
import { IFrame } from "../../IFrame";
import { RemovedMapIcon } from "../../model/SubmissionRequest";
import { NavigationController } from "../../escape-from-tarkov/page/side-bar-menu/controller/NavigationController";
import { HideoutCrafts, HideoutStations } from "../../model/HideoutObject";
import { HideoutUtils } from "../../escape-from-tarkov/page/hideout/utils/HideoutUtils";
import { I18nHelper } from "../../locale/I18nHelper";

export class ReviewAndSubmit extends IFrame {

    private static _instance:ReviewAndSubmit;

    private constructor() {
        super("review-and-submit-frame", "./review_and_submit.html")
        this.frame.addEventListener("load", () => {
            this.init()
            this.registerListeners()
        })
    }

    async init() {
        const scrollDiv:HTMLElement = this.frame.contentWindow.document.getElementById("submissionReviewContent");
        if(scrollDiv) {
            const wrapper = HelperCreation.createDiv("", "scroll-content-wrapper", "");

            const newQuest = this.addNewQuests();
            if(newQuest) {
                wrapper.appendChild(newQuest);
            }

            const modifiedQuest = this.addModifiedQuests();
            if(modifiedQuest) {
                wrapper.appendChild(modifiedQuest);
            }

            const removedQuests = this.addRemovedQuests();
            if(removedQuests) {
                wrapper.appendChild(removedQuests)
            }

            const modifiedStations = this.addModifiedHideoutStations();
            if(modifiedStations) {
                wrapper.appendChild(modifiedStations);
            }

            const addedCrafts = this.addNewHideoutCrafts();
            if(addedCrafts) {
                wrapper.appendChild(addedCrafts);
            }

            const modifiedCrafts = this.addModifiedHideoutCrafts();
            if(modifiedCrafts) {
                wrapper.appendChild(modifiedCrafts);
            }

            const removedCrafts = this.addRemovedCrafts();
            if(removedCrafts) {
                wrapper.appendChild(removedCrafts);
            }

            const addedMapIcons = this.addAddedMapIcons();
            if(addedMapIcons) {
                wrapper.appendChild(addedMapIcons);
            }

            const removedMapIcons = this.addRemovedMapIcons();
            if(removedMapIcons) {
                wrapper.appendChild(removedMapIcons);
            }

            const uploadImage = this.addUploadImages();
            if(uploadImage) {
                wrapper.appendChild(uploadImage);
            }

            scrollDiv.appendChild(wrapper);
        }
    }

    public static instance() {
        if(!ReviewAndSubmit._instance) {
            ReviewAndSubmit._instance = new ReviewAndSubmit();
        }
        return ReviewAndSubmit._instance
    }

    registerListeners() {
        const submit:HTMLButtonElement = this.frame.contentWindow.document.getElementById("submit") as HTMLButtonElement;
        submit.textContent = I18nHelper.get("pages.reviewAndSubmit.submit.title")
        if(submit) {
            submit.onclick = async(e) => {
                submit.disabled = true;

                this.resolveQuestSubmission(true, "loading");
                const submitResult:string = await EditSession.submit();
                this.resolveQuestSubmission(this.isValidUUID(submitResult));
                if(this.isValidUUID(submitResult)) {
                    let success = true;
                    const imageList = EditSession.getImages();
                    for(let i = imageList.length - 1; i >= 0; i--) {
                        this.resolveImageUpload(true, imageList[i].imageId, "loading");
                        const imageResult = await EditSession.uploadImage(submitResult, imageList[i].imageId);
                        if(!imageResult) {
                            success = false;
                        }
                        this.resolveImageUpload(imageResult, imageList[i].imageId);
                    }
    
                    if(success) {
                        this.applySuccessButton(submit);
                        return;
                    }
                }
                this.applyFailedSubmissionUpload(submit);
            }
            
        }
    }

    private isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    private applySuccessButton(submit:HTMLButtonElement) {
        const closeButton = HelperCreation.createButton("submit", "button", "", "", I18nHelper.get("pages.reviewAndSubmit.submit.success"));
        closeButton.style.backgroundColor = "#5d6a5a";
        submit.style.display = "none";
        submit.parentElement.appendChild(closeButton);
        submit.remove();
        closeButton.onclick = (e) => {
            NavigationController.disableEditMode();
            this.close();
        }
    }

    private applyFailedSubmissionUpload(submit:HTMLButtonElement) {
        const closeButton = HelperCreation.createButton("submit", "button", "", "", I18nHelper.get("pages.reviewAndSubmit.submit.failure"));
        closeButton.style.backgroundColor = "rgb(109 73 73)";
        submit.style.display = "none";
        submit.parentElement.appendChild(closeButton);
        submit.remove();
        closeButton.onclick = (e) => {
            NavigationController.disableEditMode();
            this.close();
        }
    }

    private resolveQuestSubmission(result:boolean, type?:string) {
        const list = this.frame.contentWindow.document.getElementsByClassName("quest-uplaod-status-type");
        for(const element of list) {
            if(element instanceof HTMLElement) {
                this.removeChildNodes(element)

                if(result) {
                    const image = new Image();
                    image.src = type === "loading" ? LogoPathConst.LOADING_ICON : LogoPathConst.CHECKMARK_ICON;
                    image.classList.add("quest-modification-type-image");
                    element.appendChild(image);
                    if(type !== "loading") {
                        EditSession.questSubmissionCompleted();
                    }
                } else {
                    const image = new Image();
                    image.src = LogoPathConst.REMOVE_ICON;
                    image.classList.add("quest-modification-type-image");
                    element.appendChild(image);
                }
            }
        }
    }

    private resolveImageUpload(result:boolean, imageId:string, type?:string) {
        const imageResult = this.frame.contentWindow.document.getElementById(imageId+"Resolved");
        if(imageResult) {
            this.removeChildNodes(imageResult)

            if(result) {
                const image = new Image();
                image.src = type === "loading" ? LogoPathConst.LOADING_ICON : LogoPathConst.CHECKMARK_ICON;
                image.classList.add("quest-modification-type-image");
                imageResult.appendChild(image);
                if(type !== "loading") {
                    EditSession.removeImageBlobWithImageId(imageId);
                }
            } else {
                const image = new Image();
                image.src = LogoPathConst.REMOVE_ICON;
                image.classList.add("quest-modification-type-image");
                imageResult.appendChild(image);
            }
        }
    }

    private removeChildNodes(parent: HTMLElement) {
        let _childs = parent.children
        Array.from(_childs).forEach(child => {
            if(child.getAttribute('class') != "ammo-type-header-container"){
                child.remove()
            }
        })
    }  

    private addNewQuests():HTMLElement{
        const wrapper = HelperCreation.createDiv("", "edit-section-wrapper", "");

        const header = this.createEditHeader(I18nHelper.get("pages.reviewAndSubmit.newQuests"));
        const image = new Image();
        image.src = LogoPathConst.ADDED_ICON;
        image.classList.add("quest-modification-type-image");
        header.insertBefore(image, header.firstChild);
        wrapper.appendChild(header);

        for(const editableQuest of EditSession.getEditedQuests()) {
            if(editableQuest.isNewQuest()) {
                const questContent = this.createQuestField(editableQuest.quest, true);
                wrapper.appendChild(questContent);
            }
        }

        return this.addNoneContentIfNeeded(wrapper);
    }

    private addNewHideoutCrafts():HTMLElement {
        const wrapper = HelperCreation.createDiv("", "edit-section-wrapper", "");

        const header = this.createEditHeader(I18nHelper.get("pages.reviewAndSubmit.newCrafts"));
        const image = new Image();
        image.src = LogoPathConst.ADDED_ICON;
        image.classList.add("quest-modification-type-image");
        header.insertBefore(image, header.firstChild);
        wrapper.appendChild(header);

        const map:Map<string, number> = new Map();
        for(const editableCraft of EditSession.getEditedHideoutCrafts()) {
            if(editableCraft.isNewCraft()) {
                const id = editableCraft.craft.station.id + "-" + editableCraft.craft.level
                if(map.has(id)) {
                    map.set(id, map.get(id) + 1)
                } else {
                    map.set(id, 1)
                }
            }
        }
        map.forEach((value, key) => {
            const station = HideoutUtils.getStationWithLevelId(key);
            const level = HideoutUtils.getStationLevelWithId(key);

            const hideoutContent = this.createHideoutCraftField(station.locales?.[I18nHelper.currentLocale()] ?? station.name, String(level.level), String(value));
            wrapper.appendChild(hideoutContent);
        })

        return this.addNoneContentIfNeeded(wrapper);
    }

    private addModifiedQuests() :HTMLElement{
        const wrapper = HelperCreation.createDiv("", "edit-section-wrapper", "");

        const header = this.createEditHeader(I18nHelper.get("pages.reviewAndSubmit.modifiedQuests"));
        const image = new Image();
        image.src = LogoPathConst.ADDED_ICON;
        image.classList.add("quest-modification-type-image");
        header.insertBefore(image, header.firstChild);
        wrapper.appendChild(header);

        for(const editableQuest of EditSession.getEditedQuests()) {
            if(!editableQuest.isNewQuest() && editableQuest.hasBeenChanged()) {
                const questContent = this.createQuestField(editableQuest.quest, false);
                wrapper.appendChild(questContent);
            }
        }

        return this.addNoneContentIfNeeded(wrapper);
    }

    private addModifiedHideoutStations() :HTMLElement{
        const wrapper = HelperCreation.createDiv("", "edit-section-wrapper", "");

        const header = this.createEditHeader(I18nHelper.get("pages.reviewAndSubmit.modifiedHideout"));
        const image = new Image();
        image.src = LogoPathConst.ADDED_ICON;
        image.classList.add("quest-modification-type-image");
        header.insertBefore(image, header.firstChild);
        wrapper.appendChild(header);

        for(const editableHideout of EditSession.getEditedHideoutStations()) {
            if(editableHideout.hasBeenChanged()) {
                const hideoutContent = this.createHideoutStationField(editableHideout.hideout);
                wrapper.appendChild(hideoutContent);
            }
        }

        return this.addNoneContentIfNeeded(wrapper);
    }

    private addModifiedHideoutCrafts() :HTMLElement{
        const wrapper = HelperCreation.createDiv("", "edit-section-wrapper", "");

        const header = this.createEditHeader(I18nHelper.get("pages.reviewAndSubmit.modifiedCrafts"));
        const image = new Image();
        image.src = LogoPathConst.ADDED_ICON;
        image.classList.add("quest-modification-type-image");
        header.insertBefore(image, header.firstChild);
        wrapper.appendChild(header);

        const map:Map<string, number> = new Map();
        for(const editableCraft of EditSession.getEditedHideoutCrafts()) {
            if(!editableCraft.isNewCraft() && editableCraft.hasBeenChanged()) {
                const id = editableCraft.craft.station.id + "-" + editableCraft.craft.level
                if(map.has(id)) {
                    map.set(id, map.get(id) + 1)
                } else {
                    map.set(id, 1)
                }
            }
        }
        map.forEach((value, key) => {
            const station = HideoutUtils.getStationWithLevelId(key);
            const level = HideoutUtils.getStationLevelWithId(key);

            const hideoutContent = this.createHideoutCraftField(station.locales?.[I18nHelper.currentLocale()] ?? station.name, String(level.level), String(value));
            wrapper.appendChild(hideoutContent);
        })

        return this.addNoneContentIfNeeded(wrapper);
    }

    private addRemovedQuests() :HTMLElement{
        const wrapper = HelperCreation.createDiv("", "edit-section-wrapper", "");

        const header = this.createEditHeader(I18nHelper.get("pages.reviewAndSubmit.removedQuests"));
        const image = new Image();
        image.src = LogoPathConst.REMOVED_ICON;
        image.classList.add("quest-modification-type-image");
        header.insertBefore(image, header.firstChild);
        wrapper.appendChild(header);

        for(const removedQuests of EditSession.getRemovedQuests()) {
            const questContent = this.createQuestField(QuestsUtils.getQuestFromID(removedQuests), false, true);
            wrapper.appendChild(questContent);
        }

        return this.addNoneContentIfNeeded(wrapper);
    }

    private addAddedMapIcons() :HTMLElement{
        const wrapper = HelperCreation.createDiv("", "edit-section-wrapper", "");

        const header = this.createEditHeader(I18nHelper.get("pages.reviewAndSubmit.addedIcons"));
        const image = new Image();
        image.src = LogoPathConst.ADDED_ICON;
        image.classList.add("quest-modification-type-image");
        header.insertBefore(image, header.firstChild);
        wrapper.appendChild(header);

        for(const mapFilter of EditSession.getMapEdit()) {
            mapFilter.getMapFilter().highLevelElements.forEach(hle => {
                if(hle.elements) {
                    hle.elements.forEach(element => {
                        if(element.listElements && element.listElements.length > 0) {
                            const iconContent = this.createIconField(mapFilter.getMapFilter().map, element.listElements.length, false, element.name);
                            wrapper.appendChild(iconContent);
                        }
                    })
                }
            })
        }

        return this.addNoneContentIfNeeded(wrapper);
    }

    private addRemovedMapIcons() :HTMLElement{
        const wrapper = HelperCreation.createDiv("", "edit-section-wrapper", "");

        const header = this.createEditHeader(I18nHelper.get("pages.reviewAndSubmit.removedIcons"));
        const image = new Image();
        image.src = LogoPathConst.REMOVED_ICON;
        image.classList.add("quest-modification-type-image");
        header.insertBefore(image, header.firstChild);
        wrapper.appendChild(header);

        const map:Map<string, RemovedMapIcon[]> = new Map();
        for(const removedIcon of EditSession.getRemovedIcons()) {
            if(!map.has(removedIcon.map)) {
                map.set(removedIcon.map, []);
            }
            map.get(removedIcon.map).push(removedIcon)
        }
        map.forEach((value, key) => {
            value.forEach(mapFilter => {
                mapFilter.iconTypes.forEach(iconType => {
                    const mapIconField = this.createIconField(key, iconType.iconIds.length, true, iconType.type);
                    wrapper.appendChild(mapIconField);
                })
            })
        })

        return this.addNoneContentIfNeeded(wrapper);
    }

    private addRemovedCrafts() :HTMLElement{
        const wrapper = HelperCreation.createDiv("", "edit-section-wrapper", "");

        const header = this.createEditHeader(I18nHelper.get("pages.reviewAndSubmit.removedCrafts"));
        const image = new Image();
        image.src = LogoPathConst.REMOVED_ICON;
        image.classList.add("quest-modification-type-image");
        header.insertBefore(image, header.firstChild);
        wrapper.appendChild(header);

        if(EditSession.getRemovedHideoutCrafts().length > 0) {
            const map:Map<string, number> = new Map();
            for(const removedCrafts of EditSession.getRemovedHideoutCrafts()) {
                const parts = removedCrafts.split("-");
                const id = parts[0] + "-" + parts[1];
                // const station = HideoutUtils.getStation(parts[0]);
                // const hideoutLevel = HideoutUtils.getStationLevelWithId(parts[0] + "-" + parts[1])
                if(map.has(id)) {
                    map.set(id, map.get(id) + 1)
                } else {
                    map.set(id, 1)
                }
            }
            map.forEach((value, key) => {
                const station = HideoutUtils.getStationWithLevelId(key);
                const level = HideoutUtils.getStationLevelWithId(key);
    
                const hideoutContent = this.createHideoutCraftField(station.locales?.[I18nHelper.currentLocale()] ?? station.name, String(level.level), String(value));
                wrapper.appendChild(hideoutContent);
            })
        }

        return this.addNoneContentIfNeeded(wrapper);
    }

    private addUploadImages() :HTMLElement{
        const wrapper = HelperCreation.createDiv("", "edit-section-wrapper", "");

        const header = this.createEditHeader(I18nHelper.get("pages.reviewAndSubmit.imageToUplaod"));
        const image = new Image();
        image.src = LogoPathConst.ADDED_ICON;
        image.classList.add("quest-modification-type-image");
        header.insertBefore(image, header.firstChild);
        wrapper.appendChild(header);

        const imageList = EditSession.getImages();
        for(let i = imageList.length - 1; i >= 0; i--) {
            const imageContent = this.createImageUploadField(imageList[i].imageId, imageList[i].imagePath);
            wrapper.appendChild(imageContent);
        }

        return this.addNoneContentIfNeeded(wrapper);
    }

    private addNoneContentIfNeeded(wrapper:HTMLElement) {
        return wrapper.children.length <= 1 ? null : wrapper;
        // if(wrapper.children.length <= 1) {
        //     const textWrapper = HelperCreation.createDiv("", "quest-content-div quest-content-info", "");
        //     const text = HelperCreation.createB("edit-text-field-content", I18nHelper.get("pages.reviewAndSubmit.none"));
        //     text.style.color = "#5b5b5b"
        //     textWrapper.appendChild(text);
        //     wrapper.appendChild(textWrapper);
        // }
    }

    private createEditHeader(name:string) {
        const wrapper = HelperCreation.createDiv("", "edit-header-wrapper", "");

        const text = HelperCreation.createB("edit-header-text", name);
        wrapper.appendChild(text);

        return wrapper;
    }

    private createQuestField(quest:Quest, isNew:boolean, removed?:boolean):HTMLElement {
        const wrapper = HelperCreation.createDiv(quest.id, "quest-content-div quest-content-info", "");
        
        const imageWrapper = HelperCreation.createDiv("", "quest-modification-type-wrapper", "");
        wrapper.appendChild(imageWrapper);

        const text = HelperCreation.createB("edit-text-field-content", quest.locales?.[I18nHelper.currentLocale()] ?? quest.name);
        wrapper.appendChild(text);

        const uploadStatusWrapper = HelperCreation.createDiv("", "upload-status-type-wrapper quest-uplaod-status-type", "");
        
        wrapper.appendChild(uploadStatusWrapper);

        return wrapper;
    }

    private createRemoveCraftField(number:number):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "quest-content-div quest-content-info", "");
        
        const imageWrapper = HelperCreation.createDiv("", "quest-modification-type-wrapper", "");
        wrapper.appendChild(imageWrapper);

        const text = HelperCreation.createB("edit-text-field-content", String(number));
        wrapper.appendChild(text);

        const uploadStatusWrapper = HelperCreation.createDiv("", "upload-status-type-wrapper quest-uplaod-status-type", "");
        
        wrapper.appendChild(uploadStatusWrapper);

        return wrapper;
    }

    private createHideoutStationField(hideoutStation:HideoutStations):HTMLElement {
        const wrapper = HelperCreation.createDiv(hideoutStation.id, "quest-content-div quest-content-info", "");
        
        const imageWrapper = HelperCreation.createDiv("", "quest-modification-type-wrapper", "");
        wrapper.appendChild(imageWrapper);

        const text = HelperCreation.createB("edit-text-field-content", hideoutStation.locales?.[I18nHelper.currentLocale()] ?? hideoutStation.name);
        wrapper.appendChild(text);

        const uploadStatusWrapper = HelperCreation.createDiv("", "upload-status-type-wrapper quest-uplaod-status-type", "");
        
        wrapper.appendChild(uploadStatusWrapper);

        return wrapper;
    }

    private createHideoutCraftField(stationName:string, stationLevel:string, count:string):HTMLElement {
        const wrapper = HelperCreation.createDiv(stationName+stationLevel, "quest-content-div quest-content-info", "");
        
        const imageWrapper = HelperCreation.createDiv("", "quest-modification-type-wrapper", "");
        wrapper.appendChild(imageWrapper);

        const text = HelperCreation.createB("edit-text-field-content", `${count} ${I18nHelper.get("pages.reviewAndSubmit.crafts")} ${stationName} - ${stationLevel}`);
        wrapper.appendChild(text);

        const uploadStatusWrapper = HelperCreation.createDiv("", "upload-status-type-wrapper quest-uplaod-status-type", "");
        
        wrapper.appendChild(uploadStatusWrapper);

        return wrapper;
    }

    private createIconField(map:string, amount:number, removed?:boolean, type?:string):HTMLElement {
        const wrapper = HelperCreation.createDiv(map + "-" + type ? type : I18nHelper.get("pages.reviewAndSubmit.removed"), "quest-content-div map-content-info", "");

        const imageWrapper = HelperCreation.createDiv("", "quest-modification-type-wrapper", "");
        wrapper.appendChild(imageWrapper)

        const text = HelperCreation.createB("edit-text-field-content", `${amount} ${type} ${I18nHelper.get("pages.reviewAndSubmit.iconsOn")} ${map}`);
        wrapper.appendChild(text);

        const uploadStatusWrapper = HelperCreation.createDiv("", "upload-status-type-wrapper quest-uplaod-status-type", "");
        
        wrapper.appendChild(uploadStatusWrapper);

        return wrapper;
    }

    private createImageUploadField(imageId:string, imagePath:string):HTMLElement {
        const wrapper = HelperCreation.createDiv(imageId, "quest-content-div image-content-info", "");

        const imageWrapper = HelperCreation.createDiv("", "quest-modification-type-wrapper", "");
        wrapper.appendChild(imageWrapper);

        const text = HelperCreation.createB("edit-text-field-content", imagePath);
        wrapper.appendChild(text);

        const uploadStatusWrapper = HelperCreation.createDiv(imageId+"Resolved", "upload-status-type-wrapper", "");
        
        wrapper.appendChild(uploadStatusWrapper);

        return wrapper
    }
}