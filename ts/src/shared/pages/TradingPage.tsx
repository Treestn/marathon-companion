import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PublishedTrades } from './trading/PublishedTrades';
import { MyTrades } from './trading/MyTrades';
import { TradingProfile } from './trading/TradingProfile';
import { ProfileCreationModal } from './trading/ProfileCreationModal';
import { TradingService } from '../services/trading/TradingService';
import { TradingProvider, useTradingContext } from '../context/TradingContext';
import './trading/trading.css';

type TradingSubPage = 'published' | 'my-trades' | 'profile';

type AuthState = 'checking' | 'not-logged-in' | 'logged-in' | 'profile-checked';

type TradingProfileBridge = {
  setTradingProfileExists?: (value: boolean) => void;
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

const TradingPageInner: React.FC = () => {
  const { isLoading: isStatusLoading, isSubscribed, isLoggedIn, tradingProfileExists } =
    useTradingContext();
  const bridge = useMemo(resolveBridge, []);
  const hasProfile = tradingProfileExists === true;
  const authState = useMemo<AuthState>(() => {
    if (isStatusLoading) {
      return 'checking';
    }
    if (!isLoggedIn) {
      return 'not-logged-in';
    }
    if (tradingProfileExists === null) {
      return 'logged-in';
    }
    return 'profile-checked';
  }, [isLoggedIn, isStatusLoading, tradingProfileExists]);
  const [activePage, setActivePage] = useState<TradingSubPage>('published');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(false);
  const [activeTradesCount, setActiveTradesCount] = useState<number | null>(null);
  const [tradeLimit, setTradeLimit] = useState<number | null>(null);

  const tabs = [
    { id: 'published' as TradingSubPage, label: 'Published Trades' },
    { id: 'my-trades' as TradingSubPage, label: 'My Trades' },
    { id: 'profile' as TradingSubPage, label: 'Trading Profile' }
  ];

  // Fetch and update active trades count
  const refreshActiveTradesCount = useCallback(async () => {
    try {
      const count = await TradingService.fetchMyActiveTradesCount();
      const limit = isSubscribed ? 20 : 2;
      
      setActiveTradesCount(count);
      setTradeLimit(limit);
    } catch (error) {
      console.warn('Error fetching active trades count:', error);
    }
  }, [isSubscribed]);

  useEffect(() => {
    if (!hasProfile) {
      setActiveTradesCount(null);
      setTradeLimit(null);
      if (activePage !== 'published') {
        setActivePage('published');
      }
      return;
    }
    refreshActiveTradesCount();
  }, [activePage, hasProfile, isSubscribed, refreshActiveTradesCount]);

  useEffect(() => {
    if (!isLoggedIn) {
      setActiveTradesCount(null);
      setTradeLimit(null);
      setShowSuccessBanner(false);
    }
  }, [isLoggedIn]);

  const handleProfileCreated = async () => {
    setShowProfileModal(false);
    await bridge?.refreshTradingProfile?.();
    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 5000);
  };

  const handleTabClick = (tabId: TradingSubPage) => {
    // If user doesn't have a profile, only allow published trades
    if (!hasProfile && tabId !== 'published') {
      // Show modal when trying to access disabled tabs
      setShowProfileModal(true);
      return;
    }
    setActivePage(tabId);
  };

  const renderActivePage = () => {
    // If no profile, only show published trades
    if (!hasProfile && activePage !== 'published') {
      return (
        <PublishedTrades 
          hasProfile={hasProfile}
          activeTradesCount={activeTradesCount}
          tradeLimit={tradeLimit}
          isSubscribed={isSubscribed}
          onTradeCountChanged={refreshActiveTradesCount}
        />
      );
    }

    switch (activePage) {
      case 'published':
        return (
          <PublishedTrades 
            hasProfile={hasProfile}
            activeTradesCount={activeTradesCount}
            tradeLimit={tradeLimit}
            isSubscribed={isSubscribed}
            onTradeCountChanged={refreshActiveTradesCount}
          />
        );
      case 'my-trades':
        return (
          <MyTrades 
            hasProfile={hasProfile}
            activeTradesCount={activeTradesCount}
            tradeLimit={tradeLimit}
            isSubscribed={isSubscribed}
            onTradeCountChanged={refreshActiveTradesCount}
          />
        );
      case 'profile':
        return <TradingProfile />;
      default:
        return (
          <PublishedTrades 
            hasProfile={hasProfile}
            activeTradesCount={activeTradesCount}
            tradeLimit={tradeLimit}
            isSubscribed={isSubscribed}
            onTradeCountChanged={refreshActiveTradesCount}
          />
        );
    }
  };

  // Show login message if not logged in
  if (authState === 'checking') {
    return (
      <div className="trading-page-container runner">
        <div className="trading-login-message">
          <div className="trading-login-message-content">
            <div className="trading-login-spinner" />
            <p>Checking login status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (authState === 'not-logged-in') {
    return (
      <div className="trading-page-container runner">
        <div className="trading-login-message">
          <div className="trading-login-message-content">
            <p className="trading-login-title">Please Login to Overwolf</p>
            <p className="trading-login-text">
              You need to be logged in to Overwolf to access the trading page.
            </p>
            <p className="trading-login-text-small">
              We will automatically check for login status...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-page-container runner">
      {/* Profile Creation Banner (Yellow) */}
      {!hasProfile && authState === 'profile-checked' && !showSuccessBanner && (
        <div 
          className="trading-profile-banner"
          onClick={() => setShowProfileModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowProfileModal(true);
            }
          }}
        >
          <div className="trading-profile-banner-content">
            <span className="trading-profile-banner-icon">⚠️</span>
            <span className="trading-profile-banner-text">
            Create a trading profile to start Trading with other players
            </span>
            <span className="trading-profile-banner-arrow">→</span>
          </div>
        </div>
      )}

      {/* Success Banner (Green) */}
      {showSuccessBanner && (
        <div className="trading-profile-banner trading-profile-banner-success">
          <div className="trading-profile-banner-content">
            <span className="trading-profile-banner-icon">✓</span>
            <span className="trading-profile-banner-text">
              Your trading profile has been created successfully! You can now access all trading features.
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="trading-tab-nav">
        {/* Decorative top border */}
        <div className="trading-tab-nav-top-border" />
        {tabs.map(tab => {
          const isActive = activePage === tab.id;
          const isDisabled = !hasProfile && tab.id !== 'published';
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`trading-tab-button ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              disabled={isDisabled}
              title={isDisabled ? 'Create a profile to access this page' : ''}
            >
              {/* Active indicator glow */}
              {isActive && (
                <div className="trading-tab-indicator" />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Page Content */}
      <div className="trading-page-content">
        {renderActivePage()}
      </div>

      {/* Profile Creation Modal */}
      <ProfileCreationModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileCreated={handleProfileCreated}
      />
    </div>
  );
};

export const TradingPage: React.FC = () => (
  <TradingProvider>
    <TradingPageInner />
  </TradingProvider>
);
