export class DomUtils {

    static stringToHtmlElement(htmlString:string):HTMLElement {
        const parser = new DOMParser();
        return parser.parseFromString(htmlString, "text/html").body.childNodes[0] as HTMLElement
    }
}