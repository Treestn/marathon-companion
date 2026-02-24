export class IFrame {

    frame:HTMLIFrameElement;

    constructor(id:string, src:string) {
        this.frame = document.createElement("iframe")
        this.frame.id = id
        this.frame.className = "iframe"
        this.frame.src = src
    }

    open() {
        const runner = document.getElementsByClassName("runner");
        if(runner?.length > 0) {
            runner[0].appendChild(this.frame);
            this.frame.addEventListener("load", () => {
                this.registerCloseListeners(this.frame);
            })
        }
    }

    registerCloseListeners(frame:HTMLIFrameElement) {
        const closeButton:HTMLElement = frame.contentWindow.document.getElementsByClassName("window-control-close")[0] as HTMLElement
        closeButton.addEventListener("click", () => {
            this.close()
        })
    }

    close() {
        window.document.getElementById(this.frame.id).remove();
    }
}