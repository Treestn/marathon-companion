import React, { useEffect, useMemo, useState } from 'react';
import { TradingService } from '../../services/trading/TradingService';
import { ProfileResponse } from './types/ProfileApiTypes';
import { Toast } from './Toast';
import { DeleteProfileModal } from './DeleteProfileModal';
import { useTradingContext } from '../../context/TradingContext';

type TradingProfileBridge = {
  refreshTradingProfile?: () => Promise<void>;
};

const resolveBridge = (): TradingProfileBridge | undefined => {
  try {
    const mainWindow = overwolf?.windows?.getMainWindow?.();
    return (mainWindow as any)?.backgroundBridge as TradingProfileBridge | undefined;
  } catch {
    return undefined;
  }
};

export const TradingProfile: React.FC = () => {
  const bridge = useMemo(resolveBridge, []);
  const { bearerToken, isLoading: isTradingLoading } = useTradingContext();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedIngameName, setEditedIngameName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await TradingService.fetchUserProfile();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
      }
      
      const profileData: ProfileResponse = await response.json();
      setProfile(profileData);
    } catch (err) {
      setError('Failed to load your profile. Please try again later.');
      console.warn('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTradingLoading) {
      return;
    }
    if (!bearerToken) {
      setLoading(false);
      setError('Trading token not available.');
      return;
    }
    loadProfile();
  }, [bearerToken, isTradingLoading]);

  useEffect(() => {
    if (profile && !isEditing) {
      setEditedUsername(profile.username);
      setEditedIngameName(profile.ingameName || '');
    }
  }, [profile, isEditing]);

  const handleEdit = () => {
    if (profile) {
      setEditedUsername(profile.username);
      setEditedIngameName(profile.ingameName || '');
      setIsEditing(true);
      setSaveError(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    if (profile) {
      setEditedUsername(profile.username);
      setEditedIngameName(profile.ingameName || '');
    }
  };

  const handleSave = async () => {
    // Validation: username must be at least 5 characters
    if (!editedUsername.trim() || editedUsername.trim().length < 5) {
      setSaveError('Username must be at least 5 characters long');
      return;
    }

    // Validation: ingame name must not be empty and must match format username#1234
    const trimmedIngameName = editedIngameName.trim();
    if (!trimmedIngameName) {
      setSaveError('Embark ID is required');
      return;
    }
    
    // Validate format: username#1234 (username followed by # and numbers)
    const embarkIdPattern = /^[a-zA-Z0-9_]+#[0-9]+$/;
    if (!embarkIdPattern.test(trimmedIngameName)) {
      setSaveError('Embark ID must be in the format: username#1234 (e.g., myname#1234)');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const response = await TradingService.createProfile(
        editedUsername.trim(),
        editedIngameName.trim()
      );

      // Check if response is 2xx (success)
      if (response.status >= 200 && response.status < 300) {
        setToast({ message: 'Profile updated successfully!', type: 'success' });
        setIsEditing(false);
        await bridge?.refreshTradingProfile?.();
        // Reload profile to get updated data
        await loadProfile();
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to update profile. Please try again.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        setSaveError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      setSaveError(errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  const handleDeleteProfile = async () => {
    setDeleting(true);
    try {
      const response = await TradingService.deleteProfile();
      
      if (response.status >= 200 && response.status < 300) {
        setToast({ message: 'Profile deleted successfully', type: 'success' });
        setShowDeleteModal(false);
        await bridge?.refreshTradingProfile?.();
        setProfile(null);
        setIsEditing(false);
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete profile. Please try again.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        setToast({ message: errorMessage, type: 'error' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile. Please try again.';
      setToast({ message: errorMessage, type: 'error' });
      console.error('Error deleting profile:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="trading-loading">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="trading-error">
        <div className="trading-error-message">
          {error}
        </div>
        <button className="trading-btn-primary" onClick={loadProfile}>
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="trading-empty-state">
        No profile data available
      </div>
    );
  }

  return (
    <div className="trading-page-wrapper scroll-div">
      <div className="trading-header">
        <div className="trading-header-gradient" />
        <div className="trading-header-content">
          <div>
            <h2 className="trading-title">
              Trading Profile
            </h2>
            <p className="trading-subtitle">
              Your trading profile information
            </p>
          </div>
          {!isEditing && (
            <div className="trading-profile-header-actions">
              <button
                className="trading-btn-primary trading-profile-edit-btn"
                onClick={handleEdit}
              >
                Edit Profile
              </button>
              <button
                className="trading-btn-danger trading-profile-delete-btn"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Profile
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="trading-profile-container">
        {/* Username */}
        <div className="trading-profile-card">
          <div className="trading-profile-card-gradient" />
          <div className="trading-profile-card-label">
            Username
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editedUsername}
              onChange={(e) => setEditedUsername(e.target.value)}
              className="trading-profile-edit-input"
              placeholder="Enter username (min 5 characters)"
              disabled={saving}
            />
          ) : (
            <div className="trading-profile-card-value">
              {profile.username}
            </div>
          )}
        </div>

        {/* Embark ID */}
        <div className="trading-profile-card">
          <div className="trading-profile-card-gradient" />
          <div className="trading-profile-card-label">
            Embark ID
          </div>
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedIngameName}
                onChange={(e) => setEditedIngameName(e.target.value)}
                className="trading-profile-edit-input"
                placeholder="username#1234"
                disabled={saving}
              />
              <div className="trading-profile-card-hint" style={{ fontSize: '12px', color: '#878787', marginTop: '4px' }}>
                Your Embark ID can be found in your in-game profile (format: username#1234)
              </div>
            </>
          ) : (
            <div className="trading-profile-card-value medium">
              {profile.ingameName || <span style={{ color: '#8d8d8d', fontStyle: 'italic' }}>Not set</span>}
            </div>
          )}
        </div>

        {/* Trading Rating */}
        {profile.rating !== undefined && profile.rating !== null && (
          <div className="trading-profile-card">
            <div className="trading-profile-card-gradient" />
            <div className="trading-profile-card-label">
              Trading Rating
            </div>
            <div className="trading-profile-card-value" style={{ color: '#6bc4b8' }}>
              {profile.rating.toFixed(2)}
              {profile.ratingCount !== undefined && profile.ratingCount !== null && (
                <span style={{ fontSize: '16px', color: '#b8b8b8', marginLeft: '8px', fontWeight: 'normal' }}>
                  ({profile.ratingCount} {profile.ratingCount === 1 ? 'rating' : 'ratings'})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Created At */}
        <div className="trading-profile-card">
          <div className="trading-profile-card-gradient" />
          <div className="trading-profile-card-label">
            Member Since
          </div>
          <div className="trading-profile-card-value small" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {formatDate(profile.createdAt)}
          </div>
        </div>

        {/* Edit Mode Actions */}
        {isEditing && (
          <div className="trading-profile-edit-actions">
            {saveError && (
              <div className="trading-profile-edit-error">
                {saveError}
              </div>
            )}
            <div className="trading-profile-edit-buttons">
              <button
                className="trading-btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="trading-btn-primary"
                onClick={handleSave}
                disabled={
                  saving ||
                  !editedUsername.trim() ||
                  editedUsername.trim().length < 5 ||
                  !editedIngameName.trim() ||
                  !/^[a-zA-Z0-9_]+#[0-9]+$/.test(editedIngameName.trim()) ||
                  (editedUsername.trim() === profile.username && editedIngameName.trim() === (profile.ingameName || ''))
                }
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Profile Modal */}
      <DeleteProfileModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProfile}
        loading={deleting}
      />
    </div>
  );
};
