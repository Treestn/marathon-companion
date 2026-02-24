import React from 'react';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="expedition-reset-modal-overlay" onClick={onCancel}>
      <div className="expedition-reset-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="expedition-reset-modal-title">Reset Expedition Progression</h3>
        <p className="expedition-reset-modal-text">
          Are you sure you want to reset all expedition progression? This will:
        </p>
        <ul className="expedition-reset-modal-list">
          <li>Reset all phases to their initial state</li>
          <li>Set all item counts to 0</li>
          <li>Set all coin values to 0</li>
          <li>Activate Phase 1 and block all other phases</li>
        </ul>
        <p className="expedition-reset-modal-warning">
          This action cannot be undone.
        </p>
        <div className="expedition-reset-modal-buttons">
          <button
            className="expedition-reset-modal-button expedition-reset-modal-button-confirm"
            onClick={onConfirm}
          >
            Reset
          </button>
          <button
            className="expedition-reset-modal-button expedition-reset-modal-button-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

