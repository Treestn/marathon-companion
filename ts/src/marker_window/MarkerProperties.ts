import { IFrame } from "../IFrame";
import { ChildFilter, FilterConst, LootConst, QuestsConst } from "../escape-from-tarkov/constant/FilterConst";
import { UuidGenerator } from "../escape-from-tarkov/service/helper/UuidGenerator";
import { FilterElementsData, ListElementEntity, ListElementEntityImpl } from "../model/IFilterElements";
import { IMapMediator } from "../escape-from-tarkov/page/map/mediator/IMapMediator";
import { FloorUtils } from "../escape-from-tarkov/page/map/utils/FloorUtils";
import { IconComponent } from "../escape-from-tarkov/page/map/components/impl/IconComponent";
import { MapRequest } from "../escape-from-tarkov/page/map/handlers/request/impl/MapRequest";
import { EventConst } from "../escape-from-tarkov/events/EventConst";
import { DataEventConst } from "../escape-from-tarkov/events/DataEventConst";
import { QuestsUtils } from "../escape-from-tarkov/page/quests/utils/QuestsUtils";
import { QuestIconComponent } from "../escape-from-tarkov/page/map/components/impl/QuestIconComponent";
import { PlayerProgressionUtils } from "../escape-from-tarkov/utils/PlayerProgressionUtils";
import { IIconComponent } from "../escape-from-tarkov/page/map/components/type/IIconComponent";
import { EditSession } from "../escape-from-tarkov/page/quests/edit/EditSession";
import { FileUtils } from "../escape-from-tarkov/utils/FileUtils";
import { EditableQuest } from "../escape-from-tarkov/page/quests/edit/EditableQuest";
import { HelperCreation } from "../escape-from-tarkov/service/MainPageCreator/HelperCreation";
import { LogoPathConst } from "../escape-from-tarkov/constant/ImageConst";
import { AppConfigUtils } from "../escape-from-tarkov/utils/AppConfigUtils";
import { I18nHelper } from "../locale/I18nHelper";
import { FilterAdapter } from "../adapter/FilterAdapter";
import { QuestLocales } from "../model/IQuestsElements";

export class MarkerProperties extends IFrame {

    
    private static currentFilter:string = LootConst.AMMO_CRATE.name;
    private mediator:IMapMediator;
    private imageApproved:boolean = false;
    private imageMandatory:boolean = false;

    private removedImages:string[] = []
    private isEditingIcon:boolean = false;
    private hleName:string;
    private elementName:string;
    private entity:ListElementEntity

    constructor(mediator:IMapMediator, mouseEvent:MouseEvent, originalComponent?:IconComponent) {
        super("marker-properties-window-frame", "./marker_properties.html")
        this.mediator = mediator;
        this.frame.addEventListener("load", () => {
            this.init(mouseEvent, originalComponent);
            // this.registerListeners(this.frame);
        })
    }

    async init(mouseEvent:MouseEvent, originalComponent?:IconComponent) {
        I18nHelper.init();

        this.initIcon(originalComponent, mouseEvent)
        if(this.isEditingIcon) {
            MarkerProperties.setCurrentMarker(originalComponent.element.name);
        }
        const iconTypeSelector = this.initIconSelector()
        const descriptionInput = this.initDescriptionInput();
        const questSelectorWrapper = this.initQuestSelectorWrapper();
        const questObjectiveSelectorWrapper = this.initQuestObjectiveSelectorWrapper();
        const screenshotButton = this.initScreenshotComponent();
        const imagesWrapper = this.initUploadedImagesWrapper();
        this.initQuestSelector();
        const applyButton = this.initApplyButton();

        let blobsList:{blob:Blob, filePath:string}[] = this.initBlobList();

        this.refreshApplyButton();

        this.registerFilterDropdownListener(iconTypeSelector, screenshotButton, questSelectorWrapper, questObjectiveSelectorWrapper, applyButton);
        this.registerDescriptionListener(descriptionInput);
        this.registerQuestSelectListener();
        this.registerScreenshotListener(screenshotButton, blobsList);
        this.registerApplyButtonListener(applyButton, blobsList, mouseEvent);
    }

