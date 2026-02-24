import { IChainHandler } from "../IChainHandler";
import { IChainMediator } from "../IChainMediator";
import { IRequest } from "../IRequest";

export abstract class AsyncAbstractChainMediator implements IChainMediator {

    entryPoint:IChainHandler;
    
    constructor() {
    }

    abstract init();

    async handle(request:IRequest) {
        let currentHandler = this.entryPoint;
        while(currentHandler) {
            if(currentHandler.isNeeded) {
                await currentHandler.handle(request)
            }
            currentHandler = currentHandler.nextHandler()
        }
    }
}