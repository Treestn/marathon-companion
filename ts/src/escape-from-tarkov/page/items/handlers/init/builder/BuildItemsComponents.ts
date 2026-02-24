import { progressionTypes } from "../../../../../../consts";
import { ObjectiveTypeConst } from "../../../../../constant/EditQuestConst";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { AppConfigUtils } from "../../../../../utils/AppConfigUtils";
import { ItemsElementUtils } from "../../../../../utils/ItemsElementUtils";
import { ItemsUtils } from "../../../../../utils/ItemsUtils";
import { HideoutUtils } from "../../../../hideout/utils/HideoutUtils";
import { QuestsUtils } from "../../../../quests/utils/QuestsUtils";
import { ItemsComponent } from "../../../component/ItemsComponent";
import { ItemsInitRequest } from "../../request/ItemsInitRequest";

export class BuildItemsComponents extends AbstractChainHandler {

    async handle(request: ItemsInitRequest) {
        const map:Map<string, number> = ItemsUtils.getMapOfAllItemsWithOverallAmount()
        const progressionType = AppConfigUtils.getAppConfig().userSettings.getProgressionType();
        for(const itemId of map.keys()) {
            const itemData = await ItemsElementUtils.getItemInformation(itemId);
            if(!itemData?.name) {
                console.log(`Could not fetch item information for item id: ${itemId}, the component will not be built`);
                continue;
            }
            const component = new ItemsComponent(itemId, itemData);
            this.addHideoutToItemComponent(component, progressionType);
            this.addQuestToItemComponent(component);
            request.mediator.add(component);
            request.builder.addItemComponent(component);
        }
    }
    
    private addHideoutToItemComponent(component:ItemsComponent, progressionType:string) {
        if(HideoutUtils.getData() && HideoutUtils.getData().hideoutStations) {
            HideoutUtils.getData().hideoutStations.forEach(station => {
                if(station.levels) {
                    station.levels.forEach(hideoutLevel => {
                        if(progressionType === progressionTypes.pve) {
                            if(hideoutLevel.itemPveRequirements) {
                                hideoutLevel.itemPveRequirements.forEach(itemRequirement => {
                                    if(itemRequirement.item.id === component.itemId) {
                                        component.addHideoutStationLevel(station, hideoutLevel);
                                        return;
                                    }
                                })
                            }
                        } else {
                            if(hideoutLevel.itemRequirements) {
                                hideoutLevel.itemRequirements.forEach(itemRequirement => {
                                    if(itemRequirement.item.id === component.itemId) {
                                        component.addHideoutStationLevel(station, hideoutLevel);
                                        return;
                                    }
                                })
                            }
                        }
                    })
                }
            })
        } else {
            console.log(`Issue with retrieving the Hideout data`);
        }
    }

    private addQuestToItemComponent(component:ItemsComponent) {
        QuestsUtils.getData().tasks.forEach(quest => {
            if(quest.objectives && quest.objectives.length > 0) {
                quest.objectives.forEach(obj => {
                    if((obj.type === ObjectiveTypeConst.FIND_ITEM.type || obj.type === ObjectiveTypeConst.GIVE_ITEM.type)
                         && obj.item && obj.item.id === component.itemId) {
                        component.addQuestObjective(quest, obj);
                        return;
                    }
                })
            }
        })
    }
}