import React from 'react';

interface AcceptTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const AcceptTradeModal: React.FC<AcceptTradeModalProps> = ({
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
      <div className="trading-modal-content trading-accept-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trading-modal-header">
          <h3 className="trading-modal-title">Accept Trade</h3>
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
            Are you sure you want to accept this trade? Once accepted, you will be able to complete the trade with the other party.
          </p>

          <div className="trading-modal-disclaimer">
            <p><strong>Disclaimer:</strong></p>
            <p>
              Marathon Companion is not responsible for other users not trading properly, anyone stealing items, or any issues that may arise from trading. 
              All trades are conducted at your own risk. Please trade responsibly and verify all items before completing a trade.
            </p>
          </div>

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
              className="trading-btn-primary"
              disabled={loading}
            >
              {loading ? 'Accepting...' : 'Accept Trade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

