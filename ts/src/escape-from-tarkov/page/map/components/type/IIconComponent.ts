import { Elements, HighLevelElement, ListElementEntity } from "../../../../../model/IFilterElements";
import { IMapsComponent } from "../IMapsComponent";
import { PopupIconComponent } from "../impl/PopupIconComponent";

export interface IIconComponent extends IMapsComponent {
    isCentered();
    getDimension();

    hle: HighLevelElement;
    element:Elements;
    entity:ListElementEntity;
    iconDivRef:HTMLDivElement;
    popupComponent:PopupIconComponent;
    computedStyle;
    x:number;
    y:number;
    isActive:boolean;
}