    private initBlobList():{blob:Blob, filePath:string}[] {
        let blobsList:{blob:Blob, filePath:string}[] = [];
        if(this.isEditingIcon) {
            if(this.entity.imageList?.length > 0) {
                for(const image of this.entity.imageList) {
                    blobsList.push({blob:null, filePath: image})
                    this.addImageToUi(image, blobsList);
                }
                 this.imageApproved = true;
            }
        }
        return blobsList
    }

    private initIcon(originalComponent:IconComponent, mouseEvent:MouseEvent) {
        this.entity = new ListElementEntityImpl();
        if(originalComponent) {
            this.entity = Object.assign({}, originalComponent.entity)
            this.isEditingIcon = true;
        } else {
            this.entity.id = UuidGenerator.generateSimpleNumber();
            this.entity.x = mouseEvent.offsetX
            this.entity.y = mouseEvent.offsetY;
            if(mouseEvent.target instanceof HTMLElement &&
                    mouseEvent.target.classList.contains("floor-div")
                    || (mouseEvent.target as HTMLElement).classList.contains("floorLevelImg")) {
                const building = FloorUtils.getBuildingFromFloorId(this.mediator.getFloors(), (mouseEvent.target as HTMLElement).id)
                this.entity.x += building.x
                this.entity.y += building.y
                this.entity.floor = (mouseEvent.target as HTMLElement).id
            }
        }
    }

    private initIconSelector():HTMLSelectElement {
        const filterDefaultPreferenceDropdown:HTMLSelectElement = this.frame.contentWindow.document.getElementById("filterPreferenceDropdown") as HTMLSelectElement;
        if(this.isEditingIcon) {
            filterDefaultPreferenceDropdown.disabled = true
        }
        const filterDefault = MarkerProperties.getCurrentFilter();
        for(const filter in FilterConst) {
            let optgroup:HTMLElement = this.frame.contentWindow.document.createElement("OPTGROUP");
            optgroup.setAttribute('label', filter);
            this.addChildOption(FilterConst[filter].child, filterDefault, optgroup)
            filterDefaultPreferenceDropdown.appendChild(optgroup);
        }
        return filterDefaultPreferenceDropdown;
    }

    private initDescriptionInput():HTMLInputElement {
        const descriptionEl:HTMLInputElement = this.frame.contentWindow.document.getElementById("icon-description-input") as HTMLInputElement;
        if(this.isEditingIcon) {
            (this.frame.contentWindow.document.getElementById("filterPreferenceDropdown") as HTMLSelectElement).disabled = true;
            descriptionEl.value = this.entity.description;
        }
        return descriptionEl;
    }

    private initQuestSelectorWrapper():HTMLElement {
        const questSelector = this.frame.contentWindow.document.getElementById("quest-selector");
        if(MarkerProperties.getCurrentFilter() === FilterConst.QUESTS.name) {
            questSelector.style.display = "";
            if(this.isEditingIcon) {
                const dropdown = this.frame.contentWindow.document.getElementById("questSelectorDropdown") as HTMLSelectElement;
                dropdown.disabled = true
            }
        } else {
            questSelector.style.display = "none";
        }
        return questSelector;
    }

    private initQuestObjectiveSelectorWrapper():HTMLElement {
        const questObjectiveSelector = this.frame.contentWindow.document.getElementById("quest-objective-selector");
        if(MarkerProperties.getCurrentFilter() === FilterConst.QUESTS.name) {
            questObjectiveSelector.style.display = "";
            if(this.isEditingIcon) {
                const dropdown = this.frame.contentWindow.document.getElementById("questObjectiveSelectorDropdown") as HTMLSelectElement;
                dropdown.disabled = true
            }
        } else {
            questObjectiveSelector.style.display = "none";
        }
        return questObjectiveSelector;
    }

    private initQuestSelector() {
        this.populateQuestSelector();
        this.refreshQuestObjectiveSelect();
    }

    private initScreenshotComponent():HTMLButtonElement {
        const screenshotComponent = this.frame.contentWindow.document.getElementById("iconScreenshotComponent") as HTMLElement;
        if(!EditSession.isSessionOpen()) {
            screenshotComponent.style.display = "none";
        }
        return this.frame.contentWindow.document.getElementById("icon-screenshot-button") as HTMLButtonElement
    }

