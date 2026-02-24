import { IRequest } from "./IRequest";

export interface IChainMediator {
    handle(request:IRequest)
}