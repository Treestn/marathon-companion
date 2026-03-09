import { MapAdapter } from "../../adapter/MapAdapter";
import { ObjectiveTypeConst } from "../constant/EditQuestConst";
import { TraderList } from "../constant/TraderConst";
import { UuidGenerator } from "../service/helper/UuidGenerator";

export interface QuestsObject {
    version:string;
    tasks:Quest[];
}

export interface Quest {
    id: string;
    progressionType?: string;
    prestige?:number;
    gameEdition?: string;
    unlockHoursDelay?:number;
    oldQuestId?:string;
    expiredId?:string;
    questType: string;
    active: boolean;
    completed: boolean;
    name: string;
    locales: Locales;
    normalizedName:string;
    trader: Object;
    map: Object;
    experience:number;
    wikiLink: string;
    minPlayerLevel:number;
    taskRequirements: TaskObject[];
    traderRequirements: TraderRequirements[];
    restartable: boolean;
    weapon_image: WeaponImage;
    objectives: Objectives[];
    failCondition: Condition[];
    startRewards: Reward;
    finishRewards: Reward;
    failureOutcome: Reward;
    factionName: string;
    kappaRequired?: boolean;
    lightkeeperRequired: boolean;
}

export class QuestImpl implements Quest {
    id: string;
    progressionType?: string;
    gameEdition?: string;
    unlockHoursDelay?:number;
    oldQuestId?: string;
    expiredId?: string;
    questType: string;
    active: boolean;
    completed: boolean;
    name: string;
    locales: Locales;
    normalizedName: string;
    trader: Object;
    map: Object;
    experience: number;
    wikiLink: string;
    minPlayerLevel: number;
    taskRequirements: TaskObject[] = [];
    traderRequirements: TraderRequirements[] = [];
    restartable: boolean;
    weapon_image: WeaponImage;
    objectives: Objectives[] = [];
    failCondition: Condition[] = [];
    startRewards: Reward;
    finishRewards: Reward;
    failureOutcome: Reward;
    factionName: string;
    kappaRequired?: boolean;
    lightkeeperRequired: boolean;
    
    constructor() {
        this.id = UuidGenerator.generate();
        this.name = "";
        this.normalizedName = "";
        this.trader = new QuestObject();
        this.map = new QuestObject();
        this.experience = 1;
        this.minPlayerLevel = 1;
        this.restartable = false;
        this.startRewards = new QuestReward();
        this.finishRewards = new QuestReward();
        this.failureOutcome = new QuestReward();
        this.kappaRequired = false;
        this.lightkeeperRequired = false;
    }
}

export interface NeededKeys {
    keys: Object[];
    map: Object;
}

export class QuestNeededKeys implements NeededKeys {
    keys: Object[] = [];
    map: Object;
    
    constructor() {
        this.map = new QuestObject();
    }
}

export interface Reward {
    traderStanding: TraderStanding[];
    items: Item[];
    offerUnlock: TraderUnlock[];
    skillLevelReward: SkillReward[];
    traderUnlock: Object[];
    __typename?: string;
}

export class QuestReward implements Reward {
    traderStanding: TraderStanding[] = [];
    items: Item[] = [];
    offerUnlock: TraderUnlock[] = [];
    skillLevelReward: SkillReward[] = [];
    traderUnlock: Object[] = [];
    __typename?: string;

}

export interface SkillReward {
    name: string;
    level: number;
    __typename: string;
}

export class QuestSkillReward implements SkillReward {
    name: string;
    level: number;
    __typename: string;
}

export interface TraderUnlock {
    trader: Object;
    level: number;
    item: Object;
    __typename: string;
}

export class QuestTraderUnlock implements TraderUnlock {
    trader: Object;
    level: number;
    item: Object;
    __typename: string;
    
    constructor(itemId:string) {
        this.trader = new QuestObject();
        this.item = new QuestObject();
        this.item.id = itemId;
        this.trader.id = TraderList[0].id;
        this.level = 1;
    }
}

export interface Item {
    item: ItemObject;
    count?: number;
    attributes?: Attributes[];
    __typename: string;
}

