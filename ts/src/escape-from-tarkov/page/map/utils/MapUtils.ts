import gsap from "gsap";
import { ListElementEntity } from "../../../../model/IFilterElements";
import { Building } from "../../../../model/floor/IMapFloorElements";
import { IconComponent } from "../components/impl/IconComponent";
import { PopupFloorComponent } from "../components/impl/PopupFloorComponent";

export class MapUtils {

    private static scale:number = 1;
    private static zoomStart = { x: 0, y: 0 };
    private static lastDataStart = { x: 0, y: 0 };
    private static dataStart = { x: 0, y: 0 };
    private static zoomPointX:number = 0;
    private static zoomPointY:number = 0;
    private static dataPointX:number = 0;
    private static dataPointY:number = 0;
    private static panning:boolean = false;
    private static SCALER:number = 1.4;
    private static blockZoomIn = false;
    private static isAnimating = false;
    private static isRightMouseClicked = false;
    private static readonly ZOOM_ANIMATION_CLASS = "animate-with-scale";
    static isProcessingZoom = false;
    private static animationTimeline = gsap.timeline();
    private static worker = new Worker('worker.js');

    private static readonly ZOOM_ICON_TARGET_SCALE:number = 0.7809246147438568

    static setScaler(newScale:number) {
      this.SCALER = newScale;
    }

    static getScaler():number {
      return this.SCALER
    }

    static initWorker() {
      this.worker.onmessage = (event) => {
        this.animationTimeline.play()
      }
    }

    static isInAnimation() {
      return this.isAnimating
    }

    static isRightMouseDown() {
      return this.isRightMouseClicked;
    }

    static startAnimationTimeline() {
      this.worker.postMessage(null)
    }

    static reset() {
      this.scale = 1;
      this.zoomStart = { x: 0, y: 0 };
      this.dataStart = { x: 0, y: 0 };
      this.zoomPointX = 0;
      this.zoomPointY = 0;
      this.dataPointX = 0;
      this.dataPointY = 0;
      this.panning = false;
    }

    static recenter(iconComponentList:IconComponent[], floorPopupComponent:PopupFloorComponent[]) {
        const zoom = document.getElementById("zoom")
        const mapDiv:HTMLElement = document.getElementById("mapDiv")
        const img:HTMLImageElement = document.getElementById("mapImage") as HTMLImageElement
        if(zoom && mapDiv && img) {

          // const from = {
          //   x: this.zoomStart.x,
          //   y: this.zoomStart.y,
          //   scale: this.scale
          // } 

          this.zoomPointX = (mapDiv.clientWidth - (img.clientWidth * this.scale)) / 2
          this.zoomPointY = (mapDiv.clientHeight - (img.clientHeight * this.scale)) / 2
          this.zoomStart = {x: this.zoomPointX, y: this.zoomPointY}

          
          // zoom.style.setProperty('--end-x', `${this.zoomStart.x}px`);
          // zoom.style.setProperty('--end-y', `${this.zoomStart.y}px`);

          // zoom.classList.add('animate-with-scale');
          this.setTransformWithScale(zoom);
          this.replaceMapData(zoom);
          let offsets: {x:number, y:number} = MapUtils.getOffsets();
          iconComponentList.forEach(component => {
              if(component instanceof IconComponent) {
                  this.setIconPosition(component.entity, offsets, component.iconDivRef, component)
                }
          })
        }
    }

    static async centerMapOnPosition(zoom:HTMLElement, icon:HTMLElement) {
      const mapDiv:HTMLElement = document.getElementById("mapDiv")
      const mapData:HTMLElement = document.getElementById("map-data")
      if(mapDiv && mapData && zoom && icon) {

        const delta:{x:number, y:number} = this.getCenterPositionOffset(mapDiv, icon) 
        
        this.zoomPointX = this.zoomPointX - delta.x;
        this.zoomPointY = this.zoomPointY - delta.y;
        this.zoomStart = {x: this.zoomPointX, y: this.zoomPointY}

        this.dataPointX = this.dataPointX - delta.x;
        this.dataPointY = this.dataPointY - delta.y;
        this.dataStart = {x: this.dataPointX, y: this.dataPointY}
        this.lastDataStart = {x: this.dataPointX, y: this.dataPointY}

        this.setTransformWithScale(zoom)
        this.setTransform(mapData)
      }
    }

