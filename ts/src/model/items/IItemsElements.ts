import { Item } from "../../escape-from-tarkov/service/consumer/TarkovDevConsumer";

export interface ItemsObject {
    version: string
    items: Map<string, string>;
}

export interface ItemsV2Object {
    version: string;
    locale:string;
    items: ItemV2[];
}

export interface ItemV2 {
    id:string;
    name:string;
    shortname:string;
    imageLink:string;
    rarity:string;
    value:number;
}