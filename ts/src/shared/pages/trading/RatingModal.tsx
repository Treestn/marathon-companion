import React, { useState, useEffect } from 'react';
import { TradingService } from '../../services/trading/TradingService';
import { TradingProfileResponse } from './types/ProfileApiTypes';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  tradeId
}) => {
  const [counterparty, setCounterparty] = useState<TradingProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // Load counterparty information when modal opens
  useEffect(() => {
    if (isOpen && tradeId && tradeId.trim() !== '') {
      console.log('RatingModal: Loading counterparty for tradeId:', tradeId);
      loadCounterparty();
    } else {
      // Reset state when modal closes
      setCounterparty(null);
      setRating(null);
      setHoverRating(null);
      setRatingError(null);
      setError(null);
    }
  }, [isOpen, tradeId]);

  const loadCounterparty = async () => {
    if (!tradeId || tradeId.trim() === '') {
      console.error('RatingModal: Cannot load counterparty - tradeId is empty');
      setError('Invalid trade ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('RatingModal: Fetching counterparty for tradeId:', tradeId);
      const response = await TradingService.fetchTradeCounterparty(tradeId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('RatingModal: Failed to load counterparty:', response.status, errorText);
        throw new Error('Failed to load counterparty information');
      }
      
      const data: TradingProfileResponse = await response.json();
      console.log('RatingModal: Counterparty loaded:', data);
      setCounterparty(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user information';
      setError(errorMessage);
      console.warn('Error loading counterparty:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === null) {
      setRatingError('Please select a rating');
      return;
    }

    setSubmittingRating(true);
    setRatingError(null);

    try {
      const response = await TradingService.rateTrade(tradeId, rating);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to submit rating. Please try again.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        setRatingError(errorMessage);
        return;
      }

      // Rating submitted successfully - close modal
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit rating. Please try again.';
      setRatingError(errorMessage);
      console.error('Error submitting rating:', err);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSkipRating = () => {
    onClose();
  };

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('RatingModal: Modal is open, tradeId:', tradeId);
    } else {
      console.log('RatingModal: Modal is closed');
    }
  }, [isOpen, tradeId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="trading-modal-overlay" onClick={handleSkipRating}>
      <div className="trading-modal-content trading-complete-modal scroll-div" onClick={(e) => e.stopPropagation()}>
        <div className="trading-modal-header">
          <h3 className="trading-modal-title">Rate Trading Experience</h3>
          <button 
            className="trading-modal-close" 
            onClick={handleSkipRating}
            aria-label="Close"
            disabled={submittingRating}
          >
            ×
          </button>
        </div>
        
        <div className="trading-modal-body">
          {loading && (
            <div className="trading-profile-loading">
              <div className="trading-loading-spinner" />
              <p>Loading user information...</p>
            </div>
          )}

          {error && (
            <div className="trading-modal-error">
              {error}
            </div>
          )}

          {!loading && !error && counterparty && (
            <>
              {/* User Information */}
              <div className="trading-profile-info" style={{ marginBottom: '20px' }}>
                <div className="trading-profile-field">
                  <label className="trading-profile-label">Trading with</label>
                  <div className="trading-profile-value">{counterparty.username}</div>
                </div>
                {counterparty.rating !== undefined && counterparty.rating !== null && (
                  <div className="trading-profile-field">
                    <label className="trading-profile-label">Their Rating</label>
                    <div className="trading-profile-value" style={{ color: '#6bc4b8' }}>
                      {counterparty.rating.toFixed(2)}
                      {counterparty.ratingCount !== undefined && counterparty.ratingCount !== null && (
                        <span style={{ fontSize: '14px', color: '#b8b8b8', marginLeft: '8px', fontWeight: 'normal' }}>
                          ({counterparty.ratingCount} {counterparty.ratingCount === 1 ? 'rating' : 'ratings'})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <p className="trading-modal-description">
                How would you rate your trading experience with this user?
              </p>

              <div className="trading-rating-container">
                <div className="trading-rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => {
                    // Determine if star should be highlighted (hover takes precedence, then selected rating)
                    const isHighlighted = hoverRating !== null 
                      ? star <= hoverRating 
                      : rating !== null && star <= rating;
                    
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`trading-rating-star ${isHighlighted ? 'selected' : ''}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        disabled={submittingRating}
                        aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                {(hoverRating !== null || rating !== null) && (
                  <div className="trading-rating-label">
                    {(hoverRating !== null ? hoverRating : rating) === 1 && 'Poor'}
                    {(hoverRating !== null ? hoverRating : rating) === 2 && 'Fair'}
                    {(hoverRating !== null ? hoverRating : rating) === 3 && 'Good'}
                    {(hoverRating !== null ? hoverRating : rating) === 4 && 'Very Good'}
                    {(hoverRating !== null ? hoverRating : rating) === 5 && 'Excellent'}
                  </div>
                )}
                {(hoverRating === null && rating === null) && (
                  <div className="trading-rating-label">
                    {' '}
                  </div>
                )}
                {ratingError && (
                  <div className="trading-modal-error" style={{ marginTop: '12px' }}>
                    {ratingError}
                  </div>
                )}
              </div>

              <div className="trading-modal-actions">
                <button
                  type="button"
                  onClick={handleSkipRating}
                  className="trading-btn-secondary"
                  disabled={submittingRating}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleRatingSubmit}
                  className="trading-btn-primary"
                  disabled={submittingRating || rating === null}
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

