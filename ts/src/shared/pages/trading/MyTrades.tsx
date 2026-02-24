import React, { useEffect, useState } from 'react';
import { Trade } from './PublishedTrades';
import { TradingService } from '../../services/trading/TradingService';
import { TradeResponse } from './types/TradeApiTypes';
import { mapTradeResponses } from './utils/tradeMapper';
import { TradeProfileResponse } from './types/TradeApiTypes';
import { mapTradeResponse } from './utils/tradeMapper';
import { getImagePath } from './utils/imagePath';
import { CreateTradeModal } from './CreateTradeModal';
import { TradeItemDisplay } from './TradeItemDisplay';
import { DeleteTradeModal } from './DeleteTradeModal';
import { UserProfileModal } from './UserProfileModal';
import { CompleteTradeModal } from './CompleteTradeModal';
import { RatingModal } from './RatingModal';
import { CancelTradeModal } from './CancelTradeModal';
import { Toast } from './Toast';
import { useTradingContext } from '../../context/TradingContext';

// Fetch active trades from the backend API
const fetchMyActiveTrades = async (): Promise<Trade[]> => {
  try {
    const response = await TradingService.fetchMyActiveTrades();
    
    if (!response.ok) {
      throw new Error(`Failed to fetch active trades: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!Array.isArray(data)) {
      console.error('Invalid response format - expected array, got:', typeof data, data);
      return [];
    }
    
    return mapTradeResponses(data);
  } catch (error) {
    console.warn('Error fetching active trades:', error);
    throw error;
  }
};

// Fetch trade history from the backend API
const fetchMyTradeHistory = async (): Promise<Trade[]> => {
  try {
    const response = await TradingService.fetchMyTradeHistory();
    
    if (!response.ok) {
      throw new Error(`Failed to fetch trade history: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!Array.isArray(data)) {
      console.error('Invalid response format - expected array, got:', typeof data, data);
      return [];
    }
    
    return mapTradeResponses(data);
  } catch (error) {
    console.warn('Error fetching trade history:', error);
    throw error;
  }
};

type SearchFilter = 'offering' | 'requesting' | 'both';
type TradeView = 'active' | 'ratings' | 'history';

interface MyTradesProps {
  hasProfile?: boolean;
  activeTradesCount?: number | null;
  tradeLimit?: number | null;
  isSubscribed?: boolean;
  onTradeCountChanged?: () => void;
}

interface MyTradeCardProps {
  trade: Trade;
  onTradeDeleted: () => void;
  onTradeCountChanged?: () => void;
  onTradeCompleted?: () => void;
  onRatingRequested?: (tradeId: string) => void;
}

interface RatingTradeCardProps {
  trade: Trade;
  onRateClick: (tradeId: string) => void;
}

const MyTradeCard: React.FC<MyTradeCardProps> = ({ trade, onTradeDeleted, onTradeCountChanged, onTradeCompleted, onRatingRequested }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'var(--main-blue-color)', bgColor: 'rgba(107, 196, 184, 0.2)' };
      case 'accepted':
        return { label: 'Accepted', color: '#4caf50', bgColor: 'rgba(76, 175, 80, 0.2)' };
      case 'completed':
        return { label: 'Completed', color: '#4caf50', bgColor: 'rgba(76, 175, 80, 0.2)' };
      case 'cancelled':
        return { label: 'Cancelled', color: '#8d8d8d', bgColor: 'rgba(141, 141, 141, 0.2)' };
      default:
        return { label: 'Unknown', color: '#8d8d8d', bgColor: 'rgba(141, 141, 141, 0.2)' };
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await TradingService.deleteTrade(trade.id);
      if (!response.ok) {
        throw new Error('Failed to delete trade');
      }
      setShowDeleteModal(false);
      onTradeDeleted();
      
      // Dispatch event to notify side panel to check for active trades
      window.dispatchEvent(new CustomEvent('trade:completed'));
      // Refresh the count after deletion
      if (onTradeCountChanged) {
        onTradeCountChanged();
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Failed to delete trade. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleComplete = async (): Promise<TradeResponse> => {
    setCompleting(true);
    try {
      const response = await TradingService.completeTrade(trade.id);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to complete trade. Please try again.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        setToast({ message: errorMessage, type: 'error' });
        setShowCompleteModal(false);
        throw new Error(errorMessage);
      }

      // Parse the response to get the completed trade
      const completedTrade: TradeResponse = await response.json();
      
      console.log('Trade completed successfully:', completedTrade);
      console.log('Trade ID for rating:', completedTrade.id);
      
      // Close the complete modal first
      setShowCompleteModal(false);
      
      // Notify parent to open rating modal with the tradeId from the response
      if (onRatingRequested) {
        onRatingRequested(completedTrade.id);
      }
      
      // Refresh the trade list and count (delay to avoid interfering with modal)
      setTimeout(() => {
        if (onTradeCompleted) {
          onTradeCompleted();
        }
        if (onTradeCountChanged) {
          onTradeCountChanged();
        }
        
        // Dispatch event to notify side panel to check for active trades
        window.dispatchEvent(new CustomEvent('trade:completed'));
      }, 100);
      
      return completedTrade;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete trade. Please try again.';
      setToast({ message: errorMessage, type: 'error' });
      console.error('Error completing trade:', err);
      throw err;
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await TradingService.cancelTrade(trade.id);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to cancel trade. Please try again.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        setToast({ message: errorMessage, type: 'error' });
        setShowCancelModal(false);
        return;
      }

      // Success
      setToast({ message: 'Trade cancelled successfully. The trade has been reverted to open status.', type: 'success' });
      setShowCancelModal(false);
      
      // Refresh the trade list and count
      if (onTradeCompleted) {
        onTradeCompleted();
      }
      if (onTradeCountChanged) {
        onTradeCountChanged();
      }
      
      // Dispatch event to notify side panel to check for active trades
      window.dispatchEvent(new CustomEvent('trade:completed'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel trade. Please try again.';
      setToast({ message: errorMessage, type: 'error' });
      console.error('Error cancelling trade:', err);
    } finally {
      setCancelling(false);
    }
  };

  const statusInfo = getStatusInfo(trade.status);

  return (
    <>
      <div className="trade-card">
        {/* Decorative gradient overlay */}
        <div className="trade-card-gradient" />

        {/* Status Badge */}
        <div 
          className="trade-card-status-badge"
          style={{
            color: statusInfo.color,
            backgroundColor: statusInfo.bgColor,
            borderColor: statusInfo.color
          }}
        >
          {statusInfo.label}
        </div>

        {/* Trade Items */}
      <div className="trade-card-items">
        {/* Items Offering */}
        <div className="trade-card-items-section">
          <div className="trade-card-section-label offering">
            Offering
          </div>
          {trade.itemsOffering.map((item, index) => (
            <TradeItemDisplay
              key={index}
              itemId={item.id}
              quantity={item.quantity}
              type="offering"
            />
          ))}
        </div>

        {/* Arrow */}
        <div className="trade-card-arrow">
          →
        </div>

        {/* Items Requesting */}
        <div className="trade-card-items-section">
          <div className="trade-card-section-label requesting">
            Requesting
          </div>
          {trade.itemsRequesting.map((item, index) => (
            <TradeItemDisplay
              key={index}
              itemId={item.id}
              quantity={item.quantity}
              type="requesting"
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="trading-my-trades-actions">
        <div className="trade-card-time-ago">
          {formatTimeAgo(trade.createdAt)}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {trade.status === 'active' && (
            <button 
              className="trading-btn-danger" 
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </button>
          )}
          {trade.status === 'accepted' && (
            <>
              <button 
                className="trading-btn-primary" 
                onClick={() => setShowProfileModal(true)}
              >
                View Profile
              </button>
              <button 
                className="trading-btn-secondary" 
                onClick={() => setShowCancelModal(true)}
              >
                Cancel
              </button>
              <button 
                className="trading-btn-primary" 
                onClick={() => setShowCompleteModal(true)}
              >
                Mark as Completed
              </button>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Delete Confirmation Modal */}
    <DeleteTradeModal
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      onConfirm={handleDelete}
      loading={deleting}
    />

    {/* User Profile Modal */}
    {trade.status === 'accepted' && (
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        tradeId={trade.id}
      />
    )}

    {/* Cancel Trade Modal */}
    {trade.status === 'accepted' && (
      <CancelTradeModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        loading={cancelling}
      />
    )}

    {/* Complete Trade Modal */}
    <CompleteTradeModal
      isOpen={showCompleteModal}
      onClose={() => setShowCompleteModal(false)}
      onConfirm={handleComplete}
      loading={completing}
    />

    {/* Toast Notification */}
    {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    )}
    </>
  );
};

const RatingTradeCard: React.FC<RatingTradeCardProps> = ({ trade, onRateClick }) => {
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="trade-card">
      {/* Decorative gradient overlay */}
      <div className="trade-card-gradient" />

      {/* User Info Header */}
      <div className="trade-card-user-info">
        <div className="trade-card-username">{trade.username || 'Unknown'}</div>
        {trade.rating !== undefined && trade.rating !== null && (
          <div className="trade-card-trading-score">
            Rating: {trade.rating.toFixed(2)}{trade.ratingCount !== undefined && trade.ratingCount !== null && ` (${trade.ratingCount} ${trade.ratingCount === 1 ? 'rating' : 'ratings'})`}
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div 
        className="trade-card-status-badge"
        style={{
          color: '#6bc4b8',
          backgroundColor: 'rgba(107, 196, 184, 0.1)',
          borderColor: '#6bc4b8'
        }}
      >
        Completed
      </div>

        {/* Trade Items */}
        <div className="trade-card-items">
          {/* Items Offering */}
          <div className="trade-card-items-section">
            <div className="trade-card-section-label offering">
              Offering
            </div>
            {trade.itemsOffering.map((item, index) => (
              <TradeItemDisplay
                key={index}
                itemId={item.id}
                quantity={item.quantity}
                type="offering"
              />
            ))}
          </div>

          {/* Arrow */}
          <div className="trade-card-arrow">
            →
          </div>

          {/* Items Requesting */}
          <div className="trade-card-items-section">
            <div className="trade-card-section-label requesting">
              Requesting
            </div>
            {trade.itemsRequesting.map((item, index) => (
              <TradeItemDisplay
                key={index}
                itemId={item.id}
                quantity={item.quantity}
                type="requesting"
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="trading-my-trades-actions">
          <div className="trade-card-time-ago">
            {formatTimeAgo(trade.createdAt)}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="trading-btn-primary" 
              onClick={() => onRateClick(trade.id)}
            >
              RATE
            </button>
          </div>
        </div>
      </div>
  );
};

export const MyTrades: React.FC<MyTradesProps> = ({ 
  hasProfile = false,
  activeTradesCount = null,
  tradeLimit = null,
  isSubscribed = false,
  onTradeCountChanged
}) => {
  const { bearerToken, isLoading: isTradingLoading } = useTradingContext();
  const hasToken = Boolean(bearerToken);
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [allActiveTrades, setAllActiveTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [allTradeHistory, setAllTradeHistory] = useState<Trade[]>([]);
  const [pendingRatingsTrades, setPendingRatingsTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('both');
  const [currentView, setCurrentView] = useState<TradeView>('active');
  const [activeTradesLoaded, setActiveTradesLoaded] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showCreateTradeModal, setShowCreateTradeModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [completedTradeId, setCompletedTradeId] = useState<string | null>(null);

  // Handler to open rating modal after trade completion
  const handleRatingRequested = (tradeId: string) => {
    console.log('Opening rating modal for tradeId:', tradeId);
    setCompletedTradeId(tradeId);
    setShowRatingModal(true);
  };

  // Sort trades: accepted trades first, then by creation date (newest first)
  const sortTrades = (trades: Trade[]): Trade[] => {
    return [...trades].sort((a, b) => {
      // Accepted trades come first
      if (a.status === 'accepted' && b.status !== 'accepted') {
        return -1;
      }
      if (a.status !== 'accepted' && b.status === 'accepted') {
        return 1;
      }
      // For same status, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const loadActiveTrades = async () => {
    try {
      setLoadingActive(true);
      setError(null);
      if (!hasToken) {
        setError('Trading token not available.');
        return;
      }
      
      const activeData = await fetchMyActiveTrades();
      const sortedData = sortTrades(activeData);
      
      setAllActiveTrades(sortedData);
      setActiveTrades(sortedData);
      setActiveTradesLoaded(true);
    } catch (err) {
      setError('Failed to load active trades. Please try again later.');
      console.warn('Error loading active trades:', err);
    } finally {
      setLoadingActive(false);
    }
  };

  const loadTradeHistory = async () => {
    try {
      setLoadingHistory(true);
      setError(null);
      if (!hasToken) {
        setError('Trading token not available.');
        return;
      }
      
      const historyData = await fetchMyTradeHistory();
      
      setAllTradeHistory(historyData);
      setTradeHistory(historyData);
      setHistoryLoaded(true);
    } catch (err) {
      setError('Failed to load trade history. Please try again later.');
      console.warn('Error loading trade history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!hasToken) {
        setError('Trading token not available.');
        return;
      }
      
      // Fetch both active trades and history in parallel
      const [activeData, historyData] = await Promise.all([
        fetchMyActiveTrades(),
        fetchMyTradeHistory()
      ]);
      
      const sortedActiveData = sortTrades(activeData);
      setAllActiveTrades(sortedActiveData);
      setActiveTrades(sortedActiveData);
      setAllTradeHistory(historyData);
      setTradeHistory(historyData);
      setActiveTradesLoaded(true);
      setHistoryLoaded(true);
    } catch (err) {
      setError('Failed to load your trades. Please try again later.');
      console.warn('Error loading trades:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRatings = async () => {
    try {
      setLoadingRatings(true);
      setError(null);
      if (!hasToken) {
        setError('Trading token not available.');
        return;
      }
      
      const response = await TradingService.fetchPendingRatings();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pending ratings: ${response.status}`);
      }
      
      const data: TradeProfileResponse[] = await response.json();
      
      // Map TradeProfileResponse to Trade objects
      const mappedTrades = data
        .map((item) => {
          if (!item || !item.trade || !item.counterparty) {
            return null;
          }
          return mapTradeResponse(item.trade, item.counterparty);
        })
        .filter((trade): trade is Trade => trade !== null);
      
      setPendingRatingsTrades(mappedTrades);
    } catch (err) {
      setError('Failed to load pending ratings. Please try again later.');
      console.warn('Error loading pending ratings:', err);
      setPendingRatingsTrades([]);
    } finally {
      setLoadingRatings(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const initialize = async () => {
      if (isTradingLoading || !hasToken) {
        return;
      }
      await loadTrades();
      // Load pending ratings count when page loads
      await loadPendingRatings();
    };
    initialize();
  }, [hasToken, isTradingLoading]);

  // Fetch data when switching views if not already loaded
  useEffect(() => {
    if (currentView === 'active' && !activeTradesLoaded && !loadingActive && !loading) {
      loadActiveTrades();
    } else if (currentView === 'ratings' && !loadingRatings && !loading) {
      loadPendingRatings();
    } else if (currentView === 'history' && !historyLoaded && !loadingHistory && !loading) {
      loadTradeHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  // Apply filters when search term or filter changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setActiveTrades(allActiveTrades);
      setTradeHistory(allTradeHistory);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    const filterTrades = (trades: Trade[]): Trade[] => {
      return trades.filter(trade => {
        if (searchFilter === 'offering' || searchFilter === 'both') {
          const matchesOffering = trade.itemsOffering.some(item =>
            item.name.toLowerCase().includes(searchLower)
          );
          if (matchesOffering) return true;
        }
        
        if (searchFilter === 'requesting' || searchFilter === 'both') {
          const matchesRequesting = trade.itemsRequesting.some(item =>
            item.name.toLowerCase().includes(searchLower)
          );
          if (matchesRequesting) return true;
        }
        
        return false;
      });
    };

    // Sort filtered results to maintain accepted trades at top
    const filteredActive = filterTrades(allActiveTrades);
    setActiveTrades(sortTrades(filteredActive));
    setTradeHistory(filterTrades(allTradeHistory));
  }, [searchTerm, searchFilter, allActiveTrades, allTradeHistory]);

  return (
    <div className="trading-page-wrapper scroll-div">
      <div className="trading-header">
        <div className="trading-header-gradient" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 className="trading-title" style={{ margin: 0 }}>
            My Published Trades
          </h2>
          <button
            className="trading-btn-primary"
            onClick={() => setShowCreateTradeModal(true)}
            disabled={
              loading || 
              loadingActive || 
              loadingHistory || 
              !hasProfile || 
              activeTradesCount === null || 
              tradeLimit === null ||
              (activeTradesCount >= tradeLimit)
            }
            title={
              !hasProfile 
                ? 'Create a trading profile to create trades' 
                : activeTradesCount === null || tradeLimit === null
                  ? 'Loading trade limit...'
                  : activeTradesCount >= tradeLimit
                    ? `You have reached the limit of ${tradeLimit} active trades`
                    : ''
            }
          >
            Create Trade
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={{
            fontSize: '15px',
            color: '#b8b8b8',
            margin: 0
          }}>
            Manage your active trades and view your trading history
          </p>
          {activeTradesCount !== null && tradeLimit !== null && (
            <div className={`trading-page-trade-count ${activeTradesCount >= tradeLimit ? 'at-limit' : ''}`}>
              <span className="trading-page-trade-count-label">Active Trades:</span>
              <span className="trading-page-trade-count-value">
                {activeTradesCount} / {tradeLimit}
              </span>
            </div>
          )}
        </div>

        {/* View Toggle Buttons */}
        <div className="trading-view-toggle">
          <button
            className={`trading-view-toggle-button ${currentView === 'active' ? 'active' : ''}`}
            onClick={() => {
              if (currentView !== 'active') {
                setCurrentView('active');
                // Always refresh active trades when switching to this view
                loadActiveTrades();
              }
            }}
            disabled={loadingActive || loading}
          >
            Active Trades
            {allActiveTrades.length > 0 && (
              <span className="trading-view-toggle-count">({allActiveTrades.length})</span>
            )}
          </button>
          <button
            className={`trading-view-toggle-button ${currentView === 'ratings' ? 'active' : ''}`}
            onClick={() => {
              if (currentView !== 'ratings') {
                setCurrentView('ratings');
                // Always refresh pending ratings when switching to this view
                loadPendingRatings();
              }
            }}
            disabled={loadingRatings || loading}
          >
            Trade Rating
            <span className="trading-view-toggle-count">({pendingRatingsTrades.length})</span>
          </button>
          <button
            className={`trading-view-toggle-button ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => {
              if (currentView !== 'history') {
                setCurrentView('history');
                // Always refresh trade history when switching to this view
                loadTradeHistory();
              }
            }}
            disabled={loadingHistory || loading}
          >
            Trade History
            {allTradeHistory.length > 0 && (
              <span className="trading-view-toggle-count">({allTradeHistory.length})</span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="trading-search-container">
          {/* Search Input */}
          <div className="trading-search-input-wrapper">
            <input
              type="text"
              placeholder="Search by item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="trading-search-input"
              disabled={loading || loadingActive || loadingHistory || loadingRatings}
            />
            {searchTerm && !loading && !loadingActive && !loadingHistory && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="trading-search-clear"
                aria-label="Clear search"
                tabIndex={0}
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Options */}
          <div className="trading-filter-container">
            <span className="trading-filter-label">
              Search in:
            </span>
            <label className={`trading-filter-option both ${searchFilter === 'both' ? 'active' : ''}`}>
              <div className="trading-filter-radio-wrapper" onClick={() => !loading && !loadingActive && !loadingHistory && setSearchFilter('both')}>
                {searchFilter === 'both' && (
                  <div className="trading-filter-radio-dot" />
                )}
              </div>
              <input
                type="radio"
                name="searchFilter"
                value="both"
                checked={searchFilter === 'both'}
                onChange={() => !loading && !loadingActive && !loadingHistory && setSearchFilter('both')}
                className="trading-filter-radio-input"
                disabled={loading || loadingActive || loadingHistory || loadingRatings}
              />
              <span className="trading-filter-text">Both</span>
            </label>
            <label className={`trading-filter-option offering ${searchFilter === 'offering' ? 'active' : ''}`}>
              <div className="trading-filter-radio-wrapper" onClick={() => !loading && !loadingActive && !loadingHistory && setSearchFilter('offering')}>
                {searchFilter === 'offering' && (
                  <div className="trading-filter-radio-dot" />
                )}
              </div>
              <input
                type="radio"
                name="searchFilter"
                value="offering"
                checked={searchFilter === 'offering'}
                onChange={() => !loading && !loadingActive && !loadingHistory && setSearchFilter('offering')}
                className="trading-filter-radio-input"
                disabled={loading || loadingActive || loadingHistory || loadingRatings}
              />
              <span className="trading-filter-text">Items Offering</span>
            </label>
            <label className={`trading-filter-option requesting ${searchFilter === 'requesting' ? 'active' : ''}`}>
              <div className="trading-filter-radio-wrapper" onClick={() => !loading && !loadingActive && !loadingHistory && setSearchFilter('requesting')}>
                {searchFilter === 'requesting' && (
                  <div className="trading-filter-radio-dot" />
                )}
              </div>
              <input
                type="radio"
                name="searchFilter"
                value="requesting"
                checked={searchFilter === 'requesting'}
                onChange={() => !loading && !loadingActive && !loadingHistory && setSearchFilter('requesting')}
                className="trading-filter-radio-input"
                disabled={loading || loadingActive || loadingHistory || loadingRatings}
              />
              <span className="trading-filter-text">Items Requesting</span>
            </label>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchFilter('both');
                }}
                className="trading-btn-secondary trading-filter-clear"
                disabled={loading || loadingActive || loadingHistory || loadingRatings}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && !loadingActive && !loadingHistory && !loadingRatings && (
        <div className="trading-error-container">
          <div className="trading-error-message">
            {error}
          </div>
          <button className="trading-btn-primary" onClick={loadTrades}>
            Retry
          </button>
        </div>
      )}

      {/* Initial Loading State */}
      {loading && (
        <div className="trading-trades-loading">
          <div className="trading-loading-spinner" />
          <p className="trading-loading-text">Loading your trades...</p>
        </div>
      )}

      {/* Active Trades Section */}
      {!loading && currentView === 'active' && (
        <div>
          {loadingActive ? (
            <div className="trading-trades-loading">
              <div className="trading-loading-spinner" />
              <p className="trading-loading-text">Loading active trades...</p>
            </div>
          ) : (
            <>
              <div className="trading-section-header">
                <h3 className="trading-section-title">
                  Active Trades
                </h3>
                {searchTerm && activeTrades.length > 0 && (
                  <span className="trading-section-result-count">
                    {activeTrades.length} result{activeTrades.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {activeTrades.length === 0 ? (
                <div className="trading-empty-state">
                  {searchTerm ? (
                    'No active trades found matching your search'
                  ) : (
                    'You have no active trades'
                  )}
                </div>
              ) : (
                <div>
                  {activeTrades.map(trade => (
                    <MyTradeCard 
                      key={trade.id} 
                      trade={trade} 
                      onTradeDeleted={loadActiveTrades}
                      onTradeCountChanged={onTradeCountChanged}
                      onTradeCompleted={loadActiveTrades}
                      onRatingRequested={handleRatingRequested}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Trade Ratings Section */}
      {!loading && currentView === 'ratings' && (
        <div>
          {loadingRatings ? (
            <div className="trading-trades-loading">
              <div className="trading-loading-spinner" />
              <p className="trading-loading-text">Loading pending ratings...</p>
            </div>
          ) : (
            <>
              <div className="trading-section-header">
                <h3 className="trading-section-title">
                  Pending Trade Ratings
                </h3>
                {pendingRatingsTrades.length > 0 && (
                  <span className="trading-section-result-count">
                    {pendingRatingsTrades.length} trade{pendingRatingsTrades.length !== 1 ? 's' : ''} to rate
                  </span>
                )}
              </div>

              {pendingRatingsTrades.length === 0 ? (
                <div className="trading-empty-state">
                  No pending ratings. All your completed trades have been rated.
                </div>
              ) : (
                <div>
                  {pendingRatingsTrades.map(trade => (
                    <RatingTradeCard 
                      key={trade.id} 
                      trade={trade}
                      onRateClick={(tradeId) => {
                        setCompletedTradeId(tradeId);
                        setShowRatingModal(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Trade History Section */}
      {!loading && currentView === 'history' && (
        <div>
          {loadingHistory ? (
            <div className="trading-trades-loading">
              <div className="trading-loading-spinner" />
              <p className="trading-loading-text">Loading trade history...</p>
            </div>
          ) : (
            <>
              <div className="trading-section-header">
                <h3 className="trading-section-title">
                  Trade History
                </h3>
                {searchTerm && tradeHistory.length > 0 && (
                  <span className="trading-section-result-count">
                    {tradeHistory.length} result{tradeHistory.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {tradeHistory.length === 0 ? (
                <div className="trading-empty-state">
                  {searchTerm ? (
                    'No trade history found matching your search'
                  ) : (
                    'You have no trade history'
                  )}
                </div>
              ) : (
                <div>
                  {tradeHistory.map(trade => (
                    <MyTradeCard 
                      key={trade.id} 
                      trade={trade} 
                      onTradeDeleted={loadTradeHistory}
                      onTradeCountChanged={onTradeCountChanged}
                      onTradeCompleted={loadTradeHistory}
                      onRatingRequested={handleRatingRequested}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Create Trade Modal */}
      <CreateTradeModal
        isOpen={showCreateTradeModal}
        onClose={() => setShowCreateTradeModal(false)}
        activeTradesCount={activeTradesCount}
        tradeLimit={tradeLimit}
        isSubscribed={isSubscribed}
        onTradeCreated={() => {
          setShowCreateTradeModal(false);
          // Refresh the appropriate view
          if (currentView === 'active') {
            loadActiveTrades();
          } else {
            loadTradeHistory();
          }
          // Refresh the count after creating trade
          if (onTradeCountChanged) {
            onTradeCountChanged();
          }
        }}
      />

      {/* Rating Modal */}
      {completedTradeId && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setCompletedTradeId(null);
            // Reload pending ratings if we're on the ratings view
            if (currentView === 'ratings') {
              loadPendingRatings();
            }
          }}
          tradeId={completedTradeId}
        />
      )}
    </div>
  );
};
