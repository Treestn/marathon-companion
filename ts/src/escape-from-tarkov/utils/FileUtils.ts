import { reject } from "lodash";
import { PlayerProgressionUtils } from "./PlayerProgressionUtils";

export class FileUtils {

    static async openSelectFolderDialog(path?:string):Promise<overwolf.utils.OpenFolderPickerResult> {

        return new Promise((resolve, reject) => {
            if(!path) {
                path = overwolf.io.paths.documents;
            }
            overwolf.utils.openFolderPicker(path, (result) => {
                if(result.success) {
                    resolve(result);
                } else {
                    console.warn('Folder selection failed', result);
                    reject(new Error(result.error));
                }
            });
          });
    }

    static async openSelectFileDialog(path?:string, fileExtension?:string):Promise<overwolf.utils.OpenFilePickerResult> {

        return new Promise((resolve, reject) => {
            if(!path) {
                path = overwolf.io.paths.documents;
            }
            overwolf.utils.openFilePicker(fileExtension ? fileExtension : ".json", path, (result) => {
                if(result.success) {
                    resolve(result);
                } else {
                    console.warn('Folder selection failed', result);
                    reject(new Error(result.error));
                }
            }, false);
          });
    }
    
    static async getFileContentAsString(path:string):Promise<overwolf.io.ReadFileContentsResult> {
        return new Promise((resolve, reject) => {
            overwolf.io.readFileContents(path, overwolf.io.enums.eEncoding.UTF8, (result) => {
                if(result.success) {
                    resolve(result);
                } else {
                    console.warn('Folder selection failed', result);
                    reject(new Error(result.error));
                }
            });
        });
    }

    static async getFileBinaryArray(path:string):Promise<overwolf.io.ReadBinaryFileResult> {
        return new Promise((resolve) => {
            overwolf.io.readBinaryFile(path, {encoding: overwolf.io.enums.eEncoding.UTF8BOM, maxBytesToRead: 0, offset: 0}, result => {
                if(result.success) {
                    console.log(result);
                    resolve(result);
                } else {
                    console.warn('File could not be loaded into binary', result);
                    resolve(result);
                }
            })
        })
    }

    static async saveBinaryFileToPng(filepath:string) {
        overwolf.io.writeFileContents
    }

    static async saveProgressionToFile(filePath:string) {
        const data = PlayerProgressionUtils.getPlayerProgressionJsonString();
        overwolf.io.writeFileContents(filePath + ".json", data, overwolf.io.enums.eEncoding.UTF8, false, (result) => {
            if(result.success) {
                console.log(`Successufully saved file to computer`)
            } else {
                console.log(`Error while saving the file to computer`)
            }
        })
    }

    static isValidWindowsFilename(filename:string) {
        // List of reserved Windows filenames
        const reservedFilenames = [
            "CON", "PRN", "AUX", "NUL",
            "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
            "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
        ];
    
        // Check if the filename is empty
        if (!filename || filename.trim() === "") {
            return false;
        }
    
        // Check for reserved filenames (case-insensitive)
        if (reservedFilenames.includes(filename.trim().toUpperCase())) {
            return false;
        }
    
        // Check for invalid characters
        const invalidChars = /[\\/:*?"<>|]/;
        if (invalidChars.test(filename)) {
            return false;
        }
    
        // Check if the filename ends with a space or period
        if (filename.trim().endsWith('.') || filename.trim().endsWith(' ')) {
            return false;
        }
    
        return true;
    }
}