    private static getCenterPositionOffset(mapDiv:HTMLElement, icon:HTMLElement):{x:number, y:number} {
      const iconRect = icon.getBoundingClientRect();
      const mapDivRect = mapDiv.getBoundingClientRect();

      const deltaX = iconRect.x - (mapDivRect.x + (mapDivRect.width/2))
      const deltaY = iconRect.y - (mapDivRect.y + (mapDivRect.height/2))

      return {x: deltaX, y:deltaY}
    }

    static setTransformWithScale(div: HTMLElement) {
      div.style.transform = `translate(${this.zoomPointX}px, ${this.zoomPointY}px) scale(${this.scale})`;
    }

    private static setTransform(div: HTMLElement) {
      div.style.transform = `translate(${this.dataPointX}px, ${this.dataPointY}px)`;
    }

    static isZoomBlocked(event) {
      let delta = (event.deltaY ? -event.deltaY : event.deltaY)/100;
      if(Math.floor(this.scale) >= 12 && delta < 0) {
        this.blockZoomIn = false;
      }
      return this.blockZoomIn
    }

    static blockNextZoomIfNeeded(event) {
      let delta = (event.deltaY ? -event.deltaY : event.deltaY)/100;
      if(Math.floor(this.scale) >= 12 && delta > 0) {
        this.blockZoomIn = true;
      }
    }

    static zoom(event, zoom:HTMLElement, delay?:number, component?:IconComponent) {
        event.preventDefault();

        const from = {
          x: this.zoomPointX,
          y: this.zoomPointY,
          scale: this.scale,
          // paused: true
        }
        // console.log(`Starting animation from: {${from.x}, ${from.y} scale ${from.scale}}`);
        

        zoom.style.transform = ""
        zoom.style.transform = `translate(${this.zoomPointX}px, ${this.zoomPointY}px) scale(${this.scale})`

        let xs = (event.clientX - this.zoomPointX) / this.scale
        let ys = (event.clientY - this.zoomPointY) / this.scale

        let delta = (event.deltaY ? -event.deltaY : event.deltaY)/100;
        
        //Change values
        if(Math.abs(delta) === 1) {
          (delta > 0) ? (this.scale *= this.SCALER) : (this.scale /= this.SCALER);
        } else {
          (delta > 0) ? (this.scale *= (this.SCALER ** Math.abs(delta))) : (this.scale /= (this.SCALER ** Math.abs(delta)));
        }

        this.zoomPointX = event.clientX - xs * this.scale;
        this.zoomPointY = event.clientY - ys * this.scale;
        this.zoomStart = {x: this.zoomPointX, y: this.zoomPointY};

        // Place Icons
        this.replaceMapData(zoom)

        if(component) {
          const offsets = this.getOffsets()
          const mapDiv:HTMLElement = document.getElementById("mapDiv")
          const mapData:HTMLElement = document.getElementById("map-data")
          if(mapDiv && mapData && component) {
            const mapDataRect = mapData.getBoundingClientRect();
            const mapDivRect = mapDiv.getBoundingClientRect();
            this.zoomPointX -= offsets.x + (component.entity.x * this.scale) - (mapDivRect.left - mapDataRect.left) - (mapDivRect.width/2)
            this.zoomPointY -= offsets.y + (component.entity.y * this.scale) - (mapDivRect.top - mapDataRect.top) - (mapDivRect.height/2)
          }
        }

        if(!this.isAnimating) {
          this.isAnimating = true;
          this.animationTimeline = gsap.timeline({pause: true, defaults: { overwrite: 'auto' }})
          
          this.animationTimeline.fromTo(zoom,
            from,
            {
              duration: delay ? delay : 0.3,
              x: this.zoomPointX,
              y: this.zoomPointY,
              scale: this.scale,
              // ease: "power1.inOut",
              onComplete: () => {
                // console.log(`Finished animation to: {${this.zoomPointX}, ${this.zoomPointY} scale ${this.scale}}`);
                this.isAnimating = false;
                this.animationTimeline.clear();
              }
            }, 0 // Start at the same time as all the other ones
          )
        }
    }

