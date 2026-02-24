import { AppConfig, AppConfigPatch } from "../../shared/models/AppConfig";
import { AppConfigService } from "../services/app-data/AppConfigService";
import { BridgeModule } from "./BackgroundBridgeRegistry";

export class AppConfigBridge implements BridgeModule {
  public constructor(private readonly appConfigService: AppConfigService) {}

  public getApi() {
    return {
      waitForAppConfig: async () => undefined,
      getAppConfig: (): AppConfig => this.appConfigService.getConfig(),
      updateAppConfig: (patch: AppConfigPatch) => this.appConfigService.updateConfig(patch),
      onAppConfigUpdated: (handler: (config: AppConfig) => void) => {
        const listener = (config: AppConfig) => handler(config);
        this.appConfigService.on("updated", listener);
        return () => {
          this.appConfigService.off("updated", listener);
        };
      },
    };
  }
}
