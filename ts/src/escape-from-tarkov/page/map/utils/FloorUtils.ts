import { MapAdapter } from "../../../../adapter/MapAdapter";
import { ListElementEntity } from "../../../../model/IFilterElements";
import { Building, Floor, MapFloorElementsData } from "../../../../model/floor/IMapFloorElements";
import { StorageHelper } from "../../../service/helper/StorageHelper";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { QuestsUtils } from "../../quests/utils/QuestsUtils";
import { IconUtils } from "./IconUtils";

export class FloorUtils {

    static clickGlowColor:string = "white";
    static questGlowColor:string = "green";
    static hoveringGlowColor:string = "#2c312c";

    private static keySuffix = "_floor"

    static save(data:MapFloorElementsData) {
        const storageKey = `${MapAdapter.getMapFromId(MapAdapter.getIdFromMap(data.map))}${this.keySuffix}`;
        StorageHelper.save(storageKey, data)
    }

    static getStoredData(mapId):any {
        const storageKey = `${MapAdapter.getMapFromId(mapId)}${this.keySuffix}`;
        return StorageHelper.getStoredData(storageKey)
    }

    static isFloorActive(floors:MapFloorElementsData, floorId:string):boolean {
        let isActive = false;
        floors.elements.forEach(floor => {
            floor.floors.forEach(entity => {
                if(entity.active && String(entity.UUID) === floorId) {
                    isActive = true;
                }
            })
        })
        return isActive;
    }

    static isSpecificFloorActive(floors:Building, floorId:string):boolean {
        let isActive = false;
        floors.floors.forEach(entity => {
            if(entity.active && String(entity.UUID) === floorId) {
                isActive = true;
            }
        })
        return isActive;
    }

    static isBuildingFloorActive(floors:MapFloorElementsData, floorId:string) {
        const building = FloorUtils.getBuildingFromFloorId(floors, floorId);
        if(building) {
            if(FloorUtils.isSpecificFloorActive(building, floorId)) {
                // If the floor is not active, we return false;
                return true;
            }
        }
        return false;
    }
    
    static isRelatedToBuilding(floors:Building, floorId:string):boolean {
        let isRelated = false;
        floors.floors.forEach(entity => {
            if(String(entity.UUID) === floorId) {
                isRelated = true;
            }
        })
        return isRelated;
    }

    static getBuildingFromFloorId(floors:MapFloorElementsData, floorId:string):Building {
        for(const building of floors.elements) {
            for(const floor of building.floors) {
                if(String(floor.UUID) === floorId) {
                    return building
                }
            }
        }
        return null;
    }

    static getActiveFloorFromBuilding(building:Building):Floor {
        for(const floor of building.floors) {
            if(floor.active) {
                return floor;
            }
        }
        return null;
    }

    static resolveQuestFloorGlow(entities:ListElementEntity[], floors:MapFloorElementsData) {
        const activeEntity:ListElementEntity[] = IconUtils.getActiveAndFloorRelatedEntityFromList(entities);
        
        for(const entity of activeEntity) {
            const quest = QuestsUtils.getQuestFromID(entity.questId);
            if(!FloorUtils.isBuildingFloorActive(floors, entity.floor) && quest
                && !PlayerProgressionUtils.isQuestObjectiveCompletedByIconId(quest, String(entity.id))) {
                const building = FloorUtils.getBuildingFromFloorId(floors, entity.floor);
                if(building) {
                    const activeFloor:Floor = FloorUtils.getActiveFloorFromBuilding(building)
                    if(activeFloor) {
                        const floorDiv = document.getElementById(activeFloor.UUID)
                        if(floorDiv) {
                            // Make the floor glow :)
                            floorDiv.style.filter = `drop-shadow(0 0 12px ${FloorUtils.questGlowColor})`
                        } else {
                            console.log(`Could not get HtmlElement for floor: ${activeFloor.UUID}`);
                        }
                    } else {
                        console.log(`There are no active floor for building: ${building.UUID}`);
                    }
                } else {
                    console.log(`Could not find building from floorId: ${entity.floor}`);
                }
            }
        }
    }

    private static readonly animationGlowClass = "animate-glow-floor";

    static animateFloorGlow(floorId:string) {
        const canvas = this.getFloorCanvas(floorId)
        if(canvas) {
            if(!canvas.classList.contains(this.animationGlowClass)) {
                canvas.classList.add(this.animationGlowClass);
                canvas.addEventListener('animationend', (e) => {
                    canvas.classList.remove(this.animationGlowClass)
                });
            }
        }
    }

    static getFloorCanvas(floorId:string):HTMLElement {
        const floor = document.getElementById(floorId);
        if(floor) {
            const list = floor.getElementsByClassName("floorLevelImg");
            if(list.length > 0 && list[0] instanceof HTMLCanvasElement) {
                return list[0];
            }
        }
    }
}