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
import { IMapBuilder } from "./IMapBuilder";

export abstract class AbstractMapBuilder implements IMapBuilder {

    abstract map: IMapComponent
    abstract northRotation:number
    abstract btrPath: IBtrPathComponent;
    abstract mapRecenter: IMapsComponent;
    abstract mapSelectorList: IMapsComponent[];
    abstract parentFilterList: IParentFilterComponent[]
    abstract filterList: IFilterComponent[]
    abstract iconsList: IIconComponent[]
    abstract floorsList: IFloorComponent[]
    abstract canvasList: ICanvasComponent[]
    abstract popupsIconList: IPopupIconComponent[]
    abstract popupsFloorList: IPopupFloorComponent[]
    abstract labelList: LabelComponent[]

    reset() {
        this.map = undefined;
        this.mapRecenter = undefined;
        this.parentFilterList = [];
        this.filterList = [];
        this.iconsList = [];
        this.floorsList = [];
        this.canvasList = [];
        this.popupsIconList = [];
    }

    getBuilder(): IMapBuilder {
        return this;
    }

    addMap(map: IMapComponent): IMapBuilder {
        this.map = map
        return this;
    }

    addCompass(northRotation:number) {
        this.northRotation = northRotation;
        return this;
    }

    addBtrPath(path: IBtrPathComponent): IMapBuilder {
        this.btrPath = path;
        return this;
    }

    addMapRecenter(recenter:IMapsComponent) {
        this.mapRecenter = recenter
        return this;
    }

    addLabel(label:LabelComponent) {
        this.labelList.push(label);
        return this;
    }

    addMapSelector(selector: IMapsComponent): IMapBuilder {
        this.mapSelectorList.push(selector);
        return this;
    }

    addParentFilter(filter: IParentFilterComponent): IMapBuilder {
        this.parentFilterList.push(filter);
        return this;
    }

    addFilter(filter: IFilterComponent): IMapBuilder {
        this.filterList.push(filter);
        return this;
    }

    addIcon(icon: IIconComponent): IMapBuilder {
        this.iconsList.push(icon);
        return this;
    }

    addFloor(floor: IFloorComponent): IMapBuilder {
        this.floorsList.push(floor);
        return this;
    }

    addCanvas(canvas: ICanvasComponent): IMapBuilder {
        this.canvasList.push(canvas);
        return this;
    }

    addIconPopup(popup: IPopupIconComponent): IMapBuilder {
        this.popupsIconList.push(popup);
        return this;
    }

    addFloorPopup(popup: IPopupFloorComponent): IMapBuilder {
        this.popupsFloorList.push(popup);
        return this;
    }

    abstract buildIcons(): Promise<IMapBuilder>;
    abstract buildPopups(): Promise<IMapBuilder>;

    abstract build();

}