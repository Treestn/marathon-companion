import { IFrame } from "../IFrame";
import { IPlayerProgression } from "../model/IPlayerProgression";
import { FileUtils } from "../escape-from-tarkov/utils/FileUtils";
import { FileSaver } from "./FileSaver";
import { PlayerProgressionUtils } from "../escape-from-tarkov/utils/PlayerProgressionUtils";
import { NavigationUtils } from "../escape-from-tarkov/utils/NavigationUtils";
import { AppConfigUtils } from "../escape-from-tarkov/utils/AppConfigUtils";
import { progressionTypes } from "../consts";
import { I18nHelper } from "../locale/I18nHelper";

export class FileImport extends IFrame {

    private static _instance:FileImport;
    private static progression:IPlayerProgression;

    private constructor() {
        super("file-import-frame", "./file_import.html")
        this.frame.addEventListener("load", () => {
            this.init()
            this.registerListeners()
        })
    }

    async init() {
        I18nHelper.init();
        const loadProgression:HTMLButtonElement = this.frame.contentWindow.document.getElementById("apply") as HTMLButtonElement;
        if(loadProgression) {
            loadProgression.textContent = I18nHelper.get("pages.file.import.load")
            loadProgression.disabled = true;
        }
    }

    public static instance() {
        if(!FileImport._instance) {
            FileImport._instance = new FileImport();
        }
        return FileImport._instance;
    }

    registerListeners() {
        const loadProgression:HTMLButtonElement = this.frame.contentWindow.document.getElementById("apply") as HTMLButtonElement;

        const fileButton = this.frame.contentWindow.document.getElementById("file-import-folder-selector-button");
        const fileInput:HTMLInputElement = this.frame.contentWindow.document.getElementById("folder-selector-input") as HTMLInputElement;
        if(fileButton && fileInput && loadProgression) {
            fileButton.onclick = async () => {
                const result = await FileUtils.openSelectFileDialog(FileSaver.folderPath);
                if(result.success) {
                    fileInput.value = result.file;
                    const fileStringResult = await FileUtils.getFileContentAsString(result.file);
                    if(fileStringResult.success && fileStringResult.content) {
                        try{
                            FileImport.progression = JSON.parse(fileStringResult.content);
                        } catch(e) {
                            loadProgression.disabled = true;
                            FileImport.progression = null;
                            fileInput.style.borderColor = "red"
                            return;
                        }
                        if(FileImport.progression && FileImport.progression.id === "databaseProgressionEntry") {
                            fileInput.style.borderColor = "green"
                            loadProgression.disabled = false;
                            return;
                        }
                    }
                    loadProgression.disabled = true;
                    FileImport.progression = null;
                    fileInput.style.borderColor = "red"
                }
            }
        }

        
        if(loadProgression) {
            loadProgression.onclick = () => {
                if(FileImport.progression && FileImport.progression.id === "databaseProgressionEntry") {
                    PlayerProgressionUtils.setPlayerProgression(FileImport.progression);
                    const progressionType = AppConfigUtils.getAppConfig().userSettings.getProgressionType();
                    if(progressionType && (progressionType === progressionTypes.pvp || progressionType === progressionTypes.pve)) {
                        NavigationUtils.handleProgressionTypeClick(progressionType);
                    } else {
                        NavigationUtils.handleProgressionTypeClick(progressionTypes.pvp);
                    }
                    this.close();
                }
            }
        }
    }
}