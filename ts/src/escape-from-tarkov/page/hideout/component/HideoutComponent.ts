import { HideoutStations } from "../../../../model/HideoutObject";

export class HideoutComponent {
    
    private station:HideoutStations;
    private canvasElement:HTMLCanvasElement;
    private logoWrapper:HTMLDivElement;
    private htmlHeaderElement:HTMLElement;
    private htmlBodyElement:HTMLElement;

    constructor(station:HideoutStations) {
        this.station = station
    }

    getStation():HideoutStations {
        return this.station;
    }

    setCanvasElement(canvas:HTMLCanvasElement) {
        this.canvasElement = canvas
    }

    getCanvasElement():HTMLCanvasElement {
        return this.canvasElement;
    }

    setLogoWrapperElement(logoWrapper:HTMLDivElement) {
        this.logoWrapper = logoWrapper;
    }

    getLogoWrapperElement():HTMLDivElement {
        return this.logoWrapper;
    }

    setHtmlHeaderElement(htmlHeaderElement:HTMLElement) {
        this.htmlHeaderElement = htmlHeaderElement
    }

    getHtmlHeaderElement():HTMLElement {
        return this.htmlHeaderElement;
    }

    setHtmlBodyElement(htmlBodyElement:HTMLElement) {
        this.htmlBodyElement = htmlBodyElement
    }

    getHtmlBodyElement():HTMLElement {
        return this.htmlBodyElement;
    }
}