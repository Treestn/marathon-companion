import { TraderList } from "../escape-from-tarkov/constant/TraderConst";

export class TraderMapper {

    private readonly traderMap: Map<string, string> = new Map();

    private static _instance:TraderMapper;

    private constructor() {
        for (const trader of TraderList) {
            this.traderMap.set(trader.id, trader.name);
        }
    }

    public static getTraderFromId(id: string): string {
        this._instance ??= new TraderMapper();
        return this._instance.traderMap.get(id);
    }

    public static getLocalizedTraderName(id:string):string {
        return TraderMapper.getTraderFromId(id);
        // const traderName = TraderMapper.getTraderFromId(id).toUpperCase().replace(" ", "_")
        // return TraderLocaleConst[traderName]?.[I18nHelper.currentLocale()] ?? TraderLocaleConst[traderName]?.[I18nHelper.defaultLocale];
    }

    public static getIdFromTrader(traderName:string) {
        this._instance ??= new TraderMapper();
        for (const [key, value] of this._instance.traderMap.entries()) {
            if (value.toLocaleLowerCase() === traderName.toLocaleLowerCase()) {
                return key;
            }
        }
        return null; // Return null if value is not found
    }

    public static getImageFromTraderId(traderId:string) {
        this._instance ??= new TraderMapper();
        for (const traderInfo of TraderList) {
            if (traderInfo.id === traderId) {
                return traderInfo.src;
            }
        }
        return null; // Return null if value is not found
    }

    public static getImageFromTraderName(traderName:string) {
        this._instance ??= new TraderMapper();
        for (const traderInfo of TraderList) {
            if (traderInfo.name.toLocaleLowerCase() === traderName.toLocaleLowerCase()) {
                return traderInfo.src;
            }
        }
        return null; // Return null if value is not found
    }
}

export const TraderLocaleConst = {
    // PRAPOR: {
    //     en: "Prapor",
    //     cs: "Prapor",
    //     de: "Prapor",
    //     es: "Prapor",
    //     fr: "Prapor",
    //     hu: "Prapor",
    //     it: "Prapor",
    //     ja: "Prapor",
    //     ko: "프라퍼",
    //     pl: "Prapor",
    //     pt: "Prapor",
    //     ro: "Prapor",
    //     sk: "Prapor",
    //     tr: "Prapor",
    //     zh: "Prapor"
    // },
    // THERAPIST: {
    //     en: "Therapist",
    //     cs: "Therapist",
    //     de: "Therapist",
    //     es: "Therapist",
    //     fr: "La Toubib",
    //     hu: "Therapist",
    //     it: "Therapist",
    //     ja: "Therapist",
    //     ko: "테라피스트",
    //     pl: "Terapeutka",
    //     pt: "Therapist",
    //     ro: "Doctorița",
    //     sk: "Terapeutka",
    //     tr: "Terapist",
    //     zh: "Therapist"
    // },
    // FENCE: {
    //     en: "Fence",
    //     cs: "Fence",
    //     de: "Fence",
    //     es: "Fence",
    //     fr: "Fence",
    //     hu: "Fence",
    //     it: "Fence",
    //     ja: "Fence",
    //     ko: "펜스",
    //     pl: "Paser",
    //     pt: "Fence",
    //     ro: "Amanet",
    //     sk: "Fence",
    //     tr: "Simsar",
    //     zh: "Fence"
    // },
    // SKIER: {
    //     en: "Skier",
    //     cs: "Skier",
    //     de: "Skier",
    //     es: "Skier",
    //     fr: "Skier",
    //     hu: "Skier",
    //     it: "Skier",
    //     ja: "Skier",
    //     ko: "스키어",
    //     pl: "Narciarz",
    //     pt: "Skier",
    //     ro: "Bișniţar",
    //     sk: "Skier",
    //     tr: "Kayakçı",
    //     zh: "Skier"
    // }
}