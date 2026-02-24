import { IconComponent } from "../../../../components/impl/IconComponent";
import { DataEventConst } from "../../../../../../events/DataEventConst";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";
import { MapRequest } from "../../../request/impl/MapRequest";
import { ListElementEntity } from "../../../../../../../model/IFilterElements";
import { FilterUtils } from "../../../../utils/FilterUtils";
import { EditSession } from "../../../../../quests/edit/EditSession";
import { QuestIconComponent } from "../../../../components/impl/QuestIconComponent";
import { EditableQuest } from "../../../../../quests/edit/EditableQuest";
import { QuestsUtils } from "../../../../../quests/utils/QuestsUtils";
import { IconUtils } from "../../../../utils/IconUtils";

export class RemoveIconHandler extends AbstractMapChainHandler {
    
    handle(request: MapRequest) {
        if(request.subEvent === DataEventConst.MOUSE_CLICK) {
            this.handleMouseClick(request);
        } 
    }
    
    private handleMouseClick(request:MapRequest) {
        if(request.mouseEvent.shiftKey && request.mouseEvent.ctrlKey && request.component instanceof IconComponent 
            ) {
            if(!request.component.entity.protectedEntity) {
                let newFilterElementEntityList:ListElementEntity[] = [];
                for(const entity of request.component.element.listElements) {
                    if(entity.id !== (request.component as IconComponent).entity.id) {
                        newFilterElementEntityList.push(entity);
                    }
                }
    
                (request.component as IconComponent).element.listElements = newFilterElementEntityList;
                const iconDiv = document.getElementById(String((request.component as IconComponent).entity.id))
                if(iconDiv) {
                    iconDiv.remove();
                }
                request.mediator.remove(request.component.popupComponent);
                request.mediator.remove(request.component)
                FilterUtils.save(request.mediator.getFilter());
            }
            this.removeEditFilter(request.mediator.getFilter().map, request.component);
        }
    }

    private removeEditFilter(map:string, component:IconComponent) {
        if(EditSession.isSessionOpen()) {
            EditSession.removeMapFilterElement(map, component.entity, component.element);
            if(component instanceof QuestIconComponent) {
                let editableQuest = EditSession.getModifiedQuest(component.entity.questId);
                if(!editableQuest) {
                    editableQuest = new EditableQuest(QuestsUtils.getQuestFromID(component.entity.questId));
                    EditSession.addModifiedQuest(editableQuest);
                } 
                editableQuest.removeIconFromObjective(String(component.entity.id));
                EditSession.removeImageBlobsWithIconId(component.entity.id);
                
            }
            IconUtils.hideIcon(String(component.entity.id));
        }
    }
}