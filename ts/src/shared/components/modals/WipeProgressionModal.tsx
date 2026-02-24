import React, { useEffect, useMemo, useState } from "react";
import { I18nHelper } from "../../../locale/I18nHelper";
import { WipeProgressionTarget } from "../../services/WipeProgressionModalEvents";
import "./wipe-progression-modal.css";

type WipeProgressionModalProps = {
  isOpen: boolean;
  target: WipeProgressionTarget | null;
  onClose: () => void;
};

export const WipeProgressionModal: React.FC<WipeProgressionModalProps> = ({
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
      ? I18nHelper.get("pages.questReset.title")
      : "Reset Progression";
  }, [isI18nReady]);

  const warningPrimary = useMemo(() => {
    return isI18nReady
      ? I18nHelper.get("pages.questReset.warning.1")
      : "You are about to reset all the quests.";
  }, [isI18nReady]);

  const warningSecondary = useMemo(() => {
    return isI18nReady
      ? I18nHelper.get("pages.questReset.warning.2")
      : "This option exists when a wipe happens and you need all your progress to be wiped.";
  }, [isI18nReady]);

  if (!isOpen || !target) {
    return null;
  }

  const handleConfirm = () => {
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    bridge?.updateProgression?.({
      type: "quest-wipe",
      progressionType: target.progressionType,
    });
    onClose();
  };

  return (
    <div className="wipe-progression-overlay" role="presentation" onClick={onClose}>
      <div
        className="wipe-progression-card"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="wipe-progression-header">
          <h3 className="wipe-progression-title">{title}</h3>
          <button
            type="button"
            className="wipe-progression-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="wipe-progression-body">
          <p className="wipe-progression-text">{warningPrimary}</p>
          <p className="wipe-progression-text">{warningSecondary}</p>
          <div className="wipe-progression-actions">
            <button
              type="button"
              className="wipe-progression-button wipe-progression-cancel"
              onClick={onClose}
            >
              {isI18nReady ? I18nHelper.get("pages.questReset.no") : "Cancel"}
            </button>
            <button
              type="button"
              className="wipe-progression-button wipe-progression-confirm"
              onClick={handleConfirm}
            >
              {isI18nReady ? I18nHelper.get("pages.questReset.yes") : "Reset"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
