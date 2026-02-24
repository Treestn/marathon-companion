import { Ammo, IAmmoElements } from "../../../../model/ammo/IAmmoElements";
import { StorageHelper } from "../../../service/helper/StorageHelper";

export class AmmoUtils {

    static readonly ammoStorageKey = "ammoObject";

    private static ammoObject: IAmmoElements;

    static save() {
        StorageHelper.save(this.ammoStorageKey, this.ammoObject)
    }

    static getStoredData():string {
        return StorageHelper.getStoredData(this.ammoStorageKey)
    }

    static getAmmoObject(): IAmmoElements {
        return this.ammoObject;
    }

    static isAmmoRefreshed() {
        if(this.ammoObject) {
            return true;
        }
        return false;
    }

    static setAmmoObject(ammoObject:IAmmoElements) {
        this.ammoObject = ammoObject;
    }

    static getAmmoListFromType(name: string):Ammo[] {
        return this.ammoObject.ammoType.find(ammo => ammo.name === name).ammoList
    }

    static getAmmo(name: string):Ammo {
        for(let i = 0; i< this.ammoObject.ammoType.length; i++) {
            for(let j = 0; j < this.ammoObject.ammoType[i].ammoList.length; i++) {
                if(this.ammoObject.ammoType[i].ammoList[j].name === name) {
                    return this.ammoObject.ammoType[i].ammoList[j]
                }
            }
        }
        return null
    }

    static getAllAmmoObject():IAmmoElements {
        return Object.assign([], this.ammoObject)
    }

}