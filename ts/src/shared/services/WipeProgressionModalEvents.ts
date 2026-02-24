export type WipeProgressionTarget = {
  progressionType: string;
};

type WipeProgressionOpenEvent = CustomEvent<WipeProgressionTarget>;

const OPEN_EVENT = "wipe-progression-modal:open";

export const openWipeProgressionModal = (target: WipeProgressionTarget): void => {
  globalThis.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: target }));
};

export const subscribeWipeProgressionModalOpen = (
  handler: (target: WipeProgressionTarget) => void,
): (() => void) => {
  const listener = ((event: Event) => {
    const customEvent = event as WipeProgressionOpenEvent;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  }) as EventListener;

  globalThis.addEventListener(OPEN_EVENT, listener);
  return () => globalThis.removeEventListener(OPEN_EVENT, listener);
};
