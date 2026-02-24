export class UuidGenerator {

    public static generate():string {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    public static generateSimple():string {
        return "xxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    public static generateSimpleNumber(length = 16):number {
        let numericUUID = '';
        for (let i = 0; i < length; i++) {
            numericUUID += Math.floor(Math.random() * 10);
        }
        return Number(numericUUID);
    }

}

