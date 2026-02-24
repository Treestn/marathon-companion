import { Locales } from "../escape-from-tarkov/constant/FilterConst"

interface IFilterElements {
    getFilterElementsArray(): (Elements)[]
    getFilterElement(name: string): Elements
    changeFilterElementState(element: Elements, state: boolean): void
    getListElementEntity(elementName: string): (ListElementEntity)[] 
    getFilterElementListByFloorUUID(UUID: string): ListElementEntity[]
}

export interface FilterElementsData {
    map: string;
    author: string;
    mapImagePath: string;
    width: number,
    height:number,
    offsetX?:number,
    offsetY?:number,
    version: string;
    private: boolean;
    north?:number;
    highLevelElements: (HighLevelElement)[];
}

export class EditFilterElementImpl implements FilterElementsData {
    map: string;
    author: string;
    mapImagePath: string;
    width: number;
    height:number;
    offsetX?:number;
    offsetY?:number;
    version: string;
    private: boolean;
    north?:number;
    highLevelElements: (HighLevelElement)[] = [];

    constructor(map:string, mapPath:string, width:number, height:number) {
        this.map = map;
        this.mapImagePath = mapPath
        this.width = width;
        this.height = height
    }
}

export interface HighLevelElement {
    name:string;
    active?: boolean | false;
    imagePath?: string | null;
    secondaryImage?: string | null;
    elements?: (Elements)[];
}

export class EditHighLevelElementImpl implements HighLevelElement {
    name: string
    active?: boolean
    imagePath?: string
    elements?: Elements[] = []
    
    constructor(name:string) {
        this.name = name;
    }
}

export interface Elements {
    name: string;
    active?: boolean | false;
    imagePath?: string | null;
    listElements?: (ListElementEntity)[];
    height: number;
    width: number;
    centered?: boolean | false;
}

export class ElementsImpl implements Elements {
    name: string
    active?: boolean
    imagePath?: string
    listElements?: ListElementEntity[] = []
    height: number
    width: number
    centered?: boolean
    
    constructor(name:string, src:string, width:number, height:number, centered?:boolean) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.imagePath = src;
        this.centered = centered
    }
}

export interface ListElementEntity {
    id: number;
    questId?: string;
    active?: boolean;
    protectedEntity?: boolean;
    image?: string | null;
    floor?: string;
    position?: (Position)[];
    description?: string;
    locales?:Locales;
    longDescription?: string;
    longDescriptionLocales?:Locales;
    x?: number;
    y?: number;
    itemIds?:string[];
    imageList?:string[];
    spawnChance?:string;
    infoList:IconInfo[];
}

export interface IconInfo {
    title:string;
    titleLocales?:Locales;
    description?:string;
    descriptionLocales?:Locales;
    cost?:string;
    itemId?:string;
}

export interface Item {
    itemId:string;
}

export class ListElementEntityImpl {
    id: number;
    questId?: string;
    protectedEntity?:boolean
    active?: boolean;
    image?: string | null;
    floor?: string;
    position?: (Position)[];
    description?: string;
    centered?: boolean | false;
    x?: number;
    y?: number;
    imageList?:string[] = [];
    spawnChance:string;
    infoList:IconInfo[] = [];

    constructor(entity?:ListElementEntity) {
        if(entity) {
            this.id = entity.id;
            this.questId = entity.questId;
            this.protectedEntity = entity.protectedEntity;
            this.floor = entity.floor;
            this.position = entity.position;
            this.description = entity.description;
            this.x = entity.x
            this.y = entity.y
            this.imageList = entity.imageList;
            this.spawnChance = entity.spawnChance;
            this.infoList = entity.infoList;
        }
    }

    setQuestId(id: string){
        this.questId = id;
    }

    setFloor(id:string) {
        this.floor = id
    }
}  

export interface Position {
    id: number,
    x: number;
    y: number
}

// export class FilterElements extends Element implements IFilterElements {

//     private map: string;
//     elementsData: FilterElementsData;
//     private localStorageKey:string;

//     constructor(map:string) {
//         super(endpoints.map_filter_config)
//         this.map = map
//         this.localStorageKey = "FilterElements" + map;

//         if(StorageHelper.getStoredData(this.localStorageKey) !== null) {
//             this.elementsData = JSON.parse(StorageHelper.getStoredData(this.localStorageKey))
//         }
//     }