    private initUploadedImagesWrapper() {
        const imagesWrapper = this.frame.contentWindow.document.getElementById("uploaded-images-wrapper");
        if(!EditSession.isSessionOpen()) {
            imagesWrapper.style.display = "none";
        }
        return imagesWrapper
    }

    private initApplyButton():HTMLButtonElement {
        const applyButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("apply") as HTMLButtonElement;
        applyButton.textContent = I18nHelper.get("pages.maps.popup.apply");
        return applyButton
    }

    private addChildOption(childFilters:ChildFilter[], filterDefault, filterDefaultPreferenceDropdown) {
        for(const filterConst in childFilters) {
            const filter = childFilters[filterConst];
            
            if(filter.name === filterDefault) {
                let option = new Option(filter.locales?.[I18nHelper.currentLocale()] ?? filter.name, filter.name, true, true);
                filterDefaultPreferenceDropdown.appendChild(option);
            } else {
                filterDefaultPreferenceDropdown.appendChild(new Option(filter.locales?.[I18nHelper.currentLocale()] ?? filter.name, filter.name));
            }
        }
    }

    private registerApplyButtonListener(apply:HTMLButtonElement, blobsList:{blob:Blob, filePath:string}[], mouseEvent:MouseEvent) {
        apply.addEventListener("click", async () => {
            const uuids:string[] = [];
            if(blobsList.length > 0) {
                for(const blob of blobsList) {
                    if(blob.filePath.includes("http")) {
                        continue;
                    }
                    const uuid = UuidGenerator.generate();
                    EditSession.pushNewImageBlob(this.entity.id, blob.filePath, uuid, blob.blob);
                    if(MarkerProperties.getCurrentFilter() !== FilterConst.QUESTS.name) {
                        uuids.push(uuid);
                    }
                }
            }
            this.apply(uuids, mouseEvent);
        })
    }

    private registerFilterDropdownListener(filterPreferenceDropdown:HTMLSelectElement, screenshotComponent:HTMLButtonElement, questWrapper:HTMLElement, objectiveWrapper:HTMLElement, apply:HTMLButtonElement) {
        filterPreferenceDropdown.onchange = (e) => {
            MarkerProperties.setCurrentMarker(filterPreferenceDropdown.value)
            this.hleName = FilterAdapter.getParentFilter(filterPreferenceDropdown.value).name;
            this.elementName = filterPreferenceDropdown.value;

            if(filterPreferenceDropdown.value === FilterConst.QUESTS.name) {
                questWrapper.style.display = "";
                if(EditSession.isSessionOpen()) {
                    screenshotComponent.style.display = "";
                    this.imageMandatory = true;
                } else {
                    this.imageMandatory = false
                }
                const questSelect = this.frame.contentWindow.document.getElementById("questSelectorDropdown") as HTMLSelectElement;
                if(questSelect) {
                    objectiveWrapper.style.display = "";
                    this.refreshQuestObjectiveSelect();
                }
            } else {
                if(EditSession.isSessionOpen()) {
                    screenshotComponent.style.display = "";
                } else {
                    screenshotComponent.style.display = "none";
                }
                questWrapper.style.display = "none"
                objectiveWrapper.style.display = "none";
                this.imageMandatory = false;
                // this.removeOptions(objectiveSelector);
            }
            this.refreshApplyButton();
        }

    }

    private registerDescriptionListener(descriptionInput:HTMLInputElement) {
        descriptionInput.onchange = (e) => {
            if(I18nHelper.currentLocale() === I18nHelper.defaultLocale) {
                this.entity.description = descriptionInput.value;
            }
            if(!this.entity.locales) {
                this.entity.locales = new QuestLocales()
            }
            this.entity.locales[I18nHelper.currentLocale()] = descriptionInput.value;
            this.refreshApplyButton();
        }
    }

    private registerQuestSelectListener() {
        const questSelect = this.frame.contentWindow.document.getElementById("questSelectorDropdown") as HTMLSelectElement;
        questSelect.onchange = (e) => {
            this.entity.questId = questSelect.value;
            const objectiveSelector = this.frame.contentWindow.document.getElementById("quest-objective-selector");
            objectiveSelector.style.display = "";
            this.refreshQuestObjectiveSelect();
            this.refreshApplyButton();
        }
    }

