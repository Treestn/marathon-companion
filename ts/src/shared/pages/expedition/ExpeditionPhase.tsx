import React from 'react';
import { Phase } from '../ExpeditionPage';
import { PhaseState } from './ExpeditionProgressionService';
import { ExpeditionItemDisplay } from './ExpeditionItemDisplay';

interface ExpeditionPhaseProps {
  phase: Phase;
  previousPhaseCompleted: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onComplete: () => void;
  onItemUpdate: (phaseId: number, itemName: string, newValue: number) => void;
}

export const ExpeditionPhase: React.FC<ExpeditionPhaseProps> = ({
  phase,
  previousPhaseCompleted,
  isExpanded,
  onToggleExpand,
  onComplete,
  onItemUpdate
}) => {
  const allItemsComplete = phase.items?.every(item => item.current >= item.required) ?? false;
  const isBlocked = phase.state === 'blocked';
  const isCompleted = phase.state === 'completed';
  const isActive = phase.state === 'active';
  
  // Phase 1 (id === 1) can be completed if active (enabled by default)
  // Other phases require previous phase to be completed AND phase to be active (items don't need to be complete)
  const canComplete = phase.id === 1 
    ? isActive && !isCompleted  // Phase 1: enabled if active and not completed
    : previousPhaseCompleted && isActive && !isCompleted;  // Other phases: require previous phase + active (items auto-completed on mark)

  const handleItemChange = (itemName: string, value: string) => {
    const numValue = parseInt(value) || 0;
    onItemUpdate(phase.id, itemName, numValue);
  };

  const handleDecrease = (itemName: string, currentValue: number) => {
    const newValue = Math.max(0, currentValue - 1);
    onItemUpdate(phase.id, itemName, newValue);
  };

  const handleIncrease = (itemName: string, currentValue: number) => {
    onItemUpdate(phase.id, itemName, currentValue + 1);
  };

  const shouldCollapse = isCompleted && !isExpanded;

  return (
    <div className={`expedition-phase ${phase.state === 'completed' ? 'completed' : ''} ${phase.state === 'blocked' ? 'blocked' : ''} ${phase.state === 'active' ? 'active' : ''} ${shouldCollapse ? 'collapsed' : ''}`}>
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

      {!shouldCollapse && phase.items && phase.items.length > 0 ? (
        <div className="expedition-phase-items">
          {phase.items.map((item, index) => {
            const isComplete = item.current >= item.required;
            return (
              <div key={index} className={`expedition-phase-item ${isComplete ? 'complete' : ''}`}>
                <div className="expedition-phase-item-content">
                  {item.itemId ? (
                    <ExpeditionItemDisplay itemId={item.itemId} fallbackName={item.name} />
                  ) : (
                    <span className="expedition-phase-item-name">{item.name}</span>
                  )}
                  <div className="expedition-phase-item-quantity">
                    <div className="expedition-quantity-control">
                      <button
                        type="button"
                        onClick={() => handleDecrease(item.name, item.current)}
                        className="expedition-quantity-btn expedition-quantity-btn-decrease"
                        disabled={isBlocked || item.current <= 0}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.current}
                        onChange={(e) => handleItemChange(item.name, e.target.value)}
                        className="expedition-phase-item-input"
                        disabled={isBlocked}
                      />
                      <button
                        type="button"
                        onClick={() => handleIncrease(item.name, item.current)}
                        className="expedition-quantity-btn expedition-quantity-btn-increase"
                        disabled={isBlocked}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <span className="expedition-phase-item-separator">/</span>
                    <span className="expedition-phase-item-required">{item.required}</span>
                  </div>
                </div>
                {isComplete && (
                  <span className="expedition-phase-item-checkmark">✓</span>
                )}
              </div>
            );
          })}
        </div>
      ) : !shouldCollapse ? (
        <div className="expedition-phase-empty">
          <p>No requirements available</p>
        </div>
      ) : null}

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

