import React from 'react';

interface CounterpartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  ingameName: string;
}

export const CounterpartyModal: React.FC<CounterpartyModalProps> = ({
  isOpen,
  onClose,
  username,
  ingameName
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ingameName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="trading-modal-overlay" onClick={onClose}>
      <div className="trading-modal-content trading-counterparty-modal scroll-div" onClick={(e) => e.stopPropagation()}>
        <div className="trading-modal-header">
          <h3 className="trading-modal-title">Trade Accepted!</h3>
          <button 
            className="trading-modal-close" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="trading-modal-body">
          <div className="trading-counterparty-success-message">
            <div className="trading-counterparty-success-icon">✓</div>
            <p>You have successfully accepted this trade!</p>
            <p className="trading-counterparty-info-text">
              Contact the other player using the information below:
            </p>
          </div>

          <div className="trading-profile-info">
            <div className="trading-profile-field">
              <label className="trading-profile-label">Username</label>
              <div className="trading-profile-value">{username}</div>
            </div>

            <div className="trading-profile-field">
              <label className="trading-profile-label">Embark ID</label>
              <div className="trading-profile-ingame-wrapper">
                <div className="trading-profile-value trading-profile-ingame">
                  {ingameName}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`trading-btn-copy ${copied ? 'copied' : ''}`}
                  title="Copy Embark ID"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="trading-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="trading-btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