    static resizeToContainer(iconComponentList:IconComponent[], floorPopupComponent:PopupFloorComponent[], animate:boolean) {
        const zoom = document.getElementById("zoom")
        const mapDiv:HTMLElement = document.getElementById("mapDiv")
        const img:HTMLImageElement = document.getElementById("mapImage") as HTMLImageElement
        if(mapDiv && img && zoom) {

            // const aspectRatio:number = img.naturalWidth/img.naturalHeight;
            this.scale = 1;
            
            const paneWidth = mapDiv.clientWidth;
            const paneHeight = mapDiv.clientHeight;
            if(paneHeight === 0 || paneWidth === 0) {
              return;
            }
            // const paneAspectRatio = paneWidth / paneHeight;

            // const aspectRationDelta = aspectRatio/paneAspectRatio
            // console.log(aspectRationDelta);
            
            let multiplier = 0;

            if(paneWidth < img.naturalWidth || paneHeight < img.naturalHeight) {
              this.resizeDown(img.naturalWidth, img.naturalHeight, paneWidth, paneHeight, multiplier);
            } else {
              this.resizeUp(img.naturalWidth, img.naturalHeight, paneWidth, paneHeight, multiplier);
            }
            
            this.setTransformWithScale(zoom)
            this.recenter(iconComponentList, floorPopupComponent)
          }
    }

    private static resizeDown(width, height, paneWidth, paneHeight, multiplier) {
      while((this.scale * width > paneWidth) || (this.scale * height) > paneHeight) {
        this.scale /= this.SCALER
        multiplier++;
      }
    }

    private static resizeUp(width, height, paneWidth, paneHeight, multiplier) {
      while(this.scale * width < paneWidth || this.scale * height < paneHeight) {
        this.scale *= this.SCALER
      multiplier++;
      }
    }

    static mouseMove(e) {
        const zoom = document.getElementById("zoom")
        const mapData = document.getElementById("map-data")
        if(zoom && mapData) {
            e.preventDefault();

            if (!this.panning) {
              return;
            }
            this.zoomPointX = (e.clientX - this.zoomStart.x);
            this.zoomPointY = (e.clientY - this.zoomStart.y);
            // this.zoomStart = {x: this.zoomPointX, y: this.zoomPointY};
            
            this.dataPointX = (e.clientX - this.dataStart.x);
            this.dataPointY = (e.clientY - this.dataStart.y);
            // this.dataStart = {x: this.dataPointX, y: this.dataPointY};
            
            this.setTransformWithScale(zoom);
            this.setTransform(mapData)
        }
    }

    static mouseDown(e:MouseEvent) {
        if(this.isProcessingZoom || e.button === 1) {
          return;
        }
        this.isRightMouseClicked = true;
        e.preventDefault();
        this.zoomStart = { x: e.clientX - this.zoomPointX, y: e.clientY - this.zoomPointY };
        this.dataStart = { x: e.clientX - this.dataPointX, y: e.clientY - this.dataPointY };
        this.panning = true;
    }

    static mouseUp(e) {
        this.isRightMouseClicked = false;
        this.panning = false;
    }