    private registerScreenshotListener(screenshotButton:HTMLButtonElement, blobsList:{blob:Blob, filePath:string}[]) {
        let imageResult:overwolf.utils.OpenFilePickerResult;
        screenshotButton.onclick = async (e) => {
            imageResult = await FileUtils.openSelectFileDialog(
                AppConfigUtils.getAppConfig().userSettings.getPreferredImageUploadPath(), 
                ".png"
            );
            screenshotButton.style.backgroundColor = "red"
            let text:string = "Select From File, Max 8MB, 16/9";
            if(imageResult.success) {
                this.saveFolderPath(imageResult.file);

                const imageBlobResult:Blob | string = await this.getImageBlob(imageResult);
                if(imageBlobResult instanceof Blob) {
                    this.imageApproved = true;
                    screenshotButton.style.backgroundColor = "green";
                    this.addImageToUi(imageResult.file, blobsList);
                    blobsList.push({blob: imageBlobResult, filePath: imageResult.file})
                } else {
                    text = imageBlobResult;
                }
            } else {
                text = "Image could not be loaded"
            }
            if(this.imageMandatory && blobsList.length === 0) {
                this.imageApproved = false;
            }
            this.refreshApplyButton();
            screenshotButton.textContent = text
        }
    }

    private async getImageBlob(imageResult:overwolf.utils.OpenFilePickerResult):Promise<Blob | string> {
        const fileBinary = await FileUtils.getFileBinaryArray(imageResult.file);
        if(fileBinary.success) {

            const byteArray = new Uint8Array(fileBinary.content);
            const blob = new Blob([byteArray], {type: "image/png"});
            if(!(blob.size <= (8 * 1024 * 1024))) {
                return "Image exceeds 8MB";
            }

            const is16by9 = await this.isImage16by9(blob);
            if(!is16by9) {
                return "Image does not respect the 16/9 aspect ratio"
            }

            return blob;

        } else {
            return "Image could not be loaded, do not load from OneDrive"
        }
    }

    private saveFolderPath(folderPath:string) {
        AppConfigUtils.getAppConfig().userSettings.setPreferredImageUploadPath(folderPath.substring(0, folderPath.lastIndexOf("\\") + 1));
        AppConfigUtils.save();
    }

    private addImageToUi(path:string, blobsList:{blob:Blob, filePath:string}[]) {
        const uploadedImageWrapper = this.frame.contentWindow.document.getElementById("uploaded-images-wrapper")

        const wrapper = HelperCreation.createDiv("", "uploaded-image", "");
        const b = HelperCreation.createB("uploaded-image-text", path);
        const image = new Image();
        image.classList.add("uploaded-image-remove-image")
        image.src = LogoPathConst.REMOVE_ICON;

        wrapper.appendChild(b);
        wrapper.appendChild(image);
        this.removeImageController(image, path, blobsList);

        uploadedImageWrapper.appendChild(wrapper);
    }

    private removeImageController(image:HTMLImageElement, path:string, blobsList:{blob:Blob, filePath:string}[]) {
        image.onclick = (e) => {
            let i = 0;
            for(let info of blobsList) {
                if(this.isEditingIcon && path.includes("http")) {
                    this.removedImages.push(path);
                }
                if(info.filePath === path) {
                    blobsList.splice(i, 1);
                    if(blobsList.length === 0) {
                        this.imageApproved = false;
                        this.refreshApplyButton();
                    }
                    image.parentElement.remove();
                    e.stopPropagation();
                    return;
                }
                i++;
            }
        }
    }

