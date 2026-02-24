import { FullscreenImageController } from "../../../controller/FullscreenImageController"
import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { Quest } from "../../../../model/quest/IQuestsElements";
import { PlayerProgressionUtils } from "../../../utils/PlayerProgressionUtils";
import { QuestRequest } from "../handlers/request/QuestRequest";
import { QuestMediator } from "../mediator/QuestMediator";

export class QuestImageController {

    private static mediator:QuestMediator;

    static setMediator(mediator:QuestMediator) {
        this.mediator = mediator;
    }

    static createQuestImageCyclingEventListener(paths:string[], imageElement:HTMLImageElement) {
        imageElement.addEventListener('click', () => {
            FullscreenImageController.fullScreenImageElementWithCycling(imageElement as HTMLImageElement, paths)
        })
    }

    static createQuestImageEventListener(imageElement:HTMLImageElement) {
        imageElement.addEventListener('click', () => {
            FullscreenImageController.fullScreenImageElement(imageElement)   
        })
    }

    static createNavigateToMapIcon(htmlTarget:HTMLElement, quest:Quest, iconId:string) {
        htmlTarget.addEventListener("click", () => {
            if(PlayerProgressionUtils.isQuestActive(quest.id)) {
                let request = new QuestRequest(this.mediator, EventConst.SELECT_ICON, DataEventConst.ZOOM_ON_ICON, quest, null, htmlTarget)
                request.id = iconId
                this.mediator.update(request);
            }
        })
    }

    static createNavigateToMapKey(htmlTarget:HTMLElement, keyId:string, mapId:string) {
        htmlTarget.addEventListener("click", () => {
            let request = new QuestRequest(this.mediator, EventConst.SELECT_KEY_ICON, DataEventConst.ZOOM_ON_ICON, null, null, htmlTarget)
            request.id = keyId
            request.mapId = mapId;
            this.mediator.update(request);
        })
    }
}