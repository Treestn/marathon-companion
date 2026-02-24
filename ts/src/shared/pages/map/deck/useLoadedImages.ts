import { useEffect, useRef, useState } from "react";

type Options = {
  crossOrigin?: string;
  cacheBust?: boolean;
};


export function useLoadedImages(paths: string[], opts: Options = {}) {
  const { crossOrigin = "anonymous", cacheBust = false } = opts;

  const [images, setImages] = useState<Map<string, HTMLImageElement>>(
    () => new Map()
  );
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    // Create stable key from paths
    const key = Array.from(new Set(paths)).sort().join("|");
    
    // Don't reload if key hasn't changed
    if (key === lastKeyRef.current) {
      return;
    }
    
    // Handle empty paths
    if (!paths.length || key === "") {
      if (lastKeyRef.current !== "") {
        lastKeyRef.current = "";
        setImages(new Map());
        setVersion((v) => v + 1);
        setIsLoading(false);
      }
      return;
    }
    
    // Store the key for this load operation
    const loadKey = key;
    lastKeyRef.current = key;

    setIsLoading(true);

    const next = new Map<string, HTMLImageElement>();
    const uniquePaths = Array.from(new Set(paths));
    let remaining = uniquePaths.length;

    const doneOne = () => {
      remaining--;
      // Only update if this is still the current load (key hasn't changed)
      if (remaining <= 0 && lastKeyRef.current === loadKey) {
        setImages(next);
        setVersion((v) => v + 1);
        setIsLoading(false);
        console.log('[useLoadedImages] Loaded', next.size, 'images out of', uniquePaths.length, 'paths');
      }
    };

    for (const originalPath of uniquePaths) {
      const img = new Image();
      img.crossOrigin = crossOrigin;

      img.onload = () => {
        // Only add if this is still the current load
        if (lastKeyRef.current === loadKey) {
          next.set(originalPath, img); // IMPORTANT: key = originalPath
        }
        doneOne();
      };
      img.onerror = () => {
        console.warn("failed to load", originalPath);
        doneOne();
      };

      const url =
        cacheBust && !originalPath.startsWith("data:")
          ? `${originalPath}${originalPath.includes("?") ? "&" : "?"}v=${Date.now()}`
          : originalPath;

      img.src = url; // IMPORTANT: request URL can differ, key does not
    }
  }, [paths, crossOrigin, cacheBust]);

  return { images, version, isLoading };
}

export function createIconAtlas(images: Map<string, HTMLImageElement>) {
  if (images.size === 0) return null;

  // Create a canvas to hold all icons
  const atlasCanvas = document.createElement('canvas');
  const ctx = atlasCanvas.getContext('2d');
  if (!ctx) return null;

  // Calculate atlas size (simple grid layout)
  const iconSize = 32; // Max size for each icon in atlas (reduced from 64)
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
    mapping: iconMapping
  };
};