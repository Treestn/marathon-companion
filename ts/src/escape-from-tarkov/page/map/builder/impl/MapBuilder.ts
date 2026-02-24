import { I18nHelper } from "../../../../../locale/I18nHelper";
import { FilterAdapter } from "../../../../../adapter/FilterAdapter";
import { FilterConst, MiscConst } from "../../../../constant/FilterConst";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { AnimationHelper } from "../../../../service/helper/AnimationHelper";
import { ItemsElementUtils } from "../../../../utils/ItemsElementUtils";
import { IMapsComponent } from "../../components/IMapsComponent";
import { FloorComponent } from "../../components/impl/FloorComponent";
import { IconComponent } from "../../components/impl/IconComponent";
import { PopupFloorComponent } from "../../components/impl/PopupFloorComponent";
import { PopupIconComponent } from "../../components/impl/PopupIconComponent";
import { QuestIconComponent } from "../../components/impl/QuestIconComponent";
import { LabelComponent } from "../../components/impl/LabelComponent";
import { IBtrPathComponent } from "../../components/type/IBtrPathComponent";
import { ICanvasComponent } from "../../components/type/ICanvasComponent";
import { IFilterComponent } from "../../components/type/IFIlterComponent";
import { IFloorComponent } from "../../components/type/IFloorComponent";
import { IIconComponent } from "../../components/type/IIconComponent";
import { IMapComponent } from "../../components/type/IMapComponent";
import { IParentFilterComponent } from "../../components/type/IParentFilterComponent";
import { IPopupFloorComponent } from "../../components/type/IPopupFloorComponent";
import { IPopupIconComponent } from "../../components/type/IPopupIconComponent";
import { IndexConst } from "../../const/IndexConst";
import { PopupController } from "../../controller/PopupController";
import { IconUtils } from "../../utils/IconUtils";
import { ImageUtils } from "../../utils/ImageUtils";
import { MapSelectorUtils } from "../../utils/MapSelectorUtils";
import { PopupUtils } from "../../utils/PopupUtils";
import { AbstractMapBuilder } from "../AbstractMapBuilder";
import { IMapBuilder } from "../IMapBuilder";
import { FilterBuilderHelper } from "../helper/FilterBuilderHelper";
import { FloorBuilderHelper } from "../helper/FloorBuilderHelper";
import { IconBuilderHelper } from "../helper/IconBuilderHelper";
import { MapBuilderHelper } from "../helper/MapBuilderHelper";
import { PopupBuilderHelper } from "../helper/PopupBuilderHelper";

export class MapBuilder extends AbstractMapBuilder {
    
    map: IMapComponent
    northRotation: number;
    btrPath: IBtrPathComponent;
    mapRecenter: IMapsComponent;
    mapSelectorList: IMapsComponent[] = [];
    componentList:IMapsComponent[] = []
    parentFilterList: IParentFilterComponent[] = [];
    filterList: IFilterComponent[] = [];
    iconsList: IIconComponent[] = []
    floorsList: IFloorComponent[] = []
    canvasList: ICanvasComponent[] = []
    popupsIconList: IPopupIconComponent[] = []
    popupsFloorList: IPopupFloorComponent[] = []
    labelList: LabelComponent[] = []

    constructor() {
        super();
    }

    async build():Promise<IMapsComponent[]> {
        await this.buildMapShell();
        await this.buildFilters();
        await this.buildMap();
        await this.buildBtrPath();
        await this.buildMapRecenter();
        // this.buildCompass();
        await this.buildMapSelector();
        await this.buildFloors();
        await this.buildIcons();
        await this.buildCanvas();
        await this.buildPopups();
        await this.buildLabel();

        this.componentList.push(this.map);
        this.componentList.push(this.mapRecenter);
        this.componentList.push(...this.mapSelectorList);
        this.componentList.push(...this.parentFilterList);
        this.componentList.push(...this.filterList);
        this.componentList.push(...this.iconsList);
        this.componentList.push(...this.floorsList);
        this.componentList.push(...this.canvasList);
        this.componentList.push(...this.popupsIconList);
        this.componentList.push(...this.popupsFloorList);
        this.componentList.push(...this.labelList);

        return this.componentList;
    }

