// eslint-disable-next-line unicorn/prefer-node-protocol
import { EventEmitter } from "events";
import { TarkovCompanionService } from "../../../escape-from-tarkov/service/tarkov-companion-api/handler/TarkovCompanionService";

type OnlineServiceEvents = {
  changed: [boolean];
};

export class OnlineService extends EventEmitter<OnlineServiceEvents> {

    private isCurrentlyOnline: boolean = false;

    public async init() {
        this.isCurrentlyOnline = await this.checkOnline();

        globalThis.addEventListener("online", () => this.handleConnectivityChange());
        globalThis.addEventListener("offline", () => this.handleConnectivityChange());
    }

    public isOnline(): boolean {
        return this.isCurrentlyOnline;
    }

    public async refresh(): Promise<boolean> {
        const wasOnline = this.isCurrentlyOnline;
        this.isCurrentlyOnline = await this.checkOnline();
        if (wasOnline !== this.isCurrentlyOnline) {
            this.emit("changed", this.isCurrentlyOnline);
        }
        return this.isCurrentlyOnline;
    }

    private async handleConnectivityChange(): Promise<void> {
        const wasOnline = this.isCurrentlyOnline;
        this.isCurrentlyOnline = await this.checkOnline();
        if (wasOnline !== this.isCurrentlyOnline) {
            console.log(`[OnlineService] Online status changed: ${this.isCurrentlyOnline}`);
            this.emit("changed", this.isCurrentlyOnline);
        }
    }

    private async checkOnline(): Promise<boolean> {

        if (!navigator.onLine) {
          return false;
        }
        // avoid CORS errors with a request to your own origin
        try {
          let health = await TarkovCompanionService.checkHealth()
          console.log(`Health: ${health.ok}`);
          
          return health.ok
        } catch {
          return false
        }
    }
}
