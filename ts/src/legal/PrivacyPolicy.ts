import { IFrame } from "../IFrame";

export class PrivacyPolicy extends IFrame {

    private static _instance:PrivacyPolicy;

    private constructor() {
        super("privacy-policy-frame", "./privacy_policy.html")
        this.frame.addEventListener("load", () => {
            this.registerListeners();
        })
        
    }

    public static instance() {
        if(!PrivacyPolicy._instance) {
            PrivacyPolicy._instance = new PrivacyPolicy();
        }
        return PrivacyPolicy._instance}

    async registerListeners() {

    }

}