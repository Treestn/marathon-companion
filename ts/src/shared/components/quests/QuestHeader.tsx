import React, { useEffect, useRef, useState } from 'react';
import { Quest } from '../../../model/quest/IQuestsElements';
import { I18nHelper } from '../../../locale/I18nHelper';
import { TraderMapper } from '../../../adapter/TraderMapper';
import { TraderList } from '../../../escape-from-tarkov/constant/TraderConst';
import { ProgressionStateService } from '../../services/ProgressionStateService';
import { FACTIONS_DATA } from '../../../model/faction/IFactionsElements';

type TraderOption = {
  id: string;
  name: string;
  src: string;
};

type QuestHeaderProps = {
  quest: Quest;
  isOpen: boolean;
  onToggle: () => void;
  onActiveChange?: (questId: string, nextState: boolean) => void;
  /** Edit mode props */
  isEditMode?: boolean;
  isRemoved?: boolean;
  onTraderChange?: (traderId: string, traderName: string) => void;
  onQuestNameChange?: (name: string) => void;
  onDeleteQuest?: () => void;
  onCancelDelete?: () => void;
};

const traderOptions: TraderOption[] = TraderList.map((t) => ({
  id: t.id,
  name: t.name,
  src: t.src,
}));

const getFactionColor = (traderId: string): string =>
  FACTIONS_DATA.find((faction) => faction.factionId === traderId)?.colorSurface ??
  'var(--accent)';

// ---------------------------------------------------------------------------
// Sub-components for each header mode
// ---------------------------------------------------------------------------

type StatusAreaProps = {
  isCompleted: boolean;
  isActive: boolean;
  isOpen: boolean;
  onToggleActive: () => void;
};

const StatusArea: React.FC<StatusAreaProps> = ({
  isCompleted,
  isActive,
  isOpen,
  onToggleActive,
}) => (
  <div className="quest-header-status">
    {isCompleted ? (
      <div className="quest-header-completed-indicator">
        <span className="quest-header-completed-check">✓</span>
        <span className="quest-header-completed-text">Completed</span>
      </div>
    ) : (
      <>
        <span className="quest-header-status-text">
          {isActive ? 'Active' : 'Inactive'}
        </span>
        <button
          type="button"
          className={`quest-header-switch${isActive ? ' is-active' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleActive();
          }}
          aria-pressed={isActive}
        >
          <span className="quest-header-switch-thumb" />
        </button>
      </>
    )}
    <span className={`quest-header-chevron${isOpen ? ' quest-header-chevron-open' : ''}`}>
      {isOpen ? '▾' : '▸'}
    </span>
  </div>
);

// ---- Removed header ----
type RemovedHeaderProps = {
  traderImageSrc: string | null;
  traderAlt: string;
  displayTitle: string;
  onCancelDelete?: () => void;
};

const RemovedHeader: React.FC<RemovedHeaderProps> = ({
  traderImageSrc,
  traderAlt,
  displayTitle,
  onCancelDelete,
}) => (
  <div className="quest-header quest-header-removed">
    <div className="quest-header-toggle quest-header-toggle-disabled">
      <img
        src={traderImageSrc ?? undefined}
        alt={traderAlt}
        className="quest-trader-image quest-trader-image-removed"
      />
      <span className="quest-title quest-title-removed">{displayTitle}</span>
      <span className="quest-header-removed-badge">Removed</span>
    </div>
    <div className="quest-header-status">
      <button
        type="button"
        className="quest-header-cancel-delete-button"
        onClick={(event) => {
          event.stopPropagation();
          onCancelDelete?.();
        }}
        title="Cancel deletion"
      >
        Undo
      </button>
    </div>
  </div>
);

// ---- Edit mode header ----
type EditHeaderProps = {
  isOpen: boolean;
  isCompleted: boolean;
  isActive: boolean;
  traderImageSrc: string | null;
  traderAlt: string;
  factionColor: string;
  currentTraderId: string;
  displayTitle: string;
  onToggle: () => void;
  onTraderChange?: (traderId: string, traderName: string) => void;
  onQuestNameChange?: (name: string) => void;
  onDeleteQuest?: () => void;
};

const EditHeader: React.FC<EditHeaderProps> = ({
  isOpen,
  isCompleted,
  isActive,
  traderImageSrc,
  traderAlt,
  factionColor,
  currentTraderId,
  displayTitle,
  onToggle,
  onTraderChange,
  onQuestNameChange,
  onDeleteQuest,
}) => {
  const [isTraderDropdownOpen, setIsTraderDropdownOpen] = useState(false);
  const traderDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isTraderDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (traderDropdownRef.current && !traderDropdownRef.current.contains(event.target as Node)) {
        setIsTraderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTraderDropdownOpen]);

  const handleTraderSelect = (trader: TraderOption) => {
    onTraderChange?.(trader.id, trader.name);
    setIsTraderDropdownOpen(false);
  };

  return (
    <div
      className={`quest-header quest-header-edit${isOpen ? ' quest-header-open' : ''}${
        isCompleted ? ' quest-header-completed' : ''
      }`}
      style={{ '--quest-faction-color': factionColor } as React.CSSProperties}
    >
      <div className="quest-header-edit-left">
        {/* Trader dropdown */}
        <div className="quest-header-trader-selector" ref={traderDropdownRef}>
          <button
            type="button"
            className="quest-header-trader-button"
            onClick={(event) => {
              event.stopPropagation();
              setIsTraderDropdownOpen((prev) => !prev);
            }}
            title="Change trader"
          >
            {traderImageSrc ? (
              <span
                className="quest-trader-image quest-trader-image-active"
                role="img"
                aria-label={traderAlt}
                style={
                  {
                    '--quest-faction-color': factionColor,
                    '--quest-trader-icon-mask': `url("${traderImageSrc}")`,
                  } as React.CSSProperties
                }
              />
            ) : (
              <img
                src={traderImageSrc ?? undefined}
                alt={traderAlt}
                className="quest-trader-image"
              />
            )}
            <span className="quest-header-trader-caret">▾</span>
          </button>
          {isTraderDropdownOpen && (
            <div className="quest-header-trader-dropdown">
              {traderOptions.map((trader) => (
                <button
                  key={trader.id}
                  type="button"
                  className={`quest-header-trader-option${
                    trader.id === currentTraderId ? ' is-selected' : ''
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTraderSelect(trader);
                  }}
                >
                  <span
                    className="quest-header-trader-option-image quest-trader-image-active"
                    role="img"
                    aria-label={trader.name}
                    style={
                      {
                        '--quest-faction-color': getFactionColor(trader.id),
                        '--quest-trader-icon-mask': `url("${trader.src}")`,
                      } as React.CSSProperties
                    }
                  />
                  <span>{trader.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editable quest name */}
        <input
          type="text"
          className="quest-header-name-input"
          value={displayTitle}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onQuestNameChange?.(event.target.value)}
          title="Edit quest name"
        />

        {/* Toggle body open/close */}
        <button type="button" className="quest-header-toggle-button" onClick={onToggle}>
          <span className={`quest-header-chevron${isOpen ? ' quest-header-chevron-open' : ''}`}>
            {isOpen ? '▾' : '▸'}
          </span>
        </button>
      </div>

      <div className="quest-header-status">
        {isCompleted ? (
          <div className="quest-header-completed-indicator">
            <span className="quest-header-completed-check">✓</span>
            <span className="quest-header-completed-text">Completed</span>
          </div>
        ) : null}
        <button
          type="button"
          className="quest-header-delete-button"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteQuest?.();
          }}
          title="Remove this quest"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main QuestHeader
