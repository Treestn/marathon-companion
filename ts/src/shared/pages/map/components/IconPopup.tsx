/**
 * Icon popup component that displays when hovering over icons
 * Matches the style of the old map popup system
 */
import React, { useEffect, useRef, useState } from 'react';
import { buildRenderableImageSrc } from '../../../utils/imageUrl';
import { FeatureProps } from '../../../../model/map/FeatureProps';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { I18nHelper } from '../../../../locale/I18nHelper';
import { TraderMapper } from '../../../../adapter/TraderMapper';
import { QuestDataStore } from '../../../services/QuestDataStore';
import { ProgressionStateService } from '../../../services/ProgressionStateService';
import { dispatchDesktopNavigation } from '../../../services/NavigationEvents';
import { createImageBlobFromFile, revokeObjectUrl } from '../../../utils/imageBlob';
import { useOptionalQuestSubmissionContext } from '../../../context/QuestSubmissionContext';
import { FACTIONS_DATA } from '../../../../model/faction/IFactionsElements';
import '../map.css';

interface IconPopupProps {
  map: MapLibreMap | null;
  icon: {
    id: number;
    entity: FeatureProps;
    position: [number, number];
    pixelX: number;
    pixelY: number;
    name?: string;
    iconTypeId?: string;
  } | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onOpenFullscreen?: (images: string[], elementName: string, startIndex?: number) => void;
  allowQuestNavigation?: boolean;
}

