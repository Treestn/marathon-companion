import { useMemo } from "react";

export type IconMappingEntry = {
  x: number;
  y: number;
  width: number;
  height: number;
  mask: boolean;
};

export type IconAtlas = {
  atlas: HTMLCanvasElement;
  mapping: Record<string, IconMappingEntry>;
  version: number;
};

type BuildOptions = {
  cellSize?: number; // icon drawn size
  padding?: number;  // space between cells (prevents bleeding)
  bgClear?: boolean; // clear canvas
};

export function buildAtlasFromImages(
  images: Map<string, HTMLImageElement>,
  opts: BuildOptions = {}
): IconAtlas | null {
  if (images.size === 0) return null;

  // Create a canvas to hold all icons
  const atlasCanvas = document.createElement('canvas');
  const ctx = atlasCanvas.getContext('2d');
  if (!ctx) return null;

  // Calculate atlas size (simple grid layout)
  const iconSize = 64; // Max size for each icon in atlas (reduced from 64)
  const iconsPerRow = Math.ceil(Math.sqrt(images.size));
  const atlasSize = iconsPerRow * iconSize;

  atlasCanvas.width = atlasSize;
  atlasCanvas.height = atlasSize;

  const iconMapping: { [key: string]: { x: number; y: number; width: number; height: number; mask: boolean } } = {};
  let index = 0;

  images.forEach((img, imagePath) => {
    const row = Math.floor(index / iconsPerRow);
    const col = index % iconsPerRow;
    const x = col * iconSize;
    const y = row * iconSize;

    // Draw image to atlas
    ctx.drawImage(img, x, y, iconSize, iconSize);

    // Create mapping entry
    iconMapping[imagePath] = {
      x,
      y,
      width: iconSize,
      height: iconSize,
      mask: false
    };

    index++;
  });

  return {
    atlas: atlasCanvas,
    mapping: iconMapping,
    version: Date.now()
  };
}

export function useIconAtlas(images: Map<string, HTMLImageElement>, imagesVersion: number, cellSize = 32) {
  return useMemo(() => {
    // Only build atlas if we have images
    if (!images || images.size === 0) {
      // Don't warn on initial render - images might still be loading
      return null;
    }
    
    const atlas = buildAtlasFromImages(images, { cellSize, padding: 2 });
    
    if (!atlas) {
      console.warn('[useIconAtlas] Failed to build atlas from', images.size, 'images');
      return null;
    }
    
    console.log('[useIconAtlas] Built atlas with', Object.keys(atlas.mapping).length, 'mappings, version', atlas.version);
    return atlas;
  }, [imagesVersion, cellSize, images.size]); // Include images.size to detect when images are added/removed
}
