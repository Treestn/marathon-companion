export type HotkeyModalTarget =
  | {
      kind: "overwolf";
      hotkeyName: string;
      label?: string;
    }
  | {
      kind: "side-quest";
      label?: string;
    };

export type HotkeyAssignedDetail =
  | { kind: "overwolf"; hotkeyName: string; value: string }
  | { kind: "side-quest"; value: string };

type HotkeyOpenEvent = CustomEvent<HotkeyModalTarget>;
type HotkeyAssignedEvent = CustomEvent<HotkeyAssignedDetail>;

const OPEN_EVENT = "hotkey-modal:open";
const ASSIGNED_EVENT = "hotkey-modal:assigned";

/**
 * Get the background window's global context, used as a cross-window event bus.
 * All Overwolf windows can access this via getMainWindow().
 */
const getBackgroundGlobal = (): typeof globalThis | null => {
  try {
    const mainWindow = overwolf?.windows?.getMainWindow?.();
    return (mainWindow as typeof globalThis) ?? null;
  } catch {
    return null;
  }
};

export const openHotkeyModal = (target: HotkeyModalTarget): void => {
  globalThis.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: target }));
};

export const subscribeHotkeyModalOpen = (
  handler: (target: HotkeyModalTarget) => void,
): (() => void) => {
  const listener = ((event: Event) => {
    const customEvent = event as HotkeyOpenEvent;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  }) as EventListener;

  globalThis.addEventListener(OPEN_EVENT, listener);
  return () => globalThis.removeEventListener(OPEN_EVENT, listener);
};

/**
 * Dispatch a hotkey-assigned event both locally and on the background window
 * so every window (in-game, second screen, desktop) can react.
 */
export const dispatchHotkeyAssigned = (detail: HotkeyAssignedDetail): void => {
  // Local dispatch (for components in the same window)
  globalThis.dispatchEvent(new CustomEvent(ASSIGNED_EVENT, { detail }));

  // Cross-window dispatch via the background window
  const bg = getBackgroundGlobal();
  if (bg && bg !== globalThis) {
    bg.dispatchEvent(new CustomEvent(ASSIGNED_EVENT, { detail }));
  }
};

/**
 * Subscribe to hotkey-assigned events, listening both locally and on the
 * background window to catch cross-window updates.
 */
export const subscribeHotkeyAssigned = (
  handler: (detail: HotkeyAssignedDetail) => void,
): (() => void) => {
  const listener = ((event: Event) => {
    const customEvent = event as HotkeyAssignedEvent;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  }) as EventListener;

  // Listen locally
  globalThis.addEventListener(ASSIGNED_EVENT, listener);

  // Also listen on the background window for cross-window events
  const bg = getBackgroundGlobal();
  const hasBg = bg != null && bg !== globalThis;
  if (hasBg) {
    bg.addEventListener(ASSIGNED_EVENT, listener);
  }

  return () => {
    globalThis.removeEventListener(ASSIGNED_EVENT, listener);
    if (hasBg) {
      bg.removeEventListener(ASSIGNED_EVENT, listener);
    }
  };
};
