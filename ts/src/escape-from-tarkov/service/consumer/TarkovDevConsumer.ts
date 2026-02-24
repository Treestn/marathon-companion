// import { ItemsElement } from "../../json_element/IItemsElements";

export interface TarkovDevData {
    items: Item[]
}

export interface Item {
    baseImageLink: string;
    id: string;
    name: string;
    shortName: string;
    rarity?: string;
    value?: number;
}

export class ItemData implements Item {
    
    baseImageLink: string;
    id: string;
    name: string;
    shortName: string;

    constructor() {
        
    }
}