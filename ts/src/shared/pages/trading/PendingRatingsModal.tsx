import React, { useState, useEffect } from 'react';
import { TradingService } from '../../services/trading/TradingService';
import { TradeProfileResponse } from './types/TradeApiTypes';
import { RatingModal } from './RatingModal';

interface PendingRatingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmitted?: () => void;
}

export const PendingRatingsModal: React.FC<PendingRatingsModalProps> = ({
  isOpen,
  onClose,
  onRatingSubmitted
}) => {
  const [pendingRatings, setPendingRatings] = useState<TradeProfileResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPendingRatings();
    } else {
      // Reset state when modal closes
      setPendingRatings([]);
      setError(null);
      setSelectedTradeId(null);
      setShowRatingModal(false);
    }
  }, [isOpen]);

  const loadPendingRatings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await TradingService.fetchPendingRatings();
      if (!response.ok) {
        throw new Error('Failed to load pending ratings');
      }
      const data: TradeProfileResponse[] = await response.json();
      setPendingRatings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pending ratings';
      setError(errorMessage);
      console.warn('Error loading pending ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRateTrade = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    setShowRatingModal(true);
  };

  const handleRatingModalClose = async () => {
    setShowRatingModal(false);
    setSelectedTradeId(null);
    // Reload pending ratings to update the list
    await loadPendingRatings();
    // Check if there are any remaining pending ratings after reload
    // We'll check this in a useEffect that watches pendingRatings
  };

  // Close modal if no pending ratings remain
  useEffect(() => {
    if (!loading && !error && pendingRatings.length === 0 && isOpen && !showRatingModal) {
      onRatingSubmitted?.();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRatings.length, loading, error, isOpen, showRatingModal]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="trading-modal-overlay" onClick={onClose}>
        <div className="trading-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div className="trading-modal-header">
            <h3 className="trading-modal-title">Pending Trade Ratings</h3>
            <button
              className="trading-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="trading-modal-body">
            {loading && (
              <div className="trading-profile-loading">
                <div className="trading-loading-spinner" />
                <p>Loading pending ratings...</p>
              </div>
            )}

            {error && (
              <div className="trading-modal-error">
                {error}
              </div>
            )}

            {!loading && !error && pendingRatings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ color: '#b8b8b8', fontSize: '16px' }}>No pending ratings</p>
                <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>
                  All your completed trades have been rated.
                </p>
              </div>
            )}

            {!loading && !error && pendingRatings.length > 0 && (
              <>
                <p className="trading-modal-description" style={{ marginBottom: '20px' }}>
                  You have {pendingRatings.length} {pendingRatings.length === 1 ? 'trade' : 'trades'} that need to be rated.
                </p>
                <div className="trading-pending-ratings-list">
                  {pendingRatings.map((item) => (
                    <div key={item.trade.id} className="trading-pending-rating-item">
                      <div className="trading-pending-rating-info">
                        <div className="trading-pending-rating-header">
                          <span className="trading-pending-rating-username">
                            {item.counterparty.username}
                          </span>
                          {item.counterparty.rating !== undefined && item.counterparty.rating !== null && (
                            <span className="trading-pending-rating-score">
                              Rating: {item.counterparty.rating.toFixed(2)}
                              {item.counterparty.ratingCount !== undefined && item.counterparty.ratingCount !== null && (
                                <span style={{ fontSize: '12px', color: '#888', marginLeft: '4px' }}>
                                  ({item.counterparty.ratingCount})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="trading-pending-rating-date">
                          Completed: {formatDate(item.trade.updatedAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRateTrade(item.trade.id)}
                        className="trading-btn-primary"
                        style={{ minWidth: '120px' }}
                      >
                        Rate Trade
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showRatingModal && selectedTradeId && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={handleRatingModalClose}
          tradeId={selectedTradeId}
        />
      )}
    </>
  );
};

