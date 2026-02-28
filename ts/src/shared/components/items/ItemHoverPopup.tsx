import React from "react";
import { Item } from "../../../model/items/IItemsElements";
import { rarityToColor, rarityToLabel } from "../../../escape-from-tarkov/utils/RarityColorUtils";
import "./item-hover-popup.css";

export type ItemHoverPopupItem = Partial<Item> & {
  id: string;
  name?: string;
  description?: string;
  rarity?: string;
  value?: number | null;
  type?: string;
  slotType?: string;
  category?: string;
  runnerType?: string[];
};

type ItemHoverPopupProps = {
  item: ItemHoverPopupItem;
  placement?: "right" | "left" | "below";
  className?: string;
  typeLabel?: string;
  costLabel?: string;
};

const resolveItemTypeLabel = (item: ItemHoverPopupItem): string => {
  if (item.type?.trim()) {
    return item.type.trim();
  }
  if (item.slotType?.trim()) {
    return item.slotType.trim();
  }
  if (item.category?.trim()) {
    return item.category.trim();
  }
  if (Array.isArray(item.runnerType) && item.runnerType.length > 0) {
    return item.runnerType.filter(Boolean).join(" / ");
  }
  return "Item";
};

export const ItemHoverPopup: React.FC<ItemHoverPopupProps> = ({
  item,
  placement = "right",
  className,
  typeLabel,
  costLabel,
}) => {
  const resolvedRarityColor = rarityToColor(item.rarity ?? "");
  let placementClass = "";
  if (placement === "left") {
    placementClass = "item-hover-popup--left";
  } else if (placement === "below") {
    placementClass = "item-hover-popup--below";
  }
  const popupClassName = ["item-hover-popup", placementClass, className].filter(Boolean).join(" ");
  const resolvedType = typeLabel?.trim() || resolveItemTypeLabel(item);
  const resolvedCost = costLabel ?? (item.value === null || item.value === undefined ? "N/A" : String(item.value));
  const resolvedRarityLabel = rarityToLabel(item.rarity);
  const resolvedName = item.name?.trim() || "Unknown item";
  const resolvedDescription = item.description?.trim() || "No description available.";

  return (
    <div className={popupClassName} aria-hidden="true">
      <div
        className="item-hover-popup-header"
        style={{ "--item-popup-rarity-color": resolvedRarityColor } as React.CSSProperties}
      >
        <span className="item-hover-popup-rarity">{resolvedRarityLabel}</span>
        <span className="item-hover-popup-type">{resolvedType}</span>
        <span className="item-hover-popup-cost">{resolvedCost}</span>
      </div>
      <div className="item-hover-popup-body">
        <strong className="item-hover-popup-name">{resolvedName}</strong>
        <p className="item-hover-popup-description">{resolvedDescription}</p>
      </div>
    </div>
  );
};
