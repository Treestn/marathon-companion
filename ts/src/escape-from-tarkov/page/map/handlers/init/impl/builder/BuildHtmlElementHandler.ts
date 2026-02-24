import { IMapInitRequest } from "../../../request/IMapInitRequest";
import { AbstractChainHandler } from "../../../../../../types/abstract/AbstractChainHandler";

export class BuildHtmlElementHandler extends AbstractChainHandler {
    async handle(request: IMapInitRequest) {
        let componentList = await request.mapBuilder.build()
        request.mediator.addAll(componentList)
    }
}