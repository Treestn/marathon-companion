import React from 'react';

interface CompleteTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<any>; // Can return TradeResponse or void
  loading?: boolean;
}

export const CompleteTradeModal: React.FC<CompleteTradeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false
}) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      await onConfirm();
      // Parent will handle closing this modal and opening the rating modal
    } catch (error) {
      // Error handling is done in parent component
      console.error('Error completing trade:', error);
    }
  };

  return (
    <div className="trading-modal-overlay" onClick={onClose}>
      <div className="trading-modal-content trading-complete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trading-modal-header">
          <h3 className="trading-modal-title">Mark Trade as Completed</h3>
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
            Please confirm that both parties have completed the trade and exchanged all items. This action will mark the trade as completed.
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
              onClick={handleConfirm}
              className="trading-btn-primary"
              disabled={loading}
            >
              {loading ? 'Completing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

