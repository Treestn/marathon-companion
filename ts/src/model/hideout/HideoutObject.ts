import { HideoutUtils } from "../escape-from-tarkov/page/hideout/utils/HideoutUtils";

export interface HideoutObject {
    version:string;
    layout:Layout;
    gameVersionUpdate?:string;
    upToDate?:boolean;
    hideoutStations:HideoutStations[];
    crafts: HideoutCrafts[];
}

export interface Layout {
    width: number,
    height: number,
    layoutImage: string
}

export interface HideoutStations {
    location: Location;
    crafts: Crafts[];
    id: string;
    oldId?: string;
    imageLink: string;
    levels: HideoutLevels[]
    name: string;
    locales: Locales;
    normalizedName: string;
}

export interface Locales {
    en?:string
    cs?:string;
    de?:string;
    es?:string;
    fr?:string;
    hu?:string;
    it?:string;
    ja?:string;
    ko?:string;
    pl?:string;
    pt?:string;
    ro?:string;
    sk?:string;
    tr?:string;
    zh?:string;
}

export interface Location {
    x: number,
    y: number,
    width: number,
    height: number,
}

export interface Crafts {
    id:string;
}

export interface HideoutLevels {
    id: string;
    oldId?: string;
    itemRequirements: ItemRequirements[];
    itemPveRequirements: ItemRequirements[];
    level: number;
    stationLevelRequirements: StationLevelRequirements[]
    traderRequirements: TraderRequirements[]
}

export interface ItemRequirements {
    item:Item;
    quantity:number;
}

export interface StationLevelRequirements {
    level: number;
    station: Station;
}

export interface TraderRequirements {
    ImageUtils: any;
    level: number;
    trader: Trader
}

export interface Trader {
    id:string;
    normalizedName:string;
}

export interface Item {
    id: string;
}

export interface Station {
    id: string;
    normalizedName: string;
}

export interface HideoutCrafts {
    station:Station;
    level:number;
    duration: number;
    rewardItems:RewardItems[];
    requiredItems:RequiredItems[];
    taskUnlock: TaskUnlock;
}

export class HideoutCraftsImpl implements HideoutCrafts {
    station:Station;
    level:number;
    duration: number;
    rewardItems:RewardItems[];
    requiredItems:RequiredItems[];
    taskUnlock: TaskUnlock;

    constructor(stationId:string, level:number) {
        this.station = {id: stationId, normalizedName: HideoutUtils.getStation(stationId).normalizedName}
        this.level = level;
        this.rewardItems = []
        this.requiredItems = [];
        this.duration = 0;
    }
}

export interface RewardItems {
    item:Item
    count:number;
}

export interface RequiredItems {
    item:Item;
    count:number;
    attributes:Attributes[];
}

export interface Attributes {
    type: string;
    name: string;
    value: string;
}

export interface TaskUnlock {
    id:string;
}