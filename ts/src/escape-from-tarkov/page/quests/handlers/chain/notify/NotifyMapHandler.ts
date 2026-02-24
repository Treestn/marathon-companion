import { DataEventConst } from "../../../../../events/DataEventConst";
import { EventConst } from "../../../../../events/EventConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { NavigationUtils } from "../../../../../utils/NavigationUtils";
import { QuestRequest } from "../../request/QuestRequest";
import { FilterUtils } from "../../../../map/utils/FilterUtils";
import { FilterConst } from "../../../../../constant/FilterConst";
import { FilterElementsData, ListElementEntity } from "../../../../../../model/IFilterElements";

export class NotifyMapHandler extends AbstractChainHandler {

    async handle(request: QuestRequest) {
        if(request.notifyOthers) { 
            if(EventConst.SELECT_ICON === request.event || EventConst.SELECT_KEY_ICON === request.event) {
                switch(request.subEvent) {
                    case DataEventConst.ZOOM_ON_ICON: await this.handleMapIconSelect(request); break;
                }
            }
        }
    }
    
    private async handleMapIconSelect(request:QuestRequest) {

        let mapId:string;
        if(request.event === EventConst.SELECT_KEY_ICON) {
            mapId = request.mapId;
        } else {
            mapId = this.getIconMap(request)
        }

        if(mapId) {
            const filters = this.getMapFilters(mapId);
            const targetEntity = this.getTargetEntity(filters, request);
            if (filters && targetEntity) {
                this.ensureQuestFilterEnabled(filters, targetEntity);
                FilterUtils.save(filters);
            }

            if (targetEntity && typeof targetEntity.x === "number" && typeof targetEntity.y === "number") {
                const focusDetail = {
                    mapId,
                    pixelX: targetEntity.x,
                    pixelY: targetEntity.y,
                    floorId: targetEntity.floor ?? null,
                    iconId: targetEntity.id
                };
                (globalThis as any).__pendingMapFocus = focusDetail;
            }

            await NavigationUtils.loadMapPage(mapId, { setDefaultPreference: false });
            if (targetEntity && typeof targetEntity.x === "number" && typeof targetEntity.y === "number") {
                if (typeof globalThis.dispatchEvent === "function") {
                    globalThis.dispatchEvent(
                        new CustomEvent("map-focus-icon", {
                            detail: {
                                mapId,
                                pixelX: targetEntity.x,
                                pixelY: targetEntity.y,
                                floorId: targetEntity.floor ?? null,
                                iconId: targetEntity.id
                            }
                        })
                    );
                }
                return;
            }
        }
        console.log(`Map name not found`);
    }

    private getMapFilters(mapId: string): FilterElementsData | null {
        const stored = FilterUtils.getStoredData(mapId);
        if (!stored) return null;
        try {
            return JSON.parse(stored) as FilterElementsData;
        } catch {
            return null;
        }
    }

    private getTargetEntity(filters: FilterElementsData | null, request: QuestRequest): ListElementEntity | null {
        if (!filters) return null;
        if (request.event === EventConst.SELECT_KEY_ICON && request.id) {
            for (const hle of filters.highLevelElements ?? []) {
                for (const element of hle.elements ?? []) {
                    for (const entity of element.listElements ?? []) {
                        if (!entity.itemIds?.length) continue;
                        if (entity.itemIds.some((itemId) => itemId.includes(request.id))) {
                            return entity;
                        }
                    }
                }
            }
        }
        if (request.id) {
            return FilterUtils.getEntityWithId(filters, Number(request.id));
        }
        return null;
    }

    private ensureQuestFilterEnabled(filters: FilterElementsData, target: ListElementEntity) {
        const questHle = filters.highLevelElements?.find(hle => hle.name === FilterConst.QUESTS.name);
        if (!questHle) return;
        if (questHle.active === false) {
            questHle.active = true;
        }
        questHle.elements?.forEach((element) => {
            if (element.active === false) {
                element.active = true;
            }
            element.listElements?.forEach((entity) => {
                if (entity.id === target.id && entity.active === false) {
                    entity.active = true;
                }
            });
        });
    }

    private getIconMap(request:QuestRequest):string {
        for(const obj of request.quest.objectives) {
            if(!obj.questImages) {
                continue;
            }
            for(const questImage of obj.questImages) {
                if(questImage.id === request.id) {
                    return obj.maps[0].id
                }
            }
        }
    }

}