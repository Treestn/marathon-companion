import { DomUtils } from "../../utils/DomUtils"

export class IconBuilderHelper {

    private static template = 
    `
    <div class="icon-div">
    </div>
    `

    static getTemplate():HTMLDivElement {
        return DomUtils.stringToHtmlElement(this.template) as HTMLDivElement
    }
}