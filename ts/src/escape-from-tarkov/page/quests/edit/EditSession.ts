import { MapAdapter } from "../../../../adapter/MapAdapter";
import { HideoutCrafts, HideoutLevels, HideoutStations } from "../../../../model/HideoutObject";
import { Elements, FilterElementsData, ListElementEntity, ListElementEntityImpl } from "../../../../model/IFilterElements";
import { Quest } from "../../../../model/quest/IQuestsElements";
import { IconType, RemovedMapIcon, SubmissionRequest } from "../../../../model/SubmissionRequest";
import { TarkovCompanionService } from "../../../service/tarkov-companion-api/handler/TarkovCompanionService";
import { HideoutUtils } from "../../hideout/utils/HideoutUtils";
import { FilterUtils } from "../../map/utils/FilterUtils";
import { EditableHideout } from "./EditableHideout";
import { EditableHideoutCrafts } from "./EditableHideoutCrafts";
import { EditableMapFilter } from "./EditableMapFilter";
import { EditableQuest } from "./EditableQuest";

export class EditSession {

    private static currentQuestEdit:EditableQuest[] = []
    private static currentMapEdit:EditableMapFilter[] = [];
    private static currentHideoutEdit:EditableHideout[] = []
    private static currentHideoutCraftsEdit:EditableHideoutCrafts[] = [];
    private static currentRemovedIcons:RemovedMapIcon[] = [];
    private static currentRemovedQuests:string[] = [];
    private static currentRemovedHideoutCrafts:string[] = [];
    private static sessionOpen:boolean = false;
    private static currentImages:{iconId:number, imagePath:string, imageId:string, blob:Blob}[] = []
    private static reviewButton:HTMLButtonElement;

    static isSessionOpen():boolean {
        return this.sessionOpen;
    }

    static openSession() {
        this.sessionOpen = true;
        this.currentQuestEdit = [];
        this.currentMapEdit = [];
        this.currentHideoutEdit = [];
        this.currentHideoutCraftsEdit = []
        this.currentRemovedIcons = [];
        this.currentRemovedQuests = [];
        this.currentRemovedHideoutCrafts = [];
        this.currentImages = [];
        let reviewButton:HTMLButtonElement = document.getElementById("editReviewButton") as HTMLButtonElement;
        if(reviewButton) {
            this.reviewButton = reviewButton;
        }
    }

    static getEditedQuests():EditableQuest[] {
        const list:EditableQuest[] = []
        for(const editableQuest of this.currentQuestEdit) {
            if(this.isQuestBeingModified(editableQuest.quest.id)) {
                list.push(editableQuest)
            }
        }
        return list;
    }

    static getEditedHideoutStations():EditableHideout[] {
        const list:EditableHideout[] = []
        for(const editableHideout of this.currentHideoutEdit) {
            if(this.isHideoutBeingModified(editableHideout.hideout.id)) {
                list.push(editableHideout)
            }
        }
        return list;
    }

    static getEditedHideoutCrafts():EditableHideoutCrafts[] {
        const list:EditableHideoutCrafts[] = []
        for(const editableCraft of this.currentHideoutCraftsEdit) {
            if(this.isHideoutCraftsBeingModified(editableCraft.craft.station.id, editableCraft.craft.level)) {
                list.push(editableCraft)
            }
        }
        return list;
    }

    static getEditedHideoutCraft(stationId:string, level:number, rewardItems:string[]):EditableHideoutCrafts {
        for(const editableCraft of this.currentHideoutCraftsEdit) {
            if(editableCraft.craft.station.id === stationId && editableCraft.craft.level === level) {
                
                let found = true;
                for(const rewardItem of editableCraft.craft.rewardItems) {
                    if(!rewardItems.includes(rewardItem.item.id)) {
                        found = false;
                    }
                }
                if(found) {
                    return editableCraft;
                }
            }
        }
    }

    static getImages():{iconId:number, imagePath:string, imageId:string, blob:Blob}[] {
        return this.currentImages;
    }

    static getMapEdit():EditableMapFilter[] {
        return this.currentMapEdit;
    }