    private isImage16by9(blob:Blob):Promise<boolean> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                resolve(Math.abs(aspectRatio - 16 / 9) < 0.01); // Allow minor floating-point differences
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }

    private refreshApplyButton() {
        const applyButton:HTMLButtonElement = this.frame.contentWindow.document.getElementById("apply") as HTMLButtonElement;
        let state = false;
        if(EditSession.isSessionOpen()) {
            const descriptionEl:HTMLInputElement = this.frame.contentWindow.document.getElementById("icon-description-input") as HTMLInputElement;
            if(MarkerProperties.getCurrentFilter() === FilterConst.QUESTS.name && (!this.imageApproved || descriptionEl.value.length <= 0)) {
                state = true;
            }
        }
        if(state) {
            applyButton.textContent = "Please enter all fields"
        } else {
            applyButton.textContent = "Apply"
        }
        applyButton.disabled = state;
    }

    private populateQuestSelector() {
        const questDropdown:HTMLSelectElement = this.frame.contentWindow.document.getElementById("questSelectorDropdown") as HTMLSelectElement
        let defaulted:boolean = true;
        if(this.entity.questId) {
            QuestsUtils.getQuestsTitleMap().forEach((title:string, id:string) => {
                if(id === this.entity.questId) {
                    questDropdown.appendChild(new Option(title, id, true, true));
                } else {
                    questDropdown.appendChild(new Option(title, id));
                }
            })
        } else {
            QuestsUtils.getQuestsTitleMap().forEach((title:string, id:string) => {
                questDropdown.appendChild(new Option(title, id, defaulted, defaulted));
                if(defaulted) {
                    defaulted = false
                }
            })
        }

        if(EditSession.isSessionOpen()) {
            EditSession.getEditedQuests().forEach(questEdit => {
                if(questEdit.isNewQuest()) {
                    questDropdown.appendChild(new Option(questEdit.quest.locales?.[I18nHelper.currentLocale()] ?? questEdit.quest.name, questEdit.getQuestId()));
                }
            })
        }
    }

    private refreshQuestObjectiveSelect() {
        const objectiveSelect:HTMLSelectElement = this.frame.contentWindow.document.getElementById("questObjectiveSelectorDropdown") as HTMLSelectElement
        this.removeOptions(objectiveSelect);
        let found = false;
        let defaulted:boolean = true;
        if(EditSession.isSessionOpen()) {
            EditSession.getEditedQuests().forEach(questEdit => {
                if(questEdit.getQuestId() === this.entity.questId) {
                    questEdit.quest.objectives?.forEach(obj => {
                        let option = new Option(obj.locales?.[I18nHelper.currentLocale()] ?? obj.description, obj.id, defaulted, defaulted);
                        if(defaulted) {
                            defaulted = false
                        }
                        objectiveSelect.appendChild(option);
                    })
                    found = true;
                }
            })
        }
        if(!found) {
            QuestsUtils.getQuestFromID(this.entity.questId)?.objectives.forEach( obj => {
                let option;
                if(obj.questImages) {
                    for(const objImages of obj.questImages) {
                        if(objImages.id === String(this.entity.id)) {
                            option = new Option(obj.locales?.[I18nHelper.currentLocale()] ?? obj.description, obj.id, true, true);
                        }
                    }
                }
                if(!option) {
                    option = new Option(obj.locales?.[I18nHelper.currentLocale()] ?? obj.description, obj.id);
                }
                objectiveSelect.appendChild(option);
            })
        }
    }

    private removeOptions(selectElement:HTMLSelectElement) {
        for(let i = selectElement.options.length - 1; i >= 0; i--) {
           selectElement.remove(i);
        }
     }
    
    static setCurrentMarker(filter:string) {
        this.currentFilter = filter;
    }

    static getCurrentFilter():string {
        return this.currentFilter;
    }

    private apply(uuids:string[], mouseEvent:MouseEvent) {
        const filterPreferenceDropdown:HTMLSelectElement = this.frame.contentWindow.document.getElementById("filterPreferenceDropdown") as HTMLSelectElement;
        if(filterPreferenceDropdown.length !== 0) {
            MarkerProperties.setCurrentMarker(filterPreferenceDropdown.value)
        }

        if(uuids.length > 0) {
            this.entity.imageList = uuids;
        }
        if(this.entity.imageList) {
            let found = false;
            if(MarkerProperties.getCurrentFilter() === QuestsConst.QUESTS.name) {

            } else {
                for(const image of this.removedImages) {
                    if(found) break;
                    for(let i = 0; i < this.entity.imageList.length; i++) {
                        if(this.entity.imageList[i] === image) {
                            this.entity.imageList.splice(i, 1);
                            found = true;
                            break;
                        }
                    }
                }
            }
        }

        let component:IIconComponent;
        let elementProp = {hleName: "", src: "", width: 0, height: 0, centered: false};
        if(!this.isEditingIcon) {
            this.mediator.getFilter().highLevelElements.forEach(hle => {
                hle.elements.forEach(e => {
                    if(e.name === MarkerProperties.currentFilter) {
                        if(e.name === QuestsConst.QUESTS.name) {
                            e.listElements.push(this.entity);
                            let quest = QuestsUtils.getQuestFromID(this.entity.questId)
                            if(!quest) {
                                const editedQuest = EditSession.getModifiedQuest(this.entity.questId);
                                if(editedQuest) {
                                    quest = editedQuest.quest;
                                    this.entity.active = true
                                }
                            } else {
                                this.entity.active = PlayerProgressionUtils.isQuestActive(quest.id)
                            }
                            component = new QuestIconComponent(this.mediator, String(this.entity.id), hle, e, this.entity, quest);
                        } else  {
                            e.listElements.push(this.entity);
                            component = new IconComponent(this.mediator, String(this.entity.id), hle, e, this.entity);
                        }
                        elementProp = {hleName: hle.name, src: e.imagePath, width: e.width, height: e.height, centered: e.centered}
                    }
                })
            })
        } else {
            let found = false;
            for(const hle of this.mediator.getFilter().highLevelElements) {
                if(found) break;
                for(const e of hle.elements) {
                    if(found) break;
                    for(const entity of e.listElements) {
                        if(entity.id === this.entity.id) {
                            elementProp = {hleName: hle.name, src: e.imagePath, width: e.width, height: e.height, centered: e.centered}
                            found = true;
                            break;
                        }
                    }
                }
            }
        }

        this.addEditFilter(this.mediator.getFilter(), elementProp);
        this.removeIconImageFromQuestObjective();
        this.mediator.update(new MapRequest(this.mediator, EventConst.ICON_UPDATE, mouseEvent, component, DataEventConst.ADD_ICON, new Date().getTime()))
        this.close();
    }

    private addEditFilter(map:FilterElementsData, prop:{hleName: string, src:string, width: number, height: number, centered: boolean}) {
        if(EditSession.isSessionOpen()) {
            EditSession.addNewMapFilterElement(map.map, map.mapImagePath, map.width, map.height, prop, MarkerProperties.currentFilter, this.entity)
            this.addIconToQuestObjective();
        }
    }

    private addIconToQuestObjective() {
        if(EditSession.isSessionOpen() && MarkerProperties.getCurrentFilter() === QuestsConst.QUESTS.name) {
            const objectiveDropdown:HTMLSelectElement = this.frame.contentWindow.document.getElementById("questObjectiveSelectorDropdown") as HTMLSelectElement;
            
            let editableQuest = EditSession.getModifiedQuest(this.entity.questId)
            if(!editableQuest) {
                editableQuest = new EditableQuest(QuestsUtils.getQuestFromID(this.entity.questId));
                EditSession.addModifiedQuest(editableQuest);
            }
            if(objectiveDropdown) {
                const imageList:string[] = EditSession.getImageIds(this.entity.id);
                imageList.forEach(imageId => {
                    editableQuest.addIconToObjective(objectiveDropdown.value, String(this.entity.id), this.entity.description, imageId);
                })
            }
        }
    }

    private removeIconImageFromQuestObjective() {
        if(EditSession.isSessionOpen() && MarkerProperties.getCurrentFilter() === QuestsConst.QUESTS.name) {
            const objectiveDropdown:HTMLSelectElement = this.frame.contentWindow.document.getElementById("questObjectiveSelectorDropdown") as HTMLSelectElement;
            
            let editableQuest = EditSession.getModifiedQuest(this.entity.questId)
            if(!editableQuest) {
                editableQuest = new EditableQuest(QuestsUtils.getQuestFromID(this.entity.questId));
                EditSession.addModifiedQuest(editableQuest);
            }
            if(objectiveDropdown) {
                this.removedImages.forEach(imagePath => {
                    editableQuest.removeIconImageFromObjective(String(this.entity.id), imagePath);
                })
            }
        }
    }
}