//     // public async init():Promise<void> {
//     //     return await super.getConfig(this.elementsData != null ? this.elementsData.version : null, {map: this.map}).then(response => {
//     //         if(response === "Error") {
//     //             PopupHelper.addPopup("Error", ErrorMessagesConst.COULD_NOT_FETCH_CONFIG)
//     //         }
//     //         let storedData = StorageHelper.getStoredData(this.localStorageKey);
//     //         if(response == null || response === "Error") {
//     //             if(storedData !== null) {
//     //                 this.elementsData = JSON.parse(storedData)
//     //             } else {
//     //                 PopupHelper.addFatalPopup(ErrorMessagesConst.FATAL_ERROR_NO_CONFIG, 
//     //                 "FilterElements config is missing for " + this.map)
//     //                 return;
//     //             }
//     //             // this.addProtectedField()
//     //             this.save()
//     //             return;
//     //         }
//     //         if(response.length > 0) {
//     //             let data:FilterElementsData = JSON.parse(response)
//     //             if(data) {
//     //                 this.elementsData = data;
//     //                 if(storedData) {
//     //                     this.resolveElementsData()
//     //                 }
//     //                 this.save()
//     //             }
//     //         }
//     //     })
//     // }

//     save() {
//         StorageHelper.save(this.localStorageKey, this.elementsData)
//     }

//     // private addProtectedField() {
//     //     this.elementsData.highLevelElements.forEach(hle => {
//     //         hle.elements.forEach(e => {
//     //             e.listElements.forEach(le => {
//     //                 le.protected = true;
//     //             })
//     //         })
//     //     })
//     // }

//     // private setAllQuestsElementsActive() {
//     //     this.getQuestsElements().forEach(quest => {
//     //         quest.listElements.forEach(element => {
//     //             element.active = true;
//     //         })           
//     //     })
//     // }

//     getMapAuthor() {
//         return this.elementsData.author
//     }

//     getMapOffsetX() {
//         return this.elementsData.offsetX != undefined ? this.elementsData.offsetX : 0;
//     }
    
//     getMapOffsetY() {
//         return this.elementsData.offsetY != undefined ? this.elementsData.offsetY : 0;
//     }

//     getMapImageWidth() {
//         return this.elementsData.width;
//     }

//     getMapImageHeight() {
//         return this.elementsData.height;
//     }

//     getMapImagePath(): string {
//         return this.elementsData.mapImagePath
//     }

//     getFilterElementsArray(): (Elements)[] {
//         var elementsList:Elements[] = []
//         this.elementsData.highLevelElements.forEach(e => e.elements.forEach(element => elementsList.push(element))) 
//         return elementsList
//     }

//     getHighLevelFilterElements():HighLevelElement[] {
//         try{
//             return this.elementsData.highLevelElements
//         } catch(e) {
//             // console.log(e);
//         }
//     }

//     getHighLevelFilterElement(name:string): HighLevelElement {
//         return this.elementsData.highLevelElements.find(e => e.name == name)
//     }

//     getHighLevelFilterElementFromChild(childName:string): HighLevelElement {
//         for(let i = 0; i < this.elementsData.highLevelElements.length; i++) {
//             for(let j = 0; j < this.elementsData.highLevelElements[i].elements.length; j++) {
//                 if(this.elementsData.highLevelElements[i].elements[j].name == childName) {
//                     return this.elementsData.highLevelElements[i];
//                 }
//             }
//         }
//         return null;
//     }

//     areAllHighLvlElementChildElementsTheSameState(highLevelElement:HighLevelElement, state:boolean) {
//         let bool:boolean = true; 
//         highLevelElement.elements.forEach(e => {
//             if(e.active != state) {
//                 bool = false
//             }
//         })
//         return bool;
//     }

//     getFilterElement(name: string): Elements {
//         return this.getFilterElementsArray().find(e => e.name == name)
//     }

//     updateQuestIconStateById(state:boolean, questId:string) {
//         this.getFilterElementsArray().find(e => e.name === FilterConst.QUESTS.name).listElements.forEach(e => {
//             if(e.questId.toString() === questId) {
//                 e.active = state
//                 this.save()
//             }
//         })
//     }

