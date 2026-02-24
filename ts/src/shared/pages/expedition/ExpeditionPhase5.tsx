import React from 'react';
import { Phase } from '../ExpeditionPage';

interface ExpeditionPhase5Props {
  phase: Phase;
  previousPhaseCompleted: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onComplete: () => void;
  onCoinUpdate: (phaseId: number, category: 'combat' | 'survival' | 'provisions' | 'materials', newValue: number) => void;
}

export const ExpeditionPhase5: React.FC<ExpeditionPhase5Props> = ({
  phase,
  previousPhaseCompleted,
  isExpanded,
  onToggleExpand,
  onComplete,
  onCoinUpdate
}) => {
  const coinCategories = phase.coinCategories || {
    combat: { required: 0, current: 0 },
    survival: { required: 0, current: 0 },
    provisions: { required: 0, current: 0 },
    materials: { required: 0, current: 0 }
  };

  const categories = [
    { key: 'combat' as const, label: 'Combat Items', required: coinCategories.combat.required, current: coinCategories.combat.current },
    { key: 'survival' as const, label: 'Survival Items', required: coinCategories.survival.required, current: coinCategories.survival.current },
    { key: 'provisions' as const, label: 'Provisions', required: coinCategories.provisions.required, current: coinCategories.provisions.current },
    { key: 'materials' as const, label: 'Materials', required: coinCategories.materials.required, current: coinCategories.materials.current }
  ];

  const allCategoriesComplete = categories.every(cat => cat.current >= cat.required);
  const isBlocked = phase.state === 'blocked';
  const isCompleted = phase.state === 'completed';
  const isActive = phase.state === 'active';
  
  // Phase 5 requires previous phase to be completed AND phase to be active (coins auto-completed on mark)
  const canComplete = previousPhaseCompleted && isActive && !isCompleted;

  const handleCoinChange = (category: 'combat' | 'survival' | 'provisions' | 'materials', value: string) => {
    const numValue = parseInt(value) || 0;
    onCoinUpdate(phase.id, category, numValue);
  };

  const handleCoinDecrease = (category: 'combat' | 'survival' | 'provisions' | 'materials', currentValue: number) => {
    const newValue = Math.max(0, currentValue - 1000); // Decrease by 1000 for coins
    onCoinUpdate(phase.id, category, newValue);
  };

  const handleCoinIncrease = (category: 'combat' | 'survival' | 'provisions' | 'materials', currentValue: number) => {
    onCoinUpdate(phase.id, category, currentValue + 1000); // Increase by 1000 for coins
  };

  const formatCoins = (value: number): string => {
    return value.toLocaleString('en-US');
  };

  const shouldCollapse = isCompleted && !isExpanded;

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
        {categories.map((category, index) => {
          const isComplete = category.current >= category.required;
          const progress = Math.min((category.current / category.required) * 100, 100);
          
          return (
            <div key={index} className={`expedition-phase-coin-category ${isComplete ? 'complete' : ''}`}>
              <div className="expedition-phase-coin-category-header">
                <span className="expedition-phase-coin-category-label">{category.label}</span>
                <div className="expedition-phase-coin-category-value">
                  <div className="expedition-quantity-control">
                    <button
                      type="button"
                      onClick={() => handleCoinDecrease(category.key, category.current)}
                      className="expedition-quantity-btn expedition-quantity-btn-decrease"
                      disabled={isBlocked || category.current <= 0}
                      aria-label="Decrease coins"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={category.current}
                      onChange={(e) => handleCoinChange(category.key, e.target.value)}
                      className="expedition-phase-coin-input"
                      disabled={isBlocked}
                    />
                    <button
                      type="button"
                      onClick={() => handleCoinIncrease(category.key, category.current)}
                      className="expedition-quantity-btn expedition-quantity-btn-increase"
                      disabled={isBlocked}
                      aria-label="Increase coins"
                    >
                      +
                    </button>
                  </div>
                  <span className="expedition-phase-coin-separator">/</span>
                  <span className="expedition-phase-coin-required">{formatCoins(category.required)}</span>
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
          );
        })}
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

