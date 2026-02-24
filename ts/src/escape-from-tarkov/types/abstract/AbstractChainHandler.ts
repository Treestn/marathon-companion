import { IChainHandler } from "../IChainHandler";
import { IRequest } from "../IRequest";


export abstract class AbstractChainHandler implements IChainHandler {
    
    private next: IChainHandler;

    setNext(handler: IChainHandler) {
        this.next = handler;
    }

    hasNext():boolean {
        if(this.next) {
            return true
        }
        return false;
    }

    // We go through them all
    isNeeded(request: IRequest): boolean {
        return true;
    }

    nextHandler(): IChainHandler {
        return this.next;
    }

    abstract handle(request: IRequest);
}