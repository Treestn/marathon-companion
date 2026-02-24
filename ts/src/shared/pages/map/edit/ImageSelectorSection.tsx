import React, { useState } from "react";
import { buildRenderableImageSrc } from "../../../utils/imageUrl";

type ImageSelectorProps = {
  selectedImages: Array<{ path: string; previewUrl: string }>;
  imageSelectionError: string | null;
  isDisabled?: boolean;
  onSelectImage: () => void;
  onRemoveImage: (path: string) => void;
  onMoveImageUp: (path: string) => void;
  onMoveImageDown: (path: string) => void;
};

export const ImageSelector: React.FC<ImageSelectorProps> = ({
  selectedImages,
  imageSelectionError,
  isDisabled = false,
  onSelectImage,
  onRemoveImage,
  onMoveImageUp,
  onMoveImageDown,
}) => {
  const [hoveredImage, setHoveredImage] = useState<{
    path: string;
    previewUrl: string;
    top: number;
    left: number;
  } | null>(null);

  return (
    <>
      <div className="map-edit-field-label">Images</div>
      {selectedImages.length > 0 && (
        <div className="map-edit-image-list">
          {selectedImages.map((image, index) => {
            const fileUrl = buildRenderableImageSrc(image.path);
            const showPopup = (element: HTMLElement) => {
              const rect = element.getBoundingClientRect();
              const popupWidth = 400;
              const popupHeight = 240;
              const leftGap = 40;
              const top = Math.max(
                popupHeight / 2 + 8,
                Math.min(
                  window.innerHeight - popupHeight / 2 - 8,
                  rect.top + rect.height / 2
                )
              );
              const left = Math.max(8, rect.left - popupWidth - leftGap);
              setHoveredImage({
                path: image.path,
                previewUrl: image.previewUrl,
                top,
                left,
              });
            };

            return (
              <div key={image.path} className="map-edit-image-path">
                <button
                  type="button"
                  className="map-edit-image-preview"
                  onMouseEnter={(event) => showPopup(event.currentTarget)}
                  onMouseLeave={() => setHoveredImage(null)}
                  onFocus={(event) => showPopup(event.currentTarget)}
                  onBlur={() => setHoveredImage(null)}
                  aria-label={`Preview image ${image.path}`}
                >
                  <img
                    src={image.previewUrl}
                    alt="Selected upload"
                    onError={(event) => {
                      const target = event.target as HTMLImageElement;
                      if (target.src !== fileUrl) {
                        target.src = fileUrl;
                      }
                    }}
                  />
                </button>
                <span className="map-edit-image-path-text">{image.path}</span>
                <div className="map-edit-image-controls">
                  {index > 0 && (
                    <button
                      type="button"
                      className="map-edit-image-move"
                      disabled={isDisabled}
                      onClick={() => onMoveImageUp(image.path)}
                      aria-label={`Move image up ${image.path}`}
                    >
                      ▲
                    </button>
                  )}
                  <button
                    type="button"
                    className="map-edit-image-remove"
                    disabled={isDisabled}
                    onClick={() => onRemoveImage(image.path)}
                    aria-label={`Remove image ${image.path}`}
                  >
                    ×
                  </button>
                  {index < selectedImages.length - 1 && (
                    <button
                      type="button"
                      className="map-edit-image-move"
                      disabled={isDisabled}
                      onClick={() => onMoveImageDown(image.path)}
                      aria-label={`Move image down ${image.path}`}
                    >
                      ▼
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {hoveredImage && (
        <div
          className="map-edit-image-popup-fixed"
          style={{ top: hoveredImage.top, left: hoveredImage.left }}
        >
          <img
            src={hoveredImage.previewUrl}
            alt="Selected upload preview"
            onError={(event) => {
              const target = event.target as HTMLImageElement;
              const fallbackUrl = buildRenderableImageSrc(hoveredImage.path);
              if (target.src !== fallbackUrl) {
                target.src = fallbackUrl;
              }
            }}
          />
        </div>
      )}
      {imageSelectionError && <div className="map-edit-image-error">{imageSelectionError}</div>}
      <button
        type="button"
        className="map-edit-image-button"
        onClick={onSelectImage}
        disabled={isDisabled}
      >
        Select From File, Max 8MB, 16/9
      </button>
    </>
  );
};
