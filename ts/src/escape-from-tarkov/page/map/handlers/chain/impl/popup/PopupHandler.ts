import { FloorComponent } from "../../../../components/impl/FloorComponent";
import { IconComponent } from "../../../../components/impl/IconComponent";
import { PopupFloorComponent } from "../../../../components/impl/PopupFloorComponent";
import { DataEventConst } from "../../../../../../events/DataEventConst";
import { EventConst } from "../../../../../../events/EventConst";
import { IndexConst } from "../../../../const/IndexConst";
import { FloorUtils } from "../../../../utils/FloorUtils";
import { MapUtils } from "../../../../utils/MapUtils";
import { PopupUtils } from "../../../../utils/PopupUtils";
import { AbstractMapChainHandler } from "../../AbstractMapChainHandler";
import { MapRequest } from "../../../request/impl/MapRequest";
import { QuestIconComponent } from "../../../../components/impl/QuestIconComponent";

export class PopupHandler extends AbstractMapChainHandler {

    handle(request: MapRequest) {
        if(request.event === EventConst.ICON_EVENT || request.event === EventConst.QUEST_ICON_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handleIconMouseClick(request); break;
                case DataEventConst.MOUSE_HOVER: this.hideAllFloorPopup(request); this.handleHoveringIcon(request); break;
                case DataEventConst.MOUSE_MOVE: this.handleHoveringIcon(request); break;
                case DataEventConst.MOUSE_MOVE_ALPHA: this.handleNotHoveringIconAnymore(request); break;
                case DataEventConst.MOUSE_LEAVE: this.handleNotHoveringIconAnymore(request); break;
            }
        }
        if(request.event === EventConst.POPUP_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.handlePopupMouseClick(request); break;
                case DataEventConst.MOUSE_HOVER: this.handleHoveringPopup(request); break;
                case DataEventConst.MOUSE_MOVE_ALPHA: this.handleNotHoveringPopupAnymore(request); break;
                case DataEventConst.MOUSE_LEAVE: this.handleNotHoveringPopupAnymore(request); break;
            }
        }
        if(request.event === EventConst.MAP_EVENT || request.event === EventConst.FLOOR_EVENT) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_DOWN: this.hideAllFloorPopup(request);
            }
        }
        if(request.event === EventConst.FLOOR_EVENT && !MapUtils.isInAnimation()) {
            switch(request.subEvent) {
                case DataEventConst.MOUSE_CLICK: this.changePopupDescription(request); break;
                case DataEventConst.MOUSE_HOVER: this.hideAllFloorPopup(request); this.showPopup(request); break;
                case DataEventConst.MOUSE_MOVE: this.hideAllFloorPopup(request); this.showPopup(request); break;
                case DataEventConst.MOUSE_MOVE_ALPHA: this.hideFloorPopup(request); break;
                case DataEventConst.MOUSE_LEAVE: this.hideFloorPopup(request); break;
            }
        }
        if(request.subEvent === DataEventConst.WHEEL) {
            this.hideAllFloorPopup(request);
        }
    }
    
    private handleIconMouseClick(request:MapRequest) {
        // if(request.component instanceof IconComponent) {
        //     const popupWrapper = document.getElementById(request.component.popupComponent.id);
        //     if(request.component.isActive) {
        //         this.hidePopup(request);
        //         request.component.isActive = false;
        //         if(!(request.component instanceof QuestIconComponent)) {
        //             popupWrapper.style.pointerEvents = "none";
        //         }
        //     } else {
        //         this.showPopup(request);
        //         request.component.isActive = true;
        //         popupWrapper.style.pointerEvents = "auto";
        //     }
        // }
    }

    private handleHoveringFloor(request:MapRequest) {
        this.showPopup(request)
    }

    private handleHoveringIcon(request:MapRequest) {
        this.showPopup(request)
    }

    private handleNotHoveringIconAnymore(request:MapRequest) {
        if(request.component instanceof IconComponent && !request.component.isActive) {
            this.hidePopup(request)
        }
    }

    private handlePopupMouseClick(request:MapRequest) {
        if(request.mouseEvent.target instanceof HTMLImageElement 
                && request.mouseEvent.target.classList.contains(PopupUtils.imageClass)) {
            if(request.component instanceof QuestIconComponent) {
                // request.component.quest.objectives.
                // FullscreenImageController.fullScreenImageElement(request.mouseEvent.target)
            }
        }
    }

    private handleHoveringPopup(request:MapRequest) {
        console.log("Hovering the popup");
    }

    private handleNotHoveringPopupAnymore(request:MapRequest) {
        if(request.component instanceof IconComponent && !request.component.isActive) {
            this.hidePopup(request)
        }
    }

    private showPopup(request:MapRequest) {
        if(request.component instanceof IconComponent) {
            const popupWrapper = document.getElementById(request.component.popupComponent.id)
            PopupUtils.positionPopup(popupWrapper, request.component.popupComponent)
            if(!request.component.popupComponent.isDisplayed) {
                request.component.popupComponent.isDisplayed = true;
                PopupUtils.show(popupWrapper, request.component.popupComponent);
                return;
            }
        }
        if(request.component instanceof FloorComponent) {
            if(!request.component.popupComponent.isDisplayed) {
                // this.hideAllPopup(request)
                request.component.popupComponent.isDisplayed = true;

                const popupWrapper = document.getElementById(request.component.popupComponent.id)
                // this.hideAllPopup(request);
                // popupWrapper.parentElement.style.transform = "";

                // TODO: move to utils
                // popupWrapper.parentElement.style.zIndex = IndexConst.OVERLAY
                // popupWrapper.parentElement.style.display = "block";
                
                popupWrapper.style.zIndex = IndexConst.OVERLAY;
                popupWrapper.style.display = "flex";

                MapUtils.setFloorPopupPosition(popupWrapper, request.component.building)
                PopupUtils.setPopupDescription(popupWrapper, request.component.floor.description);

                void popupWrapper.offsetHeight;
                requestAnimationFrame(() => {
                    popupWrapper.style.opacity = '1';
                });
                return;
            }
        }
    }

    private changePopupDescription(request:MapRequest) {
        if(request.component instanceof FloorComponent) {
            const activeFloor = FloorUtils.getActiveFloorFromBuilding(request.component.building);
            const popupWrapper = document.getElementById(request.component.popupComponent.id)
            request.component.popupComponent.isDisplayed = true;
            PopupUtils.setPopupDescription(popupWrapper, activeFloor.description);
        }
    }

    private hideFloorPopup(request:MapRequest) {
        if(request.component instanceof FloorComponent) {
            const floorDiv = document.getElementById(request.component.floor.UUID)
            if(request.component.popupComponent.isDisplayed 
                    && floorDiv 
                    && floorDiv instanceof HTMLElement 
                    && floorDiv.style.zIndex !== IndexConst.HIDDEN) {
                this.hidePopup(request)
            }
        }
    }

    private hidePopup(request:MapRequest) {
        if(request.component instanceof IconComponent) {
            request.component.isActive = false;
            if(request.component.popupComponent.isDisplayed) {
                request.component.popupComponent.isDisplayed = false
                const popupWrapper = document.getElementById(request.component.popupComponent.id)
                PopupUtils.hide(popupWrapper)
                return;
            }
        }

        if(request.component instanceof FloorComponent) {
            console.log("Hiding Floor Popup");
            
            if(request.component.popupComponent.isDisplayed) {
                request.component.popupComponent.isDisplayed = false
                const popupWrapper = document.getElementById(request.component.popupComponent.id)
                PopupUtils.hideFloorPopup(popupWrapper)
                return;
            }
        }
    }

    private hideAllFloorPopup(request:MapRequest) {
        const mapData = document.getElementById("map-data");
        if(mapData) {
            const components = request.mediator.getComponentList();
            for(const component of components) {
                if(component instanceof PopupFloorComponent) {
                    const popup = document.getElementById(component.id)
                    if(popup) {
                        component.isDisplayed = false;
                        PopupUtils.hideFloorPopup(popup)
                    }
                }
            }
        }
    }
}