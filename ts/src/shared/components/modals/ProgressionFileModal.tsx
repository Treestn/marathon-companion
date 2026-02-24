import React, { useEffect, useState } from "react";
import { I18nHelper } from "../../../locale/I18nHelper";
import { FileUtils } from "../../../escape-from-tarkov/utils/FileUtils";
import { PlayerProgressionUtils } from "../../../escape-from-tarkov/utils/PlayerProgressionUtils";
import { progressionTypes } from "../../../consts";
import { NavigationUtils } from "../../../escape-from-tarkov/utils/NavigationUtils";
import { ProgressionFileModalTarget } from "../../services/ProgressionFileModalEvents";
import { AppConfigClient } from "../../services/AppConfigClient";
import "./progression-file-modal.css";

type ProgressionFileModalProps = {
  isOpen: boolean;
  target: ProgressionFileModalTarget | null;
  onClose: () => void;
};

const useI18nReady = (isOpen: boolean): boolean => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    I18nHelper.init()
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, [isOpen]);
  return ready;
};

const resolveTitle = (isSaveMode: boolean, isI18nReady: boolean): string => {
  if (isSaveMode) {
    return isI18nReady ? I18nHelper.get("pages.file.save.title") : "Save App Progression";
  }
  return isI18nReady ? I18nHelper.get("pages.file.import.title") : "Import App Progression";
};

type SaveContentProps = {
  isOpen: boolean;
  isI18nReady: boolean;
  onClose: () => void;
};

const SaveProgressionContent: React.FC<SaveContentProps> = ({
  isOpen,
  isI18nReady,
  onClose,
}) => {
  const [folderPath, setFolderPath] = useState(overwolf.io.paths.documents);
  const [fileName, setFileName] = useState("ArcRaidersCompanionProgression");
  const [isFileNameValid, setIsFileNameValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFolderPath(overwolf.io.paths.documents);
    setFileName("ArcRaidersCompanionProgression");
    setIsFileNameValid(true);
  }, [isOpen]);

  useEffect(() => {
    setIsFileNameValid(FileUtils.isValidWindowsFilename(fileName));
  }, [fileName]);

  const handleSelectFolder = async () => {
    const result = await FileUtils.openSelectFolderDialog(folderPath);
    if (result.success) {
      setFolderPath(result.path);
    }
  };

  const handleSave = async () => {
    if (!isFileNameValid) {
      return;
    }
    setIsSubmitting(true);
    const path = `${folderPath}\\${fileName}`;
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    if (bridge?.saveProgressionToFile) {
      await bridge.saveProgressionToFile(path);
    } else {
      await FileUtils.saveProgressionToFile(path);
    }
    setIsSubmitting(false);
    onClose();
  };

  return (
    <>
      <div className="progression-file-row">
        <span className="progression-file-label">
          {isI18nReady ? I18nHelper.get("pages.file.save.folder") : "Folder"}
        </span>
        <input className="progression-file-input" value={folderPath} readOnly />
        <button
          type="button"
          className="progression-file-button"
          onClick={handleSelectFolder}
        >
          {isI18nReady ? I18nHelper.get("pages.file.save.change") : "Change"}
        </button>
      </div>
      <div className="progression-file-row">
        <span className="progression-file-label">
          {isI18nReady ? I18nHelper.get("pages.file.save.filename") : "File Name"}
        </span>
        <input
          className={`progression-file-input${
            isFileNameValid ? " is-valid" : " is-invalid"
          }`}
          value={fileName}
          onChange={(event) => setFileName(event.target.value)}
        />
      </div>
      <div className="progression-file-actions">
        <button
          type="button"
          className="progression-file-button primary"
          onClick={handleSave}
          disabled={!isFileNameValid || isSubmitting}
        >
          {isI18nReady ? I18nHelper.get("pages.file.save.save") : "Save"}
        </button>
      </div>
    </>
  );
};

type ImportContentProps = {
  isOpen: boolean;
  isI18nReady: boolean;
  onClose: () => void;
};

