import { IMediator } from "./IMediator";

export interface IRequest {
    mediator: IMediator;
    event:string;
    subEvent:string;
}