    static replaceMapData(zoom:HTMLElement) {
      const mapData = document.getElementById("map-data")
      if(mapData) {
        // console.log(`Starting map data repositionning from: {${this.dataPointX},  ${this.dataPointY}}`);
        const zoomRect = zoom.getBoundingClientRect();
        const dataRect = mapData.getBoundingClientRect();

        const deltaX = Math.abs(dataRect.width - zoomRect.width) /2;
        const deltaY = Math.abs(dataRect.height - zoomRect.height) /2;

        let directionX = dataRect.width <= zoomRect.width ? 1 : -1;
        let directionY = dataRect.height <= zoomRect.height ? 1 : -1;

        // Save last position
        this.lastDataStart = {x: this.dataPointX, y: this.dataPointY}

        this.dataPointX = this.zoomStart.x + (deltaX * directionX);
        this.dataPointY = this.zoomStart.y + (deltaY * directionY);
        this.dataStart = {x: this.dataPointX, y: this.dataPointY}

        this.setTransform(mapData);
        // console.log(`Finished map data repositionning to: {${this.dataPointX}, ${this.dataPointY}}`);
        // console.log(`Finished map mouse wheel event at:  ${performance.now()}`);
      }
    }

    static getOffsets(): {x:number, y:number} {
      const mapData = document.getElementById("map-data");
      const zoom = document.getElementById("zoom");

      if(mapData && zoom) {
        let offsetLeft = this.zoomPointX - this.dataPointX;
        let offsetTop =  this.zoomPointY - this.dataPointY;

        return {x: offsetLeft, y: offsetTop};
      }
      console.log("Error calculating the offset");
      return {x:0, y:0}
    }

    static setIconPosition(icon:ListElementEntity, offsets: {x:number, y: number}, iconDiv, component:IconComponent) {
      if(component?.entity?.id === 7090764458) {
        console.log("component is ");
      }
      //Change values
      const x = offsets.x + (icon.x * this.scale)
      const y = offsets.y + (icon.y * this.scale)
      component.x = x;
      component.y = y;
      
      iconDiv.style.transform = `translate(${x}px, ${y}px)`;
    }

    static repositionIcon(icon:ListElementEntity, offsets: {x:number, y: number}, iconDiv:HTMLElement, component:IconComponent, animate:boolean, delay?:number) {
      
      const x = offsets.x + (icon.x * this.scale)
      const y = offsets.y + (icon.y * this.scale)

      if(component?.entity?.id === 7090764458) {
        console.log("component is ");
      }

      if(!animate) {
        iconDiv.style.transform = `translate(${x}px, ${y}px)`;
        component.x = x;
        component.y = y;
        return;
      }

      let matrixValue;
      let startx;
      let starty
      if(!component.x || !component.y) {
        matrixValue = component.computedStyle.transform.match(/[-+]?[0-9]*\.?[0-9]+/g).map(parseFloat);
        startx = this.lastDataStart.x - this.dataStart.x + matrixValue[4]
        starty = this.lastDataStart.y - this.dataStart.y + matrixValue[5]
      } else {
        startx = this.lastDataStart.x - this.dataStart.x + component.x
        starty = this.lastDataStart.y - this.dataStart.y + component.y
      }

      // console.log(`Finished calculating starting point at:  ${performance.now()}`);

      // iconDiv.style.transform = "";
      const from = {
        x: startx,
        y: starty
      }

      // iconDiv.style.transform = `translate(${startx}px, ${starty}px)`
      // gsap.from(iconDiv, from)
      // this.fromTweens.push(gsap.from(iconDiv, from));
      // this.animationTimeline.to(iconDiv,
      //   {
      //     duration: 0.3,
      //     x: x,
      //     y: y
      //     // ease: "power1.inOut",
      //   }
      // )

      // this.toTweens.push(gsap.to(iconDiv,
      //   {
      //     duration: 0.3,
      //     x: x,
      //     y: y,
      //     paused: true
      //     // ease: "power1.inOut",
      //   })
      // );
      this.animationTimeline.fromTo(iconDiv,
        from,
        {
          duration: delay ? delay : 0.3,
          x: x,
          y: y,
          // ease: "power1.inOut",
        }, 0 // Start at the same time as other elements
      )
      component.x = x;
      component.y = y;
    }

