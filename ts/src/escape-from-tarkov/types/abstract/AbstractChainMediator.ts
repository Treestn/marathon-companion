import { IChainHandler } from "../IChainHandler";
import { IChainMediator } from "../IChainMediator";
import { IRequest } from "../IRequest";

export abstract class AbstractChainMediator implements IChainMediator {

    static entryPoint:IChainHandler;
    
    constructor() {
    }

    abstract init();

    handle(request:IRequest) {
        let currentHandler = AbstractChainMediator.entryPoint;
        while(currentHandler) {
            if(currentHandler.isNeeded) {
                currentHandler.handle(request)
            }
            currentHandler = currentHandler.nextHandler()
        }
    }
}