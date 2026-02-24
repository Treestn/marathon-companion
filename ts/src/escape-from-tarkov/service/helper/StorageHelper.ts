// import { Encryption } from "../encryption/Encryption"

export class StorageHelper {

    private constructor() {}

    static save(localStorageKey:string, data, encrypt?:boolean) {
        this.saveItem(localStorageKey, data)
    }

    private static saveItem(localStorageKey, data) {
        localStorage.removeItem(localStorageKey)
        localStorage.setItem(localStorageKey, JSON.stringify(data))
    }

    static getStoredData(localStorageKey:string, encrypted?:boolean):any {
        const item = localStorage.getItem(localStorageKey)
        // if(encrypted && item !== null) {
        //     return await Encryption.getInstance().decrypt(JSON.parse(item))
        // }
        return item
    }
}