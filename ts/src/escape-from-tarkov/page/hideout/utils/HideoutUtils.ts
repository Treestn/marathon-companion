import { progressionTypes } from "../../../../consts";
import { HideoutCrafts, HideoutObject, HideoutStations, HideoutLevels, Station, StationLevelRequirements, Layout } from "../../../../model/HideoutObject";
import { StorageHelper } from "../../../service/helper/StorageHelper";
import { AppConfigUtils } from "../../../utils/AppConfigUtils";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { ItemUtils } from "../../items/utils/ItemUtils";

export class HideoutUtils {

    private static readonly localStorageKey = "hideoutConfig"

    private static hideoutObject:HideoutObject;

    static setHideoutObject(data:HideoutObject) {
        if(!this.hideoutObject) {
            this.hideoutObject = data;
        }
    }

    static getData():HideoutObject {
        return this.hideoutObject
    }

    static exists():boolean {
        if(this.hideoutObject) {
            return true;
        }
        return false;
    }

    static save(data:HideoutObject) {
        this.setHideoutObject(data);
        StorageHelper.save(this.localStorageKey, this.hideoutObject)
    }

    static getLayout():Layout {
        if(this.hideoutObject && this.hideoutObject.layout) {
            return this.hideoutObject.layout
        }
        return null;
    }

    static getStoredData():string {
        return StorageHelper.getStoredData(this.localStorageKey)
    }

    static getHideoutScale():number {
        const hideoutDiv = document.getElementById(`hideoutDiv`);
        let scale:number;
        if(hideoutDiv) {
            scale = hideoutDiv.clientWidth / this.hideoutObject.layout.width
            if(this.hideoutObject.layout.height * scale > hideoutDiv.clientHeight) {
                scale = hideoutDiv.clientHeight / this.hideoutObject.layout.height
            }
        }
        return scale;
    }

    static getStation(stationId:string):HideoutStations {
        for(const station of this.hideoutObject.hideoutStations) {
            if(station.id === stationId) {
                return station;
            }
        }
    }

    static resolveHideoutState() {
        this.hideoutObject.hideoutStations.forEach(station => {
            if(this.areStationRequirementsCompleted(station)) {
                const state = PlayerProgressionUtils.getHideoutStationState(station.id);
                if(state && !state.completed) {
                    state.active = true;
                    const level1 = this.getStationLevelWithNumber(station.id, 1);
                    if(level1) {
                        const level1State = PlayerProgressionUtils.getStationLevelState(station.id, level1.id)
                        if(!level1State.completed) {
                            level1State.active = true;
                        }
                    }
                }
            }
        })
    }