//     isQuestIconActive(id:string) {
//         let active = false;
//         this.getFilterElementsArray().find(e => e.name === FilterConst.QUESTS.name).listElements.forEach(e => {
//             if(e.id.toString() === id.toString()) {
//                 active = e.active
//             }
//         })
//         return active
//     }

//     getElement(id:string) {
//         let elementToReturn:ListElementEntity = null
//         this.getFilterElementsArray().forEach(element => {
//             element.listElements.forEach(e => {
//                 if(e.id.toString() === id.toString()) {
//                     elementToReturn = e
//                 }
//             })
//         })
//         return elementToReturn
//     }

//     isFloorIconActive(iconUUID: string):Boolean {
//         let bool:Boolean = false;
//         this.getFilterElementsArray().forEach(icon => {
//             if(icon.active) {
//                 icon.listElements.forEach(entity => {
//                     if(entity.id.toString() === iconUUID) {
//                         if(icon.name.toString() === FilterConst.QUESTS.name) {
//                             if(entity.active) {
//                                 bool = true;
//                             }
//                             return;
//                         }
//                         bool = true;
//                     }
//                 })
//             }
//         })
//         return bool;
//     }

//     isFloorDependantFromQuestId(questUUID: string):boolean {
//         let dependant:boolean = false
//         this.getFilterElementsArray().forEach(icon => {
//             icon.listElements.forEach(entity => {
//                 if(entity.questId != undefined && entity.questId.toString() === questUUID && entity.floor != undefined) { 
//                     dependant = true;
//                 }
//             })
//         })
//         return dependant;
//     }

//     isQuestFilterActive() {
//         let highLevelElement: HighLevelElement = this.getFilterElementsArray().find(e => e.name === FilterConst.QUESTS.name)
//         return highLevelElement.active === undefined ? false : highLevelElement.active;
//     }

//     disableAllQuestsByFloorUUID(floorUUID:string) {
//         this.getQuestsElements().forEach(e => {
//             e.listElements.forEach(element => {
//                 if(element.floor === floorUUID) {
//                     element.active = false;
//                     this.save()
//                 }
//             })
//         })
//     }

//     getFloorUUIDFromQuestUUID(questUUID: string):string[] {
//         let floorUUIDs:string[] = [];
//         this.getFilterElementsArray().forEach(icon => {
//             if(icon.active) {
//                 return icon.listElements.forEach(entity => {
//                     if(entity.questId != undefined && entity.questId.toString() === questUUID) {
//                         floorUUIDs.push(entity.floor);
//                     }
//                 })
//             }
//         })
//         return floorUUIDs;
//     }

//     private getQuestsElements():Elements[] {
//         return this.elementsData.highLevelElements.find(e => e.name == FilterConst.QUESTS.name).elements
//     }

//     getFloorUUIDFromIconUUID(iconUUID: string):string {
//         let floorUUID:string;
//         this.getFilterElementsArray().forEach(icon => {
//             if(icon.active) {
//                 var notFound:boolean = true;
//                 return icon.listElements.find(entity => {
//                     if(entity.id.toString() === iconUUID && notFound) {
//                         floorUUID = entity.floor;
//                         notFound = false
//                     }
//                 })
//             }
//         })
//         return floorUUID;
//     }

//     getFilterElementListByFloorUUID(UUID: string): ListElementEntity[] {
//         let list:ListElementEntity[] = []
//         this.getFilterElementsArray().forEach(icon => {
//             icon.listElements.forEach(entity => {
//                 if(entity.floor == UUID) {
//                     list.push(entity)
//                 }
//             })
//         })
//         return list;
//     }

//     changeFilterElementState(element: Elements, state: boolean): void {
//         element.active = state
//         this.save()
//     }

//     getListElementEntity(elementName: string): (ListElementEntity)[] {
//         return this.getFilterElementsArray().find(e => e.name == elementName).listElements
//     }

//     removeElementEntity(id:string) {
//         let array = this.getFilterElementsArray()
//         for(let i = 0; i < array.length; i++) {
//             for(let j = 0; j < array[i].listElements.length; j++){
//                 if(array[i].listElements[j].id.toString() === id) {
//                     array[i].listElements.splice(j, 1);
//                     return;
//                 }
//             }
//         }
//     }
// }
