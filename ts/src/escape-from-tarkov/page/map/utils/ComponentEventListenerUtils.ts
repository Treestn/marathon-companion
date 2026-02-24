import { IMapsComponent } from "../components/IMapsComponent";
import { FloorComponent } from "../components/impl/FloorComponent";
import { WindowComponent } from "../components/impl/WindowComponent";
import { IMapMediator } from "../mediator/IMapMediator";
import { MapUtils } from "./MapUtils";
import { throttle } from "lodash";

export class ComponentEventListenerUtils {

    private static mapMediator:IMapMediator;
    private static mouseDown:boolean = false;

    static setMapMediator(mediator:IMapMediator) {
        this.mapMediator = mediator;
    }

    static delegateMapDataEvent() {
        const mapData = document.getElementById("map-data");
        const zoom = document.getElementById("zoom");
        if(mapData && zoom) {
            mapData.onclick = zoom.onclick
            mapData.onmouseover = zoom.onmouseover
            mapData.onmousedown = zoom.onmousedown
            mapData.onmouseup = zoom.onmouseup
            mapData.onmousemove = zoom.onmousemove
            mapData.onwheel = zoom.onwheel
            mapData.onmouseleave = zoom.onmouseleave
        }
    }
    
    static registerMouseClick(mapDiv:HTMLDivElement) {
        mapDiv.onclick = async (e) => {
            const targetId:string = (e.target as HTMLElement).id
            for(let component of this.mapMediator.getComponentList()) {
                if(component.isTargeted(targetId)) {
                    if(this.isPropagationRequired(component, e)) {
                        await MapUtils.propagateEvent(e.target as HTMLElement, e)
                        return;
                    }
                    component.onclick(e);
                    return;
                }
            }
        }
    }

    static registerMouseHover(mapDiv:HTMLDivElement) {
        mapDiv.onmouseover = async (e) => {
            const targetId:string = (e.target as HTMLElement).id
            for(let component of this.mapMediator.getComponentList()) {
                if(component.isTargeted(targetId)) {
                    if(this.isPropagationRequired(component, e)) {
                        await MapUtils.propagateEvent(e.target as HTMLElement, e)
                        return;
                    }
                    component.onhover(e);
                    return;
                }
            }
        }
    }

    static registerMouseDown(mapDiv:HTMLDivElement) {
        mapDiv.onmousedown = async (e) => {
            const targetId:string = (e.target as HTMLElement).id
            this.mouseDown = true;
            for(let component of this.mapMediator.getComponentList()) {
                if(component.isTargeted(targetId)) {
                    if(this.isPropagationRequired(component, e)) {
                        await MapUtils.propagateEvent(e.target as HTMLElement, e)
                        return;
                    }
                    component.onmousedown(e);
                    return;
                }
            }
        }
    }

    static registerMouseLeave() {
        this.mapMediator.getComponentList().forEach(component => {
            this.registerOnMouseLeaveForComponent(component)
        })
    }

    static registerOnMouseLeaveForComponent(component: IMapsComponent) {
        const element = document.getElementById(component.targetType);
        if(element) {
            document.getElementById(component.targetType).onmouseleave = async (e) => {
                component.onmouseleave(e);
                return;
            }
        } else {
            console.log(`Component not found in the DOM: ${component.targetType}`);
        }
    }

    static registerMouseUp(mapDiv:HTMLDivElement) {
        mapDiv.onmouseup = async (e) => {
            const targetId:string = (e.target as HTMLElement).id
            this.mouseDown = false;
            for(let component of this.mapMediator.getComponentList()) {
                if(component.isTargeted(targetId)) {
                    if(this.isPropagationRequired(component, e)) {
                        await MapUtils.propagateEvent(e.target as HTMLElement, e)
                        return;
                    }
                    component.onmouseup(e);
                    return;
                }
            }
        }
        document.onmouseup = async (e) => {
            MapUtils.mouseUp(e);
        }
    }