export class QuestRewardItem implements Item {
    item: ItemObject;
    count?: number;
    attributes?: Attributes[] = [];
    __typename: string;

    constructor(itemId:string) {
        this.item = new QuestItemObject(itemId);
    }

}
 
export interface ItemObject {
    id?: string;
    containsItems?: Item[];
    __typename: string;
}

export class QuestItemObject implements ItemObject {
    id?: string;
    containsItems?: Item[] = [];
    __typename: string;

    constructor(itemId:string) {
        this.id = itemId;
    }
}

export interface Attributes {
    name: string;
    requirement: Comparator;
    __typename: string;
}

export class QuestAttributes implements Attributes {
    name: string;
    requirement: Comparator;
    __typename: string;
    
    constructor() {
        this.requirement = new QuestComparator();
    }
}

export interface TraderStanding {
    trader: Object;
    standing: number;
    __typename: string; 
}

export class QuestTraderStanding implements TraderStanding {
    trader: Object;
    standing: number;
    __typename: string;

    constructor(traderId:string) {
        this.trader = new QuestObject(traderId);
        this.standing = -0.01
    }

}

export interface Condition {
    __typename: string;
    id: string;
    type: string;
    description: string;
    maps: Object[];
    optional: boolean;
    task: Object;
    status: string[]
}

export class QuestCondition implements Condition {
    __typename: string;
    id: string;
    type: string;
    description: string;
    maps: Object[] = [];
    optional: boolean;
    task: Object;
    status: string[] = [];
    
    constructor() {
        this.task = new QuestObject();
    }
}

export interface TaskObject {
    task: Id;
    status: string[];
}

export class TaskRequirement implements TaskObject {
    task: Id;
    status: string[] = [];

    constructor() {
        this.task = new QuestId();
    }
}

export interface TraderRequirements {
    trader: TaskObject;
    requirementType: string;
    compareMethod: string;
    value: number;
}

export class QuestTraderRequirements implements TraderRequirements {
    trader: TaskObject;
    requirementType: string;
    compareMethod: string;
    value: number;
    
    constructor() {
        this.trader = new TaskRequirement();
    }
}

export interface Id {
    id: string;
}

export class QuestId implements Id {
    id: string;
}

export interface Object {
    id: string;
    name?:string;
    normalizedName?:string;
    __typename?: string;
}

export class QuestObject implements Object {
    id: string;
    name?: string;
    normalizedName?: string;
    __typename?: string;

    constructor(id?:string) {
        if(id) {
            this.id = id;
        }
    }
}

export interface Require {
    level: number;
    quests: number[];
}

export class QuestRequire implements Require {
    level: number;
    quests: number[] = []
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

export class QuestLocales implements Locales {
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

export interface Reputation {
    trader: string;
    rep: number;
}

export class QuestReputation implements Reputation {
    trader: string;
    rep: number;
}

export interface WeaponPart {
    parts: string[];
}

export class QuestWeaponPart implements WeaponPart {
    parts: string[] = [];
}

export interface Objectives {
    __typename: string;
    id: string;
    oldId?:string;
    foundInRaid?:boolean;
    type: string;
    description:string;
    locales: Locales;
    maps: Map[];
    optional: boolean;
    item: Object;
    questImages: QuestImage[];
    questItem: QuestItem;
    containsAll: Object[];
    containsCategory: Object[];
    attributes: Attributes[];
    targetNames: string[];
    count: number;
    shotType: string;
    zoneNames: string[];
    bodyParts: string[];
    timeFromHour: number;
    timeUntilHour: number;
    weaponBuilder: WeaponBuilder[];
    usingWeapon: Object[];
    usingWeaponMods: Object[];
    wearing: Object[];
    notWearing: Object[];
    distance: Comparator;
    playerHealthEffect: HealthEffect;
    enemyHealthEffect: HealthEffect;
    skillLevel?: SkillLevel;
    markerItem?: ItemId;
    neededKeys: NeededKeys[];
}

export class WeaponBuilder {
    description:string;
    moddingView:string;
    inspectView:string;

