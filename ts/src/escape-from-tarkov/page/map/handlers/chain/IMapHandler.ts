import { IChainHandler } from "../../../../types/IChainHandler";

export interface IMapHandler extends IChainHandler {
    setAllowedTargets(targets:string[])
    setAllowedEvents(events:string[]);
    setAllowedSubEvents(subEvents:string[]);
    getAllowedTargets(): string[]
    getAllowedEvents(): string[]
    getAllowedSubEvents(): string[]
}