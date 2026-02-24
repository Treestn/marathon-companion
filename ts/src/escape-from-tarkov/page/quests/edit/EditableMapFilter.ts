import { EditFilterElementImpl, EditHighLevelElementImpl, ElementsImpl, FilterElementsData, ListElementEntity, ListElementEntityImpl } from "../../../../model/IFilterElements";

export class EditableMapFilter {

    private mapFilter:FilterElementsData;

    constructor(map:string, mapPath:string, width:number, height:number) {
        this.mapFilter = new EditFilterElementImpl(map, mapPath, width, height);
    }

    getMapFilter():FilterElementsData {
        return this.mapFilter;
    }

    getMapName():string {
        return this.mapFilter.map
    }

    addEditFilter(prop:{hleName: string, src:string, width: number, height: number, centered: boolean}, elementName:string, elementImpl:ListElementEntity) {
        for(const hle of this.mapFilter.highLevelElements) {
            if(prop.hleName === hle.name) {
                for(const element of hle.elements) {
                    if(element.name === elementName) {
                        for(let i = 0; i < element.listElements.length; i++) {
                            if(element.listElements[i].id === elementImpl.id) {
                                element.listElements.splice(i, 1);
                                break;
                            }
                        }
                        element.listElements.push(elementImpl);
                        return;
                    }
                }
                // It means the Element was not found
                const newElement = new ElementsImpl(elementName, prop.src, prop.width, prop.height, prop.centered);
                hle.elements.push(newElement);
                newElement.listElements.push(elementImpl);
                return;
            }

        }
        // It means the hle was not found
        const newHle = new EditHighLevelElementImpl(prop.hleName);
        const newElement = new ElementsImpl(elementName, prop.src, prop.width, prop.height, prop.centered);

        newElement.listElements.push(elementImpl);
        newHle.elements.push(newElement);
        this.mapFilter.highLevelElements.push(newHle);
    }

    removeEditFilterElement(id:number):boolean{
        const removed = this.removeFilter(id);
        this.cleanup();
        return removed;
    }

    private cleanup() {

    }

    private removeFilter(id:number):boolean {
        for(const hle of this.mapFilter.highLevelElements) {
            for(const elements of hle.elements) {
                for(let i = 0; i < elements.listElements.length; i++) {
                    if(elements.listElements[i].id === id) {
                        elements.listElements.splice(i, 1);
                        return true;
                    }
                }
            }
        }
        return false;
    }
}