import React, { useCallback, useEffect, useState } from 'react';
import { TradingService } from '../../services/trading/TradingService';
import { TradeResponse } from './types/TradeApiTypes';
import { TradingProfileResponse } from './types/ProfileApiTypes';
import { mapTradeResponses } from './utils/tradeMapper';
import { getImagePath } from './utils/imagePath';
import { CreateTradeModal } from './CreateTradeModal';
import { TradeItemDisplay } from './TradeItemDisplay';
import { Toast } from './Toast';
import { CounterpartyModal } from './CounterpartyModal';
import { AcceptTradeModal } from './AcceptTradeModal';
import { useTradingContext } from '../../context/TradingContext';

export interface TradeItem {
  id: string;
  name: string;
  quantity: number;
  imageUrl?: string;
}

export interface Trade {
  id: string;
  userId: string;
  username: string;
  rating?: number; // Trading rating/score
  ratingCount?: number; // Number of ratings
  itemsOffering: TradeItem[];
  itemsRequesting: TradeItem[];
  createdAt: string;
  status: 'active' | 'accepted' | 'completed' | 'cancelled';
  acceptedByProfileId?: string | null;
}

// Fetch trades from the backend API
const fetchPublishedTrades = async (): Promise<Trade[]> => {
  try {
    const response = await TradingService.fetchTrades();
    
    if (!response.ok) {
      throw new Error(`Failed to fetch trades: ${response.status} ${response.statusText} | reason: ${await response.text()}`);
    }
    
    // New v2 API returns array of { trade: TradeResponse, counterparty: TradingProfileResponse }
    const data = await response.json();
    
    // Validate response structure
    if (!Array.isArray(data)) {
      console.error('Invalid response format - expected array, got:', typeof data, data);
      return [];
    }
    
    // Map backend responses to frontend Trade objects
    // This filters out non-TRADE types and maps the data structure
    return mapTradeResponses(data);
  } catch (error) {
    throw error;
  }
};

interface TradeCardProps {
  trade: Trade;
  activeTradesCount?: number | null;
  tradeLimit?: number | null;
  onAcceptTrade?: (tradeId: string) => void;
  isAccepting?: boolean;
  onAcceptTradeClick?: (tradeId: string) => void;
}

const TradeCard: React.FC<TradeCardProps> = ({ trade, activeTradesCount, tradeLimit, onAcceptTrade, isAccepting = false, onAcceptTradeClick }) => {
  const isAtLimit = activeTradesCount !== null && tradeLimit !== null && activeTradesCount >= tradeLimit;
  const isDisabled = activeTradesCount === null || tradeLimit === null || isAtLimit || isAccepting;
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
        <div className="trade-card-username">{trade.username}</div>
        {trade.rating !== undefined && trade.rating !== null && (
          <div className="trade-card-trading-score">
            Rating: {trade.rating.toFixed(2)}{trade.ratingCount !== undefined && trade.ratingCount !== null && ` (${trade.ratingCount} ${trade.ratingCount === 1 ? 'rating' : 'ratings'})`}
          </div>
        )}
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

      {/* Action Button */}
      <div className="trade-card-actions">
        <div className="trade-card-time-ago">
          {formatTimeAgo(trade.createdAt)}
        </div>
        <button 
          className="trading-btn-primary"
          disabled={isDisabled}
          onClick={() => {
            if (onAcceptTradeClick) {
              onAcceptTradeClick(trade.id);
            } else if (onAcceptTrade) {
              onAcceptTrade(trade.id);
            }
          }}
          title={isAtLimit ? `You have reached the limit of ${tradeLimit} active trades` : ''}
        >
          {isAccepting ? 'Accepting...' : 'Accept Trade'}
        </button>
      </div>
    </div>
  );
};

type SearchFilter = 'offering' | 'requesting' | 'both';

interface PublishedTradesProps {
  hasProfile?: boolean;
  activeTradesCount?: number | null;
  tradeLimit?: number | null;
  isSubscribed?: boolean;
  onTradeCountChanged?: () => void;
}

