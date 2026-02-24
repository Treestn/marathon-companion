// deck/useMapboxOverlay.ts
import { useEffect, useRef } from "react";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Map as MapLibreMap } from "maplibre-gl";

type Params = {
  map: MapLibreMap | null;
  interleaved?: boolean;
  handlers?: {
    onHover?: (info: any) => void;
    onClick?: (info: any, event: any) => void;
  };
  onReady?: () => void;
};

function hasStyle(map: MapLibreMap) {
  try {
    const style = map.getStyle?.();
    // style exists and has at least something
    return !!style && Array.isArray(style.layers) && style.layers.length > 0;
  } catch {
    return false;
  }
}

export function useMapboxOverlay({ map, interleaved = true, handlers, onReady }: Params) {
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    const attach = () => {
      if (cancelled) return;
      if (overlayRef.current) return;

      // Don't attach without a style
      if (!hasStyle(map)) return;

      const overlay = new MapboxOverlay({
        interleaved,
        onHover: (info) => handlers?.onHover?.(info),
        onClick: (info, event) => handlers?.onClick?.(info, event),
      });

      map.addControl(overlay);
      overlayRef.current = overlay;
      onReadyRef.current?.();
    };

    // Try now
    attach();

    // If style isn't ready yet, wait for it
    const onStyleData = () => attach();
    const onLoad = () => attach();

    map.on("styledata", onStyleData);
    map.on("load", onLoad);

    return () => {
      cancelled = true;
      map.off("styledata", onStyleData);
      map.off("load", onLoad);

      const overlay = overlayRef.current;
      if (overlay) {
        try {
          // Clear layers first to avoid render on disposed map.
          overlay.setProps({ layers: [] });
        } catch {}
        try { map.removeControl(overlay); } catch {}
        try { overlay.finalize?.(); } catch {}
        overlayRef.current = null;
      }
    };
  }, [map, interleaved]); // IMPORTANT: not handlers/onReady

  // Update handlers without recreating overlay
  useEffect(() => {
    if (!overlayRef.current) return;
    overlayRef.current.setProps({
      onHover: (info: any) => handlers?.onHover?.(info),
      onClick: (info: any, event: any) => handlers?.onClick?.(info, event),
    });
  }, [handlers]);

  return overlayRef;
}