    muzzle: Object[] = [];
    barrel:Object[] = [];
    handguard:Object[] = [];
    rail:Object[] = [];
    attachment:Object[] = [];
    grip:Object[] = [];
    gasBlock:Object[] = [];
    receiver:Object[] = [];
    mount:Object[] = [];
    scope:Object[] = [];
    pistolGrip:Object[] = [];
    magazine:Object[] = [];
    bufferTube:Object[] = [];
    stock:Object[] = [];
    bolt:Object[] = [];
}

export class QuestObjective implements Objectives {
    __typename: string;
    id: string;
    oldId?: string;
    foundInRaid?:boolean;
    type: string;
    description: string;
    locales:Locales;
    maps: Map[] = [];
    optional: boolean;
    item: Object;
    questImages: QuestImage[] = [];
    questItem: QuestItem;
    containsAll: Object[] = [];
    containsCategory: Object[] = [];
    attributes: Attributes[] = [];
    targetNames: string[] = [];
    count: number;
    shotType: string;
    zoneNames: string[] = [];
    bodyParts: string[] = [];
    timeFromHour: number;
    timeUntilHour: number;
    weaponBuilder: WeaponBuilder[] = [];
    usingWeapon: Object[] = [];
    usingWeaponMods: Object[] = [];
    wearing: Object[] = [];
    notWearing: Object[] = [];
    distance: Comparator;
    playerHealthEffect: HealthEffect;
    enemyHealthEffect: HealthEffect;
    skillLevel?: SkillLevel;
    markerItem?: ItemId;
    neededKeys: NeededKeys[] = [];
    
    constructor() {
        this.id = UuidGenerator.generate()
        this.optional = false;
        this.count = 0;
        this.description = ""
        // Default values
        this.__typename = ObjectiveTypeConst.VISIT.typename
        this.type = ObjectiveTypeConst.VISIT.type
    }
}

export interface QuestItem {
    height: number,
    id: string,
    name: string,
    shortName: string,
    width: number
}

export class QuestItemInfo implements QuestItem {
    height: number;
    id: string;
    name: string;
    shortName: string;
    width: number;
}

export interface SkillLevel {
    name: string;
    level:number;
    __typename:string;
}

export class QuestSkillLevel implements SkillLevel {
    name: string;
    level: number;
    __typename: string;
}

export interface WeaponImage {
    id: number;
    paths: string[];
    description?: string;
}

export class QuestWeaponImage implements WeaponImage {
    id: number;
    paths: string[] = [];
    description?: string;
}

export interface HealthEffect {
    bodyParts: string[];
    effects: string[];
    time: number;
    __typename: string;
}

export class QuestHealthEffect implements HealthEffect {
    bodyParts: string[] = [];
    effects: string[] = [];
    time: number;
    __typename: string;
    
}

export interface Comparator {
    compareMethod: string;
    value: number;
    __typename: string;
}

export class QuestComparator implements Comparator {
    compareMethod: string;
    value: number;
    __typename: string;
}

export interface QuestImage {
    id: string,
    paths?: string[];
    description?: string;
}

export class QuestImageImpl implements QuestImage {
    id: string;
    paths?: string[] = [];
    description?: string;
}

export interface With {
    type: string;
    name: string;
    value: string;
    id: number;
}

export class QuestWith implements With {
    type: string;
    name: string;
    value: string;
    id: number;
    
}

export interface Map {
    id:string;
    name: string;
    __typename: string;
}

export class QuestMap implements Map {
    id: string;
    name: string;
    __typename: string;
    
    constructor(mapId:string) {
        this.id = mapId;
        this.name = MapAdapter.getMapFromId(mapId).split("_").join(" ")
    }
}

export interface Gps {
    leftPercent: number;
    topPercent: number;
    floor: string;
}

export class QuestGps implements Gps {
    leftPercent: number;
    topPercent: number;
    floor: string;
}

export interface ReputationFailure {
    trader: string;
    rep: number;
}

export class QuestReputationFailure implements ReputationFailure {
    trader: string;
    rep: number;
}

export interface ItemId {
    id:string
}

export class QuestItemId implements ItemId {
    id: string;

