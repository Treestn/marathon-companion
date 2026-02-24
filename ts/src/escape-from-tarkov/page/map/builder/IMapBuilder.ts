import { IMapsComponent } from "../components/IMapsComponent";
import { LabelComponent } from "../components/impl/LabelComponent";
import { IBtrPathComponent } from "../components/type/IBtrPathComponent";
import { ICanvasComponent } from "../components/type/ICanvasComponent";
import { IFilterComponent } from "../components/type/IFIlterComponent";
import { IFloorComponent } from "../components/type/IFloorComponent";
import { IIconComponent } from "../components/type/IIconComponent";
import { IMapComponent } from "../components/type/IMapComponent";
import { IParentFilterComponent } from "../components/type/IParentFilterComponent";
import { IPopupFloorComponent } from "../components/type/IPopupFloorComponent";
import { IPopupIconComponent } from "../components/type/IPopupIconComponent";

export interface IMapBuilder {
    reset();
    getBuilder(): IMapBuilder;
    addMap(map: IMapComponent): IMapBuilder;
    addBtrPath(path: IBtrPathComponent): IMapBuilder;
    addCompass(northRotation: number): IMapBuilder
    addMapRecenter(recenter: IMapsComponent): IMapBuilder;
    addMapSelector(selector: IMapsComponent): IMapBuilder;
    addIcon(icon: IIconComponent): IMapBuilder;
    addParentFilter(filter: IParentFilterComponent): IMapBuilder;
    addFilter(filter: IFilterComponent): IMapBuilder;
    addFloor(floor: IFloorComponent): IMapBuilder;
    addCanvas(canvas: ICanvasComponent): IMapBuilder;
    addIconPopup(popup: IPopupIconComponent): IMapBuilder;
    addFloorPopup(popup: IPopupFloorComponent): IMapBuilder;
    addLabel(text: LabelComponent): IMapBuilder;
    build();

    buildIcons(): Promise<IMapBuilder>;
    buildPopups(): Promise<IMapBuilder>;
}