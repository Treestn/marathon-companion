import { OWGames, OWHotkeys } from "@overwolf/overwolf-api-ts/dist";
import { IFrame } from "../IFrame";
import { AppConfigUtils } from "../escape-from-tarkov/utils/AppConfigUtils";
import { SidePageQuestController } from "../escape-from-tarkov/page/controller/SidePageQuestController";
import { I18nHelper } from "../locale/I18nHelper";

export class Hotkeys extends IFrame {

    private static _instance:Hotkeys;

    private static hotkey:string; 

    private static domHotkeyId:string;

    private static elementReferenceList:HTMLElement[] = [];

    private static sidePageQuestHotkey:boolean = false;

    private constructor() {
        super("hotkeys-frame", "./hotkeys.html")
        this.frame.addEventListener("load", () => {
            this.registerListeners();
            I18nHelper.init();
        })
    }

    public static instance() {
        if(!Hotkeys._instance) {
            Hotkeys._instance = new Hotkeys();
        }
        return Hotkeys._instance
    }

    async overridePosition() {
        setTimeout(() => {
            const main = this.frame.contentWindow.document.getElementById("hotkeys-main");
            if(main) {
                main.style.marginRight = "0px";
            }
            const hkBackground = this.frame.contentWindow.document.getElementById("hotkeys-background");
            if(hkBackground) {
                hkBackground.style.width = "100%";
            }
        }, 20)
    }

    async registerListeners() {

        const gameClassId = await this.getCurrentGameClassId();
        const hotkeyText = await OWHotkeys.getHotkeyText(
          Hotkeys.hotkey,
          gameClassId ?? undefined
        );

        const hotkeyInput = this.frame.contentWindow.document.getElementById('hotkey-input');
        if(Hotkeys.sidePageQuestHotkey) {
            (hotkeyInput as HTMLInputElement).placeholder = AppConfigUtils.getAppConfig().userSettings.getSidePageQuestHotkey();
        } else {
            (hotkeyInput as HTMLInputElement).placeholder = hotkeyText;
        }


        hotkeyInput.onpaste = e => {
            e.preventDefault();
            return false;
        };

        let hotkey = '';
        let keyCode:number = null;
        hotkeyInput.addEventListener('keydown', function (e) {
            e.preventDefault();
            e.stopPropagation();

            (hotkeyInput as HTMLInputElement).value = "";
            hotkey = '';

            if (e.ctrlKey && !Hotkeys.sidePageQuestHotkey) {
                hotkey += 'Ctrl + ';
            }

            if (e.shiftKey && !Hotkeys.sidePageQuestHotkey) {
                hotkey += 'Shift + ';
            }

            if (e.altKey && !Hotkeys.sidePageQuestHotkey) {
                hotkey += 'Alt + ';
            }

            if(e.key != "Control" && e.key != "Alt" && e.key != "Shift") {
                hotkey += e.key.toUpperCase();
                keyCode = e.keyCode;
            } else {
                keyCode = null;
            }

            (hotkeyInput as HTMLInputElement).value = hotkey;
        });

        const validateButton = this.frame.contentWindow.document.getElementById('apply-hotkey');
        validateButton.addEventListener("click", () => {
            this.submit(hotkey.split(' ').join(''), keyCode, gameClassId).then(result => {
                if(!result.success) {
                    (hotkeyInput as HTMLInputElement).style.borderColor = "red";
                    const errorText = this.frame.contentWindow.document.getElementById("hotkey-error-text");                    
                    errorText.textContent = result.error
                } else {
                    const domEl = window.document.getElementById(Hotkeys.domHotkeyId)
                    if(domEl) {
                        domEl.textContent = hotkey
                    } else {
                        console.log(`Could not refresh UI with new Hotkey for element id ${Hotkeys.domHotkeyId}`);
                    }

                    if(Hotkeys.elementReferenceList.length > 0) {
                        Hotkeys.elementReferenceList.forEach(el => {
                            el.textContent = hotkey
                        })
                    }
                    Hotkeys.domHotkeyId = null;
                    Hotkeys.elementReferenceList = [];
                    Hotkeys.sidePageQuestHotkey = false;
                    this.close()
                }
            })
        })
    }

    private async submit(hotkey:string, keyCode:number, gameClassId):Promise<overwolf.Result> {

        if(keyCode === null) {
            return null;
        }

        let ctrlModifier = false;
        let shiftModifier = false;
        let altModifier = false;

        if(hotkey.includes("Ctrl")) {
            ctrlModifier = true;
        }

        if(hotkey.includes("Shift")) {
            shiftModifier = true
        }

        if(hotkey.includes("Alt")) {
            altModifier = true;
        }

        let newHotkey = {
            name: Hotkeys.hotkey,
            binding: hotkey,
            gameid: gameClassId,
            virtualKey: keyCode,
            modifiers: {
              shift: shiftModifier,
              ctrl: ctrlModifier,
              alt: altModifier
            }
        };

        return (await this.assignHotkey(newHotkey))
    }

    private async assignHotkey(newHotkey: overwolf.settings.hotkeys.AssignHotkeyObject): Promise<overwolf.Result> {
        return new Promise((resolve) => {
            overwolf.settings.hotkeys.assign(newHotkey, (result) => {
                resolve(result);
            });
        });
    }

    static setSidePageQuestHotkey(isKeybindForSidePage:boolean) {
        this.sidePageQuestHotkey = isKeybindForSidePage
    }

    static setHotkey(hotkey:string) {
        this.hotkey = hotkey;
    }

    static getHotkey():string {
        return this.hotkey;
    }

    static setDomHotkeyId(id:string) {
        this.domHotkeyId = id;
    }

    static addElementReference(ref:HTMLElement) {
        this.elementReferenceList.push(ref)
    }

    private async getCurrentGameClassId(): Promise<number | null> {
        const info = await OWGames.getRunningGameInfo();
    
        return info && info.isRunning && info.classId ? info.classId : null;
    }
}