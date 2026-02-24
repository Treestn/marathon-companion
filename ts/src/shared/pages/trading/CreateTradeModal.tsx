import React, { useState, useEffect } from 'react';
import { TradingService } from '../../services/trading/TradingService';
import { useTradingContext } from '../../context/TradingContext';
import { ItemSelector } from './ItemSelector';
import { useUserStatusContext } from '../../context/UserStatusContext';

interface TradeItemInput {
  id: string;
  name: string;
  quantity: number;
  imageLink: string;
}

interface CreateTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTradeCreated: () => void;
  activeTradesCount?: number | null;
  tradeLimit?: number | null;
  isSubscribed?: boolean;
}

export const CreateTradeModal: React.FC<CreateTradeModalProps> = ({
  isOpen,
  onClose,
  onTradeCreated,
  activeTradesCount: propActiveTradesCount = null,
  tradeLimit: propTradeLimit = null,
  isSubscribed: propIsSubscribed = false
}) => {
  const { status } = useUserStatusContext();
  const { bearerToken, isLoading: isTradingLoading } = useTradingContext();
  const subscriptionState = status?.subscription?.state;
  const isSubscribedFromStatus =
    subscriptionState === 'ACTIVE' ||
    subscriptionState === 'PENDING_CANCELLATION';
  const [offeringItems, setOfferingItems] = useState<TradeItemInput[]>([]);
  const [requestingItems, setRequestingItems] = useState<TradeItemInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [activeTradesCount, setActiveTradesCount] = useState<number | null>(null);
  const [tradeLimit, setTradeLimit] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  const addOfferingItem = () => {
    setOfferingItems([...offeringItems, { id: '', name: '', quantity: 1, imageLink: '' }]);
  };

  const addRequestingItem = () => {
    setRequestingItems([...requestingItems, { id: '', name: '', quantity: 1, imageLink: '' }]);
  };

  const updateOfferingItem = (index: number, field: 'id' | 'name' | 'quantity' | 'imageLink', value: string | number) => {
    const updated = [...offeringItems];
    updated[index] = { ...updated[index], [field]: value };
    setOfferingItems(updated);
  };

  const updateRequestingItem = (index: number, field: 'id' | 'name' | 'quantity' | 'imageLink', value: string | number) => {
    const updated = [...requestingItems];
    updated[index] = { ...updated[index], [field]: value };
    setRequestingItems(updated);
  };

  const handleOfferingItemSelect = (index: number, itemId: string, itemName: string, imageLink: string) => {
    const updated = [...offeringItems];
    updated[index] = { 
      ...updated[index], 
      id: itemId,
      name: itemName,
      imageLink: imageLink
    };
    setOfferingItems(updated);
  };

  const handleRequestingItemSelect = (index: number, itemId: string, itemName: string, imageLink: string) => {
    const updated = [...requestingItems];
    updated[index] = { 
      ...updated[index], 
      id: itemId,
      name: itemName,
      imageLink: imageLink
    };
    setRequestingItems(updated);
  };

  const removeOfferingItem = (index: number) => {
    setOfferingItems(offeringItems.filter((_, i) => i !== index));
  };

  const removeRequestingItem = (index: number) => {
    setRequestingItems(requestingItems.filter((_, i) => i !== index));
  };

  // Check if trade is valid
  const isTradeValid = React.useMemo(() => {
    // Check if there are any items in either list
    if (offeringItems.length === 0 || requestingItems.length === 0) {
      return false;
    }

    // Check if all offering items are valid (have id, name, and quantity > 0)
    for (const item of offeringItems) {
      const hasId = item.id && typeof item.id === 'string' && item.id.trim() !== '';
      const hasName = item.name && typeof item.name === 'string' && item.name.trim() !== '';
      const hasValidQuantity = typeof item.quantity === 'number' && item.quantity > 0;
      
      if (!hasId || !hasName || !hasValidQuantity) {
        return false;
      }
    }

    // Check if all requesting items are valid (have id, name, and quantity > 0)
    for (const item of requestingItems) {
      const hasId = item.id && typeof item.id === 'string' && item.id.trim() !== '';
      const hasName = item.name && typeof item.name === 'string' && item.name.trim() !== '';
      const hasValidQuantity = typeof item.quantity === 'number' && item.quantity > 0;
      
      if (!hasId || !hasName || !hasValidQuantity) {
        return false;
      }
    }

    return true;
  }, [offeringItems, requestingItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const validOffering = offeringItems.filter(item => item.id && item.name.trim() && item.quantity > 0);
    const validRequesting = requestingItems.filter(item => item.id && item.name.trim() && item.quantity > 0);

    if (validOffering.length === 0) {
      setError('Please add at least one item you are offering with a valid name and quantity');
      return;
    }

    if (validRequesting.length === 0) {
      setError('Please add at least one item you are requesting with a valid name and quantity');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const offeredItems = validOffering.map(item => ({ id: item.id, count: item.quantity }));
      const requestedItems = validRequesting.map(item => ({ id: item.id, count: item.quantity }));

      const response = await TradingService.createTrade(offeredItems, requestedItems);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create trade. Please try again.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      onTradeCreated();
      // Dispatch event to notify side panel to resume polling
      window.dispatchEvent(new CustomEvent('trade:created'));
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trade. Please try again.');
      console.error('Error creating trade:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check trade limit when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      // Prepopulate with one item in each section when modal opens
      setOfferingItems([{ id: '', name: '', quantity: 1, imageLink: '' }]);
      setRequestingItems([{ id: '', name: '', quantity: 1, imageLink: '' }]);

      if (isTradingLoading || !bearerToken) {
        setCheckingLimit(true);
        setLimitExceeded(false);
        setLimitMessage(null);
        setError(null);
        return;
      }

      // Use props if available, otherwise fetch
      if (propActiveTradesCount !== null && propTradeLimit !== null) {
        setActiveTradesCount(propActiveTradesCount);
        setTradeLimit(propTradeLimit);
        setIsSubscribed(propIsSubscribed || isSubscribedFromStatus);
        
        if (propActiveTradesCount >= propTradeLimit) {
          setLimitExceeded(true);
          if (propIsSubscribed) {
            setLimitMessage(`You have reached the maximum limit of ${propTradeLimit} active and accepted trades.`);
          } else {
            setLimitMessage(
              `You have reached the maximum limit of ${propTradeLimit} active and accepted trades. ` +
              `Subscribe to the app to get access to up to 20 concurrent trades.`
            );
          }
        } else {
          setLimitExceeded(false);
          setLimitMessage(null);
        }
        setCheckingLimit(false);
      } else {
        // Fallback: fetch if props not available
        checkTradeLimit();
      }
    } else {
      // Reset state when modal closes
      setLimitExceeded(false);
      setLimitMessage(null);
      setActiveTradesCount(null);
      setTradeLimit(null);
      setIsSubscribed(false);
      setOfferingItems([]);
      setRequestingItems([]);
      setError(null);
    }
  }, [
    isOpen,
    propActiveTradesCount,
    propTradeLimit,
    propIsSubscribed,
    isSubscribedFromStatus,
    bearerToken,
    isTradingLoading,
  ]);

  const checkTradeLimit = async () => {
    setCheckingLimit(true);
    setLimitExceeded(false);
    setLimitMessage(null);
    
    try {
      if (!bearerToken) {
        setError('Trading token not available.');
        return;
      }
      const count = await TradingService.fetchMyActiveTradesCount();
      const subscribed = propIsSubscribed || isSubscribedFromStatus;
      const limit = subscribed ? 20 : 2;
      
      setActiveTradesCount(count);
      setTradeLimit(limit);
      setIsSubscribed(subscribed);
      
      if (count >= limit) {
        setLimitExceeded(true);
        if (subscribed) {
          setLimitMessage(`You have reached the maximum limit of ${limit} active and accepted trades.`);
        } else {
          setLimitMessage(
            `You have reached the maximum limit of ${limit} active and accepted trades. ` +
            `Subscribe to the app to get access to up to 20 concurrent trades.`
          );
        }
      }
    } catch (error) {
      console.error('Error checking trade limit:', error);
      // Don't block trade creation if we can't check the limit
    } finally {
      setCheckingLimit(false);
    }
  };

  const handleClose = () => {
    setOfferingItems([]);
    setRequestingItems([]);
    setError(null);
    setLimitExceeded(false);
    setLimitMessage(null);
    setActiveTradesCount(null);
    setTradeLimit(null);
    setIsSubscribed(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="trading-modal-overlay" onClick={handleClose}>
      <div className="trading-modal-content trading-create-trade-modal scroll-div" onClick={(e) => e.stopPropagation()}>
        <div className="trading-modal-header">
          <h3 className="trading-modal-title">Create New Trade</h3>
          <button 
            className="trading-modal-close" 
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="trading-modal-body">
          {checkingLimit && (
            <div className="trading-modal-loading">
              <div className="trading-loading-spinner" />
              <p>Checking trade limit...</p>
            </div>
          )}

          {!checkingLimit && activeTradesCount !== null && tradeLimit !== null && (
            <div className={`trading-trade-count-info ${limitExceeded ? 'limit-exceeded' : ''}`}>
              <div className="trading-trade-count-text">
                <span className="trading-trade-count-label">Active Trades:</span>
                <span className={`trading-trade-count-value ${activeTradesCount >= tradeLimit ? 'at-limit' : ''}`}>
                  {activeTradesCount} / {tradeLimit}
                </span>
              </div>
              {!isSubscribed && (
                <div className="trading-trade-count-subscription-hint">
                  Subscribe to increase your limit to 20 concurrent trades
                </div>
              )}
            </div>
          )}

          {limitExceeded && limitMessage && (
            <div className="trading-modal-error trading-limit-error">
              {limitMessage}
            </div>
          )}

          {!checkingLimit && (
            <>
              <p className="trading-modal-description">
                Add items you want to offer and items you want to receive in exchange.
              </p>

              <form onSubmit={handleSubmit}>
            {/* Offering Items Section */}
            <div className="trading-create-trade-section">
              <div className="trading-create-trade-section-header">
                <h4 className="trading-create-trade-section-title">Items Offering</h4>
                <button
                  type="button"
                  onClick={addOfferingItem}
                  className="trading-btn-secondary trading-btn-small"
                  disabled={loading}
                >
                  + Add Item
                </button>
              </div>
              
              <div className="trading-create-trade-items-list">
                {offeringItems.map((item, index) => (
                  <div key={index} className="trading-create-trade-item-row">
                    <div className="trading-create-trade-item-selector-wrapper">
                      <ItemSelector
                        value={item.id}
                        onChange={(itemId, itemName, imageLink) => handleOfferingItemSelect(index, itemId, itemName, imageLink)}
                        placeholder="Search for an item..."
                        disabled={loading}
                      />
                    </div>
                    <div className="trading-quantity-control">
                      <button
                        type="button"
                        onClick={() => updateOfferingItem(index, 'quantity', Math.max(1, (item.quantity || 1) - 1))}
                        className="trading-quantity-btn trading-quantity-btn-decrease"
                        disabled={loading || (item.quantity || 1) <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity || ''}
                        onChange={(e) => updateOfferingItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                        className="trading-modal-input trading-create-trade-item-quantity"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => updateOfferingItem(index, 'quantity', (item.quantity || 1) + 1)}
                        className="trading-quantity-btn trading-quantity-btn-increase"
                        disabled={loading}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOfferingItem(index)}
                      className="trading-btn-remove"
                      disabled={loading}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {offeringItems.length === 0 && (
                  <div className="trading-create-trade-empty">
                    No items added. Click "Add Item" to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Requesting Items Section */}
            <div className="trading-create-trade-section">
              <div className="trading-create-trade-section-header">
                <h4 className="trading-create-trade-section-title">Items Requesting</h4>
                <button
                  type="button"
                  onClick={addRequestingItem}
                  className="trading-btn-secondary trading-btn-small"
                  disabled={loading}
                >
                  + Add Item
                </button>
              </div>
              
              <div className="trading-create-trade-items-list">
                {requestingItems.map((item, index) => (
                  <div key={index} className="trading-create-trade-item-row">
                    <div className="trading-create-trade-item-selector-wrapper">
                      <ItemSelector
                        value={item.id}
                        onChange={(itemId, itemName, imageLink) => handleRequestingItemSelect(index, itemId, itemName, imageLink)}
                        placeholder="Search for an item..."
                        disabled={loading}
                      />
                    </div>
                    <div className="trading-quantity-control">
                      <button
                        type="button"
                        onClick={() => updateRequestingItem(index, 'quantity', Math.max(1, (item.quantity || 1) - 1))}
                        className="trading-quantity-btn trading-quantity-btn-decrease"
                        disabled={loading || (item.quantity || 1) <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity || ''}
                        onChange={(e) => updateRequestingItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                        className="trading-modal-input trading-create-trade-item-quantity"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => updateRequestingItem(index, 'quantity', (item.quantity || 1) + 1)}
                        className="trading-quantity-btn trading-quantity-btn-increase"
                        disabled={loading}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRequestingItem(index)}
                      className="trading-btn-remove"
                      disabled={loading}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {requestingItems.length === 0 && (
                  <div className="trading-create-trade-empty">
                    No items added. Click "Add Item" to get started.
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="trading-modal-error">
                {error}
              </div>
            )}

            <div className="trading-modal-disclaimer">
              <p><strong>Disclaimer:</strong></p>
              <p>
                Marathon Companion is not responsible for other users not trading properly, anyone stealing items, or any issues that may arise from trading. 
                All trades are conducted at your own risk. Please trade responsibly and verify all items before completing a trade.
              </p>
            </div>

            <div className="trading-modal-actions">
              <button
                type="button"
                onClick={handleClose}
                className="trading-btn-secondary"
                disabled={loading || checkingLimit}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="trading-btn-primary"
                disabled={
                  loading || 
                  !isTradeValid || 
                  limitExceeded || 
                  checkingLimit ||
                  activeTradesCount === null ||
                  tradeLimit === null ||
                  (activeTradesCount !== null && tradeLimit !== null && activeTradesCount >= tradeLimit)
                }
              >
                {loading ? 'Creating...' : 'Create Trade'}
              </button>
            </div>
          </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

