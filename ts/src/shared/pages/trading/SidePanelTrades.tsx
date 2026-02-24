import React, { useState, useEffect } from 'react';
import { TradingService } from '../../services/trading/TradingService';
import { TradeResponse, TradeStatus } from './types/TradeApiTypes';
import { mapTradeResponses } from './utils/tradeMapper';
import { TradeItemDisplay } from './TradeItemDisplay';
import { pageLoader } from '../../pages/PageLoader';
import { useTradingContext } from '../../context/TradingContext';

export interface Trade {
  id: string;
  userId: string;
  username: string;
  itemsOffering: Array<{ id: string; name: string; quantity: number; imageUrl?: string }>;
  itemsRequesting: Array<{ id: string; name: string; quantity: number; imageUrl?: string }>;
  createdAt: string;
  status: 'active' | 'accepted' | 'completed' | 'cancelled';
  acceptedByProfileId?: string | null;
}

// Fetch active trades (OPEN and ACCEPTED status)
const fetchActiveTrades = async (): Promise<Trade[] | null> => {
  try {
    if (!TradingService.hasBearerToken()) {
      return null;
    }
    const response = await TradingService.fetchMyActiveTrades();
    
    if (!response.ok) {
      throw new Error(`Failed to fetch active trades: ${response.status} ${response.statusText}`);
    }
    
    const tradeResponses: TradeResponse[] = await response.json();
    
    // Filter to only OPEN and ACCEPTED trades
    const activeTrades = tradeResponses.filter(
      trade => trade.status === TradeStatus.OPEN || trade.status === TradeStatus.ACCEPTED
    );
    
    return mapTradeResponses(activeTrades);
  } catch (error) {
    console.warn('Error fetching active trades:', error);
    return [];
  }
};

interface TradeEntityProps {
  trade: Trade;
}

