import React from 'react';

interface DeleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteProfileModal: React.FC<DeleteProfileModalProps> = ({
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
          <h3 className="trading-modal-title">Delete Trading Profile</h3>
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
            Are you sure you want to delete your trading profile? This action cannot be undone.
          </p>
          <p className="trading-modal-warning">
            <strong>Warning:</strong> All stored information about your profile will be removed, including:
          </p>
          <ul className="trading-modal-warning-list">
            <li>Your profile information (username, Embark ID)</li>
            <li>All currently opened trades</li>
            <li>All accepted trades</li>
          </ul>

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
              {loading ? 'Deleting...' : 'Delete Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

