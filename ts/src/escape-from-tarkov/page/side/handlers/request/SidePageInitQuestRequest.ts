import { HideoutObject } from "../../../../../model/HideoutObject";
import { ItemsV2Object } from "../../../../../model/items/IItemsElements";
import { QuestsObject } from "../../../../../model/quest/IQuestsElements";
import { WeaponImagesElements } from "../../../../../model/IWeaponImage";
import { IRequest } from "../../../../types/IRequest";
import { ItemsElementUtils } from "../../../../utils/ItemsElementUtils";
import { WeaponImageUtils } from "../../../../utils/WeaponImageUtils";
import { MapPageMediator } from "../../../map/MapPageMediator";
import { QuestPageMediator } from "../../../quests/QuestPageMediator";
import { QuestsUtils } from "../../../quests/utils/QuestsUtils";
import { QuestSidePageBuilder } from "../../builder/impl/QuestSidePageBuilder";
import { SidePageQuestMediator } from "../../mediator/SidePageQuestMediator";

export class SidePageInitQuestRequest implements IRequest {

    event: string;
    subEvent: string;
    mediator: SidePageQuestMediator;
    questMediator:QuestPageMediator;
    mapMediator:MapPageMediator;

    builder:QuestSidePageBuilder;

    quests: QuestsObject;
    storedQuests: QuestsObject;

    itemsElement:ItemsV2Object;
    storedItemsElement:ItemsV2Object;

    weaponImage:WeaponImagesElements;
    storedWeaponImage:WeaponImagesElements;

    hideoutElement:HideoutObject;
    storedHideoutElement:HideoutObject;


    constructor(mediator:SidePageQuestMediator, questMediator:QuestPageMediator, mapMediator:MapPageMediator) {
        this.mediator = mediator;
        this.builder = new QuestSidePageBuilder();
        this.questMediator = questMediator;
        this.mapMediator = mapMediator;
        
        if(QuestsUtils.exists()) {
            this.quests = QuestsUtils.getData();
        }
        if(WeaponImageUtils.exists()) {
            this.weaponImage = WeaponImageUtils.getData();
        }
        if(ItemsElementUtils.exists()) {
            this.itemsElement = ItemsElementUtils.getData();
        }
    }

}