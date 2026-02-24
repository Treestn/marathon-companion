export const ProgressionTypes = {
    PVE: {owEvent: "PVE", storedString: "pve", displayedName: "PvE"} as ProgressionType,
    PVP: {owEvent: "PVP", storedString: "pvp", displayedName: "PvP"} as ProgressionType
}

export const ProgressionTypesList = [
    {owEvent: "", storedString: "", displayedName: ""},
    ProgressionTypes.PVE,
    ProgressionTypes.PVP
]

export type ProgressionType = {
    owEvent: string,
    storedString: string,
    displayedName: string
}

export const QuestStates = {
    READY_TO_START: {owEvent: "AvailableForStart", displayedName: "Blocked", active: false, blocked: true, completed: false, failed: false} as ProgressionQuestStatus,
    AVAILABLE_FOR_FINISH: {owEvent: "AvailableForFinish", displayedName: "Available For Finish", active: false, blocked: true, completed: false, failed: false} as ProgressionQuestStatus,
    STARTED: {owEvent: "Started", displayedName: "Active", active: true, blocked: false, completed: false, failed: false} as ProgressionQuestStatus,
    COMPLETED: {owEvent: "Success", displayedName: "Completed", active: false, blocked: false, completed: true, failed: false} as ProgressionQuestStatus,
    FAILED: {owEvent: "Fail", displayedName: "Failed", active: false, blocked: false, completed: false, failed: true} as ProgressionQuestStatus,
}

export type ProgressionQuestStatus = {
    owEvent: string,
    displayedName: string,
    active: boolean,
    blocked: boolean,
    completed: boolean,
    failed: boolean
}

export class OwEventMapper {

    static getProgressionType(type:string): ProgressionType {
        if(type === ProgressionTypes.PVP.owEvent) {
            return ProgressionTypes.PVP
        }
        if(type === ProgressionTypes.PVE.owEvent) {
            return ProgressionTypes.PVE
        }
        return null
    }

    static getProgressionQuestStatus(owState:string): ProgressionQuestStatus {
        if(owState === QuestStates.READY_TO_START.owEvent) {
            return QuestStates.READY_TO_START
        }
        if(owState === QuestStates.STARTED.owEvent) {
            return QuestStates.STARTED
        }
        if(owState === QuestStates.COMPLETED.owEvent) {
            return QuestStates.COMPLETED
        }
        if(owState === QuestStates.FAILED.owEvent) {
            return QuestStates.FAILED
        }
    }
}