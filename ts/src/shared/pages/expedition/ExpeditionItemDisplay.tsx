import React, { useState, useEffect } from 'react';
import { ItemsElementUtils } from '../../../escape-from-tarkov/utils/ItemsElementUtils';
import { rarityToColor } from '../../../escape-from-tarkov/utils/RarityColorUtils';
import { Item } from '../../../escape-from-tarkov/service/consumer/TarkovDevConsumer';

interface ExpeditionItemDisplayProps {
  itemId: string;
  fallbackName: string;
}

export const ExpeditionItemDisplay: React.FC<ExpeditionItemDisplayProps> = ({ itemId, fallbackName }) => {
  const [itemData, setItemData] = useState<Item | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadItemData = async () => {
      try {
        if (itemId && ItemsElementUtils.exists()) {
          const data = await ItemsElementUtils.getItemInformation(itemId);
          setItemData(data);
        }
      } catch (error) {
        console.error(`Error loading item data for ${itemId}:`, error);
      }
    };

    if (itemId) {
      loadItemData();
    }
  }, [itemId]);

  const getRarityStyle = () => {
    if (!itemData || !itemData.rarity) {
      return {};
    }

    const color = rarityToColor(itemData.rarity);
    if (!color || color === 'black') {
      return {};
    }

    return {
      borderColor: color,
      borderStyle: 'solid' as const,
      borderWidth: '2px',
      background: `radial-gradient(circle at right top, transparent -8px, #000000d9 24px, ${color} 111px)`
    };
  };

  const getImageSrc = () => {
    if (!itemData || !itemData.baseImageLink) {
      return '';
    }

    if (itemData.baseImageLink.includes('undefined')) {
      return '';
    }

    return itemData.baseImageLink;
  };

  // Use item name from ItemsElementUtils if available, otherwise use fallback
  const itemName = itemData?.name || fallbackName;
  const imageSrc = getImageSrc();
  const rarityStyle = getRarityStyle();

  return (
    <div className="expedition-phase-item-display">
      <div className="expedition-phase-item-icon" style={rarityStyle}>
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt={itemName}
            className="expedition-phase-item-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="expedition-phase-item-icon-placeholder" />
        )}
      </div>
      <span className="expedition-phase-item-name-text" title={itemName}>
        {itemName}
      </span>
    </div>
  );
};