    buildMapShell() {
        const mapRunner = document.getElementById("maps-runner");
        if(mapRunner) {
            mapRunner.remove()
        }

        const runner = document.getElementById("runner-container");
        if(runner) {
            const template = MapBuilderHelper.getTemplate();
            const map = template.getElementsByClassName("mapRunner")[0] as HTMLDivElement
            map.style.borderRadius = "10px"
            runner.insertBefore(template, document.getElementsByClassName("side-page-container")[0]);
            AnimationHelper.addLoadingMapGif();
        }
    }

    buildMapRecenter() {
        const mapDiv = document.getElementById("mapDiv");
        if(mapDiv && this.mapRecenter) {
            // We set the same id so that if one of them is clicked, we submit the event for recenter
            let recenterButton = HelperCreation.createDiv("recenter-resize", "recenter-resize-container", "")
            let imageContainer = HelperCreation.createDiv("recenter-resize", "recenter-image-container", "");
            let image = HelperCreation.createImage("recenter-resize", "recenter-resize-image", "../../img/icons/target.png", "zoom")
            imageContainer.appendChild(image)
            recenterButton.appendChild(imageContainer)
            mapDiv.appendChild(recenterButton)
        }
    }

    buildCompass() {
        const mapDiv = document.getElementById("mapDiv");
        if(mapDiv && Number.isInteger(this.northRotation)) {
            // We set the same id so that if one of them is clicked, we submit the event for recenter
            let imageContainer = HelperCreation.createDiv("", "compass-image-container", "");
            let image = HelperCreation.createImage("", "compass-resize-image", "../../img/compass.png", "zoom")
            image.style.rotate = (this.northRotation + "deg");
            imageContainer.appendChild(image)
            mapDiv.appendChild(imageContainer)
        }
    }

    buildMapSelector() {
        const mapDiv = document.getElementById("mapDiv");
        if(mapDiv && this.mapSelectorList.length > 0) {
            const dropwdown = MapSelectorUtils.createDropdownContainerMapDiv();
            mapDiv.appendChild(dropwdown)
        }
    }


    // We do nothing, it is built using the init chain
    // Reference: FilterInitHandler
    async buildFilters() {
        const mapDiv = document.getElementById("mapDiv");
        if(mapDiv) {
            const wrapper = mapDiv.appendChild(FilterBuilderHelper.createDropdownContainerFilterDiv())
            if(wrapper) {
                const dropdownContent:HTMLElement = wrapper.getElementsByClassName("dropdown-content")[0] as HTMLElement
                if(dropdownContent) {
                    for(const component of this.parentFilterList) {
                        if(component.parentFilter.elements.length === 1) {
                            FilterBuilderHelper.createLabel(dropdownContent, component.parentFilter, true);
                        } else {
                            FilterBuilderHelper.createLabel(dropdownContent, component.parentFilter, false);
                        }
                    }
                }
            }
        }
    }

    async buildMap() {
        const zoom = document.getElementById("zoom");
        const mapData = document.getElementById("map-data");
        mapData.style.pointerEvents = 'none';
        if(zoom) {
            const img = new Image();
            img.id = "mapImage"
            img.alt = "zoom"
            if(this.map.src && this.map.src.endsWith(".svg")) {
                img.width = this.map.width;
                img.height = this.map.height;
            }
            try {
                img.src = this.map.src
                await img.decode();
            } catch(e) {
                ImageUtils.onImageLoadError(img, this.map.src)
            }
            zoom.appendChild(img)
            const mapData = document.getElementById("map-data")

            mapData.style.width = String(zoom.getBoundingClientRect().width) + "px";
            mapData.style.height = String(zoom.getBoundingClientRect().height) + "px";
        }
    }

