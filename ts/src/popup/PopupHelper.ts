import { WindowsService } from "../WindowsService";
import { kWindowNames } from "../consts";

export class PopupHelper {

    private static isActive:boolean = false;

    private static popupList:Map<string, string> = new Map();

    public static readonly SUCCESS_BORDER_COLOR = "#426d4b";
    public static readonly INFO_BORDER_COLOR = "#53758d";
    public static readonly ERROR_BORDER_COLOR = "#5d3434";
    public static readonly WARNING_BORDER_COLOR = "#674a0d";
    public static readonly TWITCH_BORDER_COLOR = "#9147FF";

    private static createPopup(title:string, text:string, borderColor:string):string {
        return `
        <div id="popup-container" class="popup-container" style="border: 5px solid ${borderColor};">
            <div class="popup-data">
                <div id="popup" class="popup">
                    <div class="popup-title">
                        <div class="popup-title-logo-container">
                            <img class="popup-title-logo" src="../../icons/logo-256x256.png">
                        </div>
                        <b class="popup-title-text">${title}</b>
                    </div>
                    <div class="popup-text">
                        <p>${text}</p>
                    </div>
                </div>
                <div class="popup-close">
                    <img id="popup-close-button" class="popup-close-button" src="../../img/x_icon_white.png" />
                </div>
            </div>
        <div id="popup-timer" class="popup-timer"></div>
        </div>
        `
    }

    private static createFatalErrorPopup(text:string):string {
        return `<div id="fatal-popup-background" class="fatal-popup-background">
        <div id="fatal-popup-container" class="popup-container" style="border: 5px solid ${this.ERROR_BORDER_COLOR};">
            <div class="popup-data">
                <div id="popup" class="popup">
                    <div class="fatal-popup-title">
                        <div class="popup-title-logo-container">
                            <img class="popup-title-logo" src="../../icons/logo-256x256.png">
                        </div>
                        <b class="popup-title-text">Fatal Error</b>
                    </div>
                    <div class="fatal-popup-text">
                        <p>${text}</p>
                    </div>
                    <div class="fatal-popup-text">
                        <p>Possible fix: Verify that you are connected to the internet.</p>
                    </div>
                    <div class="fatal-popup-text">
                        <p>If you are connected to the internet, the servers are under maintenance, try again soon.</p>
                    </div>
                    <div class="fatal-popup-text">
                        <p>The app will close shortly, sorry for the inconvenience.</p>
                    </div>
                </div>
                <div class="popup-close">
                    <img id="fatal-popup-close-button" class="popup-close-button" src="../../img/x_icon_white.png" />
                </div>
            </div>
            <div id="popup-timer" class="popup-timer"></div>
        </div>
      </div>`
    }

    static addPopup(title:string, text:string, borderColor) {
        if(this.popupList.has(title)) {
            return;
        }
        this.popupList.set(title, this.createPopup(title, text, borderColor))
    }

    static addFatalPopup(text:string, reason:string) {
        console.log("Fatal Error: " + reason);

        const mainWindow = document.getElementById("main-window");
        if (!mainWindow) {
            console.warn("[PopupHelper] Cannot display fatal popup: main-window element not found");
            return;
        }
        
        const parser = new DOMParser();
        const popup:Document = parser.parseFromString(this.createFatalErrorPopup(text), "text/html")
        this.createFatalEventListener(popup)
        mainWindow.appendChild(popup.getElementById("fatal-popup-background"))
        this.createFatalTimerAnimation(document.getElementById("popup-timer"))
    }

    static start() {
        if(!this.isActive) {
            this.isActive = true;
            this.showNextPopup()
        }
    }

    private static showNextPopup() {
        if(this.popupList.size > 0) {
            const title = this.popupList.keys().next().value;
            const content = this.popupList.values().next().value;

            const parser = new DOMParser();
            const popup:Document = parser.parseFromString(content, "text/html")
            document.getElementById("main-window").appendChild(popup.getElementById("popup-container"))
            let timeoutId = this.createTimerAnimation(title, document.getElementById("popup-timer"))
            this.createEventListener(title, timeoutId)
        } else {
            this.isActive = false;
            this.popupList.clear();
        }
    }

    private static createEventListener(title:string, timeout) {
        document.getElementById("popup-close-button").addEventListener("click", () => {
            document.getElementById("popup-container").remove();
            clearTimeout(timeout)
            this.popupList.delete(title);
            this.showNextPopup();
        })
    }

    private static createFatalEventListener(popup:Document) {
        
        popup.getElementById("fatal-popup-close-button").addEventListener("click", () => {
            WindowsService.close(kWindowNames.background)
            // WindowsService.getCurrentWindow().then(result => {
            //     if(result.success) {
            //         WindowsService.close(result.window.name)
            //         WindowsService.close(kWindowNames.background)
            //     }
            // })
        })
    }

    private static createTimerAnimation(title:string, timerDiv:HTMLElement):number {     
        return setTimeout(() => {
            this.popupList.delete(title);
            document.getElementById("popup-container").remove();
            this.showNextPopup();
        }, 30000)
    }

    private static createFatalTimerAnimation(timerDiv:HTMLElement) {
        // timerDiv.style.width = "100%";
        
        setTimeout(() => {
            WindowsService.close(kWindowNames.background)
        }, 30000)
        // timerDiv.style.width = "0%";
    }
}