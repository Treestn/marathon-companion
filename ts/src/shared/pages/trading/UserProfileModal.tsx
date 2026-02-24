import React, { useState, useEffect } from 'react';
import { TradingService } from '../../services/trading/TradingService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId?: string;
  tradeId?: string;
}

interface UserProfile {
  username: string;
  ingameName: string;
  rating?: number;
  ratingCount?: number;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profileId,
  tradeId
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && (profileId || tradeId)) {
      loadProfile();
    } else {
      setProfile(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, profileId, tradeId]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      let response: Response;
      
      // If tradeId is provided, use the counterparty endpoint
      if (tradeId) {
        response = await TradingService.fetchTradeCounterparty(tradeId);
      } else if (profileId) {
        // Otherwise, use the profile ID endpoint (backward compatibility)
        response = await TradingService.fetchUserProfileById(profileId);
      } else {
        throw new Error('Either profileId or tradeId must be provided');
      }
      
      if (!response.ok) {
        throw new Error('Failed to load user profile');
      }
      const data = await response.json();
      setProfile({
        username: data.username || 'Unknown',
        ingameName: data.ingameName || 'Not set',
        rating: data.rating,
        ratingCount: data.ratingCount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
      console.warn('Error loading user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!profile?.ingameName) return;
    
    try {
      await navigator.clipboard.writeText(profile.ingameName);
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
      <div className="trading-modal-content trading-profile-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trading-modal-header">
          <h3 className="trading-modal-title">User Profile</h3>
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
              <p>Loading profile...</p>
            </div>
          )}

          {error && (
            <div className="trading-modal-error">
              {error}
            </div>
          )}

          {!loading && !error && profile && (
            <div className="trading-profile-info">
              <div className="trading-profile-field">
                <label className="trading-profile-label">Username</label>
                <div className="trading-profile-value">{profile.username}</div>
              </div>

              {profile.rating !== undefined && profile.rating !== null && (
                <div className="trading-profile-field">
                  <label className="trading-profile-label">Trading Rating</label>
                  <div className="trading-profile-value" style={{ color: '#6bc4b8' }}>
                    {profile.rating.toFixed(2)}
                    {profile.ratingCount !== undefined && profile.ratingCount !== null && (
                      <span style={{ fontSize: '14px', color: '#b8b8b8', marginLeft: '8px', fontWeight: 'normal' }}>
                        ({profile.ratingCount} {profile.ratingCount === 1 ? 'rating' : 'ratings'})
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="trading-profile-field">
                <label className="trading-profile-label">Embark ID</label>
                <div className="trading-profile-ingame-wrapper">
                  <div className="trading-profile-value trading-profile-ingame">
                    {profile.ingameName}
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
          )}

          <div className="trading-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="trading-btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