export const PublishedTrades: React.FC<PublishedTradesProps> = ({ 
  hasProfile = false,
  activeTradesCount = null,
  tradeLimit = null,
  isSubscribed = false,
  onTradeCountChanged
}) => {
  const [allTrades, setAllTrades] = useState<Trade[]>([]); // Store all trades for filtering
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]); // Filtered trades based on search
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('both');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showCreateTradeModal, setShowCreateTradeModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [acceptingTradeId, setAcceptingTradeId] = useState<string | null>(null);
  const [showCounterpartyModal, setShowCounterpartyModal] = useState(false);
  const [counterpartyInfo, setCounterpartyInfo] = useState<{ username: string; ingameName: string } | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [pendingTradeId, setPendingTradeId] = useState<string | null>(null);
  const { bearerToken, isLoading: isTradingLoading, tradingProfileExists } = useTradingContext();

  const getTokenErrorMessage = useCallback(() => {
    if (tradingProfileExists === false) {
      return 'Create a trading profile to view trades.';
    }
    return 'Trading token not available yet.';
  }, [tradingProfileExists]);

  const loadTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!bearerToken) {
        setError(getTokenErrorMessage());
        return;
      }
      const data = await fetchPublishedTrades();
      setAllTrades(data);
    } catch (err) {
      setError('Failed to load trades. Please try again later.');
      console.warn('Error loading trades:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTradeClick = (tradeId: string) => {
    setPendingTradeId(tradeId);
    setShowAcceptModal(true);
  };

  const handleAcceptTrade = async () => {
    if (!pendingTradeId) return;
    
    const tradeId = pendingTradeId;
    setShowAcceptModal(false);
    setAcceptingTradeId(tradeId);
    try {
      const response = await TradingService.acceptTrade(tradeId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to accept trade. Please try again.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        setToast({ message: errorMessage, type: 'error' });
        return;
      }

      // Parse successful response
      const responseData = await response.json();
      
      // Response contains: { trade: TradeResponse, counterparty: TradingProfileResponse }
      if (responseData.counterparty) {
        setCounterpartyInfo({
          username: responseData.counterparty.username || 'Unknown',
          ingameName: responseData.counterparty.ingameName || 'Not set'
        });
        setShowCounterpartyModal(true);
      }
      
      // Refresh trades list
      await loadTrades();
      
      // Dispatch event to notify side panel to resume polling
      window.dispatchEvent(new CustomEvent('trade:accepted'));
      
      // Refresh trade count
      if (onTradeCountChanged) {
        onTradeCountChanged();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept trade. Please try again.';
      setToast({ message: errorMessage, type: 'error' });
      console.error('Error accepting trade:', err);
    } finally {
      setAcceptingTradeId(null);
      setPendingTradeId(null);
    }
  };

  useEffect(() => {
    if (isTradingLoading) {
      return;
    }
    if (!bearerToken) {
      setLoading(false);
      setError(getTokenErrorMessage());
      return;
    }
    loadTrades();
  }, [bearerToken, getTokenErrorMessage, isTradingLoading]);

  // Filter trades based on search term and filter type
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTrades(allTrades);
      setCurrentPage(1); // Reset to first page when search is cleared
      return;
    }

    const filtered = allTrades.filter(trade => {
      const searchLower = searchTerm.toLowerCase();
      
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

    setFilteredTrades(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, searchFilter, allTrades]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrades = filteredTrades.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of trades list
      const tradingWrapper = document.querySelector('.trading-page-wrapper');
      if (tradingWrapper) {
        tradingWrapper.scrollTop = 0;
      }
    }
  };

  return (
    <div className="trading-page-wrapper scroll-div">
      <div className="trading-header">
        <div className="trading-header-gradient" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 className="trading-title" style={{ margin: 0 }}>
            Published Trades
          </h2>
          <button
            className="trading-btn-primary"
            onClick={() => setShowCreateTradeModal(true)}
            disabled={
              loading || 
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <p className="trading-subtitle" style={{ margin: 0 }}>
            Browse all active trades from other players
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
              disabled={loading}
            />
            {searchTerm && !loading && (
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
              <div className="trading-filter-radio-wrapper" onClick={() => !loading && setSearchFilter('both')}>
                {searchFilter === 'both' && (
                  <div className="trading-filter-radio-dot" />
                )}
              </div>
              <input
                type="radio"
                name="searchFilter"
                value="both"
                checked={searchFilter === 'both'}
                onChange={() => !loading && setSearchFilter('both')}
                className="trading-filter-radio-input"
                disabled={loading}
              />
              <span className="trading-filter-text">Both</span>
            </label>
            <label className={`trading-filter-option offering ${searchFilter === 'offering' ? 'active' : ''}`}>
              <div className="trading-filter-radio-wrapper" onClick={() => !loading && setSearchFilter('offering')}>
                {searchFilter === 'offering' && (
                  <div className="trading-filter-radio-dot" />
                )}
              </div>
              <input
                type="radio"
                name="searchFilter"
                value="offering"
                checked={searchFilter === 'offering'}
                onChange={() => !loading && setSearchFilter('offering')}
                className="trading-filter-radio-input"
                disabled={loading}
              />
              <span className="trading-filter-text">Items Offering</span>
            </label>
            <label className={`trading-filter-option requesting ${searchFilter === 'requesting' ? 'active' : ''}`}>
              <div className="trading-filter-radio-wrapper" onClick={() => !loading && setSearchFilter('requesting')}>
                {searchFilter === 'requesting' && (
                  <div className="trading-filter-radio-dot" />
                )}
              </div>
              <input
                type="radio"
                name="searchFilter"
                value="requesting"
                checked={searchFilter === 'requesting'}
                onChange={() => !loading && setSearchFilter('requesting')}
                className="trading-filter-radio-input"
                disabled={loading}
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
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="trading-error-container">
          <div className="trading-error-message">
            {error}
          </div>
          <button className="trading-btn-primary" onClick={loadTrades}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="trading-trades-loading">
          <div className="trading-loading-spinner" />
          <p className="trading-loading-text">Loading trades...</p>
        </div>
      )}

      {/* Trades Content */}
      {!loading && !error && (
        <>
          {filteredTrades.length === 0 ? (
            <div className="trading-empty-state">
              {searchTerm ? (
                <>
                  <div>No trades found matching "{searchTerm}"</div>
                  <div style={{ fontSize: '14px' }}>
                    Try adjusting your search or filter options
                  </div>
                </>
              ) : (
                <div>No trades available at the moment</div>
              )}
            </div>
          ) : (
            <div>
              {searchTerm && (
                <div className="trading-search-results">
                  Found {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''} matching "{searchTerm}"
                </div>
              )}
              {!searchTerm && (
                <div className="trading-search-results">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredTrades.length)} of {filteredTrades.length} trades
                </div>
              )}
              {currentTrades.map(trade => (
                <TradeCard 
                  key={trade.id} 
                  trade={trade}
                  activeTradesCount={activeTradesCount}
                  tradeLimit={tradeLimit}
                  onAcceptTrade={handleAcceptTrade}
                  onAcceptTradeClick={handleAcceptTradeClick}
                  isAccepting={acceptingTradeId === trade.id}
                />
              ))}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="trading-pagination">
                  <button
                    className="trading-btn-secondary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </button>
                  
                  <div className="trading-pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  {/* Page Numbers */}
                  <div className="trading-pagination-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`trading-btn-secondary trading-pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    className="trading-btn-secondary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
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
          loadTrades(); // Refresh the trades list
          if (onTradeCountChanged) {
            onTradeCountChanged(); // Refresh the count
          }
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Accept Trade Modal */}
      <AcceptTradeModal
        isOpen={showAcceptModal}
        onClose={() => {
          setShowAcceptModal(false);
          setPendingTradeId(null);
        }}
        onConfirm={handleAcceptTrade}
        loading={acceptingTradeId !== null}
      />

      {/* Counterparty Modal */}
      {counterpartyInfo && (
        <CounterpartyModal
          isOpen={showCounterpartyModal}
          onClose={() => {
            setShowCounterpartyModal(false);
            setCounterpartyInfo(null);
          }}
          username={counterpartyInfo.username}
          ingameName={counterpartyInfo.ingameName}
        />
      )}
    </div>
  );
};

