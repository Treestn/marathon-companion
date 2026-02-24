import { sessionKeys } from "../../consts";
import { FilterStates, IFilterStates } from "../../model/IFilterState";

export class SessionUtils {

    private static filterState:IFilterStates;

    static getSecondMonitorFlag():boolean {
        return overwolf.windows.getMainWindow().sessionStorage.getItem(sessionKeys.secondMonitorFlag) === "true" ? true : false
    }

    static getTemporaryMapSelected(): string {
        return overwolf.windows.getMainWindow().sessionStorage.getItem(sessionKeys.temporaryMapSelection)
    }

    static getTemporaryRaidType(): string {
        return overwolf.windows.getMainWindow().sessionStorage.getItem(sessionKeys.temporaryRaidType)
    }
    
    static getPreviousGameInfoEvent(): string {
        return overwolf.windows.getMainWindow().sessionStorage.getItem(sessionKeys.previousGameInfoEvent)
    }

    static getActiveMapSession(): string {
        return overwolf.windows.getMainWindow().sessionStorage.getItem(sessionKeys.activeMap)
    }

    static getUtilityApiState(): string {
        return overwolf.windows.getMainWindow().sessionStorage.getItem(sessionKeys.utilityApiState)
    }

    static getWasInGameState(): string {
        return overwolf.windows.getMainWindow().sessionStorage.getItem(sessionKeys.wasInGameState)
    }

    static getFilterStates(): IFilterStates {
        if(!this.filterState) {
            const stored =  overwolf.windows.getMainWindow().sessionStorage.getItem(sessionKeys.filterState);
            if(stored) {
                this.filterState = Object.assign(new FilterStates(), JSON.parse(stored));
            } else {
                this.filterState = new FilterStates();
                this.setFilterState();
            }
        }
        return this.filterState
    }

    static setSecondMonitorFlag(pref:string):void {
        if(!this.isStringBooleanValueAccepted(pref)) {
            throw new Error(`Monitor Preference is wrong: ${pref}`);
        }
        overwolf.windows.getMainWindow().sessionStorage.setItem(sessionKeys.secondMonitorFlag, pref)
    }

    static setTemporaryMapSelected(map: string): void {
        overwolf.windows.getMainWindow().sessionStorage.setItem(sessionKeys.temporaryMapSelection, map);
    }

    static setTemporaryRaidTypeSelected(raidType: string): void {
        overwolf.windows.getMainWindow().sessionStorage.setItem(sessionKeys.temporaryRaidType, raidType);
    }

    static setPreviousGameInfoEvent(event: string): void {
        overwolf.windows.getMainWindow().sessionStorage.setItem(sessionKeys.previousGameInfoEvent, event);
    }

    static setActiveMapSession(value: string): void {
        overwolf.windows.getMainWindow().sessionStorage.setItem(sessionKeys.activeMap, value)
    }

    static setUtilityApiState(value: string): void {
        overwolf.windows.getMainWindow().sessionStorage.setItem(sessionKeys.utilityApiState, value)
    }

    static setWasInGameFlag(value: string): void {
        overwolf.windows.getMainWindow().sessionStorage.setItem(sessionKeys.wasInGameState, value)
    }

    static setFilterState() {
        overwolf.windows.getMainWindow().sessionStorage.setItem(sessionKeys.filterState, JSON.stringify(this.filterState));
    }

    static deleteTemporaryMapSelected(): void {
        overwolf.windows.getMainWindow().sessionStorage.removeItem(sessionKeys.temporaryMapSelection)
    }

    private static isStringBooleanValueAccepted(value:string) {
        return value === "true" || value === "false"
    }
}