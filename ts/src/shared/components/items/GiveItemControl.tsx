import React, { useCallback, useEffect, useState } from 'react';
import { ItemRarityImage } from './ItemRarityImage';
import { ItemsElementUtils } from '../../../escape-from-tarkov/utils/ItemsElementUtils';
import { ProgressionUpdatesService } from '../../services/ProgressionUpdatesService';
import { dispatchDesktopNavigation } from '../../services/NavigationEvents';
import './give-item-control.css';

type GiveItemControlProps = {
  itemId: string;
  count: number;
  questId: string;
  objectiveId: string;
  isCompleted?: boolean;
};

export const GiveItemControl: React.FC<GiveItemControlProps> = ({
  itemId,
  count,
  questId,
  objectiveId,
  isCompleted = false,
}) => {
  const itemName = ItemsElementUtils.getItemName(itemId) ?? itemId;
  const [currentAmount, setCurrentAmount] = useState(0);

  const refreshAmount = useCallback(() => {
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    const nextAmount = bridge?.getItemCurrentQuantity?.(itemId) ?? 0;
    setCurrentAmount(nextAmount);
  }, [itemId]);

  useEffect(() => {
    refreshAmount();
  }, [refreshAmount]);

  useEffect(() => {
    return ProgressionUpdatesService.subscribe((op) => {
      if (op?.type === 'item-quantity' && op.itemId === itemId) {
        setCurrentAmount(op.quantity ?? 0);
        return;
      }
      if (
        op?.type === 'quest-objective' &&
        op.questId === questId &&
        op.objectiveId === objectiveId
      ) {
        refreshAmount();
      }
    });
  }, [itemId, questId, objectiveId, refreshAmount]);

  const displayAmount = isCompleted ? count : currentAmount;

  return (
    <div
      className="give-item-control"
      data-quest-id={questId}
      data-objective-id={objectiveId}
      data-item-id={itemId}
    >
      <button
        type="button"
        className="give-item-button"
        disabled={isCompleted}
        onClick={(event) => {
          event.stopPropagation();
          const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
          bridge?.decreaseItemQuantity?.(itemId, 1);
          refreshAmount();
        }}
        aria-label="Return item"
      >
        −
      </button>
      <div
        className="give-item-image-wrapper"
        onClick={(event) => {
          event.stopPropagation();
          dispatchDesktopNavigation({
            pageId: 'items-needed',
            itemId,
            filters: {
              includeQuests: true,
              includeHideout: true,
              trackingOnly: false,
              missingOnly: false,
            },
          });
        }}
      >
        <ItemRarityImage itemId={itemId} size={32} />
        <div className="give-item-name-tooltip">{itemName}</div>
        <div
          className={`give-item-amount${currentAmount >= count ? ' is-complete' : ''}`}
        >
          {displayAmount} / {count}
        </div>
      </div>
      <button
        type="button"
        className="give-item-button"
        disabled={isCompleted}
        onClick={(event) => {
          event.stopPropagation();
          const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
          bridge?.increaseItemQuantity?.(itemId, 1);
          refreshAmount();
        }}
        aria-label="Give item"
      >
        +
      </button>
    </div>
  );
};
