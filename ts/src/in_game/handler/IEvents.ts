export interface IOwEvent {
    getMap():string
    getFeature():string
    getGameInfo():string
    getRaidType():string
    getSessionType():string
    getQuestsList():OWQuestEvent[]
    getQuestsListv2():OWQuestEvent[]
}

export interface EventInfo {
    info: EventInfo;
    feature: string
}

export interface EventInfo {
    match_info?: MatchInfo
    game_info?:GameInfo
}

export interface MatchInfo {
    map:string
    raid_type:string
    session_type:string
}

export interface GameInfo {
    phase:string
    quests_list: string
    quests_list_0: string
    quests_list_1: string
    quests_list_2: string
    quests_list_3: string
    quests_list_4: string
    quests_list_5: string
    quests_list_6: string
    quests_list_7: string
    quests_list_8: string
    quests_list_9: string
    quests_list_10: string
    quests_list_11: string
    quests_list_12: string
}

export type OWQuestEvent = {
    trader: string,
    quest: string,
    quest_id: string,
    quest_type: string,
    quest_status: string,
    location: string,
    level: number
}

export class OwEventImpl implements IOwEvent {

    private eventInfo: EventInfo

    constructor(json) {
        this.eventInfo = JSON.parse(json)
    }

    getMap():string {
        if(this.eventInfo.info?.match_info?.map) {
            return this.eventInfo.info.match_info.map
        }
        return null
    }

    getRaidType():string {
        if(this.eventInfo.info?.match_info?.raid_type) {
            return this.eventInfo.info.match_info.raid_type
        }
        return null;
    }

    getSessionType():string {
        if(this.eventInfo.info?.match_info?.session_type) {
            return this.eventInfo.info.match_info.session_type
        }
        return null;
    }

    getFeature():string {
        return this.eventInfo.feature
    }

    getGameInfo():string {
        if(this.eventInfo?.info?.game_info?.phase) {
            return this.eventInfo.info.game_info.phase
        }
        return null
    }

    getQuestsList():OWQuestEvent[] {
        if(this.eventInfo?.info?.game_info?.quests_list) {
            return JSON.parse(this.eventInfo.info.game_info.quests_list)
        }
        return null
    }

    getQuestsListv2(): OWQuestEvent[] {
        const list: OWQuestEvent[] = []
        if(this.eventInfo?.info?.game_info?.quests_list_0) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_0))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_1) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_1))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_2) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_2))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_3) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_3))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_4) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_4))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_5) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_5))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_6) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_6))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_7) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_7))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_8) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_8))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_9) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_9))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_10) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_10))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_11) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_11))
        }
        if(this.eventInfo?.info?.game_info?.quests_list_12) {
            list.push(...JSON.parse(this.eventInfo.info.game_info.quests_list_12))
        }
        return list.length > 0 ? list : null;
    }
}