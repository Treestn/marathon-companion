import { BridgeModule } from "./BackgroundBridgeRegistry";
import { FirstTimeExperienceService } from "../services/common/FirstTimeExperienceService";

export class FirstTimeExperienceBridge implements BridgeModule {
  constructor(private readonly service: FirstTimeExperienceService) {}

  public getApi() {
    return {
      getFirstTimeExperienceActive: () => this.service.getIsActive(),
      setFirstTimeExperienceActive: (value: boolean) => this.service.setIsActive(value),
      onFirstTimeExperienceUpdated: (handler: (value: boolean) => void) => {
        this.service.on("updated", handler);
        return () => this.service.off("updated", handler);
      },
    };
  }
}
