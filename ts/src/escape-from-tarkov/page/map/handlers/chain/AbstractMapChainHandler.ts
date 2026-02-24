import { IMapRequest } from "../request/IMapRequest";
import { IMapHandler } from "./IMapHandler";

export abstract class AbstractMapChainHandler implements IMapHandler {
    private next: IMapHandler;
    private allowedTargets:string[];
    private allowedEvents:string[] = [];
    private allowedSubEvents:string[] = [];

    setAllowedTargets(targets:string[]) {
        this.allowedTargets.concat(targets)
    }

    setAllowedEvents(events:string[]) {
        this.allowedEvents.concat(events)
    }

    setAllowedSubEvents(subEvents:string[]) {
        this.allowedSubEvents.concat(subEvents)
    }

    getAllowedTargets(): string[] {
        return this.allowedTargets
    }

    getAllowedEvents(): string[] {
        return this.allowedEvents
    }

    getAllowedSubEvents(): string[] {
        return this.allowedSubEvents
    }

    setNext(handler: IMapHandler) {
        this.next = handler;
    }

    hasNext():boolean {
        if(this.next) {
            return true
        }
        return false;
    }

    nextHandler(): IMapHandler {
        return this.next;
    }

    isNeeded(request: IMapRequest): boolean {
        if(!this.allowedEvents) {
            throw new Error("Chain Of Responsability: Events not declared");
        }
        if(!this.allowedSubEvents) {
            throw new Error("Chain Of Responsability: Sub Events not declared");
        }
        if(!this.allowedTargets) {
            throw new Error("Chain Of Responsability: Targets not declared");
        }
        return this.allowedEvents.includes(request.event) 
        && (request.subEvent ? this.allowedSubEvents.includes(request.subEvent) : true)
    }

    abstract handle(request: IMapRequest);

}