    static registerMouseMove(mapDiv:HTMLDivElement) {
        // this.throttledMouseMove = throttle(this.handleMouseMove, 50);

        // mapDiv.onmousemove = this.conditionalMouseMoveHandler;
        mapDiv.onmousemove = e => !MapUtils.isInAnimation() ? this.handleMouseMove(e) : throttle(this.handleMouseMove.bind(this), 50);
        // mapDiv.onmousemove = async (e) => {
        //     // if(MapUtils.isInAnimation) {
        //     //     this.createThrottledHandler(this.handleMouseMove, 30, e);
        //     // } else {
        //     //     this.handleMouseMove(e)
        //     // }
        //     const targetId:string = (e.target as HTMLElement).id
        //     for(let component of this.mapMediator.getComponentList()) {
        //         if(component.isTargeted(targetId)) {
        //             if(this.isPropagationRequired(component, e)) {
        //                 if(component instanceof FloorComponent) {
        //                     component.onmousemovealpha(e);
        //                 }
        //                 await MapUtils.propagateEvent(e.target as HTMLElement, e)
        //                 return;
        //             }
        //             component.onmousemove(e);
        //             return;
        //         }
        //     }
        // }
    }

    private static async handleMouseMove(e:MouseEvent) {
        const targetId:string = (e.target as HTMLElement).id
        for(let component of this.mapMediator.getComponentList()) {
            if(component.isTargeted(targetId)) {
                if(this.isPropagationRequired(component, e)) {
                    if(component instanceof FloorComponent) {
                        component.onmousemovealpha(e);
                    }
                    await MapUtils.propagateEvent(e.target as HTMLElement, e)
                    return;
                }
                component.onmousemove(e);
                return;
            }
        }
    }

    static registerWindowResize(mediator:IMapMediator) {
        const windowComponent = new WindowComponent(mediator, "")
        window.addEventListener('resize', () => {
            windowComponent.onwindowresize(null)
        })
    }

    private static isPropagationRequired(component:IMapsComponent, e:MouseEvent):boolean {
        if(component instanceof FloorComponent && this.isAlpha(component.floor.UUID, e)) {
            if(e.target instanceof HTMLElement) {
                return true;
            }
        }
        return false;
    }

    private static isAlpha(floorId:string, event):boolean {
        const parentDiv = document.getElementById(floorId)
        if(parentDiv) {
            const canvas = parentDiv.getElementsByClassName("floorLevelImg")[0] as HTMLCanvasElement
            if(canvas && MapUtils.isAlpha(canvas.getContext("2d", { willReadFrequently: true }), event)) {
                return true;
            }
        }
        return false;
    }

    static registerOnWheel(mapDiv:HTMLDivElement) {
        let isWheeling = false;
        let wheelTimeout;
        let delta = 0;
        let currentEvent:MouseEvent;
        mapDiv.onwheel = (event:WheelEvent) => {
            if(MapUtils.isProcessingZoom || this.mouseDown) {
                return;
            }

            // Check if the wheel event is already being processed
            if (isWheeling) {
                if(Math.abs(delta) > 300) {
                    return;
                }
                delta += event.deltaY;
                // currentEvent = event;
                return;
            }

            // console.log(`Starting mouse wheel event at:  ${performance.now()}`);
            // const targetId:string = (e.target as HTMLElement).id
            // for(let component of componentList) {
            //     if(component.isTargeted(targetId)) {
            //         component.onwheel(e);
            //         break;
            //     }
            // }
            currentEvent = event;
            delta = event.deltaY

            // Set the flag to indicate that the wheel event is being processed
            isWheeling = true;
            
            // Clear the timeout if it exists
            clearTimeout(wheelTimeout);

            // Set a timeout to reset the flag after a delay
            wheelTimeout = setTimeout(() => {
                MapUtils.isProcessingZoom = true;
                console.log(`Starting mouse wheel event at:  ${performance.now()}`);
                console.log(`Scroll delta: ${delta}`);
                // Create a new WheelEvent with the accumulated delta value
                const modifiedEvent = new WheelEvent('wheel', {
                    deltaY: Math.round(delta/100)*100,
                    clientX: currentEvent.clientX,
                    clientY: currentEvent.clientY
                    // ...currentEvent // Copy other properties from the original event
                });
                
                
                const targetId:string = (currentEvent.target as HTMLElement).id
                for(let component of this.mapMediator.getComponentList()) {
                    if(component.isTargeted(targetId)) {
                        component.onwheel(modifiedEvent);
                        break;
                    }
                }
                delta = 0;
                isWheeling = false;
                setTimeout(() => {
                    MapUtils.isProcessingZoom = false;
                }, 300)
            }, 50);
        }
    }
}