const TradeEntity: React.FC<TradeEntityProps> = ({ trade }) => {
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const statusClass = trade.status === 'accepted' ? 'accepted' : 'open';
  const statusText = trade.status === 'accepted' ? 'Accepted' : 'Open';

  return (
    <div className={`side-page-trade-entity ${statusClass}`} id={trade.id}>
      <div className="side-page-trade-status">
        <span className={`side-page-trade-status-badge ${statusClass}`}>{statusText}</span>
      </div>
      
      <div className="side-page-trade-content">
        <div className="side-page-trade-items-section">
          <div className="side-page-trade-items">
            {trade.itemsOffering.map((item, index) => (
              <TradeItemDisplay
                key={index}
                itemId={item.id}
                quantity={item.quantity}
                type="offering"
                showName={false}
              />
            ))}
          </div>
        </div>

        <div className="side-page-trade-arrow">→</div>

        <div className="side-page-trade-items-section">
          <div className="side-page-trade-items">
            {trade.itemsRequesting.map((item, index) => (
              <TradeItemDisplay
                key={index}
                itemId={item.id}
                quantity={item.quantity}
                type="requesting"
                showName={false}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="side-page-trade-footer">
        <span className="side-page-trade-time">{formatTimeAgo(trade.createdAt)}</span>
      </div>
    </div>
  );
};

type SidePanelTradesProps = {
  showHeader?: boolean;
  onNavigateToTrading?: () => void;
};

const sortTrades = (list: Trade[]): Trade[] =>
  [...list].sort((a, b) => {
    if (a.status === 'accepted' && b.status !== 'accepted') return -1;
    if (a.status !== 'accepted' && b.status === 'accepted') return 1;
    return 0;
  });

export const SidePanelTrades: React.FC<SidePanelTradesProps> = ({
  showHeader = true,
  onNavigateToTrading,
}) => {
  const {
    bearerToken,
    isLoading: isStatusLoading,
    isLoggedIn,
    tradingProfileExists,
  } = useTradingContext();
  const isOverwolfConnected = isLoggedIn;
  const hasProfile = tradingProfileExists === true;
  const isProfileKnown = tradingProfileExists !== null;
  const hasToken = Boolean(bearerToken);
  const isStatusReady = !isStatusLoading && (!hasProfile || hasToken);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = React.useRef<number | null>(null);
  const shouldPollRef = React.useRef<boolean>(true);

  // Function to start polling
  const startPolling = React.useCallback(() => {
    if (pollingIntervalRef.current) {
      return; // Already polling
    }
    
    const loadTrades = async () => {
      // Only poll if shouldPollRef is true
      if (!shouldPollRef.current) {
        return;
      }
      
      try {
        const activeTrades = await fetchActiveTrades();
        if (!activeTrades) {
          return;
        }
        // Sort trades: accepted first, then open
        const sortedTrades = sortTrades(activeTrades);
        setTrades(sortedTrades);
        setError(null);
        
        // If list is empty, stop polling
        if (sortedTrades.length === 0) {
          shouldPollRef.current = false;
          stopPolling();
        }
      } catch (err) {
        console.warn('Error loading trades:', err);
        setError('Failed to load trades');
      }
    };

    // Initial load
    loadTrades();
    
    // Refresh trades every 60 seconds
    pollingIntervalRef.current = window.setInterval(loadTrades, 60000);
  }, []);

  // Function to stop polling
  const stopPolling = React.useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Function to resume polling (called when trade is created or accepted)
  const resumePolling = React.useCallback(() => {
    shouldPollRef.current = true;
    if (!pollingIntervalRef.current) {
      startPolling();
    }
  }, [startPolling]);

  // Function to check trades after completion
  const checkTradesAfterCompletion = React.useCallback(async () => {
    try {
      const activeTrades = await fetchActiveTrades();
      if (!activeTrades) {
        return;
      }
      const sortedTrades = sortTrades(activeTrades);
      setTrades(sortedTrades);
      setError(null);
      
      // If list is empty, stop polling
      if (sortedTrades.length === 0) {
        shouldPollRef.current = false;
        stopPolling();
      }
    } catch (err) {
      console.error('Error checking trades after completion:', err);
    }
  }, [stopPolling]);

  useEffect(() => {
    if (!isStatusReady) {
      return;
    }

    if (!isOverwolfConnected) {
      stopPolling();
      setLoading(false);
      return; // Don't load trades if not connected
    }

    if (!isProfileKnown) {
      return; // Still checking profile
    }

    if (hasProfile && !hasToken) {
      setLoading(true);
      return;
    }

    if (!hasProfile) {
      setLoading(false);
      stopPolling();
      return; // Don't load trades if no profile
    }

    // Initial fetch once
    const initialLoad = async () => {
      try {
        setLoading(true);
        const activeTrades = await fetchActiveTrades();
        if (!activeTrades) {
          return;
        }
        const sortedTrades = sortTrades(activeTrades);
        setTrades(sortedTrades);
        setError(null);
        
        // If list is empty, don't start polling
        if (sortedTrades.length === 0) {
          shouldPollRef.current = false;
        } else {
          shouldPollRef.current = true;
          startPolling();
        }
      } catch (err) {
        console.warn('Error loading trades:', err);
        setError('Failed to load trades');
      } finally {
        setLoading(false);
      }
    };

    initialLoad();

    // Listen for trade events
    const handleTradeCreated = () => {
      resumePolling();
    };

    const handleTradeAccepted = () => {
      resumePolling();
    };

    const handleTradeCompleted = () => {
      checkTradesAfterCompletion();
    };

    // Add event listeners
    window.addEventListener('trade:created', handleTradeCreated);
    window.addEventListener('trade:accepted', handleTradeAccepted);
    window.addEventListener('trade:completed', handleTradeCompleted);

    return () => {
      stopPolling();
      window.removeEventListener('trade:created', handleTradeCreated);
      window.removeEventListener('trade:accepted', handleTradeAccepted);
      window.removeEventListener('trade:completed', handleTradeCompleted);
    };
  }, [
    isStatusReady,
    isOverwolfConnected,
    hasProfile,
    isProfileKnown,
    startPolling,
    stopPolling,
    resumePolling,
    checkTradesAfterCompletion,
  ]);

  // Show connection required message ONLY if explicitly not connected (false)
  // Don't show if still checking (null) or if connected (true)
  // Only show message when isOverwolfConnected is explicitly false
  const renderHeader = () => {
    if (!showHeader) {
      return null;
    }
    return (
      <div className="side-page-trades-header">
        <b className="side-page-trades-title">Active Trades</b>
        {trades.length > 0 && (
          <span className="side-page-trades-count">({trades.length})</span>
        )}
      </div>
    );
  };

  if (isStatusReady && !isOverwolfConnected && !loading) {
    return (
      <div className="side-page-trades-container">
        {renderHeader()}
        <div className="side-page-trades-content scroll-div">
          <div className="side-page-trades-connection-required">
            <div className="side-page-trades-connection-icon">⚠️</div>
            <div className="side-page-trades-connection-message">
              Please connect to Overwolf to use the trading feature
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show profile creation prompt if connected but no profile
  if (isStatusReady && isOverwolfConnected && isProfileKnown && !hasProfile && !loading) {
    const handleNavigateToTrading = async () => {
      if (onNavigateToTrading) {
        onNavigateToTrading();
        return;
      }
      try {
        await pageLoader.loadPage('trading');
      } catch (err) {
        console.error('Error navigating to trading page:', err);
      }
    };

    return (
      <div className="side-page-trades-container">
        {renderHeader()}
        <div className="side-page-trades-content scroll-div">
          <div className="side-page-trades-profile-required">
            <div className="side-page-trades-profile-message">
              Create a trading profile to view your active trades
            </div>
            <button
              className="trading-btn-primary side-page-trades-create-profile-btn"
              onClick={handleNavigateToTrading}
            >
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking connection, checking profile, or loading trades
  if (!isStatusReady || !isProfileKnown || loading) {
    return (
      <div className="side-page-trades-container">
        {renderHeader()}
        <div className="side-page-trades-content scroll-div">
          <div className="side-page-trades-loading">Loading trades...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="side-page-trades-container">
        {renderHeader()}
        <div className="side-page-trades-content scroll-div">
          <div className="side-page-trades-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="side-page-trades-container">
      {renderHeader()}
      <div className="side-page-trades-content scroll-div">
        {trades.length === 0 ? (
          <div className="side-page-trades-empty">No active trades</div>
        ) : (
          trades.map((trade) => (
            <TradeEntity key={trade.id} trade={trade} />
          ))
        )}
      </div>
    </div>
  );
};

