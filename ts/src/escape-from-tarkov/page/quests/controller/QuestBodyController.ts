import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { Objectives, Quest } from "../../../../model/quest/IQuestsElements";
import { QuestRequest } from "../handlers/request/QuestRequest";
import { QuestMediator } from "../mediator/QuestMediator";

export class QuestBodyController {

    private static mediator:QuestMediator;

    static setMediator(mediator:QuestMediator) {
        this.mediator = mediator;
    }

    static addObjectiveCompletionControllerEventListener(container:HTMLElement, quest:Quest, objective:Objectives) {
        container.addEventListener('dblclick', e => {
            if(!this.isTargetImageSection(e as PointerEvent)) {
                this.questGoalClicked(container, quest, objective)
            }
        })

        container.addEventListener('click', e => {
            if(!this.isTargetImageSection(e as PointerEvent)) {
                this.questGoalClicked(container, quest, objective)
            }
        })
    }

    private static isTargetImageSection(e:PointerEvent) {
        const target = e.target as HTMLElement
        return target.classList.contains("quest-image-location-div")
            || target.classList.contains("quest-image-location-container")
            || target.classList.contains("quest-image-location")
            || target.classList.contains("quest-img-description-div")
            || target.classList.contains("quest-img-description")
            || target.classList.contains("quest-image-find-on-map-container")
            || target.classList.contains("quest-image-find-on-map-text")
            || target.classList.contains("overlay-image-selector")
            || target.classList.contains("overlay-selector-icon")
    }

    private static questGoalClicked(container:HTMLElement, quest:Quest, objective:Objectives) {
        this.mediator.update(new QuestRequest(this.mediator, EventConst.QUEST_BODY, 
            DataEventConst.QUEST_OBJECTIVE_UPDATE, quest, null, container))
    }

    static registerItemNavigationController(itemId:string, element:HTMLElement) {
        element.onclick = (e) => {
            const request = new QuestRequest(this.mediator, EventConst.ITEM_SEARCH, DataEventConst.MOUSE_CLICK
                , null, null, null);
            request.itemId = itemId
            request.notifyOthers = true;
            this.mediator.update(request);
            e.stopPropagation();
        }
    }
}