// ---------------------------------------------------------------------------

export const QuestHeader = React.memo<QuestHeaderProps>(({
  quest,
  isOpen,
  onToggle,
  onActiveChange,
  isEditMode = false,
  isRemoved = false,
  onTraderChange,
  onQuestNameChange,
  onDeleteQuest,
  onCancelDelete,
}) => {
  const displayTitle =
    quest.locales?.[I18nHelper.currentLocale()] ??
    quest.name ??
    'Quest';
  const currentTraderId = (quest.trader as { id?: string })?.id ?? '';
  const traderImageSrc = TraderMapper.getImageFromTraderId(currentTraderId);
  const traderAlt = (quest.trader as { name?: string })?.name ?? '';
  const factionColor = getFactionColor(currentTraderId);

  const [isActive, setIsActive] = useState(
    ProgressionStateService.isQuestActive(quest.id)
  );
  const [isCompleted, setIsCompleted] = useState(
    ProgressionStateService.isQuestCompleted(quest.id)
  );

  useEffect(() => {
    const handler = async (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || detail.questId !== quest.id) {
        return;
      }
      if (detail.type === 'active-state') {
        setIsActive(ProgressionStateService.isQuestActive(quest.id));
      }
      if (detail.type === 'completed') {
        setIsCompleted(ProgressionStateService.isQuestCompleted(quest.id));
      }
    };
    globalThis.addEventListener('quest-progress-updated', handler);
    return () => globalThis.removeEventListener('quest-progress-updated', handler);
  }, [quest.id]);

  const toggleActive = () => {
    const nextState = !isActive;
    if (onActiveChange) {
      onActiveChange(quest.id, nextState);
    } else {
      const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
      bridge?.updateProgression?.({
        type: 'quest-active',
        questId: quest.id,
        isActive: nextState,
      });
    }
    setIsActive(nextState);
  };

  if (isRemoved) {
    return (
      <RemovedHeader
        traderImageSrc={traderImageSrc}
        traderAlt={traderAlt}
        displayTitle={displayTitle}
        onCancelDelete={onCancelDelete}
      />
    );
  }

  if (isEditMode) {
    return (
      <EditHeader
        isOpen={isOpen}
        isCompleted={isCompleted}
        isActive={isActive}
        traderImageSrc={traderImageSrc}
        traderAlt={traderAlt}
        factionColor={factionColor}
        currentTraderId={currentTraderId}
        displayTitle={displayTitle}
        onToggle={onToggle}
        onTraderChange={onTraderChange}
        onQuestNameChange={onQuestNameChange}
        onDeleteQuest={onDeleteQuest}
      />
    );
  }

  return (
    <div
      className={`quest-header${isOpen ? ' quest-header-open' : ''}${
        isCompleted ? ' quest-header-completed' : ''
      }`}
      style={{ '--quest-faction-color': factionColor } as React.CSSProperties}
    >
      <button type="button" className="quest-header-toggle" onClick={onToggle}>
        {isActive && traderImageSrc ? (
          <span
            className="quest-trader-image quest-trader-image-active"
            role="img"
            aria-label={traderAlt}
            style={
              {
                '--quest-faction-color': factionColor,
                '--quest-trader-icon-mask': `url("${traderImageSrc}")`,
              } as React.CSSProperties
            }
          />
        ) : (
          <img
            src={traderImageSrc}
            alt={traderAlt}
            className="quest-trader-image"
          />
        )}
        <span className="quest-title">{displayTitle}</span>
      </button>
      <StatusArea
        isCompleted={isCompleted}
        isActive={isActive}
        isOpen={isOpen}
        onToggleActive={toggleActive}
      />
    </div>
  );
});

QuestHeader.displayName = 'QuestHeader';
