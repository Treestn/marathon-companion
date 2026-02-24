import React, { useState } from 'react';
import { TradingService } from '../../services/trading/TradingService';

interface ProfileCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated: () => void;
}

export const ProfileCreationModal: React.FC<ProfileCreationModalProps> = ({
  isOpen,
  onClose,
  onProfileCreated
}) => {
  const [username, setUsername] = useState('');
  const [ingameName, setIngameName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: username must be at least 5 characters
    if (!username.trim() || username.trim().length < 5) {
      setError('Username must be at least 5 characters long');
      return;
    }

    // Validation: ingame name must not be empty and must match format username#1234
    const trimmedIngameName = ingameName.trim();
    if (!trimmedIngameName) {
      setError('Embark ID is required');
      return;
    }
    
    // Validate format: username#1234 (username followed by # and numbers)
    const embarkIdPattern = /^[a-zA-Z0-9_]+#[0-9]+$/;
    if (!embarkIdPattern.test(trimmedIngameName)) {
      setError('Embark ID must be in the format: username#1234 (e.g., myname#1234)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await TradingService.createProfile(username.trim(), ingameName.trim());
      
      // Check if response is 2xx (success)
      if (response.status >= 200 && response.status < 300) {
        // Profile created successfully
        onProfileCreated();
        handleClose();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create profile: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile. Please try again.');
      console.error('Error creating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setIngameName('');
    setError(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="trading-modal-overlay" onClick={handleClose}>
      <div className="trading-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="trading-modal-header">
          <h3 className="trading-modal-title">Create Trading Profile</h3>
          <button 
            className="trading-modal-close" 
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="trading-modal-body">
          <p className="trading-modal-description">
            To access My Trades and Trading Profile, you need to create a profile. Please provide your trading username (the name other traders see) and your Embark ID (found in your in-game profile, format: username#1234) so other users can find you for trades.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="trading-modal-form-group">
              <label htmlFor="username" className="trading-modal-label">
                Username *
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="profile-modal-input"
                placeholder="Enter your username (min 5 characters)"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="trading-modal-form-group">
              <label htmlFor="ingameName" className="trading-modal-label">
                Embark ID *
              </label>
              <input
                id="ingameName"
                type="text"
                value={ingameName}
                onChange={(e) => setIngameName(e.target.value)}
                className="profile-modal-input"
                placeholder="username#1234"
                disabled={loading}
              />
              <div style={{ fontSize: '12px', color: '#878787', marginTop: '4px' }}>
                Your Embark ID can be found in your in-game profile (format: username#1234)
              </div>
            </div>

            {error && (
              <div className="trading-modal-error">
                {error}
              </div>
            )}

            <div className="trading-modal-actions">
              <button
                type="button"
                onClick={handleClose}
                className="trading-btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="trading-btn-primary"
                disabled={loading || !username.trim() || username.trim().length < 5 || !ingameName.trim() || !/^[a-zA-Z0-9_]+#[0-9]+$/.test(ingameName.trim())}
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

