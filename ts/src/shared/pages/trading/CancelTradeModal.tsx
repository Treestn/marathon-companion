import React from 'react';

interface CancelTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const CancelTradeModal: React.FC<CancelTradeModalProps> = ({
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
      <div className="trading-modal-content trading-cancel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trading-modal-header">
          <h3 className="trading-modal-title">Cancel Accepted Trade</h3>
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
            Are you sure you want to cancel this accepted trade?
          </p>
          
          <div className="trading-modal-warning">
            <p><strong>This action will:</strong></p>
            <ul>
              <li>Cancel the accepted status for both you and the other party</li>
              <li>Revert the trade back to "Open" status</li>
              <li>Make the trade available for other players to accept again</li>
            </ul>
            <p style={{ marginTop: '12px', color: '#ff6b6b' }}>
              The other party will be notified that the trade acceptance has been cancelled.
            </p>
          </div>

          <div className="trading-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="trading-btn-secondary"
              disabled={loading}
            >
              Keep Accepted
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="trading-btn-danger"
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'Cancel Trade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