    constructor(id:string) {
        this.id = id
    }
}

interface QuestsObjectStored {
    version: string,
    tasks:QuestStoredImpl[];
}

interface QuestStored {
    id: string;
    active: boolean;
    completed: boolean;
}

class QuestObjectStoredImpl implements QuestsObjectStored {
    version: string;
    tasks: QuestStoredImpl[];

    constructor(version:string) {
        this.version = version
        this.tasks = []
    }
}

class QuestStoredImpl implements QuestStored {
    id: string;
    active: boolean;
    completed: boolean;
}

// export class QuestElements extends Element implements IQuestsData {

//     private questsObject:QuestsObject;
//     private localStorageKey:string;
//     private static instance:QuestElements;

//     private constructor() {
//         super(endpoints.quest_config)
//         this.localStorageKey = "QuestsObjects"
//     }

//     static getInstance() {
//         if(!this.instance) {
//             this.instance = new QuestElements()
//         }
//         return this.instance
//     }

//     setQuestsObject(questsObject:QuestsObject) {
//         if(!this.questsObject) {
//             this.questsObject = questsObject
//         }
//     }

//     public async init():Promise<void> {
//         let window = await WindowsService.getCurrentWindow()
//         if(window.success && window.window.name === kWindowNames.questsReminder) {
//             this.questsObject = JSON.parse(StorageHelper.getStoredData(this.localStorageKey))
//         }
         
//         await super.getConfig(this.questsObject != null ? this.questsObject.version : null).then(response => {
//             if(response === "Error") {
//                 PopupHelper.addPopup("Error", ErrorMessagesConst.COULD_NOT_FETCH_CONFIG)
//             }
//             let storedData = StorageHelper.getStoredData(this.localStorageKey);
//             if(response == null || response === "Error") {
//                 if(storedData !== null) {
//                     this.questsObject = JSON.parse(storedData)
//                 } else {
//                     PopupHelper.addFatalPopup(ErrorMessagesConst.FATAL_ERROR_NO_CONFIG, 
//                     "Quests config is missing")
//                     return;
//                 }
//                 return;
//             }
//             if(response.length > 0) {
//                 let data:QuestsObject = JSON.parse(response)
//                 if(data) {
//                     this.questsObject = data;
//                     if(storedData) {
//                         this.resolveData() 
//                     }
//                     this.save()
//                 }
//             }
//         })
//     }

//     save() {
//         // StorageHelper.save(this.localStorageKey, this.normalizeStoredElements())
//         StorageHelper.save(this.localStorageKey, this.questsObject)
//     }
//     private setAllQuestsActive() {
//         this.questsObject.tasks.forEach(quest => {
//             quest.active = true
//         })
//     }

//     private normalizeStoredElements():QuestsObjectStored {
//         let storing:QuestsObjectStored = new QuestObjectStoredImpl(this.questsObject.version)
//         this.questsObject.tasks.forEach(quest => {
//             let storeQuest:QuestStored = new QuestStoredImpl()
//             storeQuest.id = quest.id
//             storeQuest.active = quest.active
//             storeQuest.completed = quest.completed
//             storing.tasks.push(storeQuest)
//         })
//         return storing
//     }

//     private resolveData() {
//         let stored = StorageHelper.getStoredData(this.localStorageKey)
//         if(stored !== null) {
//             let storedData = JSON.parse(stored) as QuestsObjectStored
//             this.resolve(storedData)
//         }
//     }

//     private resolve(storedData:QuestsObjectStored) {
//         this.questsObject.tasks.forEach(quest => {
//             let storedQuest = storedData.tasks.find(storedQuest => storedQuest.id === quest.id)
//             if(storedData != undefined && storedQuest != undefined) {
//                 quest.active = storedQuest.active ?? false;
//                 quest.completed = storedQuest.completed ?? false;
//             } else {
//                 quest.active = false;
//                 quest.completed = false;
//             }
//         })
//     }

//     getQuestsObject(): Quest[] {
//         return Object.assign([], this.questsObject.tasks);
//     }

//     getActiveQuests(): Array<Quest> {
//         let activeQuests: Array<Quest> = [];
//         this.questsObject.tasks.forEach(quest => {
//             if(quest.active) {
//                 activeQuests.push(quest)
//             }
//         })
//         return Object.assign([], activeQuests)
//     }

//     getCompletedQuests(): Array<Quest> {
//         let activeQuests: Array<Quest> = [];
//         this.questsObject.tasks.forEach(quest => {
//             if(quest.completed ?? false) {
//                 activeQuests.push(quest)
//             } 
//         })
//         return Object.assign([], activeQuests)
//     }

//     setActiveQuest(id: string, isActive: boolean) {
//         for(const element of this.questsObject.tasks) {
//             if(element.id.toString() == id) {
//                 element.active = isActive
//                 this.save()
//                 return;
//             }
//         }
//     }

//     setCompletedQuestState(id: string, isCompleted: boolean) {
//         for(const element of this.questsObject.tasks) {
//             if(element.id.toString() == id) {
//                 element.completed = isCompleted
//                 this.save()
//                 return;
//             }
//         }
//     }

//     getActiveQuestsForMap(map: string): Array<Quest> {
//         let activeQuests: Array<Quest> = [];
//         this.questsObject.tasks.forEach(quest => {
//             if(quest.active && this.isQuestInMap(map, quest)) {
//                 activeQuests.push(quest)
//             } 
//         })
//         return activeQuests
//     }

//     isQuestInMap(map: string, quest: Quest) {
//         if(quest.objectives != null) {
//             for(const element of quest.objectives) {
//                 if(element.maps != null) {
//                     for( let j = 0; j < element.maps.length; j++) {
//                         if(element.maps[j].name.toLowerCase() === map.toLowerCase()) {
//                             return true;
//                         }
//                     }
//                 } 
//             }
//         }
//     }

//     changeQuestState(isActive: boolean, questID: string) {
//         this.questsObject.tasks.forEach(quest => {
//             if(quest.id.toString() == questID) {
//                 quest.active = isActive
//                 this.save()
//                 return;
//             }
//         })
//     }

//     getQuestFromID(id: string): Quest {
//         for(const element of this.questsObject.tasks) {
//             if(element.id.toString() == id) {
//                 return element
//             }
//         }
//         return null;
//     }

//     getQuestFromName(name: string): Quest {
//         for(const element of this.questsObject.tasks) {
//             if(element.name.toString() == name) {
//                 return element
//             }
//         }
//         return null;
//     }

//     getActiveQuestsDependantOnFloor(): Array<Quest> {
//         let activeQuests: Array<Quest> = [];
//         this.questsObject.tasks.forEach(quest => {
//             if(quest.active && MapHandler.isFloorIconActive(quest.id.toString())) {
//                 activeQuests.push(quest)
//             } 
//         })
//         return activeQuests
//     }

//     getQuestUnlocksFromId(id:string): string[] {
//         let list:string[] = []

//         this.questsObject.tasks.forEach(quest => {
//             quest.taskRequirements.forEach(requirement => {
//                 if(requirement.task.id == id) {
//                     list.push(quest.name);
//                 }
//             })
//         });
//         return list;
//     }

//     static isMarkingPartOfObjective(obj:Objectives):boolean {
//         return obj.__typename === "TaskObjectiveMark"
//     }

//     static isPlantingPartOfObjective(obj:Objectives):boolean {
//         return obj.type === "plantItem"
//     }

//     // getActiveQuestsForMap(map:string) {
//     //     let activeQuests:Quest[] = []
//     //     QuestElements.getInstance().getActiveQuests().forEach(quest => {
//     //       for(let i = 0; i < quest.objectives.length; i++) {
//     //         for(let j = 0; j < quest.objectives[i].maps.length; j ++) {
              
//     //           if(quest.objectives[i].maps[j].name === map.split("_").join(" ")) {
//     //             activeQuests.push(quest)
//     //             break;
//     //           }
//     //         }
//     //       }
//     //     });
//     //     return activeQuests
//     //   }
// }