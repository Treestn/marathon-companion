import React from 'react';
import { Phase } from '../ExpeditionPage';

interface ExpeditionPhase6Props {
  phase: Phase;
  previousPhaseCompleted: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onComplete: () => void;
  onCoinValueUpdate: (phaseId: number, newValue: number) => void;
}

export const ExpeditionPhase6: React.FC<ExpeditionPhase6Props> = ({
  phase,
  previousPhaseCompleted,
  isExpanded,
  onToggleExpand,
  onComplete,
  onCoinValueUpdate
}) => {
  const coinValue = phase.coinValue || { required: 5000000, current: 0 };
  const required = coinValue.required;
  const current = coinValue.current;

  const isComplete = current >= required;
  const isBlocked = phase.state === 'blocked';
  const isCompleted = phase.state === 'completed';
  const isActive = phase.state === 'active';
  
  // Phase 6 requires previous phase to be completed AND phase to be active (coins auto-completed on mark)
  const canComplete = previousPhaseCompleted && isActive && !isCompleted;

  const handleCoinChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    onCoinValueUpdate(phase.id, numValue);
  };

  const handleCoinDecrease = (currentValue: number) => {
    const newValue = Math.max(0, currentValue - 1000); // Decrease by 1000 for coins
    onCoinValueUpdate(phase.id, newValue);
  };

  const handleCoinIncrease = (currentValue: number) => {
    onCoinValueUpdate(phase.id, currentValue + 1000); // Increase by 1000 for coins
  };

  const formatCoins = (value: number): string => {
    return value.toLocaleString('en-US');
  };

  const shouldCollapse = isCompleted && !isExpanded;
  const progress = Math.min((current / required) * 100, 100);

  return (
    <div className={`expedition-phase expedition-phase-coin ${phase.state === 'completed' ? 'completed' : ''} ${phase.state === 'blocked' ? 'blocked' : ''} ${phase.state === 'active' ? 'active' : ''} ${shouldCollapse ? 'collapsed' : ''}`}>
      <div 
        className={`expedition-phase-header ${isCompleted ? 'clickable' : ''}`}
        onClick={isCompleted ? onToggleExpand : undefined}
        role={isCompleted ? 'button' : undefined}
        tabIndex={isCompleted ? 0 : undefined}
        onKeyDown={isCompleted ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        } : undefined}
      >
        <div className="expedition-phase-header-content">
          <h2 className="expedition-phase-title">{phase.title}</h2>
          {isCompleted && (
            <span className="expedition-phase-completed-badge">Completed</span>
          )}
        </div>
        {!shouldCollapse && phase.description && (
          <p className="expedition-phase-description">{phase.description}</p>
        )}
      </div>

      {!shouldCollapse && (
        <div className="expedition-phase-coin-categories">
          <div className={`expedition-phase-coin-category ${isComplete ? 'complete' : ''}`}>
            <div className="expedition-phase-coin-category-header">
              <span className="expedition-phase-coin-category-label">Value</span>
              <div className="expedition-phase-coin-category-value">
                <div className="expedition-quantity-control">
                  <button
                    type="button"
                    onClick={() => handleCoinDecrease(current)}
                    className="expedition-quantity-btn expedition-quantity-btn-decrease"
                    disabled={isBlocked || current <= 0}
                    aria-label="Decrease coins"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={current}
                    onChange={(e) => handleCoinChange(e.target.value)}
                    className="expedition-phase-coin-input"
                    disabled={isBlocked}
                  />
                  <button
                    type="button"
                    onClick={() => handleCoinIncrease(current)}
                    className="expedition-quantity-btn expedition-quantity-btn-increase"
                    disabled={isBlocked}
                    aria-label="Increase coins"
                  >
                    +
                  </button>
                </div>
                <span className="expedition-phase-coin-separator">/</span>
                <span className="expedition-phase-coin-required">{formatCoins(required)}</span>
                <span className="expedition-phase-coin-unit"> coins</span>
              </div>
            </div>
            <div className="expedition-phase-coin-progress-bar">
              <div 
                className="expedition-phase-coin-progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            {isComplete && (
              <span className="expedition-phase-coin-checkmark">✓</span>
            )}
          </div>
        </div>
      )}

      {!shouldCollapse && (
        <div className="expedition-phase-actions">
          <button
            className={`expedition-phase-complete-btn ${canComplete ? 'enabled' : 'disabled'}`}
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            disabled={!canComplete}
          >
            Mark Complete
          </button>
        </div>
      )}
    </div>
  );
};