    static giveItems(hideoutLevel:HideoutLevels) {
        if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
            if(hideoutLevel.itemPveRequirements) {
                hideoutLevel.itemPveRequirements.forEach(itemRequirement => {
                    ItemUtils.giveItem(itemRequirement.item.id, itemRequirement.quantity);
                })
            }
        } else {
            if(hideoutLevel.itemRequirements) {
                hideoutLevel.itemRequirements.forEach(itemRequirement => {
                    ItemUtils.giveItem(itemRequirement.item.id, itemRequirement.quantity);
                })
            }
        }

    }

    static giveItemsBack(hideoutLevel:HideoutLevels) {
        if(AppConfigUtils.getAppConfig().userSettings.getProgressionType() === progressionTypes.pve) {
            if(hideoutLevel.itemPveRequirements) {
                hideoutLevel.itemPveRequirements.forEach(itemRequirement => {
                    ItemUtils.giveItemBack(itemRequirement.item.id, itemRequirement.quantity);
                })
            }
        } else {
            if(hideoutLevel.itemRequirements) {
                hideoutLevel.itemRequirements.forEach(itemRequirement => {
                    ItemUtils.giveItemBack(itemRequirement.item.id, itemRequirement.quantity);
                })
            }
        }
    }

    static areStationRequirementsCompleted(station:HideoutStations):boolean {
        let requirementsCompleted = true

        station.levels.forEach(level => {
            if(level.level === 1) {
                level.stationLevelRequirements.forEach(requirement => {
                    if(!this.isStationLevelRequirementCompleted(requirement.station.id, requirement.level)) {
                        requirementsCompleted = false;
                    }
                })
            }
        })
        return requirementsCompleted
    }

    static isStationLevelRequirementCompleted(stationId:string, stationlevel:number):boolean {
        const state = PlayerProgressionUtils.getHideoutStationState(stationId);
        const level:HideoutLevels = this.getStationLevelWithNumber(stationId, stationlevel);
        if(state && level && state.stationLevelState && state.stationLevelState.length > 0) {
            for(const levelState of state.stationLevelState) {
                if(levelState.id === level.id) {
                    return levelState.completed;
                }
            }
        }
        console.log(`Could not find state for station id: ${stationId} level: ${stationlevel}`);
        return false;
    }

    static getActiveStations():HideoutStations[] {
        const list:HideoutStations[] = [];
        for(const station of this.hideoutObject.hideoutStations) {
            const hideoutState = PlayerProgressionUtils.getHideoutStationState(station.id);
            if(hideoutState && hideoutState.active) {
                list.push(station);
            }
        }
        return list
    }

    static getActiveStationsLevel():Map<HideoutStations, HideoutLevels[]> {
        const map:Map<HideoutStations, HideoutLevels[]> = new Map();
        for(const station of this.hideoutObject.hideoutStations) {
            for(const hideoutLevel of station.levels) {
                const hideoutLevelState = PlayerProgressionUtils.getStationLevelState(station.id, hideoutLevel.id);
                if(hideoutLevelState && hideoutLevelState.active) {
                    if(map.has(station)) {
                        map.get(station).push(hideoutLevel);
                    } else {
                        map.set(station, new Array(hideoutLevel))
                    }
                }
            }
        }
        return map
    }

    static getPreviousStationLevel(stationId:string, stationLevelId:string):HideoutLevels {
        for(const station of this.hideoutObject.hideoutStations) {
            if(station.id === stationId) {
                let level:number = 0;
                for(const stationLevel of station.levels) {
                    if(stationLevel.id === stationLevelId) {
                        level = stationLevel.level;
                    }
                }
                if(level > 0) {
                    for(const stationLevel of station.levels) {
                        if(stationLevel.level === level - 1) {
                            return stationLevel;
                        }
                    }
                }
                return null;
            }
        }
        console.log(`Previous station level was not found when searching for station level id: ${stationLevelId} for station id: ${stationId}`);
        return null;
    }

    static getNextStationLevel(stationId:string, stationLevelId:string):HideoutLevels {
        for(const station of this.hideoutObject.hideoutStations) {
            if(station.id === stationId) {
                let level:number = 0;
                for(const stationLevel of station.levels) {
                    if(stationLevel.id === stationLevelId) {
                        level = stationLevel.level;
                    }
                }
                if(level === 0) {
                    console.log(`Station level was not found when searching for station level id: ${stationLevelId} for station id: ${stationId}`);
                    return null;
                }
                if(level > 0) {
                    for(const stationLevel of station.levels) {
                        if(stationLevel.level === level + 1) {
                            return stationLevel;
                        }
                    }
                }
                return null;
            }
        }
        console.log(`Next station level was not found when searching for station level id: ${stationLevelId} for station id: ${stationId}`);
        return null;
    }

    static getStationLevel(stationId:string, stationLevelId:string):HideoutLevels {
        for(const station of this.hideoutObject.hideoutStations) {
            if(station.id === stationId) {
                for(const level of station.levels) {
                    if(level.id === stationLevelId) {
                        return level;
                    }
                }
            }
        }
        console.log(`Could not find stationLevel with id: ${stationLevelId} for station with id: ${stationId}`);
    }

    static getStationLevelWithId(stationLevelId:string):HideoutLevels {
        for(const station of this.hideoutObject.hideoutStations) {
            for(const level of station.levels) {
                if(level && level.id === stationLevelId) {
                    return level;
                }
            }
        }
        // console.log(`Could not find stationLevel with id: ${stationLevelId}`);
    }

    static getStationWithLevelId(stationLevelId:string):HideoutStations {
        for(const station of this.hideoutObject.hideoutStations) {
            for(const level of station.levels) {
                if(level && level.id === stationLevelId) {
                    return station;
                }
            }
        }
        // console.log(`Could not find stationLevel with id: ${stationLevelId}`);
    }

    static getStationLevelWithNumber(stationId:string, levelNumber:number):HideoutLevels {
        for(const station of this.hideoutObject.hideoutStations) {
            if(station.id === stationId) {
                for(const level of station.levels) {
                    if(level.level === levelNumber) {
                        return level;
                    }
                }
            }
        }
        console.log(`Could not find stationLevel with level number: ${levelNumber} for station with id: ${stationId}`);
    }

    // static getCraft(craftId:string) {
    //     this.hideoutObject.crafts.forEach(craft => {
    //         if(craft.)
    //     })
    // }

    static getAllCraftsForStationIdWithLevel(stationId:string, level:number):HideoutCrafts[] {
        const list:HideoutCrafts[] = []
        this.hideoutObject.crafts.forEach(craft => {
            if(craft.station && craft.station.id === stationId && craft.level === level) {
                list.push(craft);
            }
        })
        return list
    }

    static getAllCraftsForStationId(stationId:string):HideoutCrafts[] {
        const list:HideoutCrafts[] = []
        this.hideoutObject.crafts.forEach(craft => {
            if(craft.station && craft.station.id === stationId) {
                list.push(craft);
            }
        })
        return list
    }

    static getCraftsUnlockFromQuest(questId:string):HideoutCrafts[] {
        const list:HideoutCrafts[] = []
        this.hideoutObject.crafts.forEach(craft => {
            if(craft.taskUnlock && craft.taskUnlock.id === questId) {
                list.push(craft);
            }
        })
        return list
    }
}