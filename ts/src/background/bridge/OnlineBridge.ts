import { BridgeModule } from "./BackgroundBridgeRegistry";
import { OnlineService } from "../services/common/OnlineService";

export class OnlineBridge implements BridgeModule {
  constructor(private readonly service: OnlineService) {}

  public getApi() {
    return {
      getIsOnline: () => this.service.isOnline(),
      onOnlineStatusChanged: (handler: (isOnline: boolean) => void) => {
        this.service.on("changed", handler);
        return () => this.service.off("changed", handler);
      },
    };
  }
}
