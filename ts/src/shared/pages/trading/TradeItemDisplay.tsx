import React, { useState, useEffect } from 'react';
import { ItemsElementUtils } from '../../../escape-from-tarkov/utils/ItemsElementUtils';
import { rarityToColor } from '../../../escape-from-tarkov/utils/RarityColorUtils';
import { Item } from '../../../escape-from-tarkov/service/consumer/TarkovDevConsumer';

interface TradeItemDisplayProps {
  itemId: string;
  quantity: number;
  type: 'offering' | 'requesting';
  showName?: boolean;
}

export const TradeItemDisplay: React.FC<TradeItemDisplayProps> = ({ itemId, quantity, type, showName = true }) => {
  const [itemData, setItemData] = useState<Item | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const loadItemData = async () => {
      try {
        const data = await ItemsElementUtils.getItemInformation(itemId);
        setItemData(data);
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

    // If image link includes "undefined" or is invalid, return empty
    if (itemData.baseImageLink.includes('undefined')) {
      return '';
    }

    return itemData.baseImageLink;
  };

  const itemName = itemData?.name || 'Loading...';
  const imageSrc = getImageSrc();
  const rarityStyle = getRarityStyle();
  const isBlueprint = itemName.toLowerCase().includes('blueprint');

  return (
    <div 
      className="trade-card-item" 
      data-type={type}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`trade-card-item-icon ${isBlueprint ? 'blueprint' : ''}`} style={rarityStyle}>
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt={itemName}
            className="trade-card-item-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`trade-card-item-icon-placeholder ${type}`} />
        )}
      </div>
      {showName && (
        <div className="trade-card-item-details">
          <div className="trade-card-item-name">
            {itemName}
          </div>
          <div className="trade-card-item-quantity">
            <span>×</span>
            {quantity}
          </div>
        </div>
      )}
      {!showName && (
        <>
          <div className="trade-card-item-quantity-only">
            <span>×</span>
            {quantity}
          </div>
          {isHovered && itemData && (
            <div className="trade-card-item-hover-name">
              {itemName}
            </div>
          )}
        </>
      )}
    </div>
  );
};

