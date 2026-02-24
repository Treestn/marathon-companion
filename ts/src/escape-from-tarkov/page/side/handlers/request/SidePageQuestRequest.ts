import { OWQuestEvent } from "../../../../../in_game/handler/IEvents";
import { Quest } from "../../../../../model/quest/IQuestsElements";
import { IMediator } from "../../../../types/IMediator";
import { IRequest } from "../../../../types/IRequest";
import { HideoutPageMediator } from "../../../hideout/HideoutPageMediator";
import { ItemsPageMediator } from "../../../items/ItemsPageMediator";
import { MapPageMediator } from "../../../map/MapPageMediator";
import { QuestPageMediator } from "../../../quests/QuestPageMediator";

export class SidePageQuestRequest implements IRequest {
    event: string;
    subEvent: string;
    mediator: IMediator;
    mapMediator: MapPageMediator;
    questMediator: QuestPageMediator;
    hideoutMediator: HideoutPageMediator;
    itemsMediator: ItemsPageMediator;
    quest:Quest;
    notifyOthers:boolean = true;
    htmlElement:HTMLElement;

    constructor(mediator:IMediator, mapMediator:MapPageMediator, questMediator:QuestPageMediator, 
            event:string, subevent:string, quest:Quest) {
        this.mediator = mediator;
        this.mapMediator = mapMediator;
        this.questMediator = questMediator;
        this.event = event;
        this.subEvent = subevent;
        this.quest = quest;
    }
}