import { Elements, HighLevelElement } from "../../../../../model/IFilterElements";
import { IMapsComponent } from "../IMapsComponent";

export interface IFilterComponent extends IMapsComponent {
    parentFilter:HighLevelElement;
    filter:Elements;
}