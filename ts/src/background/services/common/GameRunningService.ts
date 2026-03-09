import { kGameClassIds } from "../../../consts";

export class GameInfoService {

    private gameRunning:boolean = false;

    public async init() {
        this.gameRunning = await this.getGameRunningStatus();     
    }

    public async refresh():Promise<boolean> {
        this.gameRunning = await this.getGameRunningStatus();
        return this.gameRunning;
    }

    public isGameRunning():boolean {
        return this.gameRunning;
    }

    private getGameRunningStatus():Promise<boolean> {
        return new Promise(resolve => {
            overwolf.games.getRunningGameInfo(gameInfo => {
                resolve(Boolean(gameInfo && gameInfo.isRunning && this.isSupportedGame(gameInfo)));
            });
        })
    }

    public isSupportedGame(info: overwolf.games.RunningGameInfo) {
        return info.classId && kGameClassIds.includes(info.classId);
    }

}