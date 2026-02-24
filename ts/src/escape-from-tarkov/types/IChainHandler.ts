import { IRequest } from "./IRequest";

export interface IChainHandler {
    setNext(handler:IChainHandler);
    hasNext():boolean;
    isNeeded(request: IRequest):boolean;
    nextHandler():IChainHandler;
    handle(request:IRequest);
}