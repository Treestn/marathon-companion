import { BucketConst } from "../constant/BucketConst";
import { Item as MarathonItem, ItemsModel } from "../../model/items/IItemsElements";
import { Item as TarkovDevItem, ItemData } from "../service/consumer/TarkovDevConsumer";
import { StorageHelper } from "../service/helper/StorageHelper";

export class ItemsElementUtils {

    private static localStorageKey = "itemsMap";
    private static itemsData:ItemsModel;
    private static itemsNameMap:Map<string, string> = new Map();
    private static itemsShortnameMap:Map<string, string> = new Map();
    private static itemsImageLinkMap:Map<string, string> = new Map();
    private static itemsRarityMap:Map<string, string> = new Map();
    private static itemsValueMap:Map<string, number> = new Map();

    private static flattenItems(object: ItemsModel): MarathonItem[] {
        if (!object?.items) {
            return [];
        }
        const all = [
            ...(object.items.items ?? []),
            ...(object.items.weapons ?? []),
            ...(object.items.cores ?? []),
            ...(object.items.implants ?? []),
            ...(object.items.mods ?? []),
        ];
        const seen = new Set<string>();
        return all.filter((item) => {
            if (!item?.id || seen.has(item.id)) {
                return false;
            }
            seen.add(item.id);
            return true;
        });
    }

    static setItemsMap(object:ItemsModel) {
        if(!this.itemsData) {
            this.itemsData = object;
            const items = this.flattenItems(object);
            for(const item of items) {
                this.itemsNameMap.set(item.id, item.name);
                this.itemsShortnameMap.set(item.id, item.name);
                this.itemsImageLinkMap.set(item.id, item.url ?? "");
                this.itemsRarityMap.set(item.id, item.rarity ?? "unknown");
                this.itemsValueMap.set(item.id, item.value ?? 0);
            }
        }
    }

    static getData():ItemsModel {
        return this.itemsData
    }

    static getAllItems(): MarathonItem[] {
        if (!this.itemsData) {
            return [];
        }
        return this.flattenItems(this.itemsData);
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
            const parsed = JSON.parse(stored) as ItemsModel;
            if (parsed?.items) {
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

    static async getItemInformation(id:string): Promise<TarkovDevItem> {
        let item:TarkovDevItem = new ItemData()
        item.baseImageLink = this.itemsImageLinkMap.get(id)
        item.name = this.itemsNameMap.get(id);
        item.shortName = this.itemsShortnameMap.get(id);
        item.id = id;
        item.rarity = this.itemsRarityMap.get(id);
        item.value = this.itemsValueMap.get(id);
        return item;
    }

}