type WindowPositionsBridge = {
  setWindowPosition?: (windowName: string, left: number, top: number) => void;
  applyWindowPosition?: (windowName: string) => Promise<boolean>;
};

const resolveBridge = (): WindowPositionsBridge | undefined => {
  try {
    const mainWindow = overwolf?.windows?.getMainWindow?.();
    return (mainWindow as any)?.backgroundBridge as WindowPositionsBridge | undefined;
  } catch {
    return undefined;
  }
};

export const WindowPositionClient = {
  setWindowPosition: (windowName: string, left: number, top: number): void => {
    const bridge = resolveBridge();
    bridge?.setWindowPosition?.(windowName, left, top);
  },
  applyWindowPosition: async (windowName: string): Promise<boolean> => {
    const bridge = resolveBridge();
    if (!bridge?.applyWindowPosition) {
      return false;
    }
    return bridge.applyWindowPosition(windowName);
  },
};
