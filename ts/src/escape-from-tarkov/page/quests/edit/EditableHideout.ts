import { TraderMapper } from "../../../../adapter/TraderMapper";
import { HideoutLevels, HideoutStations, ItemRequirements, StationLevelRequirements, TraderRequirements } from "../../../../model/HideoutObject";
import { HideoutUtils } from "../../hideout/utils/HideoutUtils";
import { EditSession } from "./EditSession";

export class EditableHideout {

    hideout:HideoutStations;
    private changed:boolean = false;

    constructor(hideout:HideoutStations) {
        if(hideout) {
            this.hideout = JSON.parse(JSON.stringify(hideout));
            this.hideout.levels = []
        }
    }

    addStationLevel(hideoutLevel:HideoutLevels) {
        this.hideout.levels.push(JSON.parse(JSON.stringify(hideoutLevel)))
    }

    hasBeenChanged():boolean {
        return this.changed;
    }

    private hasChanged():void {
        this.changed = true
        EditSession.enableReviewButton()
    }

    getHideoutLevelById(levelId:string):HideoutLevels {
        for(const hideoutLevel of this.hideout.levels) {
            if(hideoutLevel.id === levelId) {
                return hideoutLevel;
            }
        }
    }

    addStationRequirement(stationId:string, level:number, levelId:string):StationLevelRequirements {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(const stationRequirement of hideoutLevel.stationLevelRequirements) {
            if(stationRequirement.station.id === stationId) {
                stationRequirement.level = level;
                this.hasChanged();
                return null;
            }
        }
        const station = HideoutUtils.getStation(stationId);
        const newStation = {id: station.id, normalizedName: station.normalizedName}
        const newStationRequirement = {station: newStation, level: level}
        hideoutLevel.stationLevelRequirements.push(newStationRequirement);
        this.hasChanged();
        return newStationRequirement;
    }

    removeStationRequirement(stationId:string, levelId:string):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(let i = 0; i < hideoutLevel.stationLevelRequirements.length; i++) {
            if(hideoutLevel.stationLevelRequirements[i].station.id === stationId) {
                hideoutLevel.stationLevelRequirements.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeStationRequirement(previousId:string, newId:string, levelId:string, level:number):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(const station of hideoutLevel.stationLevelRequirements) {
            if(station.station.id === previousId) {
                station.station.id = newId;
                station.level = level;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    changeStationRequirementLevel(level:number, stationId:string, levelId:string):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(const station of hideoutLevel.stationLevelRequirements) {
            if(station?.station?.id === stationId) {
                station.level = level;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    addTraderRequirement(traderId:string, reputation:number, levelId:string):TraderRequirements {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(const reward of hideoutLevel.traderRequirements) {
            if(reward.trader.id === traderId) {
                reward.level = reputation;
                this.hasChanged();
                return null;
            }
        }
        const newTrader = {id: traderId, normalizedName: TraderMapper.getTraderFromId(traderId)}
        const newTraderRequirement = {ImageUtils: null, trader: newTrader, level: reputation}
        hideoutLevel.traderRequirements.push(newTraderRequirement);
        this.hasChanged();
        return newTraderRequirement;
    }

    removeTraderRequirement(traderId:string, levelId:string):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(let i = 0; i < hideoutLevel.traderRequirements.length; i++) {
            if(hideoutLevel.traderRequirements[i].trader.id === traderId) {
                hideoutLevel.traderRequirements.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeTraderRequirement(previousId:string, newId:string, levelId:string):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(const reward of hideoutLevel.traderRequirements) {
            if(reward?.trader?.id === previousId) {
                reward.trader.id = newId;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    moveTraderRequirementUp(traderId:string, levelId:string):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(let i = 0; i < hideoutLevel.traderRequirements.length; i++) {
            if(hideoutLevel.traderRequirements[i].trader.id === traderId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(hideoutLevel.traderRequirements, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    }

    moveTraderRequirementDown(traderId:string, levelId:string):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(let i = 0; i < hideoutLevel.traderRequirements.length; i++) {
            if(hideoutLevel.traderRequirements[i].trader.id === traderId) {
                if(hideoutLevel.traderRequirements.length === i + 1) {
                    return false;
                }
                this.swapElement(hideoutLevel.traderRequirements, i, i + 1);
                this.hasChanged();
                return true;
            }
        }
    }

    addItemRequirement(itemId:string, count:number, levelId:string):ItemRequirements {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(const reward of hideoutLevel.itemRequirements) {
            if(reward?.item?.id === itemId) {
                reward.quantity = count;
                this.hasChanged();
                return null;
            }
        }
        const newItem = {id: itemId};
        const newHideoutItem = {item: newItem, quantity: count}
        if(count && count > 0) {
            newHideoutItem.quantity = count
        } else {
            newHideoutItem.quantity = 1
        }

        hideoutLevel.itemRequirements.push(newHideoutItem);
        this.hasChanged();
        return newHideoutItem;
    }

    removeItemRequirement(itemId:string, levelId:string):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(let i = 0; i < hideoutLevel.itemRequirements.length; i++) {
            if(hideoutLevel.itemRequirements[i].item.id === itemId) {
                hideoutLevel.itemRequirements.splice(i, 1);
                this.hasChanged();
                return true;
            }
        }
        return false;
    }

    changeItemRequirementId(previousId:string, newId:string, levelId:string):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(const reward of hideoutLevel.itemRequirements) {
            if(reward?.item?.id === previousId) {
                reward.item.id = newId;
                this.hasChanged();
                return true;
            }
        }

        return false;
    }

    moveItemRequirementUp(itemId:string, levelId:string):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(let i = 0; i < hideoutLevel.itemRequirements.length; i++) {
            if(hideoutLevel.itemRequirements[i].item.id === itemId) {
                if(i === 0) {
                    return false;
                }
                this.swapElement(hideoutLevel.itemRequirements, i, i - 1);
                this.hasChanged();
                return true;
            }
        }
    }

    moveItemRequirementDown(itemId:string, levelId:string):boolean {
        const hideoutLevel = this.getHideoutLevelById(levelId);
        for(let i = 0; i < hideoutLevel.itemRequirements.length; i++) {
            if(hideoutLevel.itemRequirements[i].item.id === itemId) {
                if(hideoutLevel.itemRequirements.length === i + 1) {
                    return false;
                }
                this.swapElement(hideoutLevel.itemRequirements, i, i + 1);
                this.hasChanged();
                return true;
            }
        }
    }

    private swapElement(list:any[], index:number, secondIndex:number) {
        let b = list[index];
        list[index] = list[secondIndex];
        list[secondIndex] = b
    }

}