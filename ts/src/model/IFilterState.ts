export interface IFilterStates {
    mapFilter:IMapFilterState;
    questFilter:IQuestFilterState;
    hideoutFilter:IHideoutFilterState;
    itemsFilter:IItemsFilterState;
    resolve():void;
}

export class FilterStates implements IFilterStates {
    
    mapFilter: IMapFilterState;
    questFilter: IQuestFilterState;
    hideoutFilter: IHideoutFilterState;
    itemsFilter: IItemsFilterState;

    constructor() {
        this.init()
    }

    private init() {
        if(!this.mapFilter) {
            this.mapFilter = new MapFilterState();
        }
        if(!this.questFilter) {
            this.questFilter = new QuestFilterState()
        }
        if(!this.hideoutFilter) {
            this.hideoutFilter = new HideoutFilterState();
        }
        if(!this.itemsFilter) {
            this.itemsFilter = new ItemFilterState();
        }
    }

    resolve():void {
        this.init();
        this.mapFilter = Object.assign(new MapFilterState(), this.mapFilter);
        this.mapFilter.resolve();
        this.questFilter = Object.assign(new QuestFilterState(), this.questFilter);
        this.questFilter.resolve();
        this.hideoutFilter = Object.assign(new HideoutFilterState(), this.hideoutFilter);
        this.hideoutFilter.resolve();
        this.itemsFilter = Object.assign(new ItemFilterState(), this.itemsFilter);
        this.itemsFilter.resolve();
    }
}

export interface IMapFilterState {
    filterQuestWithMap:boolean;
    orderTrader:boolean;
    orderQuestName:boolean;
    kappaOnly:boolean;
    resolve():void;
}

export class MapFilterState implements IMapFilterState {

    filterQuestWithMap: boolean;
    orderTrader:boolean;
    orderQuestName:boolean;
    kappaOnly:boolean;

    constructor() {
        this.init();
    }

    private init() {
        if(this.filterQuestWithMap === null || this.filterQuestWithMap === undefined) {
            this.filterQuestWithMap = false;
        }
        if(this.orderTrader === null || this.orderTrader === undefined) {
            this.orderTrader = false;
        }
        if(this.orderQuestName === null || this.orderQuestName === undefined) {
            this.orderQuestName = false;
        }
        if(this.kappaOnly === null || this.kappaOnly === undefined) {
            this.kappaOnly = false;
        }
    }

    resolve() {
        this.init();
    }
}

export interface IQuestFilterState {
    orderByTrader:boolean;
    orderByQuestName:boolean;
    traderState:IState[];
    questTypeFilter: IState[];
    questStateFilter: IState[];
    mapFilterState: IState[];
    kappaFilterState:boolean;
    resolve():void;
}

export class QuestFilterState implements IQuestFilterState {
    orderByTrader:boolean;
    orderByQuestName:boolean;
    traderState: IState[];
    questTypeFilter: IState[];
    questStateFilter: IState[];
    mapFilterState: IState[];
    kappaFilterState: boolean;

    constructor() {
        this.init()
    }

    private init() {
        if(!this.orderByTrader) {
            this.orderByTrader = false;
        }
        if(!this.orderByQuestName) {
            this.orderByQuestName = false;
        }
        if(!this.traderState) {
            this.traderState = [];
        }
        if(!this.questTypeFilter) {
            this.questTypeFilter = [];
        }
        if(!this.questStateFilter) {
            this.questStateFilter = [];
        }
        if(!this.mapFilterState) {
            this.mapFilterState = [];
        }
        if(!this.kappaFilterState) {
            this.kappaFilterState = false;
        }
    }

    resolve() {
        this.init();
        
        this.traderState = this.traderState;
        // this.traderState.resolve();

        this.questTypeFilter = this.questTypeFilter;
        // this.questTypeFilter.resolve();

        this.questStateFilter = this.questStateFilter;
        // this.questStateFilter.resolve();

        this.mapFilterState = this.mapFilterState;
        // this.mapFilterState.resolve();
    }
}

export interface IQuestMapFilterState {
    customs:boolean;
    factory:boolean;
    groundZero:boolean;
    interchange:boolean;
    labs:boolean;
    lighthouse:boolean;
    reserve:boolean;
    shoreline:boolean;
    streets:boolean;
    woods:boolean;
    resolve():void;
}

export class QuestMapFilterState implements IQuestMapFilterState {

    customs: boolean;
    factory: boolean;
    groundZero: boolean;
    interchange: boolean;
    labs: boolean;
    lighthouse: boolean;
    reserve: boolean;
    shoreline: boolean;
    streets: boolean;
    woods: boolean;

    constructor() {
        this.init()
    }

    private init() {
        if(this.customs === null || this.customs === undefined) {
            this.customs = true;
        }
        if(this.factory === null || this.factory === undefined) {
            this.factory = true;
        }
        if(this.groundZero === null || this.groundZero === undefined) {
            this.groundZero = true;
        }
        if(this.interchange === null || this.interchange === undefined) {
            this.interchange = true;
        }
        if(this.labs === null || this.labs === undefined) {
            this.labs = true;
        }
        if(this.lighthouse === null || this.lighthouse === undefined) {
            this.lighthouse = true;
        }
        if(this.reserve === null || this.reserve === undefined) {
            this.reserve = true;
        }
        if(this.shoreline === null || this.shoreline === undefined) {
            this.shoreline = true;
        }
        if(this.streets === null || this.streets === undefined) {
            this.streets = true;
        }
        if(this.woods === null || this.woods === undefined) {
            this.woods = true;
        }
    }

