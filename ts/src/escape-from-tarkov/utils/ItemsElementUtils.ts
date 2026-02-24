import { BucketConst } from "../constant/BucketConst";
import { ItemsV2Object } from "../../model/items/IItemsElements";
import { Item, ItemData } from "../service/consumer/TarkovDevConsumer";
import { StorageHelper } from "../service/helper/StorageHelper";

export class ItemsElementUtils {

    private static localStorageKey = "itemsMap";
    private static itemsData:ItemsV2Object;
    private static itemsNameMap:Map<string, string> = new Map();
    private static itemsShortnameMap:Map<string, string> = new Map();
    private static itemsImageLinkMap:Map<string, string> = new Map();
    private static itemsRarityMap:Map<string, string> = new Map();
    private static itemsValueMap:Map<string, number> = new Map();

    static setItemsMap(object:ItemsV2Object) {
        if(!this.itemsData) {
            this.itemsData = object;
            for(const itemV2 of object.items) {
                this.itemsNameMap.set(itemV2.id, itemV2.name);
                this.itemsShortnameMap.set(itemV2.id, itemV2.shortname);
                this.itemsImageLinkMap.set(itemV2.id, itemV2.imageLink);
                this.itemsRarityMap.set(itemV2.id, itemV2.rarity);
                this.itemsValueMap.set(itemV2.id, itemV2.value);
            }
        }
    }

    static getData():ItemsV2Object {
        return this.itemsData
    }

    static getNameData() {
        return this.itemsNameMap
    }

    static exists():boolean {
        if(this.itemsData) {
            return true;
        }
        return false;
    }

    static getStoredData():string {      
        return StorageHelper.getStoredData(this.localStorageKey)
    }

    static initFromStorage(): boolean {
        if (this.itemsData) {
            return true;
        }
        const stored = this.getStoredData();
        if (!stored) {
            return false;
        }
        try {
            const parsed = JSON.parse(stored) as ItemsV2Object;
            if (parsed?.items?.length) {
                this.setItemsMap(parsed);
                return true;
            }
        } catch (error) {
            console.warn('[ItemsElementUtils] Failed to parse stored items data', error);
        }
        return false;
    }

    static save() {
        StorageHelper.save(this.localStorageKey, this.itemsData)
    }

    // private static serializeItemsMap() {
    //     const itemsMap = this.mapToObject(this.itemsMap.items);
    //     const serializableObj = {
    //         ...this.itemsMap,
    //         items: itemsMap
    //     };
    //     return serializableObj;
    // }

    // private static deserializeComplexObject(): ItemsObject | null {
    //     const jsonString = StorageHelper.getStoredData(this.localStorageKey)
    //     if (jsonString) {
    //         const parsedObj = JSON.parse(jsonString) as ItemsObject;
    //         const map = this.objectToMap(parsedObj.items);
    
    //         return {
    //             ...parsedObj,
    //             items: map as Map<string, string>
    //         };
    //     }
    //     return null;
    // }

    // private static mapToObject<T>(map: Map<string, T>): { [key: string]: T } {
    //     const obj: { [key: string]: T } = {};
    //     for (const [key, value] of map) {
    //         obj[key] = value;
    //     }
    //     return obj;
    // }

    // private static objectToMap(obj: Map<string, string>): Map<string, string> {
    //     return new Map<string, string>(Object.entries(obj));
    // }

    static getItemName(id: string):string {
        return this.itemsNameMap.get(id)

        // if(name === undefined) {
        //     await this.resolveItem(id).then(response => name = response.name)
        //     // this.setItemToJson(id, name, " Name")
        // }
        // return name;
    }

    static getItemShortName(id: string):string {
        // return this.items[id.replace('"', '') + " ShortName"]
        return this.itemsShortnameMap.get(id)
        
        // if(shortName === undefined) {
        //     await this.resolveItem(id).then(response => shortName = response.shortName)
        //     // this.setItemToJson(id, shortName, " ShortName")
        // }
        // return shortName;
    }

    // getItemDescription(id: string): string {
    //     return this.items[id.replace('"', '') + " Description"]
    // }

    static getImagePath(id: string):string {
        return this.itemsImageLinkMap.get(id);

        // if(path === undefined) {
        //     await this.resolveItem(id).then(response => path = response.baseImageLink)
        //     // this.setItemToJson(id, path, " imageLink")
        // }
        // return path;
    }

    static getItemRarity(id: string):string {
        return this.itemsRarityMap.get(id);
    }

    static async getItemInformation(id:string): Promise<Item> {
        let item:Item = new ItemData()
        item.baseImageLink = this.itemsImageLinkMap.get(id)
        item.name = this.itemsNameMap.get(id);
        item.shortName = this.itemsShortnameMap.get(id);
        item.id = id;
        item.rarity = this.itemsRarityMap.get(id);
        item.value = this.itemsValueMap.get(id);
        return item;
    }

}