    static setFloorPopupPosition(popupWrapper:HTMLElement, building:Building) {
      const offsets = this.getOffsets();
      // const x = (offsets.x + (building.x * this.scale))
      const x = (offsets.x + ((building.x + building.width/2) * this.scale)) - popupWrapper.clientWidth/2
      const y = (offsets.y + (building.y * this.scale)) - (popupWrapper.clientHeight + 10);
      const transformString = `translate(${x}px, ${y}px)`;
      if(transformString !== popupWrapper.style.transform) {
        popupWrapper.parentElement.style.transform = `translate(${x}px, ${y}px)`;
      }
    }

    static isAlpha(ctx, event) {
      var pixelData = ctx.getImageData(event.offsetX, event.offsetY, 1, 1).data;
      if(pixelData[3] != 0){
        return false;
      }
      return true;
    }

    private static propagation_count = 0;
    private static MAX_PROPAGATION = 10;
    private static propagationList:HTMLElement[] = []

    static async propagateEvent(currentTarget:HTMLElement, event:MouseEvent) {
      if(this.propagation_count === this.MAX_PROPAGATION) {
        this.propagation_count = 0;
        this.propagationList = [];
        console.log("Propagation went into a loop: Breaking the loop");
        return;
      }
      this.propagationList.push(currentTarget);
      // Find the element underneath the current one
      this.propagationList.forEach(element => element.style.pointerEvents = 'none') // Temporarily disable pointer events on the target image
      // currentTarget.style.pointerEvents = 'none';
      const elementUnderneath = document.elementFromPoint(event.clientX, event.clientY);
      this.propagationList.forEach(element => element.style.pointerEvents = 'auto') // Re-enable pointer events on the target image
      // currentTarget.style.pointerEvents = 'auto'; 
        
      if (elementUnderneath) {
          const newEvent = new MouseEvent(event.type, {
              bubbles: true,
              cancelable: true,
              clientX: event.clientX,
              clientY: event.clientY,
              view: window,
              ctrlKey: event.ctrlKey,
              shiftKey: event.shiftKey
          });
          this.propagation_count++;
          await elementUnderneath.dispatchEvent(newEvent);
      }
      this.propagation_count = 0;
      this.propagationList = [];
    }