    resolve() {
        this.init();
    }
}

export interface IQuestStateFilterState {
    active:boolean;
    completed:boolean;
    blocked:boolean;
    failed:boolean;
    noTracking:boolean;
    resolve():void;
}

export class QuestStateFilterState implements IQuestStateFilterState {

    active: boolean;
    completed: boolean;
    blocked: boolean;
    failed:boolean;
    noTracking:boolean;

    constructor() {
        this.init()
    }

    private init() {
        if(this.active === null || this.active === undefined) {
            this.active = true;
        }
        if(this.completed === null || this.completed === undefined) {
            this.completed = false;
        }
        if(this.blocked === null || this.blocked === undefined) {
            this.blocked = true;
        }
        if(this.failed === null || this.failed === undefined) {
            this.failed = true;
        }
        if(this.noTracking === null || this.noTracking === undefined) {
            this.noTracking = false;
        }
    }

    resolve() {
        this.init();
    }
}

export interface IState {
    id: string,
    state: boolean
}

export class FilterState implements IState {
    id:string;
    state:boolean;

    constructor(id:string, state:boolean) {
        this.id = id;
        this.state = state;
    }
}

export interface IQuestTypeFilterState {
    mainQuest:boolean;
    sideQuest:boolean;
    eventQuest:boolean;
    resolve():void;
}

export class QuestTypeFilterState implements IQuestTypeFilterState {
    mainQuest: boolean;
    sideQuest: boolean;
    eventQuest: boolean;

    constructor() {
        this.init()
    }

    private init() {
        if(this.mainQuest === null || this.mainQuest === undefined) {
            this.mainQuest = true;
        }
        if(this.sideQuest === null || this.sideQuest === undefined) {
            this.sideQuest = true;
        }
        if(this.eventQuest === null || this.eventQuest === undefined) {
            this.eventQuest = true;
        }
    }

    resolve() {
        this.init();
    }
}

export interface ITraderState {
    praporState:boolean;
    therapistState:boolean;
    fenceState:boolean;
    skierState:boolean;
    peacekeeperState:boolean;
    mechanicState:boolean;
    ragmanState:boolean;
    jaegerState:boolean;
    lightkeeperState:boolean;
    refState:boolean;
    btrDriverState:boolean;
    resolve():void;
}

export class TraderState implements ITraderState {
    praporState: boolean;
    therapistState: boolean;
    fenceState: boolean;
    skierState: boolean;
    peacekeeperState: boolean;
    mechanicState: boolean;
    ragmanState: boolean;
    jaegerState: boolean;
    lightkeeperState: boolean;
    refState: boolean;
    btrDriverState:boolean;
    
    constructor() {
        this.init()
    }

    private init() {
        if(this.praporState === null || this.praporState === undefined) {
            this.praporState = true;
        }
        if(this.therapistState === null || this.therapistState === undefined) {
            this.therapistState = true;
        }
        if(this.fenceState === null || this.fenceState === undefined) {
            this.fenceState = true;
        }
        if(this.skierState === null || this.skierState === undefined) {
            this.skierState = true;
        }
        if(this.peacekeeperState === null || this.peacekeeperState === undefined) {
            this.peacekeeperState = true;
        }
        if(this.mechanicState === null || this.mechanicState === undefined) {
            this.mechanicState = true;
        }
        if(this.ragmanState === null || this.ragmanState === undefined) {
            this.ragmanState = true;
        }
        if(this.jaegerState === null || this.jaegerState === undefined) {
            this.jaegerState = true;
        }
        if(this.lightkeeperState === null || this.lightkeeperState === undefined) {
            this.lightkeeperState = true
        }
        if(this.refState === null || this.refState === undefined) {
            this.refState = true;
        }
        if(this.btrDriverState === null || this.btrDriverState === undefined) {
            this.btrDriverState = true;
        }
    }

    resolve() {
        this.init();
    }
}

export interface IHideoutFilterState {
    inactiveState:boolean;
    activeState:boolean;
    completedState:boolean;
    resolve():void;
}

export class HideoutFilterState implements IHideoutFilterState {
    inactiveState:boolean;
    activeState: boolean;
    completedState: boolean;
    
    constructor() {
        this.init();
    }

    private init() {
        if(this.inactiveState === null || this.inactiveState === undefined) {
            this.inactiveState = true;
        }
        if(this.activeState === null || this.activeState === undefined) {
            this.activeState = true;
        }
        if(this.completedState === null || this.completedState === undefined) {
            this.completedState = true;
        }
    }

    resolve() {
        this.init();
    }
}

export interface IItemsFilterState {
    missingOnlyState:boolean;
    quest:boolean;
    hideout:boolean;
    resolve():void;
}

export class ItemFilterState implements IItemsFilterState {
    missingOnlyState: boolean;
    quest: boolean;
    hideout: boolean;
    
    constructor() {
        this.init();
    }

    private init() {
        if(this.missingOnlyState === null || this.missingOnlyState === undefined) {
            this.missingOnlyState = false;
        }
        if(this.quest === null || this.quest === undefined) {
            this.quest = false;
        }
        if(this.hideout === null || this.hideout === undefined) {
            this.hideout = false;
        }
    }

    resolve() {
        this.init();
    }
}