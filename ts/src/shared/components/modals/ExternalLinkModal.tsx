import React, { useEffect, useMemo, useState } from "react";
import { AppConfigClient } from "../../services/AppConfigClient";
import { ExternalLinkTarget } from "../../services/ExternalLinkModalEvents";
import "./external-link-modal.css";

type ExternalLinkModalProps = {
  isOpen: boolean;
  target: ExternalLinkTarget | null;
  onClose: () => void;
};

export const ExternalLinkModal: React.FC<ExternalLinkModalProps> = ({
  isOpen,
  target,
  onClose,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDontShowAgain(false);
    }
  }, [isOpen]);

  const label = useMemo(() => target?.label ?? "External Link", [target]);

  if (!isOpen || !target) {
    return null;
  }

  const handleConfirm = () => {
    AppConfigClient.updateConfig({
      userSettings: { externalLinkWarning: dontShowAgain ? "false" : "true" },
    });
    window.open(target.url, "_blank");
    onClose();
  };

  return (
    <div className="external-link-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="external-link-modal-card"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="external-link-modal-header">
          <h3 className="external-link-modal-title">{label}</h3>
          <button
            type="button"
            className="external-link-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="external-link-modal-body">
          <p className="external-link-modal-text">
            You are about to open an external link. Do you want to continue?
          </p>
          <label className="external-link-modal-checkbox">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
            />
            <span>Don't show this again</span>
          </label>
          <div className="external-link-modal-actions">
            <button
              type="button"
              className="external-link-modal-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="external-link-modal-button primary"
              onClick={handleConfirm}
            >
              Open Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
