import { MapsList } from "../escape-from-tarkov/constant/MapsConst";

export class MapAdapter {

    private readonly mapAdapter: Map<string, {normalizedName:string, name:string, id:string, owName:string}> = new Map();

    private static _instance:MapAdapter;

    private constructor() {
        for(const map of MapsList) {
            this.mapAdapter.set(map.id, map)
        }
    }

    public static getMapFromId(id: string): string {
        this._instance ??= new MapAdapter();
        return this._instance.mapAdapter.get(id).normalizedName;
    }

    public static getMapNameFromId(id: string): string {
        this._instance ??= new MapAdapter();
        return this._instance.mapAdapter.get(id).name;
    }

    public static getLocalizedMap(id: string): string {
        return this.getMapNameFromId(id);
    }

    public static getIdFromMap(map:string) {
        this._instance ??= new MapAdapter();
        for (const [key, value] of this._instance.mapAdapter.entries()) {
            if (value.normalizedName.toLocaleLowerCase() === map.toLocaleLowerCase()) {
                return key;
            }
            if(value.name.toLocaleLowerCase() === map.toLocaleLowerCase()) {
                return key;
            }
        }
        return null; // Return null if value is not found
    }
}

export const MapLocaleConst = {
    ACERRA_SPACEPORT: {
        en: "Acerra Spaceport",
        cs: "Acerra Spaceport",
        de: "Acerra Spaceport",
        es: "Acerra Spaceport",
        fr: "Acerra Spaceport",
        hu: "Acerra Spaceport",
        it: "Acerra Spaceport",
        ja: "Acerra Spaceport",
        ko: "Acerra Spaceport",
        pl: "Acerra Spaceport",
        pt: "Acerra Spaceport",
        ro: "Acerra Spaceport",
        sk: "Acerra Spaceport",
        tr: "Acerra Spaceport",
        zh: "Acerra Spaceport"
    },
    BURIED_CITY: {
        en: "Buried City",
        cs: "Buried City",
        de: "Buried City",
        es: "Buried City",
        fr: "Buried City",
        hu: "Buried City",
        it: "Buried City",
        ja: "Buried City",
        ko: "Buried City",
        pl: "Buried City",
        pt: "Buried City",
        ro: "Buried City",
        sk: "Buried City",
        tr: "Buried City",
        zh: "Buried City"
    },
    DAM_BATTLEGROUNDS: {
        en: "Dam Battlegrounds",
        cs: "Dam Battlegrounds",
        de: "Dam Battlegrounds",
        es: "Dam Battlegrounds",
        fr: "Dam Battlegrounds",
        hu: "Dam Battlegrounds",
        it: "Dam Battlegrounds",
        ja: "Dam Battlegrounds",
        ko: "Dam Battlegrounds",
        pl: "Dam Battlegrounds",
        pt: "Dam Battlegrounds",
        ro: "Dam Battlegrounds",
        sk: "Dam Battlegrounds",
        tr: "Dam Battlegrounds",
        zh: "Dam Battlegrounds"
    },
    PRACTICE_RANGE: {
        en: "Practice Range",
        cs: "Practice Range",
        de: "Practice Range",
        es: "Practice Range",
        fr: "Practice Range",
        hu: "Practice Range",
        it: "Practice Range",
        ja: "Practice Range",
        ko: "Practice Range",
        pl: "Practice Range",
        pt: "Practice Range",
        ro: "Practice Range",
        sk: "Practice Range",
        tr: "Practice Range",
        zh: "Practice Range"
    }
}