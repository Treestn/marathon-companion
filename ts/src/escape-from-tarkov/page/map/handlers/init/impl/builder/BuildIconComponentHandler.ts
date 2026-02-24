import { IconComponent } from "../../../../components/impl/IconComponent";
import { QuestIconComponent } from "../../../../components/impl/QuestIconComponent";
import { IMapMediator } from "../../../../mediator/IMapMediator";
import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";
import { FilterConst } from "../../../../../../constant/FilterConst";
import { Elements, FilterElementsData, HighLevelElement, ListElementEntity } from "../../../../../../../model/IFilterElements";
import { Quest } from "../../../../../../../model/quest/IQuestsElements";
import { QuestsUtils } from "../../../../../quests/utils/QuestsUtils";
import { BtrPathComponent } from "../../../../components/impl/BtrPathComponent";
import { Dimension } from "../../../../../../utils/Dimension";
import { UuidGenerator } from "../../../../../../service/helper/UuidGenerator";

export class BuildIconComponentHandler extends AbstractChainHandler {

    handle(request: IMapInitRequest) {
        if(request.filters) {
            for(const hle of request.filters.highLevelElements) {
                if(hle.name === FilterConst.LABEL.name) {
                    continue;
                }
                hle.elements.forEach(element => {
                    element.listElements.forEach(entity => {
                        const component = this.buildComponent(request.mediator, hle, element, entity);
                        if(component) {
                            request.mapBuilder.addIcon(component)
                        } else {
                            console.log(`Component did not load for ID: ${entity.id} of type ${element.name}`);
                        }
                    })
                })
            }
        }
    }
    
    buildComponent(mediator:IMapMediator, hle:HighLevelElement, element: Elements, entity: ListElementEntity):IconComponent {
        switch(hle.name) {
            case FilterConst.QUESTS.name: return this.buildQuestsComponent(mediator, String(entity.id), hle, element, entity);
            default: return this.buildGenericComponent(mediator, String(entity.id), hle, element, entity)
        }
    }

    buildGenericComponent(mediator:IMapMediator, type:string, hle:HighLevelElement, element: Elements, entity: ListElementEntity):IconComponent {
        return new IconComponent(mediator, type, hle, element, entity);
    }

    buildLootComponent(mediator:IMapMediator, type:string, hle:HighLevelElement, element: Elements, entity: ListElementEntity) {
        return new IconComponent(mediator, type, hle, element, entity);
    }

    buildBtrComponent(mediator:IMapMediator, type:string, filter:FilterElementsData, hle:HighLevelElement) {
        return new BtrPathComponent(mediator, type, hle, new Dimension(filter.width, filter.height));
    }

    buildEnnemiesComponent(mediator:IMapMediator, type:string,  hle:HighLevelElement, element: Elements, entity: ListElementEntity) {

    }

    buildExtractionComponent(mediator:IMapMediator, type:string,  hle:HighLevelElement, element: Elements, entity: ListElementEntity) {

    }

    buildSpawnComponent(mediator:IMapMediator, type:string,  hle:HighLevelElement, element: Elements, entity: ListElementEntity) {

    }

    buildQuestsComponent(mediator:IMapMediator, type:string,  hle:HighLevelElement, element: Elements, entity: ListElementEntity):IconComponent {
        let quest:Quest;
        if(entity.questId) {
            quest = QuestsUtils.getQuestFromID(entity.questId);
            if(!quest) {
                console.log(`Quest could not be found for id: ${entity.questId}`)
            }
        } else {
            console.log(`Quest Component could not built for: ${entity.id} because the questId was not present`);
        }
        return new QuestIconComponent(mediator, type, hle, element, entity, quest);
    }

    buildMiscComponent(mediator:IMapMediator, type:string, element: Elements, entity: ListElementEntity) {

    }
}