const ImportProgressionContent: React.FC<ImportContentProps> = ({
  isOpen,
  isI18nReady,
  onClose,
}) => {
  const [folderPath, setFolderPath] = useState(overwolf.io.paths.documents);
  const [selectedFile, setSelectedFile] = useState("");
  const [isFileValid, setIsFileValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFolderPath(overwolf.io.paths.documents);
    setSelectedFile("");
    setIsFileValid(false);
  }, [isOpen]);

  const handleSelectFile = async () => {
    const result = await FileUtils.openSelectFileDialog(folderPath);
    if (!result.success) {
      return;
    }
    setSelectedFile(result.file);
    try {
      const fileStringResult = await FileUtils.getFileContentAsString(result.file);
      const parsed = fileStringResult.success ? JSON.parse(fileStringResult.content || "{}") : null;
      setIsFileValid(parsed?.id === "databaseProgressionEntry");
    } catch (error) {
      console.warn("[ProgressionFileModal] Invalid file:", error);
      setIsFileValid(false);
    }
  };

  const handleImport = async () => {
    if (!isFileValid || !selectedFile) {
      return;
    }
    setIsSubmitting(true);
    try {
      const fileStringResult = await FileUtils.getFileContentAsString(selectedFile);
      const parsed = fileStringResult.success ? JSON.parse(fileStringResult.content || "{}") : null;
      if (parsed?.id === "databaseProgressionEntry") {
        PlayerProgressionUtils.setPlayerProgression(parsed);
        const progressionType =
          AppConfigClient.getConfig()?.userSettings?.progressionType ??
          (await AppConfigClient.waitForConfig())?.userSettings?.progressionType;
        if (
          progressionType &&
          (progressionType === progressionTypes.pvp || progressionType === progressionTypes.pve)
        ) {
          NavigationUtils.handleProgressionTypeClick(progressionType);
        } else {
          NavigationUtils.handleProgressionTypeClick(progressionTypes.pvp);
        }
        onClose();
      } else {
        setIsFileValid(false);
      }
    } catch (error) {
      console.warn("[ProgressionFileModal] Import failed:", error);
      setIsFileValid(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="progression-file-row">
        <span className="progression-file-label">
          {isI18nReady ? I18nHelper.get("pages.file.import.file") : "File"}
        </span>
        <input
          className={`progression-file-input${
            selectedFile && !isFileValid ? " is-invalid" : ""
          }`}
          value={selectedFile}
          readOnly
        />
        <button
          type="button"
          className="progression-file-button"
          onClick={handleSelectFile}
        >
          {isI18nReady ? I18nHelper.get("pages.file.import.select") : "Select"}
        </button>
      </div>
      <div className="progression-file-warning">
        <p>
          {isI18nReady
            ? I18nHelper.get("pages.file.import.warning.1")
            : "By importing a new progression, you will erase all of your current progression."}
        </p>
        <p>
          {isI18nReady
            ? I18nHelper.get("pages.file.import.warning.2")
            : "Make sure to save the current progression if needed before importing a new one."}
        </p>
      </div>
      <div className="progression-file-actions">
        <button
          type="button"
          className="progression-file-button primary"
          onClick={handleImport}
          disabled={!isFileValid || isSubmitting}
        >
          {isI18nReady ? I18nHelper.get("pages.file.import.load") : "Load Progression"}
        </button>
      </div>
    </>
  );
};

export const ProgressionFileModal: React.FC<ProgressionFileModalProps> = ({
  isOpen,
  target,
  onClose,
}) => {
  const isI18nReady = useI18nReady(isOpen);
  const isSaveMode = target?.mode === "save";

  if (!isOpen || !target) {
    return null;
  }

  return (
    <div className="progression-file-overlay">
      <button
        type="button"
        className="progression-file-backdrop"
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            onClose();
          }
        }}
        aria-label="Close modal"
      />
      <dialog className="progression-file-card" open>
        <header className="progression-file-header">
          <h3 className="progression-file-title">
            {resolveTitle(isSaveMode, isI18nReady)}
          </h3>
          <button
            type="button"
            className="progression-file-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="progression-file-body">
          {isSaveMode ? (
            <SaveProgressionContent
              isOpen={isOpen}
              isI18nReady={isI18nReady}
              onClose={onClose}
            />
          ) : (
            <ImportProgressionContent
              isOpen={isOpen}
              isI18nReady={isI18nReady}
              onClose={onClose}
            />
          )}
        </div>
      </dialog>
    </div>
  );
};
