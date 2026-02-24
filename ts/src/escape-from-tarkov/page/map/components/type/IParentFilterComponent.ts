import { HighLevelElement } from "../../../../../model/IFilterElements";
import { IMapsComponent } from "../IMapsComponent";

export interface IParentFilterComponent extends IMapsComponent {
    parentFilter:HighLevelElement;
}