export const IconPopup: React.FC<IconPopupProps> = ({
  map,
  icon,
  onMouseEnter,
  onMouseLeave,
  onOpenFullscreen,
  allowQuestNavigation = true,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  // All useState hooks must be at the top, before any conditional logic
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [traderImageLoading, setTraderImageLoading] = useState<boolean>(true);
  const [popupPlacement, setPopupPlacement] = useState<'above' | 'below'>('above');
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0); // Track current image index in popup
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const { questEdits } = useOptionalQuestSubmissionContext();

  const resolveImageSrc = (path: string | null | undefined): string =>
    buildRenderableImageSrc(path);

  const isLocalFilePath = (path: string) =>
    /^file:\/\//i.test(path) || /^[a-zA-Z]:[\\/]/.test(path);

  const stripFileScheme = (path: string) =>
    path.replace(/^file:\/\//i, '').replace(/^\/+/, '');

  useEffect(() => {
    if (!map || !icon) {
      setPopupPosition(null);
      return;
    }

    // Convert icon position to screen coordinates relative to map container
    const updatePosition = () => {
      if (!map || !icon) {
        setPopupPosition(null);
        return;
      }
      
      try {
        const point = map.project(icon.position);
        
        // Get icon size (approximate) - icons are rendered smaller now
        const iconSize = 15; // Further reduced since icons are smaller
        
        // Position popup very close to the icon
        // point.x and point.y are relative to the map container
        let x = point.x;
        let y = point.y - iconSize - 2; // Minimal offset - just 2px gap
        
        // Get map container bounds
        const container = map.getContainer();
        if (!container) {
          console.warn('Map container not found');
          setPopupPosition({ x, y });
          return;
        }
        
        const containerWidth = container.clientWidth || container.offsetWidth || window.innerWidth;
        const containerHeight = container.clientHeight || container.offsetHeight || window.innerHeight;
        
        // Get popup dimensions (only trust real measurements)
        const popupWidth = popupRef.current?.offsetWidth ?? 0;
        const popupHeight = popupRef.current?.offsetHeight ?? 0;
        
        // Check viewport bounds and adjust if needed
        const padding = 10; // Padding from viewport edges
        
        // Horizontal adjustment - popup is centered with translate(-50%, ...)
        const popupHalfWidth = popupWidth / 2;
        if (x - popupHalfWidth < padding) {
          // Popup goes off left edge - shift right
          x = Math.max(padding + popupHalfWidth, popupHalfWidth);
        } else if (x + popupHalfWidth > containerWidth - padding) {
          // Popup goes off right edge - shift left
          x = Math.min(containerWidth - padding - popupHalfWidth, containerWidth - popupHalfWidth);
        }
        
        // Ensure x is within bounds
        x = Math.max(popupHalfWidth, Math.min(x, containerWidth - popupHalfWidth));
        
        // Vertical adjustment - determine if popup should be above or below icon
        let placement: 'above' | 'below' = 'above';
        let finalY = y;
        
        // Calculate bounds for popup above icon (transform: translate(-50%, calc(-100% - 2px)))
        const popupTopAbove = y - popupHeight - 2; // -100% means above the point
        const popupBottomAbove = y;
        
        // Calculate bounds for popup below icon (transform: translate(-50%, 0))
        const popupTopBelow = point.y + iconSize + 2;
        const popupBottomBelow = popupTopBelow + popupHeight;
        
        // Check if popup fits above
        if (popupTopAbove >= padding && popupBottomAbove <= containerHeight - padding) {
          // Fits above, use it
          placement = 'above';
          finalY = y;
        } else if (popupTopAbove < padding) {
          // Doesn't fit above (goes off top) - position below
          placement = 'below';
          finalY = popupTopBelow;
          // Make sure it doesn't go off bottom
          if (popupBottomBelow > containerHeight - padding) {
            finalY = Math.max(padding, containerHeight - padding - popupHeight);
          }
        } else {
          // Goes off bottom when above - try below
          placement = 'below';
          finalY = popupTopBelow;
          // Make sure it doesn't go off bottom
          if (popupBottomBelow > containerHeight - padding) {
            finalY = Math.max(padding, containerHeight - padding - popupHeight);
          }
        }
        
        // Ensure finalY is within bounds
        if (placement === 'above') {
          finalY = Math.max(popupHeight + padding, Math.min(finalY, containerHeight - padding));
        } else {
          finalY = Math.max(padding, Math.min(finalY, containerHeight - popupHeight - padding));
        }
        
        setPopupPlacement(placement);
        setPopupPosition({ x, y: finalY });
      } catch (error) {
        console.error('Error calculating popup position:', error);
        // Fallback to simple positioning
        try {
          const point = map.project(icon.position);
          setPopupPosition({ x: point.x, y: point.y - 20 });
        } catch (e) {
          setPopupPosition(null);
        }
      }
    };

    // Initial position - use setTimeout to ensure container is ready
    const initialTimeout = setTimeout(() => {
      updatePosition();
    }, 0);

    // Update position on map events
    map.on('move', updatePosition);
    map.on('zoom', updatePosition);
    map.on('rotate', updatePosition);
    map.on('pitch', updatePosition);
    
    // Also update when popup is rendered (to get accurate dimensions)
    let resizeObserver: ResizeObserver | null = null;
    const setupResizeObserver = () => {
      if (popupRef.current && !resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          updatePosition();
        });
        resizeObserver.observe(popupRef.current);
      }
    };
    
    // Try to set up resize observer after a short delay
    const observerTimeout = setTimeout(setupResizeObserver, 100);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(observerTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.off('move', updatePosition);
      map.off('zoom', updatePosition);
      map.off('rotate', updatePosition);
      map.off('pitch', updatePosition);
    };
  }, [map, icon]);


  const isQuestIconType = icon?.iconTypeId === "Contracts:Contracts";
  const isQuestIcon = !!(icon?.entity.questId);
  const quest = React.useMemo(() => {
    if (!isQuestIconType || !icon?.entity.questId) {
      return null;
    }
    return QuestDataStore.getQuestById(icon.entity.questId);
  }, [isQuestIconType, icon?.entity.questId]);

  // Check if the quest has an edit entry (for trader / name overrides)
  const questEditEntry = React.useMemo(() => {
    if (!isQuestIcon || !icon?.entity.questId) return null;
    return questEdits.find((e) => e.quest.id === icon.entity.questId) ?? null;
  }, [isQuestIcon, icon?.entity.questId, questEdits]);

  // Get trader image src for quest icons — edit context trader takes priority
  const traderImageSrc = React.useMemo(() => {
    if (!isQuestIcon) return null;
    const editQuest = questEditEntry?.quest;
    if (editQuest?.trader) {
      return TraderMapper.getImageFromTraderId((editQuest.trader as { id?: string })?.id ?? '');
    }
    if (quest?.trader) {
      return TraderMapper.getImageFromTraderId((quest.trader as { id?: string })?.id ?? '');
    }
    return null;
  }, [isQuestIcon, questEditEntry?.quest, quest?.trader]);

  const currentTraderId = React.useMemo(() => {
    const editQuest = questEditEntry?.quest;
    if (editQuest?.trader) {
      return (editQuest.trader as { id?: string })?.id ?? '';
    }
    if (quest?.trader) {
      return (quest.trader as { id?: string })?.id ?? '';
    }
    return '';
  }, [questEditEntry?.quest, quest?.trader]);

  const questFactionColor = React.useMemo(() => {
    if (!currentTraderId) {
      return 'var(--accent)';
    }
    return (
      FACTIONS_DATA.find((faction) => faction.factionId === currentTraderId)?.colorSurface ??
      'var(--accent)'
    );
  }, [currentTraderId]);

  // Get element name (localized if available)
  // For quest icons: edit context name > original quest name; otherwise element name
  const elementName = React.useMemo(() => {
    if (!isQuestIcon || !quest) return icon?.name || 'Unknown';
    const editQuest = questEditEntry?.quest;
    if (editQuest) {
      return editQuest.locales?.[I18nHelper.currentLocale()] ?? editQuest.name;
    }
    return quest.locales?.[I18nHelper.currentLocale()] ?? quest.name;
  }, [isQuestIcon, quest, questEditEntry?.quest, icon?.name]);

  const questAsset = React.useMemo(() => {
    if (!quest || !icon) {
      return { images: [] as string[], description: "" };
    }
    const images: string[] = [];
    let description = "";
    for (const obj of quest.objectives ?? []) {
      if (!obj.questImages || obj.questImages.length === 0) {
        continue;
      }
      for (const questImg of obj.questImages) {
        if (String(questImg.id) === String(icon.entity.id)) {
          description = questImg.description || "";
          if (questImg.paths && Array.isArray(questImg.paths) && questImg.paths.length > 0) {
            images.push(...questImg.paths);
          }
          break;
        }
      }
      if (images.length > 0 || description) {
        break;
      }
    }
    return { images, description };
  }, [quest, icon?.entity.id, icon]);

  // Check the quest edit context for images (takes priority over original data).
  // For edit-created icons entity.imageList is already populated, but for original
  // map icons we derive the objectiveId from QuestDataStore and look it up.
  const editQuestImages = React.useMemo(() => {
    if (!isQuestIconType || !icon?.entity.questId) return [];
    const editEntry = questEdits.find((e) => e.quest.id === icon.entity.questId);
    if (!editEntry) return [];

    // Determine which objective this icon belongs to.
    let matchedObjectiveId: string | null =
      (icon.entity as unknown as Record<string, unknown>).objectiveId as string | null ?? null;
    if (!matchedObjectiveId && quest?.objectives) {
      const iconIdStr = String(icon.entity.id);
      for (const obj of quest.objectives) {
        const match = obj.questImages?.find((img) => String(img.id) === iconIdStr);
        if (match) {
          matchedObjectiveId = obj.id;
          break;
        }
      }
    }

    // Look up the edit quest's objective images
    if (matchedObjectiveId) {
      const editObj = editEntry.quest.objectives.find((o) => o.id === matchedObjectiveId);
      if (editObj?.questImages) {
        const images: string[] = [];
        for (const qi of editObj.questImages) {
          if (qi.paths && qi.paths.length > 0) images.push(...qi.paths);
        }
        if (images.length > 0) return images;
      }
    }

    // Fallback: aggregate all objective images from the edit quest
    const allImages: string[] = [];
    for (const obj of editEntry.quest.objectives) {
      if (!obj.questImages) continue;
      for (const qi of obj.questImages) {
        if (qi.paths && qi.paths.length > 0) allImages.push(...qi.paths);
      }
    }
    return allImages;
  }, [isQuestIconType, icon?.entity.questId, icon?.entity.id, quest, questEdits]);

  // Reset image loading states when trader image changes
  useEffect(() => {
    if (traderImageSrc) {
      setTraderImageLoading(true);

      // Preload the image to check if it's already cached
      const img = new Image();
      img.onload = () => {
        setTraderImageLoading(false);
      };
      img.onerror = () => {
        console.error('Trader image preload failed:', traderImageSrc);
        setTraderImageLoading(false);
      };
      img.src = traderImageSrc;
    } else {
      setTraderImageLoading(false);
    }
  }, [traderImageSrc]);

  // Reset image index when icon changes
  useEffect(() => {
    setCurrentImageIndex(0); // Reset to first image when icon changes
  }, [icon?.id]);

  // Compute images array (needed for the next useEffect)
  // Priority: entity.imageList (active draft) > edit quest context > original quest data > nothing
  let images: string[] = [];
  if (icon) {
    if (icon.entity.imageList && icon.entity.imageList.length > 0) {
      images = icon.entity.imageList;
    } else if (isQuestIconType && editQuestImages.length > 0) {
      images = editQuestImages;
    } else if (isQuestIconType) {
      images = questAsset.images;
    }
  }

  const currentImage = images.length > 0 ? images[currentImageIndex] : null;
  const currentImageSrc = currentImage ? resolveImageSrc(currentImage) : null;
  const resolvedImageSrc = imageBlobUrl ?? currentImageSrc;

  useEffect(() => {
    let isActive = true;
    let nextBlobUrl: string | null = null;

    const loadLocalImage = async (path: string) => {
      const filePath = stripFileScheme(path);
      const { url } = await createImageBlobFromFile(filePath, 'image/png');
      nextBlobUrl = url;
      if (isActive) {
        setImageBlobUrl(nextBlobUrl);
      } else {
        revokeObjectUrl(nextBlobUrl);
      }
    };

    setImageBlobUrl(null);

    if (!currentImage) {
      setImageBlobUrl(null);
      setImageLoading(false);
      return () => {};
    }

    if (isLocalFilePath(currentImage)) {
      setImageLoading(true);
      loadLocalImage(currentImage).catch((error) => {
        console.warn('Local image load failed:', error);
        if (isActive) {
          setImageBlobUrl(null);
          setImageLoading(false);
        }
      });
    } else {
      setImageBlobUrl(null);
    }

    return () => {
      isActive = false;
      revokeObjectUrl(nextBlobUrl);
    };
  }, [currentImage]);

  // Ensure index is valid when images array changes
  useEffect(() => {
    if (images.length > 0 && currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

  useEffect(() => {
    if (resolvedImageSrc) {
      setImageLoading(true);
      return;
    }
    setImageLoading(false);
  }, [resolvedImageSrc]);

  if (!icon || !popupPosition || !map) {
    return null;
  }

  const isQuestActive = isQuestIcon && quest ? ProgressionStateService.isQuestActive(quest.id) : false;
  const isObjectiveCompleted =
    isQuestIcon && quest
      ? ProgressionStateService.isQuestObjectiveCompletedByIconId(
          quest.id,
          String(icon.entity.id),
        )
      : false;

  // Get description
  // Prefer entity description (set during editing), then quest asset description, then locales
  let description = '';
  if (icon.entity.description) {
    description = icon.entity.description;
  } else if (isQuestIcon && questAsset.description) {
    description = questAsset.description;
  } else if (icon.entity.locales?.['en']) {
    description = icon.entity.locales['en'];
  }

  return (
    <div
      ref={popupRef}
      className="icon-overlay"
      style={{
        left: `${popupPosition.x}px`,
        top: `${popupPosition.y}px`,
        transform: popupPlacement === 'below' 
          ? 'translate(-50%, 0)' // Position below icon
          : 'translate(-50%, calc(-100% - 2px))', // Position above icon
        '--quest-faction-color': questFactionColor,
      }}
      onMouseEnter={(e) => {
        // Keep popup visible when hovering over it (for quest icons)
        if (isQuestIcon && onMouseEnter) {
          e.stopPropagation();
          
          onMouseEnter();
        }
      }}
      onMouseLeave={(e) => {
        // Allow popup to hide when leaving (handled by parent)
        // For non-quest icons, always close immediately when leaving
        // For quest icons, call onMouseLeave if provided (which will close after delay)
        if (onMouseLeave) {
          e.stopPropagation();
          onMouseLeave();
        }
      }}
    >
      {/* Arrow pointing to icon */}
      <div className={`popup-arrow ${popupPlacement === 'below' ? 'popup-top' : 'popup-bottom'}`} />
      
      {/* Title section */}
      <div className="title-section-container">
        {/* Trader image (only for quest icons) */}
        {isQuestIcon && traderImageSrc && (
          <div className="popup-trader-image-container">
            {traderImageLoading && (
              <div className="popup-trader-image-loading" />
            )}
            <img
              className="popup-trader-image-preload"
              src={traderImageSrc}
              alt={(questEditEntry?.quest.trader as { name?: string })?.name ?? (quest?.trader as { name?: string })?.name ?? 'Trader'}
              onLoad={() => {
                setTraderImageLoading(false);
              }}
              onError={(e) => {
                console.error('Trader image onError fired:', traderImageSrc, e);
                setTraderImageLoading(false);
              }}
            />
            {!traderImageLoading && (
              <div
                className="popup-trader-image popup-trader-image-colorized"
                style={{ '--popup-faction-icon-mask': `url("${traderImageSrc}")` } as React.CSSProperties}
                role="img"
                aria-label={(questEditEntry?.quest.trader as { name?: string })?.name ?? (quest?.trader as { name?: string })?.name ?? 'Trader'}
              />
            )}
          </div>
        )}
        {/* Title div - use quest-title-div for quest icons, title-div for regular icons */}
        <div 
          className={isQuestIcon ? "quest-title-div title-div" : "title-div"}
        >
          {isQuestIcon && quest ? (
            <b 
              className={`overlay-title${allowQuestNavigation ? " overlay-title-clickable" : ""}`}
              onClick={async (e) => {
                if (!allowQuestNavigation) {
                  return;
                }
                e.stopPropagation();
                try {
                  dispatchDesktopNavigation({ pageId: "quests", questId: quest.id });
                } catch (error) {
                  console.error('Error navigating to quest page:', error);
                }
              }}
            >
              {elementName}
            </b>
          ) : (
            <b className="overlay-title">{elementName}</b>
          )}
        </div>
      </div>

      {/* Description section - show if description exists, even without image */}
      {description && !currentImage && (
        <div className="popup-image-section-container">
          <div className="popup-image-section-description-container">
            <b className="popup-image-description">{description}</b>
          </div>
        </div>
      )}

      {/* Image section */}
      {currentImage && (
        <div className="popup-image-section-container">
          <div className="popup-image-section-description-container">
            {description && (
              <b className="popup-image-description">{description}</b>
            )}
          </div>
          <div 
            className="popup-image-container" 
            style={{ 
              pointerEvents: images.length > 0 ? 'auto' : 'none' // Allow clicks on image container if there are images
            }}
          >
            {/* Previous button - only show if multiple images */}
            {images.length > 1 && (
              <div
                className="popup-image-nav-button popup-image-nav-button-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                }}
              >
                <img
                  src="../../img/line-angle-left-icon.png"
                  alt="Previous"
                  className="popup-image-nav-icon popup-image-nav-icon-prev"
                />
              </div>
            )}

            {imageLoading && (
              <div className="popup-quest-image-loading" />
            )}
            <img
              className={`popup-image popup-image-main ${imageLoading ? 'popup-image-loading popup-image-hidden' : 'popup-image-loaded'}`}
              src={resolvedImageSrc ?? undefined}
              alt={elementName}
              key={`${currentImageIndex}-${resolvedImageSrc ?? 'none'}`} // Force re-render when src changes
              style={{ 
                cursor: images.length > 0 ? 'pointer' : 'default' // Show pointer cursor if there are images to view
              }}
              onClick={(e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                  // Image clicked
                if (images.length > 0 && onOpenFullscreen) {
                  onOpenFullscreen(images, elementName, currentImageIndex);
                } else {
                  console.warn('No images available or no callback provided');
                }
              }}
              onLoad={() => {
                setImageLoading(false);
              }}
              onError={() => {
                console.error('Image failed to load:', resolvedImageSrc);
                setImageLoading(false);
              }}
            />

            {/* Next button - only show if multiple images */}
            {images.length > 1 && (
              <div
                className="popup-image-nav-button popup-image-nav-button-next"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                }}
              >
                <img
                  src="../../img/line-angle-right-icon.png"
                  alt="Next"
                  className="popup-image-nav-icon popup-image-nav-icon-next"
                />
              </div>
            )}

            {/* Image counter - only show if multiple images */}
            {images.length > 1 && (
              <div className="popup-image-counter">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}

            {isQuestIcon && isQuestActive && !isObjectiveCompleted && (
              <div className="popup-quest-action">
                <button
                  type="button"
                  className="popup-quest-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!quest) return;
                    const objectiveId = QuestDataStore.getObjectiveIdFromIconId(
                      quest.id,
                      String(icon.entity.id),
                    );
                    if (!objectiveId) {
                      return;
                    }
                    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
                    bridge?.updateProgression?.({
                      type: 'quest-objective',
                      questId: quest.id,
                      objectiveId,
                      isCompleted: true,
                    });
                  }}
                >
                  Mark objective as done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info sections */}
      {icon.entity.infoList && icon.entity.infoList.length > 0 && (
        <div>
          {icon.entity.infoList.map((info, index) => (
            <div key={index} className="popup-info-section-container">
              <div className="popup-info-title-container">
                <b className="popup-info-title-text">
                  {info.titleLocales?.['en'] || info.title || ''}
                </b>
              </div>
              <div className="popup-info-description-container">
                <b className="popup-info-description-text">
                  {info.descriptionLocales?.['en'] || info.description || ''}
                </b>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

