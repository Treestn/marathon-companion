import { HideoutLevels, HideoutStations } from "../../../../model/HideoutObject";
import { Objectives, Quest } from "../../../../model/quest/IQuestsElements";
import { Item } from "../../../service/consumer/TarkovDevConsumer";

export class ItemsComponent {
    itemId:string;
    itemData:Item
    questsRequirement:Map<Quest, Objectives[]> = new Map();
    hideoutRequirement:Map<HideoutStations, HideoutLevels[]> = new Map();

    constructor(itemId:string, item:Item) {
        this.itemId = itemId;
        this.itemData = item
    }

    addQuestObjective(quest:Quest, objective:Objectives) {
        if(!this.questsRequirement.has(quest)) {
            this.questsRequirement.set(quest, new Array(objective));
        }
        for(const questKey of this.questsRequirement.keys()) {
            if(questKey.id === quest.id) {
                const objectiveList = this.questsRequirement.get(questKey);
                for(const obj of objectiveList) {
                    if(obj.id === objective.id) {
                        return;
                    }
                }
                this.questsRequirement.get(questKey).push(objective);
                return;
            }
        }
    }

    addHideoutStationLevel(hideoutStation:HideoutStations, hideoutLevel:HideoutLevels) {
        if(!this.hideoutRequirement.has(hideoutStation)) {
            this.hideoutRequirement.set(hideoutStation, new Array(hideoutLevel));
        }
        for(const hideoutKey of this.hideoutRequirement.keys()) {
            if(hideoutKey.id === hideoutStation.id) {
                const hideoutLevelList = this.hideoutRequirement.get(hideoutKey);
                for(const level of hideoutLevelList) {
                    if(level.id === hideoutLevel.id) {
                        return;
                    }
                }
                this.hideoutRequirement.get(hideoutKey).push(hideoutLevel);
                return;
            }
        }
    }
}