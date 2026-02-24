import { IFrame } from "../IFrame";

export class AboutUs extends IFrame {

    private static _instance:AboutUs;

    private constructor() {
        super("about-us-frame", "./about_us.html")
        this.frame.addEventListener("load", () => {
            this.registerListeners();
        })
        
    }

    public static instance() {
        if(!AboutUs._instance) {
            AboutUs._instance = new AboutUs();
        }
        return AboutUs._instance
    }

    async registerListeners() {

    }

}