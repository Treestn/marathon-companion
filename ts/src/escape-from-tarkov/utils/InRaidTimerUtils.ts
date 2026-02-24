import { AppConfigUtils } from "./AppConfigUtils";

export class InRaidTimerUtils {

    private static wrapper:HTMLElement;
    private static timer1:HTMLElement;
    private static timer2:HTMLElement;
    private static timeoutId:number;

    static start() {
        this.wrapper = document.getElementById("in-raid-timer-wrapper");
        this.timer1 = document.getElementById("window-raid-timer-1");
        this.timer2 = document.getElementById("window-raid-timer-2");
        if(AppConfigUtils.getAppConfig().userSettings.isTimerOn()) {
            this.show();
        } else {
            this.hide();
        }
    }

    private static loop() {
        this.timeoutId = setTimeout(() => {
            this.updateTime()
            this.loop();
        }, 5000);
    }

    private static updateTime() {
        const now = new Date();
        this.timer1.textContent = this.getTimeInUTCOffset(now, -3);
        this.timer2.textContent = this.getTimeInUTCOffset(now, 9);
    }

    static hide() {
        this.wrapper.style.display = "none";
        clearTimeout(this.timeoutId);
    }

    static show() {
        this.wrapper.style.display = "";
        this.updateTime()
        this.loop();
    }

    private static getTimeInUTCOffset(now:Date, offset: number): string {
        const utcTime = ((now.getTime() + offset * 60 * 60 * 1000) * 7) - 12000;
        const date = new Date(utcTime);
    
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        // const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
        // return `${hours}:${minutes}:${seconds}`;
        return `${hours}:${minutes}`;
    }
}