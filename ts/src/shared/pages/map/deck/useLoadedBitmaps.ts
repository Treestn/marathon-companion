// deck/useLoadedBitmaps.ts
import { useEffect, useRef, useState } from "react";

type Options = {
  cacheBust?: boolean;
};

export function useLoadedBitmaps(paths: string[], opts: Options = {}) {
  const { cacheBust = false } = opts;
  const [bitmaps, setBitmaps] = useState<Map<string, ImageBitmap>>(new Map());
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const lastKeyRef = useRef("");

  useEffect(() => {
    const key = paths.slice().sort().join("|");
    if (!key || key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const next = new Map<string, ImageBitmap>();

      await Promise.all(
        paths.map(async (p) => {
          try {
            const url = cacheBust ? `${p}${p.includes("?") ? "&" : "?"}v=${Date.now()}` : p;

            // data: URIs work too
            const res = await fetch(url, { mode: "cors" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const blob = await res.blob();
            const bmp = await createImageBitmap(blob);
            next.set(p, bmp);
          } catch (e) {
            // Skip bad images (do NOT draw them into the atlas)
            console.warn("❌ failed to load/decode bitmap", p, e);
          }
        })
      );

      if (cancelled) return;
      setBitmaps(next);
      setVersion((v) => v + 1);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
      // optional: close old bitmaps to release memory
      // bitmaps.forEach(b => b.close());
    };
    // only re-run when paths meaningfully change
  }, [paths.join("|")]);

  return { bitmaps, version, isLoading };
}
