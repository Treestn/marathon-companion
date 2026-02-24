import { IFrame } from "../IFrame";
import { FileUtils } from "../escape-from-tarkov/utils/FileUtils";
import { I18nHelper } from "../locale/I18nHelper";

export class FileSaver extends IFrame {

    private static _instance:FileSaver;
    static folderPath:string = overwolf.io.paths.documents;

    private constructor() {
        super("file-saver-frame", "./file_saver.html")
        this.frame.addEventListener("load", () => {
            this.init()
            this.registerListeners()
        })
    }

    async init() {
        I18nHelper.init();
        const folderInput:HTMLInputElement = this.frame.contentWindow.document.getElementById("folder-selector-input") as HTMLInputElement;
        if(folderInput) {
            folderInput.value = FileSaver.folderPath;
        }

        const fileNameInput:HTMLInputElement = this.frame.contentWindow.document.getElementById("file-name-input") as HTMLInputElement;
        if(fileNameInput) {
            fileNameInput.value = "ArcRaidersCompanionProgression";
            fileNameInput.style.borderColor = "green";
        }
    }

    public static instance() {
        if(!FileSaver._instance) {
            FileSaver._instance = new FileSaver();
        }
        return FileSaver._instance
    }

    registerListeners() {
        const changeFolderButton = this.frame.contentWindow.document.getElementById("file-saver-folder-selector-button");
        const folderInput:HTMLInputElement = this.frame.contentWindow.document.getElementById("folder-selector-input") as HTMLInputElement;
        if(changeFolderButton && folderInput) {
            changeFolderButton.onclick = async () => {
                const result = await FileUtils.openSelectFolderDialog(FileSaver.folderPath);
                if(result.success) {
                    FileSaver.folderPath = result.path;
                    folderInput.value = result.path;
                }
            }
        }
        const fileNameInput:HTMLInputElement = this.frame.contentWindow.document.getElementById("file-name-input") as HTMLInputElement;
        if(fileNameInput) {
            fileNameInput.onkeyup = () => {
                if(FileUtils.isValidWindowsFilename(fileNameInput.value)) {
                    fileNameInput.style.borderColor = "green";
                } else {
                    fileNameInput.style.borderColor = "red";
                }
            }
        }

        const save = this.frame.contentWindow.document.getElementById("apply");
        if(save && fileNameInput) {
            save.textContent = I18nHelper.get("pages.file.save.save")
            save.onclick = () => {
                if(FileUtils.isValidWindowsFilename(fileNameInput.value)) {
                    const path = FileSaver.folderPath + "\\" + fileNameInput.value
                    FileUtils.saveProgressionToFile(path)
                    this.close();
                }
            }
        }
    }
}