import { FilterElementsData, ListElementEntity } from "../../../../model/IFilterElements";
import { MapFloorElementsData } from "../../../../model/floor/IMapFloorElements";
import { EditSession } from "../../quests/edit/EditSession";
import { IMapsComponent } from "../components/IMapsComponent";
import { IconComponent } from "../components/impl/IconComponent";
import { IndexConst } from "../const/IndexConst";
import { FloorUtils } from "./FloorUtils";

export class IconUtils {

    static hoveringGlowColor = "white";
    static hoveringDeniedGlowColor = "red";
    static hoveringAllowedGlowColor = "green";
    static iconBaseOpacity = "100%"

    static getAllIconsByType(type:string):HTMLElement[] {
        let iconsList:HTMLElement[] = []

        const mapData = document.getElementById("map-data");
        if(mapData) {
            iconsList.push(...mapData.getElementsByClassName(`${type.split(" ").join("-")}-icon`) as HTMLCollectionOf<HTMLElement>);
        }

        return iconsList;
    }

    static hideIcon(iconId:string) {
        const iconDiv = document.getElementById(iconId)
        if(iconDiv) {
            iconDiv.style.visibility = 'hidden'
            iconDiv.style.zIndex = IndexConst.HIDDEN;
        }
    }

    static unhideIcon(iconId:string, map?:string, zIndex?:string) {
        if(EditSession.isSessionOpen() 
            && EditSession.isIconRemoved(map, Number(iconId))) {
            return;
        }
        const iconDiv = document.getElementById(iconId)
        if(iconDiv) {
            iconDiv.style.visibility = ''
            iconDiv.style.zIndex = zIndex ? zIndex : IndexConst.ICON;
        }
    }

    static getIconComponent(componentList:IMapsComponent[]) {
        let iconComponentList:IconComponent[] = []
        componentList.forEach(component => {
            if(component instanceof IconComponent) {
                iconComponentList.push(component as IconComponent)
            }
        })
        return iconComponentList
    }

    static getIconCanvas(parentDiv:HTMLElement):HTMLCanvasElement {
        const list = parentDiv.getElementsByClassName("iconCanvas");
        if(list) {
            const canvas = list[0] as HTMLElement;
            if(canvas && canvas instanceof HTMLCanvasElement) {
                return canvas
            }
        }
        return null;
    }

    static getActiveEntityFromList(entities:ListElementEntity[]):ListElementEntity[] {
        const activeEntity:ListElementEntity[] = []
        for(const entity of entities) {
            if(entity.active) {
                activeEntity.push(entity)
            }
        }
        return activeEntity;
    }

    static getActiveAndFloorRelatedEntityFromList(entities:ListElementEntity[]):ListElementEntity[] {
        const activeEntity:ListElementEntity[] = []
        for(const entity of entities) {
            if(entity.active && entity.floor) {
                activeEntity.push(entity)
            }
        }
        return activeEntity;
    }

    static glowAllIconsByType(type:string, filters:FilterElementsData, floors:MapFloorElementsData) {
        for(const hle of filters.highLevelElements) {
            for(const e of hle.elements) {
                if(e.name === type) {
                    for(const entity of e.listElements) {
                        if(entity.active) {
                            if(entity.floor) {
                                const building = FloorUtils.getBuildingFromFloorId(floors, entity.floor)
                                // if(!FloorUtils.isSpecificFloorActive(building, entity.floor)) {
                                    building.floors.forEach(floor => {
                                        if(String(floor.UUID) !== String(entity.floor)) {
                                            FloorUtils.animateFloorGlow(floor.UUID)
                                        }
                                    })
                                // }
                            }
                            this.animateIconGlow(String(entity.id));
                        }
                    }
                }
            }
        }
    }

    private static readonly animationGlowClass = "animate-glow-icon";

    static animateIconGlow(iconId:string) {
        const iconWrapper = document.getElementById(iconId);
        if(iconWrapper) {
            const canvas = this.getIconCanvas(iconWrapper);
            if(canvas) {
                canvas.classList.add(this.animationGlowClass);
                canvas.addEventListener('animationend', (e) => {
                    canvas.classList.remove(this.animationGlowClass)
                });
            }
        }
    }
}