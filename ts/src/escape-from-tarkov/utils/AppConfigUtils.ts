import { storageKeys } from "../../consts";
import { ApplicationConfiguration, IApplicationConfiguration } from "../../model/IApplicationConfiguration";
import { StorageHelper } from "../service/helper/StorageHelper";

export class AppConfigUtils {

    private static applicationConfig:IApplicationConfiguration;
    
    private static refresh() {
        const config = localStorage.getItem(storageKeys.applicationConfiguration)
        if(config) {
            this.applicationConfig = Object.assign(new ApplicationConfiguration(), JSON.parse(config));
        } else {
            this.applicationConfig = new ApplicationConfiguration();
            
        }
        this.applicationConfig.resolve();
    }

    static save() {
        StorageHelper.save(storageKeys.applicationConfiguration, this.applicationConfig)
    }

    static getAppConfig():IApplicationConfiguration {
        this.refresh();
        return this.applicationConfig
    }
}