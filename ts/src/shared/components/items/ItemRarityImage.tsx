import React, { useEffect, useMemo, useState } from 'react';
import { ItemsElementUtils } from '../../../escape-from-tarkov/utils/ItemsElementUtils';
import { rarityToColor } from '../../../escape-from-tarkov/utils/RarityColorUtils';
import { LogoPathConst } from '../../../escape-from-tarkov/constant/ImageConst';

type ImageState = 'loading' | 'loaded' | 'error';

type ItemRarityImageProps = {
  itemId: string;
  size?: number;
  className?: string;
};

export const ItemRarityImage: React.FC<ItemRarityImageProps> = ({ itemId, size = 40, className }) => {
  const [imageState, setImageState] = useState<ImageState>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>(LogoPathConst.LOGO_WHITE_256_BLUE_SIDE);
  const wrapperClassName = className ? `item-rarity-image ${className}` : 'item-rarity-image';

  const rarityStyle = useMemo(() => {
    const rarity = ItemsElementUtils.getItemRarity(itemId);
    if (!rarity) {
      return {};
    }
    const color = rarityToColor(rarity);
    if (!color || color === 'black') {
      return {};
    }
    return {
      borderColor: color,
      borderStyle: 'solid' as const,
      borderWidth: '2px',
    };
  }, [itemId]);

  const imageSrc = useMemo(() => {
    const fallback = LogoPathConst.LOGO_WHITE_256_BLUE_SIDE;
    const direct = ItemsElementUtils.getImagePath(itemId);
    if (!direct || direct.includes('undefined')) {
      return fallback;
    }
    return direct;
  }, [itemId]);

  useEffect(() => {
    setImageState('loading');
    setCurrentSrc(imageSrc);
  }, [imageSrc]);

  return (
    <div
      className={wrapperClassName}
      style={{ ...rarityStyle, padding: 5, maxHeight: size - 6, maxWidth: size - 6 }}
    >
      {imageState === 'loading' && (
        <div className="item-rarity-image-loading">
          <div className="item-rarity-image-spinner" />
        </div>
      )}
      {imageState === 'error' && (
        <div className="item-rarity-image-error" title="Could not load image">
          <svg
            className="item-rarity-image-error-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 5v6.59l-2.29-2.3a1 1 0 0 0-1.42 0l-3.29 3.3-4.29-4.3a1 1 0 0 0-1.42 0L3 13.59V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"
              fill="currentColor"
              opacity="0.3"
            />
            <path
              d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Zm18 6.59-2.29-2.3a1 1 0 0 0-1.42 0l-3.29 3.3-4.29-4.3a1 1 0 0 0-1.42 0L3 13.59"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="item-rarity-image-error-text">Image unavailable</span>
        </div>
      )}
      {imageState !== 'error' && (
        <img
          src={currentSrc}
          alt={ItemsElementUtils.getItemName(itemId) ?? itemId}
          style={imageState === 'loading' ? { position: 'absolute', opacity: 0 } : undefined}
          onLoad={() => setImageState('loaded')}
          onError={() => {
            if (currentSrc !== LogoPathConst.LOGO_WHITE_256_BLUE_SIDE) {
              setCurrentSrc(LogoPathConst.LOGO_WHITE_256_BLUE_SIDE);
              return;
            }
            setImageState('error');
          }}
        />
      )}
    </div>
  );
};