    static hexToRgb(hex) {
      // Remove the leading hash (#) if present
      hex = hex.replace(/^#/, '');
  
      // Parse the r, g, b values
      let bigint = parseInt(hex, 16);
      let r = (bigint >> 16) & 255;
      let g = (bigint >> 8) & 255;
      let b = bigint & 255;
  
      return `rgb(${r}, ${g}, ${b})`  
    }

    static getDeltaZoomForIcon():number {
      let scale = this.scale
      let delta = 0;
      let continueLoop = true;
      while(scale !== this.ZOOM_ICON_TARGET_SCALE && ((this.ZOOM_ICON_TARGET_SCALE + 0.1) <= scale || (this.ZOOM_ICON_TARGET_SCALE - 0.1) >= scale) && continueLoop) {
        // console.log((targetScale + 0.1) >= scale && (targetScale - 0.1) <= scale);
        
        if(scale < this.ZOOM_ICON_TARGET_SCALE) {
          if(delta > 0) {
            continueLoop = false
          }
          scale *= this.SCALER
          delta -= 100;
        } else {
          if(delta < 0) {
            continueLoop = false
          }
          scale /= this.SCALER
          delta += 100;
        }
      }
      return delta;
    } 

    static getScalerFromSensitivity(sensitivity:number):number {
      if(sensitivity === 1) {
        return 1.1;
      }
      if(sensitivity === 2) {
        return 1.2;
      }
      if(sensitivity === 3) {
        return 1.3
      }
      if(sensitivity === 4) {
        return 1.4;
      }
      if(sensitivity === 5) {
        return 1.5;
      }
      if(sensitivity === 6) {
        return 1.6;
      }
      if(sensitivity === 7) {
        return 1.7;
      }
      if(sensitivity === 8) {
        return 1.8
      }
      return 1;
    }

    static getSensitivityFromScaler(scaler:number):number {
      if(scaler === 1.1) {
        return 1;
      }
      if(scaler === 1.2) {
        return 2;
      }
      if(scaler === 1.3) {
        return 3;
      }
      if(scaler === 1.4) {
        return 4;
      }
      if(scaler === 1.5) {
        return 5;
      }
      if(scaler === 1.6) {
        return 6;
      }
      if(scaler === 1.7) {
        return 7;
      }
      if(scaler === 1.8) {
        return 8
      }
      return 1;
    }

//   private resizeIcon(delta) {
//     const elements = document.getElementsByClassName("iconImg")
//     let list = [];
//     let centeredList = [];
  
//     for(let i = 0; i < elements.length; i++) {
//       if(isCenteredElement(elements[i].getAttribute("class"))) {
//         centeredList.push(elements[i])
//       } else {
//         list.push(elements[i])
//       }
//     }
//     let parentBase = centeredList[0].parentNode as HTMLElement
//     let parentWidth:number = parentBase.clientWidth
//     let parentHeight:number = parentBase.clientHeight
  
//     let newWidth;
//     let newHeight;
//     if(delta != 0) {
//       newWidth = (delta < 0) ? parentWidth / MODIFIER : parentWidth * MODIFIER
//       newHeight = (delta < 0) ? parentHeight / MODIFIER : parentHeight * MODIFIER
//     }
//     resizeElementList(centeredList, true, newWidth, newHeight);
    
//     parentBase = list[0].parentNode as HTMLElement;
//     parentWidth = parentBase.clientWidth;
//     parentHeight = parentBase.clientHeight;
//     if(delta != 0) {
//       newWidth = (delta < 0) ? parentWidth / MODIFIER : parentWidth * MODIFIER
//       newHeight = (delta < 0) ? parentHeight / MODIFIER : parentHeight * MODIFIER
//     }
//     resizeElementList(list, false, newWidth, newHeight);
//   }
  
// private resizeElementList(elements:HTMLElement[], isCentered:boolean, newWidth, newHeight) {
//     if(elements.length === 0) {
//       return;
//     }
  
//     for (let i = 0; i < elements.length; i++) {
//       const currentElement = elements[i] as HTMLElement
//       let parent = currentElement.parentNode as HTMLElement
  
//       var zIndex = currentElement.style.zIndex;
//       var visibility = currentElement.style.visibility;
  
//       let translateIndex = parent.getAttribute('style').indexOf("translate(") + 10;
//       let parentStyle:StringBuilder = new StringBuilder()
//       parentStyle.append(parent.getAttribute('style').substring(0, translateIndex));
//       let elementStyle:StringBuilder = new StringBuilder()
//       if (isCentered) {
//         parentStyle.append('-' + newWidth/2 + 'px,-' + newWidth/2 + 'px);')
//         parentStyle.append((newWidth/2).toString())
//         parentStyle.append('px,-')
//         parentStyle.append((newWidth/2).toString())
//         parentStyle.append('px);')
//         elementStyle.append('width: ')
//         elementStyle.append(newWidth.toString())
//         elementStyle.append('px; height: ')
//         elementStyle.append(newWidth)
//         elementStyle.append('px;')
//         currentElement.setAttribute('style', elementStyle.toString());
//       } else {
  
//         parentStyle.append('-' + newWidth/2 + 'px,-' + newHeight + 'px);')
//         parentStyle.append((newWidth/2).toString())
//         parentStyle.append('px,-')
//         parentStyle.append((newHeight).toString())
//         parentStyle.append('px);')
//         elementStyle.append('width: ')
//         elementStyle.append(newWidth.toString())
//         elementStyle.append('px; height: ')
//         elementStyle.append(newHeight)
//         elementStyle.append('px;')
//         currentElement.setAttribute('style', elementStyle.toString());
//       }
      
//       currentElement.style.zIndex = zIndex;
//       currentElement.style.visibility = visibility;
  
//       parent.setAttribute('style', parentStyle.toString())
//     }
//   }
}