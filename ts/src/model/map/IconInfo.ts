import { Locales } from "../hideout/HideoutObject";

export interface IconInfo {
    title:string;
    titleLocales?:Locales;
    description?:string;
    descriptionLocales?:Locales;
    cost?:string;
    itemId?:string;
}