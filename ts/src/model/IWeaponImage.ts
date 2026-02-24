interface IGunsmithWeaponImageInterface {
    getBaseWeaponImage(id:string):string[]
    getModdingViewImage(id:string):string[]
    getInspectViewImage(id:string):string[]
}

export interface WeaponImagesElements {
    version: string;
    images: WeaponImage[];
}

export interface WeaponImage {
    id: string;
    baseGun: string[];
    moddingView: string[];
    inspectView: string[];
}

export interface Ammo {

}

// export class GunsmithWeaponImage extends Element implements IGunsmithWeaponImageInterface {

//     private weaponImages: WeaponImagesElements;
//     private localStorageKey: string;

//     private static _instance: GunsmithWeaponImage;

//     private constructor() {
//         super(endpoints.gunsmith_images_config)
//         this.localStorageKey = "gunsmithImagesConfig"
//     }

//     public static getInstance() {
//         if (!this._instance) {
//           this._instance = new GunsmithWeaponImage();
//         }
//         return this._instance;
//     }

//     public async init() {
//         await super.getConfig(this.weaponImages != null ? this.weaponImages.version : null).then(response => {
//             if(response === "Error") {
//                 PopupHelper.addPopup("Error", ErrorMessagesConst.COULD_NOT_FETCH_CONFIG)
//             }
//             let storedData = StorageHelper.getStoredData(this.localStorageKey);
//             if(response == null || response === "Error") {
//                 if(storedData !== null) {
//                     this.weaponImages = JSON.parse(storedData)
//                 } else {
//                     PopupHelper.addFatalPopup(ErrorMessagesConst.FATAL_ERROR_NO_CONFIG, 
//                     "WeaponImage config is missing")
//                     return;
//                 }
//                 return;
//             }
//             if(response.length > 0) {
//                 let data:WeaponImagesElements = JSON.parse(response)
//                 if(data) {
//                     this.weaponImages = data;
//                     this.save()
//                 }
//             }
//         })
//     }

//     save() {
//         StorageHelper.save(this.localStorageKey, this.weaponImages)
//     }

//     public getBaseWeaponImage(id:string):string[] {
//         return this.getImageObject(id).baseGun
//     }

//     public getModdingViewImage(id:string):string[] {
//         return this.getImageObject(id).moddingView
//     }

//     public getInspectViewImage(id:string):string[] {
//         return this.getImageObject(id).inspectView
//     }

//     private getImageObject(id:string): WeaponImage {
//         for(const element of this.weaponImages.images) {
//             if(element.id === id) {
//                 return element
//             }
//         }
//     }
// }