    async buildBtrPath() {
        if(this.btrPath) {
            const zoom = document.getElementById("zoom");
            if(zoom) {
                const btrPathImage = new Image();
                btrPathImage.id = "btrPathImage";
                btrPathImage.alt = "zoom";
                if(this.btrPath.getDimension()) {
                    btrPathImage.width = this.btrPath.getDimension().width
                    btrPathImage.height = this.btrPath.getDimension().height
                }
    
                try {
                    btrPathImage.src = this.btrPath.getBtrPathImage()
                    await btrPathImage.decode();
                } catch(e) {
                    ImageUtils.onImageLoadError(btrPathImage, this.btrPath.getBtrPathImage())
                }
    
                zoom.appendChild(btrPathImage)
            }
        }
    }

    async buildFloors():Promise<void> {
        const zoom = document.getElementById("zoom");
        if(zoom) {
            const promises: Promise<void>[] = [];
            for(let component of this.floorsList) {
                const promise = this.buildFloor(zoom, component as FloorComponent);
                promises.push(promise);
            }
            await Promise.all(promises);
        }
    }

    async buildFloor(zoom:HTMLElement, component:FloorComponent):Promise<void> {
        const div = FloorBuilderHelper.getTemplate()
        div.id = component.floor.UUID
        div.style.visibility = 'hidden';
        div.style.zIndex = IndexConst.HIDDEN
        div.style.top = String(component.building.y)
        div.style.left = String(component.building.x)
        div.style.position = 'absolute'

        const canvas = document.createElement('canvas') as HTMLCanvasElement;
        canvas.className = 'floorLevelImg'

        div.appendChild(canvas);

        let context = canvas.getContext('2d', { willReadFrequently: true })

        let img = new Image();
        img.crossOrigin = "Anonymous"
        if(component.floor.image && component.floor.image.endsWith(".svg")) {
            img.width = component.building.width;
            img.height = component.building.height;
        }
        try {
            img.src = component.floor.image + "?1"
            await img.decode();
        } catch(e) {
            ImageUtils.onImageLoadError(img, component.floor.image)
        }

        canvas.id = component.floor.UUID
        canvas.width = component.building.width;
        canvas.height = component.building.height;
        if(component.building.rotation) {
            const desiredWidth = component.building.width;
            const desiredHeight = component.building.height;
            const radians = (component.building.rotation * Math.PI) / 180;

            // Calculate the new bounding box dimensions
            const cos = Math.abs(Math.cos(radians));
            const sin = Math.abs(Math.sin(radians));
            const newWidth = desiredWidth * cos + desiredHeight * sin;
            const newHeight = desiredWidth * sin + desiredHeight * cos;
            
            div.style.transform = `translate(${-(newWidth - desiredWidth)/2}px, ${-(newHeight - desiredHeight)/2}px)`

            // Adjust the canvas size
            canvas.width = newWidth;
            canvas.height = newHeight;
    
            // Adjust the wrapper size
            div.style.width = `${newWidth}px`;
            div.style.height = `${newHeight}px`;

            context.translate(desiredWidth / 2, desiredHeight / 2);
            context.rotate(radians);
            context.translate((newWidth - desiredWidth)/2, (newHeight - desiredHeight)/2);

            context.drawImage(img, -desiredWidth / 2, -desiredHeight / 2, desiredWidth, desiredHeight)
        } else {
            context.drawImage(img, 0, 0)
        }

        zoom.appendChild(div)
        this.buildFloorPopupContainer(component);
    }

    async buildFloorPopupContainer(component:FloorComponent) {
        const mapData = document.getElementById("map-data")
        let container = document.getElementById(component.building.UUID);
        if(!container && mapData) {
            container = HelperCreation.createDiv(component.building.UUID, PopupUtils.floorPopupContainerClass, "");
            container.style.position = "absolute";
            container.style.display = "flex";
            container.style.pointerEvents = "none";
            container.style.zIndex = IndexConst.OVERLAY;
            mapData.appendChild(container);
        }
    }

    async buildIcons():Promise<IMapBuilder> {
        const mapData = document.getElementById("map-data");
        if(mapData) {
            const promises: Promise<void>[] = [];
            for(let component of this.iconsList) {
                const promise = this.buildIcon(mapData, component as IconComponent);
                promises.push(promise);
            }
            await Promise.all(promises);
        }
        return this;
    }

