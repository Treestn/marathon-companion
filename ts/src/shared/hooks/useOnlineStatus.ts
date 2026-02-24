import { useCallback, useEffect, useState } from "react";

type OnlineBridge = {
  getIsOnline?: () => boolean;
  onOnlineStatusChanged?: (handler: (isOnline: boolean) => void) => () => void;
};

const resolveOnlineBridge = (): OnlineBridge | undefined => {
  const mainWindow = overwolf?.windows?.getMainWindow?.();
  return (mainWindow as any)?.backgroundBridge as OnlineBridge | undefined;
};

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    let retryTimeout: number | undefined;
    let unsubscribe: (() => void) | undefined;
    const maxAttempts = 50;
    const retryDelayMs = 100;

    const load = () => {
      const bridge = resolveOnlineBridge();
      if (!bridge?.getIsOnline) {
        if (attempts < maxAttempts) {
          attempts += 1;
          retryTimeout = globalThis.setTimeout(load, retryDelayMs);
          return;
        }
        // If we can't resolve the bridge, assume online to avoid blocking
        if (isMounted) {
          setIsOnline(true);
        }
        return;
      }

      if (!isMounted) {
        return;
      }

      setIsOnline(bridge.getIsOnline());
      unsubscribe = bridge.onOnlineStatusChanged?.((value) => {
        setIsOnline(value);
      });
    };

    load();

    return () => {
      isMounted = false;
      if (retryTimeout) {
        globalThis.clearTimeout(retryTimeout);
      }
      unsubscribe?.();
    };
  }, []);

  const retryConnection = useCallback(() => {
    const bridge = resolveOnlineBridge();
    if (bridge?.getIsOnline) {
      setIsOnline(bridge.getIsOnline());
    }
  }, []);

  return { isOnline, retryConnection };
};
