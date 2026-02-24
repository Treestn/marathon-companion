import { FullscreenImageController } from "../../../controller/FullscreenImageController";
import { DataEventConst } from "../../../events/DataEventConst";
import { EventConst } from "../../../events/EventConst";
import { Objectives, QuestImage } from "../../../../model/quest/IQuestsElements";
import { QuestMediator } from "../../quests/mediator/QuestMediator";
import { QuestsUtils } from "../../quests/utils/QuestsUtils";
import { PopupIconComponent } from "../components/impl/PopupIconComponent";
import { QuestIconComponent } from "../components/impl/QuestIconComponent";
import { MapRequest } from "../handlers/request/impl/MapRequest";
import { IMapMediator } from "../mediator/IMapMediator";

export class PopupController {

    private static mapMediator:IMapMediator;
    // private static questMediator:QuestMediator;

    static setMapMediator(mediator:IMapMediator) {
        if(!this.mapMediator) {
            this.mapMediator = mediator
        }
    }

    // static setQuestMediator(mediator:QuestMediator) {
    //     if(!this.questMediator) {
    //         this.questMediator = mediator
    //     }
    // }

    static registerPopupTitleEventListener(textWrapper:HTMLElement, component:QuestIconComponent) {
        textWrapper.onclick = async(e) => {
            this.mapMediator.update(new MapRequest(this.mapMediator, EventConst.QUEST_SEARCH, e, component, 
                DataEventConst.MOUSE_CLICK, new Date().getTime()))
        }
    }

    static registerPopupObjectiveEventListener(textWrapper:HTMLElement, component:PopupIconComponent) {
        textWrapper.onclick = async(e) => {
            this.mapMediator.update(new MapRequest(this.mapMediator, EventConst.QUEST_UPDATE, e, component, 
                DataEventConst.QUEST_OBJECTIVE_UPDATE, new Date().getTime()))
        }
    }

    static registerImageFullscreenEventListener(imageElement) {
        let isHeld = false;
        let timer:number;
        imageElement.addEventListener('mousedown', () => {
            isHeld = false;
            timer = setTimeout(() => {
                isHeld = true;
            }, 100); // 100ms threshold
        });
      
        imageElement.addEventListener('mouseup', () => {
            clearTimeout(timer);
        });

        imageElement.addEventListener('click', () => {
            if(!isHeld) {
                FullscreenImageController.fullScreenImageElement(imageElement);
            }
        })
    }

    static registerQuestImageCyclingEventListener(imageElement:HTMLImageElement, questImages:QuestImage[]) {
        imageElement.onclick = () => {
            const imagePaths:string[] = [];
            for(const questImage of questImages) {
                imagePaths.push(...questImage.paths)
            }
            FullscreenImageController.fullScreenImageElementWithCycling(imageElement, imagePaths);
        }
    }

    static registerImageCyclingEventListener(imageElement:HTMLImageElement, images:string[]) {
        imageElement.onclick = () => {
            FullscreenImageController.fullScreenImageElementWithCycling(imageElement, images);
        }
    }
}