    private async buildIcon(mapData:HTMLElement, component:IconComponent):Promise<void> {
        const div = IconBuilderHelper.getTemplate()

        try {
            div.id = String(component.entity.id)
        } catch (e) {
            console.log("Component is not initialized correctly");
        }

        const aspectRatio = component.element.height / component.element.width;
        let desiredWidth = 30;
        let desiredHeight = 30 * aspectRatio;

        div.style.visibility = 'hidden';
        div.style.zIndex = IndexConst.HIDDEN
        div.style.transform = `translate(${component.entity.x}px, ${component.entity.y}px)`;
        div.style.position = 'absolute';
        div.classList.add(`${component.element.name.split(" ").join("-")}-icon`);

        const canvas = document.createElement('canvas') as HTMLCanvasElement;
        canvas.className = 'iconCanvas';
    
        div.appendChild(canvas);

        let context = canvas.getContext('2d', { willReadFrequently: true })
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "low"

        let img = new Image();
        img.crossOrigin = "Anonymous"
        
        // img.onerror = this.onImageLoadError
        try {
            img.src = component.element.imagePath + "?1"
            await img.decode();
        } catch(e) {
            await ImageUtils.onImageLoadError(img, component.element.imagePath)
        }
        if(component.element.centered) {
            canvas.style.transform = `translate(-50%, -50%)`
        } else {
            canvas.style.transform = `translate(-50%, -100%)`
        }
        
        canvas.id = String(component.entity.id)
        canvas.width = desiredWidth;
        canvas.height = desiredHeight;
        canvas.style.pointerEvents = 'auto';
        canvas.style.opacity = IconUtils.iconBaseOpacity

        context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, desiredWidth, desiredHeight)
        mapData.appendChild(div)
        component.iconDivRef = div;
        component.computedStyle = window.getComputedStyle(div);
        const matrixValue = component.computedStyle.transform.match(/[-+]?[0-9]*\.?[0-9]+/g).map(parseFloat);
        component.x = matrixValue[4]
        component.y = matrixValue[5]
    }

    buildCanvas() {

    }

    async buildPopups(): Promise<IMapBuilder> {
        const promises: Promise<void>[] = [];
        for(let component of this.popupsIconList) {
            if(component instanceof PopupIconComponent) {
                const iconWrapper = document.getElementById(String(component.icon.entity.id));
                if(iconWrapper) {
                    let promise;
                    if(component.icon.element.name === FilterConst.QUESTS.name) {
                        promise = this.buildQuestPopup(iconWrapper, component);
                    } else {
                        promise = this.buildIconPopup(iconWrapper, component);
                    }
                    promises.push(promise);
                }
            } 
        }

        for(let component of this.popupsFloorList) {
            if (component instanceof PopupFloorComponent) {
                const floorWrapper = document.getElementById(String(component.building.UUID));
                if(floorWrapper) {
                    promises.push(this.buildFloorPopup(floorWrapper, component));
                }
            }
        }
        await Promise.all(promises);
        return this;
    }

    async buildLabel(): Promise<IMapBuilder> {
        const mapData = document.getElementById("map-data");
        if(mapData) {
            const promises: Promise<void>[] = [];
            for(let component of this.labelList) {
                if(component instanceof LabelComponent) {
                    let promise = this.buildLabelText(mapData, component);
                    promises.push(promise);
                } 
            }
            await Promise.all(promises);
        }
        return this;
    }

    private async buildIconPopup(iconWrapper:HTMLElement, popupComponent:PopupIconComponent):Promise<void> {
        if(popupComponent.icon instanceof IconComponent) {

            const wrapper = PopupBuilderHelper.createPopupShell(popupComponent, popupComponent.icon, "none")

            PopupBuilderHelper.addTitle(
                wrapper.getElementsByClassName(PopupUtils.titleSectionContainerClass)[0] as HTMLElement,
                    FilterAdapter.getLocalizedFilter(popupComponent.icon.element.name), popupComponent.id);
            
            let itemId = null;
            if(popupComponent.icon.entity.itemIds && popupComponent.icon.entity.itemIds.length > 0) {
                itemId = popupComponent.icon.entity.itemIds[0]
            }

            if(popupComponent.icon.entity.description) {
                PopupBuilderHelper.createImageDescriptionSection(wrapper, popupComponent.id, itemId);
                if(popupComponent.icon.entity.itemIds?.length > 0 && popupComponent.icon.element.name === MiscConst.LOCKED_DOOR.name) {
                    PopupUtils.setPopupDescription(wrapper, ItemsElementUtils.getItemName(popupComponent.icon.entity.itemIds[0]));
                } else {
                    PopupUtils.setPopupDescription(wrapper, popupComponent.icon.entity.locales?.[I18nHelper.currentLocale()] ?? popupComponent.icon.entity.description);
                }
            }

            if(popupComponent.icon.entity.imageList && popupComponent.icon.entity.imageList.length > 0) {
                PopupBuilderHelper.addImageSection(wrapper)
            }

            PopupBuilderHelper.createIconInfosSection(wrapper, popupComponent.icon.entity.infoList);

            iconWrapper.appendChild(wrapper);
        }
    }

    private async buildQuestPopup(iconWrapper:HTMLElement, popupComponent:PopupIconComponent):Promise<void> {
        if(popupComponent.icon instanceof QuestIconComponent) {
            const quest = popupComponent.icon.quest;
            if(quest && quest.objectives.length > 0) {

                const wrapper = PopupBuilderHelper.createPopupShell(popupComponent, popupComponent.icon, "auto")

                PopupBuilderHelper.addTitle(
                    wrapper.getElementsByClassName(PopupUtils.titleSectionContainerClass)[0] as HTMLElement,
                     quest.locales?.[I18nHelper.currentLocale()] ?? quest.name, quest.id, true, popupComponent.icon);

                PopupBuilderHelper.addTraderImage(wrapper.getElementsByClassName(
                    PopupUtils.titleSectionContainerClass)[0] as HTMLElement);

                PopupBuilderHelper.addImageSection(wrapper)

                const checkmarkWrapper = PopupBuilderHelper.addDescriptionCheckmark(wrapper);
                if(checkmarkWrapper) {
                    PopupController.registerPopupObjectiveEventListener(checkmarkWrapper, popupComponent)
                }

                iconWrapper.appendChild(wrapper);
            } else {
                console.log(`Cannot build Quest Popup for icon: ${popupComponent.icon.entity.id} with QuestId: ${popupComponent.icon.entity.questId}`);                
            }
        }
    }

    private async buildLabelText(mapData:HTMLElement, component:LabelComponent):Promise<void> {
        const div = HelperCreation.createDiv(String(component.entity.id), "map-label-wrapper", "");
        const text = HelperCreation.createB("map-label", component.entity.locales?.[I18nHelper.currentLocale()] ?? component.entity.description)
        div.appendChild(text);


        div.style.visibility = 'hidden';
        div.style.zIndex = IndexConst.HIDDEN
        div.style.transform = `translate(${component.entity.x}px, ${component.entity.y}px)`;
        div.style.position = 'absolute';
        div.style.transform = `translate(-50%, -50%)`
        div.style.pointerEvents = 'none';

        component.iconDivRef = div;
        mapData.appendChild(div);
    }

    private async buildFloorPopup(floorWrapper:HTMLElement, popupComponent:PopupFloorComponent):Promise<void> {
        const wrapper = PopupBuilderHelper.createPopupShell(popupComponent, popupComponent, "none")
        
        PopupUtils.getArrow(wrapper).classList.add(PopupUtils.arrowBottom);

        PopupBuilderHelper.addTitle(
            wrapper.getElementsByClassName(PopupUtils.titleSectionContainerClass)[0] as HTMLElement,
                popupComponent.building.description, popupComponent.id);

        PopupBuilderHelper.createImageDescriptionSection(wrapper, popupComponent.id, null);
        PopupUtils.setPopupDescription(wrapper, "~");
        // PopupUtils.addDescriptionNote(wrapper, "Click to cycle floors");

        floorWrapper.appendChild(wrapper);
    }
}