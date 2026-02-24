export class GameEventsService {


    private readyToRegisterEvents: boolean = false;

    // public async init() {
    //     this.gameEventsService = new EventEmitter<GameEvents>();
    // }

    public setReadyToRegisterEvents(ready: boolean) {
        this.readyToRegisterEvents = ready;
    }

    public isReadyToRegisterEvents(): boolean {
        return this.readyToRegisterEvents;
    }
    

}