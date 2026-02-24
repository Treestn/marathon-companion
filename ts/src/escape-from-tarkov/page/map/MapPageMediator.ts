import { MapAdapter } from "../../../adapter/MapAdapter";
import { DataEventConst } from "../../events/DataEventConst";
import { EventConst } from "../../events/EventConst";
import { FilterElementsData } from "../../../model/IFilterElements";
import { AppConfigUtils } from "../../utils/AppConfigUtils";
import { AbstractPageMediator } from "../mediator/impl/AbstractPageMediator";
import { EditSession } from "../quests/edit/EditSession";
import { QuestPageMediator } from "../quests/QuestPageMediator";
import { QuestSidePageMediator } from "../side/QuestSidePageMediator";
import { MapBuilderHelper } from "./builder/helper/MapBuilderHelper";
import { IMapsComponent } from "./components/IMapsComponent";
import { QuestIconComponent } from "./components/impl/QuestIconComponent";
import { MapRequest } from "./handlers/request/impl/MapRequest";
import { IMapMediator } from "./mediator/IMapMediator";
import { MapMediator } from "./mediator/impl/MapMediator";
import { FilterUtils } from "./utils/FilterUtils";

export class MapPageMediator extends AbstractPageMediator {

    private mapMediator:IMapMediator;
    questPageMediator:QuestPageMediator;
    sidePageQuestMediator:QuestSidePageMediator;

    async load() {

        await super.removePreviousRunner();

        if(!this.savedPage) {
            if(!this.mapMediator) {
                this.mapMediator = new MapMediator(this.questPageMediator, this.sidePageQuestMediator);
            }
            
            let mapDefault = AppConfigUtils.getAppConfig().userSettings.getMapDefaultPreference();
            const mapId = MapAdapter.getIdFromMap(mapDefault);
            if(mapId) {
                AppConfigUtils.getAppConfig().userSettings.setMapDefaultPreference(mapId);
                mapDefault = mapId;
            }
            await this.mapMediator.init(mapDefault);
        } else {
            const loading = this.savedPage.getElementsByClassName("gifLoadingDiv");
            if(loading.length > 0 && this.mapMediator.activeMap) {
                for(let e of loading) {
                    e.remove()
                }
                await this.mapMediator.init(this.mapMediator.activeMap, true)
                return;
            }
            await super.loadSavePage("Could not load Map Page");
            await this.update(new MapRequest(this.mapMediator, EventConst.ICON_UPDATE, 
                null, null, DataEventConst.QUEST_UPDATE, new Date().getTime()))
            const reminderContainer = document.getElementById("icon-reminder");
            const mapDiv = document.getElementById("mapDiv");
            if(reminderContainer && mapDiv) {
                reminderContainer.remove();
                if(EditSession.isSessionOpen()) {
                    MapBuilderHelper.createEditModeReminder(mapDiv);
                } else {
                    MapBuilderHelper.createAddIconReminder(mapDiv);
                }
            }
        }
    }

    reloadFilters() {
        this.mapMediator.getFiltersMap()?.forEach((filter, map) => {
            const storedData = FilterUtils.getStoredData(map)
            if(storedData) {
                let data:FilterElementsData = JSON.parse(storedData)
                if(data) {
                    this.mapMediator.getFiltersMap()?.set(map, data);
                }
            }
        })
    }

    getQuestIconComponent(questId:string) {
        for(const component of this.mapMediator.getComponentList()) {
            if(component instanceof QuestIconComponent && component.quest.id === questId) {
                return component
            }
        }
    }

    getComponents():IMapsComponent[] {
        return this.mapMediator.getComponentList();
    }

    getActiveMap():string {
        return this.mapMediator.activeMap;
    }

    async loadMap(mapId:string) {
        await this.mapMediator.init(mapId);
    }

    async update(request: MapRequest) {
        if(!this.mapMediator) {
            console.warn("[MapPageMediator] Map mediator not initialized; skipping update.");
            return;
        }
        if(!this.isPageLoaded) {
            await this.load();
        }
        if(!this.mapMediator) {
            console.warn("[MapPageMediator] Map mediator not initialized after load; skipping update.");
            return;
        }
        if(!request.mediator) {
            request.mediator = this.mapMediator;
        }
        request.notifyOthers = false;
        await this.mapMediator.update(request);
    }

    private isPageLoaded():boolean {
        const runner = document.getElementById("mapDiv")
        if(runner) {
            return true;
        }
        return false;
    }
}