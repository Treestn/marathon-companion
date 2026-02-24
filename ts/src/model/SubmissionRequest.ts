import { HideoutCrafts, HideoutStations } from "./HideoutObject";
import { FilterElementsData } from "./IFilterElements";
import { Quest } from "./IQuestsElements";

export class SubmissionRequest {
    overwolfId:string;
    overwolfName:string;
    removedQuests:string[];
    removedMapIcon:RemovedMapIcon[];
    quests:Quest[];
    hideoutStations:HideoutStations[];
    hideoutCrafts:HideoutCrafts[];
    removedHideoutCrafts:string[];
    mapFilters:FilterElementsData[];
    
    constructor(overwolfId:string,
            overwolfName:string, 
            quests:Quest[],
            hideoutStations:HideoutStations[],
            hideoutCrafts:HideoutCrafts[],
            mapFilters:FilterElementsData[],
            removedQuests:string[], 
            removedHideoutCrafts:string[],
            removedMapIcon:RemovedMapIcon[]) {
        this.overwolfId = overwolfId;
        this.overwolfName = overwolfName;
        if(quests) {
            this.quests = quests;
        } else {
            this.quests = [];
        }
        if(hideoutStations) {
            this.hideoutStations = hideoutStations;
        } else {
            this.hideoutStations = []
        }
        if(hideoutCrafts) {
            this.hideoutCrafts = hideoutCrafts;
        } else {
            this.hideoutCrafts = [];
        }
        if(mapFilters) {
            this.mapFilters = mapFilters;
        } else {
            this.mapFilters = [];
        }
        if(removedQuests) {
            this.removedQuests = removedQuests;
        } else {
            this.removedQuests = [];
        }
        if(removedHideoutCrafts) {
            this.removedHideoutCrafts = removedHideoutCrafts;
        } else {
            this.removedHideoutCrafts = [];
        }
        if(removedMapIcon) {
            this.removedMapIcon = removedMapIcon;
        } else {
            this.removedMapIcon = []
        }
    }
}

export class RemovedMapIcon {
    map:string;
    iconTypes: IconType[] = [];

    constructor(map:string) {
        this.map = map
    }
}

export class IconType {
    type: string;
    path: string;
    iconIds:number[] = [];

    constructor(type:string, src:string) {
        this.type = type;
        this.path = src
    }
}