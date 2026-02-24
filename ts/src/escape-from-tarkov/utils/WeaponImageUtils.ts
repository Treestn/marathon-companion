import { WeaponImage, WeaponImagesElements } from "../../model/IWeaponImage"
import { StorageHelper } from "../service/helper/StorageHelper";

export class WeaponImageUtils {

    private static readonly localStorageKey = "gunsmithImagesConfig"

    private static weaponImages:WeaponImagesElements;

    static setWeaponImage(data:WeaponImagesElements) {
        if(!this.weaponImages) {
            this.weaponImages = data;
        }
    }

    static getData():WeaponImagesElements {
        return this.weaponImages
    }

    static exists():boolean {
        if(this.weaponImages) {
            return true;
        }
        return false;
    }

    static save() {
        StorageHelper.save(this.localStorageKey, this.weaponImages)
    }

    static getStoredData():string {
        return StorageHelper.getStoredData(this.localStorageKey)
    }

    static getBaseWeaponImage(id:string):string[] {
        return this.getImageObject(id).baseGun
    }

    static getModdingViewImage(id:string):string[] {
        return this.getImageObject(id).moddingView
    }

    static getInspectViewImage(id:string):string[] {
        return this.getImageObject(id).inspectView
    }

    static getImageObject(id:string): WeaponImage {
        for(const element of this.weaponImages.images) {
            if(element.id === id) {
                return element
            }
        }
    }
}