import { IFrame } from "../IFrame";

export class TermsOfServices extends IFrame {

    private static _instance:TermsOfServices;

    private constructor() {
        super("terms-of-services-frame", "./terms_of_services.html")
        this.frame.addEventListener("load", () => {
            this.registerListeners();
        })
        
    }

    public static instance() {
        if(!TermsOfServices._instance) {
            TermsOfServices._instance = new TermsOfServices();
        }
        return TermsOfServices._instance}

    async registerListeners() {

    }

}