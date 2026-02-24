import { I18nHelper } from "../locale/I18nHelper";
import { MapsList } from "../escape-from-tarkov/constant/MapsConst";

export class MapAdapter {

    private mapAdapter: Map<string, {normalizedName:string, name:string, id:string, owName:string}> = new Map();

    private static _instance:MapAdapter;

    private constructor() {
        for(const map of MapsList) {
            this.mapAdapter.set(map.id, map)
        }
    }

    public static getMapFromId(id: string): string {
        if(this._instance == null) {
            this._instance = new MapAdapter();
        }
        return this._instance.mapAdapter.get(id).normalizedName;
    }

    public static getLocalizedMap(id: string): string {
        const mapName = this.getMapFromId(id).toUpperCase().replace(" ", "_")
        return MapLocaleConst[mapName]?.[I18nHelper.currentLocale()] ?? MapLocaleConst[mapName]?.[I18nHelper.defaultLocale];
    }

    public static getIdFromMap(map:string) {
        if(this._instance == null) {
            this._instance = new MapAdapter();
        }
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
    },
    BLUE_GATE: {
        en: "Blue Gate",
        cs: "Blue Gate",
        de: "Blue Gate",
        es: "Blue Gate",
        fr: "Blue Gate",
        hu: "Blue Gate",
        it: "Blue Gate",
        ja: "Blue Gate",
        ko: "Blue Gate",
        pl: "Blue Gate",
        pt: "Blue Gate",
        ro: "Blue Gate",
        sk: "Blue Gate",
        tr: "Blue Gate",
        zh: "Blue Gate"
    },
    STELLA_MONTIS: {
        en: "Stella Montis",
        cs: "Stella Montis",
        de: "Stella Montis",
        es: "Stella Montis",
        fr: "Stella Montis",
        hu: "Stella Montis",
        it: "Stella Montis",
        ja: "Stella Montis",
        ko: "Stella Montis",
        pt: "Stella Montis",
        ro: "Stella Montis",
        sk: "Stella Montis",
        tr: "Stella Montis",
        zh: "Stella Montis"
    }
}