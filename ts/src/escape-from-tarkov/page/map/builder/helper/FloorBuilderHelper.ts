import { DomUtils } from "../../utils/DomUtils"

export class FloorBuilderHelper {
    
    private static template = 
    `
    <div class="floor-div">
    </div>
    `

    static getTemplate():HTMLDivElement {
        return DomUtils.stringToHtmlElement(this.template) as HTMLDivElement
    }

}