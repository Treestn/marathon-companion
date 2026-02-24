import React, { useEffect, useMemo, useState } from "react";
import { I18nHelper } from "../../../locale/I18nHelper";
import { AutoCompleteModalTarget } from "../../services/AutoCompleteModalEvents";
import "./auto-complete-modal.css";

type AutoCompleteModalProps = {
  isOpen: boolean;
  target: AutoCompleteModalTarget | null;
  onClose: () => void;
};

export const AutoCompleteModal: React.FC<AutoCompleteModalProps> = ({
  isOpen,
  target,
  onClose,
}) => {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    I18nHelper.init()
      .then(() => setIsI18nReady(true))
      .catch(() => setIsI18nReady(false));
  }, [isOpen]);

  const title = useMemo(() => {
    return isI18nReady
      ? I18nHelper.get("pages.questCompletedAutomation.title")
      : "Auto Complete Quests";
  }, [isI18nReady]);

  const warningOne = useMemo(() => {
    return isI18nReady
      ? I18nHelper.get("pages.questCompletedAutomation.warning.1")
      : "This option is to easily complete the quests you have already done.";
  }, [isI18nReady]);

  const warningTwo = useMemo(() => {
    return isI18nReady
      ? I18nHelper.get("pages.questCompletedAutomation.warning.2")
      : "Especially useful if you just got the app mid wipe.";
  }, [isI18nReady]);

  const warningThree = useMemo(() => {
    return isI18nReady
      ? I18nHelper.get("pages.questCompletedAutomation.warning.3")
      : "Proceed only if you understand this will auto-complete eligible quests.";
  }, [isI18nReady]);

  if (!isOpen || !target) {
    return null;
  }

  const handleConfirm = () => {
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    bridge?.updateProgression?.({
      type: "quest-auto-complete",
      progressionType: target.progressionType,
    });
    onClose();
  };

  return (
    <div className="auto-complete-overlay">
      <button
        type="button"
        className="auto-complete-backdrop"
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            onClose();
          }
        }}
        aria-label="Close modal"
      />
      <dialog className="auto-complete-card" open>
        <header className="auto-complete-header">
          <h3 className="auto-complete-title">{title}</h3>
          <button
            type="button"
            className="auto-complete-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="auto-complete-body">
          <p className="auto-complete-text">{warningOne}</p>
          <p className="auto-complete-text">{warningTwo}</p>
          <p className="auto-complete-text">{warningThree}</p>
          <div className="auto-complete-actions">
            <button
              type="button"
              className="auto-complete-button auto-complete-cancel"
              onClick={onClose}
            >
              {isI18nReady ? I18nHelper.get("pages.questCompletedAutomation.no") : "Cancel"}
            </button>
            <button
              type="button"
              className="auto-complete-button auto-complete-confirm"
              onClick={handleConfirm}
            >
              {isI18nReady ? I18nHelper.get("pages.questCompletedAutomation.yes") : "Confirm"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};