    static getMapFilterEdit(map:string):FilterElementsData {
        for(const filter of this.currentMapEdit) {
            if(filter.getMapName() === map) {
                return filter.getMapFilter();
            }
        }
        return null;
    }

    static doesMapFilterIconExist(map:string, entityId:number):boolean {
        const filter = this.getMapFilterEdit(map);
        if(filter) {
            for(const hle of filter.highLevelElements) {
                if(hle) {
                    for(const element of hle.elements) {
                        if(element) {
                            for(const entity of element.listElements) {
                                if(entity?.id === entityId) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    static getRemovedIcons():RemovedMapIcon[] {
        return this.currentRemovedIcons;
    }

    static enableReviewButton() {
        if(this.reviewButton.disabled) {
            this.reviewButton.disabled = false;
            this.reviewButton.style.backgroundColor = "#2f5129";
        }
    }

    static isIconRemoved(map:string, iconId:number) {
        for(const removedMapIcon of this.currentRemovedIcons) {
            if(removedMapIcon.map === map) {
               for(const iconType of removedMapIcon.iconTypes) {
                    return iconType.iconIds.includes(iconId);
               }
            }
        }
        return false;
    }

    static getRemovedQuests():string[] {
        return this.currentRemovedQuests;
    }

    static getRemovedHideoutCrafts():string[] {
        return this.currentRemovedHideoutCrafts;
    }

    static pushNewImageBlob(iconId:number, originalName:string, imageId:string, blob:Blob) {
        this.currentImages.push({iconId: iconId, imagePath:originalName, imageId: imageId, blob: blob});
    }

    static getImageIds(iconId:number):string[] {
        const list:string[] = []
        for(const image of this.currentImages) {
            if(image.iconId === iconId) {
                list.push(image.imageId);
            }
        }
        return list
    }

    static removeImageBlobWithImageId(imageId:string) {
        for(let i = 0; i < this.currentImages.length; i++) {
            if(this.currentImages[i].imageId === imageId) {
                this.currentImages.splice(i, 1);
                return;
            }
        }
    }

    static removeImageBlobsWithIconId(iconId:number) {
        for(let i = this.currentImages.length - 1; i >= 0; i--) {
            if(this.currentImages[i].iconId === iconId) {
                this.currentImages.splice(i, 1);
            }
        }
    }

    static getNewQuests():EditableQuest[] {
        const list:EditableQuest[] = []
        for(const quest of this.currentQuestEdit) {
            if(quest.isNewQuest()) {
                list.push(quest)
            }
        }
        return list;
    }

    static mapFilterExists(map:string):boolean {
        for(const filter of this.currentMapEdit) {
            if(filter.getMapName() === map) {
                return true;
            }
        }
        return false;
    }

    static doesRemovedMapFilterExists(map:string) {
        for(const filter of this.currentRemovedIcons) {
            if(filter.map === map) {
                return true;
            }
        }
        return false;
    }

    static getEditableMapFilter(map:string):EditableMapFilter {
        for(const filter of this.currentMapEdit) {
            if(filter.getMapName() === map) {
                return filter;
            }
        }
        return null;
    }

    static addNewMapFilterElement(map:string, path:string, width:number, height:number, prop:{hleName: string, src:string, width: number, height: number, centered: boolean}, elementName:string, elementImpl:ListElementEntity) {
        if(this.mapFilterExists(map)) {
            for(const mapFilterEdit of this.currentMapEdit) {
                if(mapFilterEdit.getMapName() === map) {
                    mapFilterEdit.addEditFilter(prop, elementName, elementImpl);
                    return;
                }
            }
        } else {
            // Map filter does not exists for this map
            const newMapFilter = new EditableMapFilter(map, path, width, height);
            this.currentMapEdit.push(newMapFilter);
            newMapFilter.addEditFilter(prop, elementName, elementImpl);
        }
        this.enableReviewButton()
    }

    static removeMapFilterElement(map:string, entity:ListElementEntity, element:Elements) {
        if(this.mapFilterExists(map)) {
            const removed = this.getEditableMapFilter(map).removeEditFilterElement(entity.id);
            if(removed) {
               return; 
            }
        }
        this.addToRemovedMap(entity, map, element);
    }

    private static addToRemovedMap(entity:ListElementEntity, map:string, element:Elements) {
        if(this.doesRemovedMapFilterExists(map)) {
            for(const mapFilter of this.currentRemovedIcons) {
                if(mapFilter.map === map) {
                    for(const mapFilterType of mapFilter.iconTypes) {
                        if(mapFilterType.type === element.name) {
                            mapFilterType.iconIds.indexOf(entity.id) === -1 ? mapFilterType.iconIds.push(entity.id) : console.log("Trying to add a removed icon but it already exists");
                            return;
                        }
                    }
                    const mapIconType = new IconType(element.name, element.imagePath);
                    mapIconType.iconIds.push(entity.id);
                    mapFilter.iconTypes.push(mapIconType);
                    return;
                }
            }
        } else {
            const mapIconType = new IconType(element.name, element.imagePath);
            mapIconType.iconIds.push(entity.id);

            const removeMapFilter = new RemovedMapIcon(map);
            removeMapFilter.iconTypes.push(mapIconType);

            this.currentRemovedIcons.push(removeMapFilter);
        }
        this.enableReviewButton()
    }

    static isQuestBeingModified(questId:string):boolean {
        for(const quest of EditSession.currentQuestEdit) {
            if(quest.getQuestId() === questId) {
                return true;
            }
        }
        return false;
    }
 
    static addModifiedQuest(editableQuest:EditableQuest) {
        EditSession.currentQuestEdit.push(editableQuest);
    }

    static addRemovedHideoutCraft(stationId:string, level:number, rewardItems:string[]) {
        let removedString = stationId + "-" + level;
        for(const reward of rewardItems) {
            if(reward !== "") {
                removedString += "-" + reward
            }
        }
        this.currentRemovedHideoutCrafts.push(removedString);
        this.enableReviewButton();
    }

    static removeHideoutCraft(stationId:string, level:number, rewardItems:string[]) {
        for(let i = 0; i < this.currentHideoutCraftsEdit.length; i++) {
            if(this.currentHideoutCraftsEdit[i].isNewCraft() 
                && this.currentHideoutCraftsEdit[i].craft.station.id === stationId
                && this.currentHideoutCraftsEdit[i].craft.level === level) {
                
                let matching = true;
                for(const reward of this.currentHideoutCraftsEdit[i].craft.rewardItems) {
                    if(!rewardItems.includes(reward.item.id)) {
                        matching = false;
                    }
                }

                if(matching) {
                    this.currentHideoutCraftsEdit.splice(i, 1);
                    return;
                }
            }
        }
        this.addRemovedHideoutCraft(stationId, level, rewardItems);
    }

    static removeModifiedQuest(questId:string) {
        for(let i = 0; i < this.currentQuestEdit.length; i++) {
            if(this.currentQuestEdit[i].isNewQuest() && this.currentQuestEdit[i].quest.id === questId) {
                this.currentQuestEdit.splice(i, 1);
                return;
            }
        }
        this.currentRemovedQuests.indexOf(questId) === -1 ? this.currentRemovedQuests.push(questId) : console.log("Trying to add a quest to be removed, but it is already in the list");
        this.enableReviewButton();
    }

    static getModifiedQuest(questId:string):EditableQuest {
        for(const quest of EditSession.currentQuestEdit) {
            if(quest.getQuestId() === questId) {
                return quest;
            }
        }
    }

    static isHideoutBeingModified(stationId:string):boolean {
        for(const hideout of EditSession.currentHideoutEdit) {
           if(hideout.hideout.id === stationId) {
                return true;
           }
        }
        return false;
    }

    static isHideoutLevelBeingModified(levelId:string):boolean {
        for(const hideout of EditSession.currentHideoutEdit) {
            for(const level of hideout.hideout.levels) {
                if(level.id === levelId) {
                    return true;
                }
            }
        }
        return false;
    }

    static addModifiedHideout(hideoutLevel:HideoutLevels) {
        const station = HideoutUtils.getStationWithLevelId(hideoutLevel.id)
        for(const edit of EditSession.currentHideoutEdit) {
            if(edit.hideout.id === station.id) {
                for(const editStationLevel of edit.hideout.levels) {
                    if(editStationLevel.id === hideoutLevel.id) {
                        //Station Level already exists, dont add
                        return;
                    }
                }
                // Station Level does not exist
                edit.addStationLevel(hideoutLevel);
                return;
            }
        }
        // Station does not exist
        const editableStation = new EditableHideout(station);
        editableStation.addStationLevel(hideoutLevel);
        EditSession.currentHideoutEdit.push(editableStation);
    }

    static getModifiedHideoutByStationId(stationId:string):EditableHideout {
        for(const hideoutStations of EditSession.currentHideoutEdit) {
            if(hideoutStations.hideout.id === stationId) {
                return hideoutStations;
            }
        }
    }

    static getModifiedHideoutByLevelId(levelId:string):EditableHideout {
        for(const hideoutStations of EditSession.currentHideoutEdit) {
            for(const hideoutLevel of hideoutStations.hideout.levels) {
                if(hideoutLevel.id === levelId) {
                    return hideoutStations;
                }
            }
        }
    }

    static isHideoutCraftsBeingModified(stationId:string, level:number):boolean {
        for(const crafts of EditSession.currentHideoutCraftsEdit) {
            if(stationId === crafts.craft.station.id && crafts.craft.level === level) {
                return true;
            }
        }
        return false;
    }

    static addModifiedHideoutCraft(editableCraft:EditableHideoutCrafts) {
        const rewardItems:string[] = []
        for(const reward of editableCraft.craft.rewardItems) {
            rewardItems.push(reward.item.id);
        }
        for(const element of this.currentHideoutCraftsEdit) {
            if(element.craft.station.id === editableCraft.craft.station.id
                && element.craft.level === editableCraft.craft.level) {
                
                let matching = true;
                for(const reward of element.craft.rewardItems) {
                    if(!rewardItems.includes(reward.item.id)) {
                        matching = false;
                    }
                }

                if(matching) {
                    return;
                }
            }
        }
        EditSession.currentHideoutCraftsEdit.push(editableCraft);
    }

    static getModifiedHideoutCraft(stationId:string, level:number):EditableHideoutCrafts[] {
        const list:EditableHideoutCrafts[] = []
        for(const crafts of EditSession.currentHideoutCraftsEdit) {
            if(stationId === crafts.craft.station.id && crafts.craft.level === level) {
                list.push(crafts);
            }
        }
        return list;
    }

    static isAllowedToSubmit():boolean {
        const changedQuests:Quest[] = []
        for(const quest of EditSession.currentQuestEdit) {
            if(quest.hasBeenChanged()) {
                changedQuests.push(quest.quest);
            }
        }
        const changedHideout:HideoutStations[] = [];
        for(const hideout of EditSession.currentHideoutEdit) {
            if(hideout.hasBeenChanged()) {
                changedHideout.push(hideout.hideout);
            }
        }
        const changedCrafts:HideoutCrafts[] = []
        for(const crafts of EditSession.currentHideoutCraftsEdit) {
            if(crafts.hasBeenChanged()) {
                changedCrafts.push(crafts.craft);
            }
        }
        const editedMapFilter:FilterElementsData[] = [];
        for(const mapFilter of this.currentMapEdit) {
            editedMapFilter.push(mapFilter.getMapFilter());
        }
        return changedQuests.length > 0 || 
            editedMapFilter.length > 0 ||
            changedHideout.length > 0 ||
            changedCrafts.length > 0 ||
            this.currentRemovedIcons.length > 0 || 
            this.currentRemovedHideoutCrafts.length > 0 ||
            this.currentRemovedQuests.length > 0
    }

    static async submit():Promise<string> {
        const changedQuests:Quest[] = []
        for(const quest of EditSession.currentQuestEdit) {
            if(quest.hasBeenChanged()) {
                changedQuests.push(quest.quest);
            }
        }
        const changedHideout:HideoutStations[] = [];
        for(const hideout of EditSession.currentHideoutEdit) {
            if(hideout.hasBeenChanged()) {
                changedHideout.push(hideout.hideout);
            }
        }
        const changedCrafts:HideoutCrafts[] = []
        for(const crafts of EditSession.currentHideoutCraftsEdit) {
            if(crafts.hasBeenChanged()) {
                changedCrafts.push(crafts.craft);
            }
        }
        const editedMapFilter:FilterElementsData[] = [];
        for(const mapFilter of this.currentMapEdit) {
            editedMapFilter.push(mapFilter.getMapFilter());
        }
        if(changedQuests.length > 0 || 
            editedMapFilter.length > 0  || 
            changedHideout.length > 0 || 
            changedCrafts.length > 0 ||
            this.getRemovedIcons.length > 0 || 
            this.getRemovedHideoutCrafts.length > 0 ||
            this.getRemovedQuests.length > 0) {

            return await new Promise(resolve => {
                overwolf.profile.getCurrentUser(async info => {
                    if(info.success && info.displayName && info.uuid) {
                        const request = new SubmissionRequest(
                            info.uuid, 
                            info.displayName, 
                            changedQuests,
                            changedHideout,
                            changedCrafts,
                            editedMapFilter,
                            this.currentRemovedQuests, 
                            this.currentRemovedHideoutCrafts,
                            this.currentRemovedIcons
                        );
                        const submissionResult = await TarkovCompanionService.postSubmission(request);
                        const text = await submissionResult.text()    
                        resolve(text);
                    } else {
                        resolve("No User");
                    }
                })
            })
        }
    }

    static async uploadImage(submissionId:string, imageId:string):Promise<boolean> {
        for(const image of this.currentImages) {
            if(image.imageId === imageId) {
                return await new Promise(resolve => {
                    overwolf.profile.getCurrentUser(async info => {
                        if(info.success && info.displayName && info.uuid) {
                            const response = await TarkovCompanionService.uploadImage(image.blob, image.imageId, submissionId, info);
                            resolve(response.ok)
                        } else {
                            resolve(false);
                        }
                    })
                })
            }
        }
        return false;
    }

    static questSubmissionCompleted() {
        this.removeAddedIconsFromFilter();
        this.currentQuestEdit = [];
        this.currentMapEdit = [];
        this.currentHideoutEdit = [];
        this.currentHideoutCraftsEdit = [];
        this.currentRemovedIcons = [];
        this.currentRemovedQuests = [];
    }

    static closeSession() {
        this.removeAddedIconsFromFilter();
        this.sessionOpen = false;
        this.currentQuestEdit = [];
        this.currentMapEdit = [];
        this.currentHideoutEdit = [];
        this.currentHideoutCraftsEdit = [];
        this.currentRemovedIcons = [];
        this.currentRemovedQuests = [];
        this.currentImages = [];
    }

    private static removeAddedIconsFromFilter() {
        for(const mapEdit of this.currentMapEdit) {
            const stored = JSON.parse(FilterUtils.getStoredData(MapAdapter.getIdFromMap(mapEdit.getMapName())));
            if(stored) {
                for(const hle of mapEdit.getMapFilter().highLevelElements) {
                    for(const el of hle.elements) {
                        for(const entity of el.listElements) {
                            this.removeEntityFromStoredData(entity.id, stored);
                        }
                    }
                }
                FilterUtils.save(stored);
            }
        }
    }

    private static removeEntityFromStoredData(entityId:number, stored:FilterElementsData) {
        for(const hle of stored.highLevelElements) {
            for(const el of hle.elements) {
                for(let i = 0; i < el.listElements.length; i++) {
                    if(el.listElements[i].id === entityId) {
                        if(!el.listElements[i].protectedEntity) {
                            el.listElements.splice(i, 1);
                            return;
                        }
                    }
                }
            }
        }
    }
}