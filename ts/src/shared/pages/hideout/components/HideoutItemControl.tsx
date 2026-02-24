import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ItemRarityImage } from "../../../components/items/ItemRarityImage";
import { ItemsElementUtils } from "../../../../escape-from-tarkov/utils/ItemsElementUtils";
import { rarityToColor } from "../../../../escape-from-tarkov/utils/RarityColorUtils";
import { ProgressionUpdatesService } from "../../../services/ProgressionUpdatesService";

type HideoutItemControlProps = {
  itemId: string;
  required: number;
  isCompleted?: boolean;
};

const formatRarityLabel = (rarity?: string): string => {
  if (!rarity) {
    return "Unknown";
  }
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
};

export const HideoutItemControl: React.FC<HideoutItemControlProps> = ({
  itemId,
  required,
  isCompleted = false,
}) => {
  const [currentAmount, setCurrentAmount] = useState(0);
  const [inputValue, setInputValue] = useState("0");

  const itemName = ItemsElementUtils.getItemName(itemId) ?? itemId;
  const rarity = ItemsElementUtils.getItemRarity(itemId);
  const rarityLabel = formatRarityLabel(rarity);
  const rarityColor = useMemo(() => {
    if (!rarity) {
      return undefined;
    }
    const color = rarityToColor(rarity);
    return color === "black" ? undefined : color;
  }, [rarity]);

  const refreshAmount = useCallback(() => {
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    const nextAmount = bridge?.getItemCurrentQuantity?.(itemId) ?? 0;
    setCurrentAmount(nextAmount);
  }, [itemId]);

  useEffect(() => {
    refreshAmount();
  }, [refreshAmount]);

  useEffect(() => {
    setInputValue(String(Math.max(0, currentAmount)));
  }, [currentAmount]);

  useEffect(() => {
    return ProgressionUpdatesService.subscribe((op) => {
      if (op?.type === "item-quantity" && op.itemId === itemId) {
        if (typeof op.quantity === "number") {
          setCurrentAmount(op.quantity);
        } else {
          refreshAmount();
        }
      }
    });
  }, [itemId, refreshAmount]);

  const updateQuantity = (delta: number) => {
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    if(delta === 1) {
      bridge?.increaseItemQuantity?.(itemId, delta);
    } else if(delta === -1) {
      bridge?.decreaseItemQuantity?.(itemId, Math.abs(delta));
    } else {
      bridge?.updateProgression({
        type: "item-quantity",
        itemId,
        delta,
      });
    }
  };

  const applyQuantity = (value: number) => {
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    if (bridge?.updateProgression) {
      bridge.updateProgression({
        type: "item-quantity",
        itemId,
        quantity: Math.max(0, value),
      });
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw.startsWith("-")) {
      setInputValue("0");
      applyQuantity(0);
      return;
    }
    const digitsOnly = raw.split(/\D/).join("");
    setInputValue(digitsOnly);
  };

  const handleInputBlur = () => {
    const nextValue = inputValue === "" ? 0 : Number(inputValue);
    applyQuantity(nextValue);
  };

  const displayAmount = Math.max(0, currentAmount);
  const isComplete = displayAmount >= required;

  return (
    <div className="hideout-item-card">
      <div className="hideout-item-info">
        <div className="hideout-item-image">
          <ItemRarityImage itemId={itemId} size={50} />
        </div>
        <div className="hideout-item-meta">
          <div className="hideout-item-name">{itemName}</div>
          <div
            className="hideout-item-rarity"
            style={rarityColor ? { backgroundColor: rarityColor } : undefined}
          >
            {rarityLabel}
          </div>
        </div>
      </div>
      <div className="hideout-item-controls">
        <button
          type="button"
          className="hideout-item-button"
          onClick={() => updateQuantity(-1)}
          disabled={isCompleted}
          aria-label="Decrease item quantity"
        >
          −
        </button>
        {isCompleted ? (
          <div className="hideout-item-count-text">
            {required} / {required}
          </div>
        ) : (
          <input
            className="hideout-item-input"
            inputMode="numeric"
            value={displayAmount === 0 && currentAmount < 0 ? "0" : inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            aria-label="Set item quantity"
          />
        )}
        {!isCompleted && (
          <div className="hideout-item-count">
            <span
              className={`hideout-item-count-current${
                isComplete ? " is-complete" : ""
              }`}
            >
              / {required}
            </span>{" "}
          </div>
        )}
        <button
          type="button"
          className="hideout-item-button"
          onClick={() => updateQuantity(1)}
          disabled={isCompleted}
          aria-label="Increase item quantity"
        >
          +
        </button>
      </div>
    </div>
  );
};
