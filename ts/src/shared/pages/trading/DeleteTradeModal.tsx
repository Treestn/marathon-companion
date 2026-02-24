import React from 'react';

interface DeleteTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteTradeModal: React.FC<DeleteTradeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="trading-modal-overlay" onClick={onClose}>
      <div className="trading-modal-content trading-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trading-modal-header">
          <h3 className="trading-modal-title">Delete Trade</h3>
          <button 
            className="trading-modal-close" 
            onClick={onClose}
            aria-label="Close"
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <div className="trading-modal-body">
          <p className="trading-modal-description">
            Are you sure you want to delete this trade? This action cannot be undone.
          </p>

          <div className="trading-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="trading-btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="trading-btn-danger"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

