export class BackgroundHelper {

    public static async getHotkey(toggleName:string):Promise<string> {
        const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
        if (bridge?.getHotkeyText) {
            return bridge.getHotkeyText(toggleName);
        }
        return "UNASSIGNED";
    }

    public static async getIsGameRunning(): Promise<boolean> {
        const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
        if (bridge?.getIsGameRunning) {
            return bridge.getIsGameRunning();
        }
        return false;
    }
}