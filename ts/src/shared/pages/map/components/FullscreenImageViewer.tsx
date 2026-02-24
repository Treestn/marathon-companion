/**
 * Fullscreen image viewer component
 * Renders images in fullscreen with navigation controls
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../map.css';
import { buildRenderableImageSrc } from '../../../utils/imageUrl';
import { createImageBlobFromFile, revokeObjectUrl } from '../../../utils/imageBlob';

interface FullscreenImageViewerProps {
  images: string[];
  currentIndex: number;
  elementName: string;
  container: HTMLElement;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({
  images,
  currentIndex,
  elementName,
  container,
  onClose,
  onPrevious,
  onNext
}) => {
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);

  const currentImage = images[currentIndex] ?? null;
  const isLocalFilePath = (path: string) =>
    /^file:\/\//i.test(path) || /^[a-zA-Z]:[\\/]/.test(path);
  const stripFileScheme = (path: string) =>
    path.replace(/^file:\/\//i, '').replace(/^\/+/, '');

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

    if (currentImage && isLocalFilePath(currentImage)) {
      loadLocalImage(currentImage).catch((error) => {
        console.warn('Local image load failed:', error);
        if (isActive) {
          setImageBlobUrl(null);
        }
      });
    }

    return () => {
      isActive = false;
      revokeObjectUrl(nextBlobUrl);
    };
  }, [currentImage]);

  const displayImageSrc = currentImage
    ? (imageBlobUrl ?? buildRenderableImageSrc(currentImage))
    : '';
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        onNext();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose, onPrevious, onNext]);

  return createPortal(
    <dialog
      className="fullscreen-viewer"
      open
      aria-label="Fullscreen image viewer"
    >
      <div className="fullscreen-viewer-backdrop" aria-hidden="true" />
      <div className="fullscreen-viewer-content">
        {/* Close button */}
        <button
          type="button"
          className="fullscreen-viewer-close-button"
          aria-label="Close image viewer"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <span className="fullscreen-viewer-close-icon">
            ×
          </span>
        </button>

        {/* Previous button */}
        {images.length > 1 && (
          <button
            type="button"
            className="fullscreen-viewer-nav-button fullscreen-viewer-nav-button-prev"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
          >
            <img
              src="../../img/line-angle-left-icon.png"
              alt="Previous"
              className="fullscreen-viewer-nav-icon fullscreen-viewer-nav-icon-prev"
            />
          </button>
        )}

        {/* Image */}
        <img
          src={displayImageSrc}
          alt={`${elementName} - ${currentIndex + 1}`}
          className="fullscreen-viewer-image"
        />

        {/* Next button */}
        {images.length > 1 && (
          <button
            type="button"
            className="fullscreen-viewer-nav-button fullscreen-viewer-nav-button-next"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <img
              src="../../img/line-angle-right-icon.png"
              alt="Next"
              className="fullscreen-viewer-nav-icon fullscreen-viewer-nav-icon-next"
            />
          </button>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="fullscreen-viewer-counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </dialog>,
    container
  );
};

