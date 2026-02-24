export type AutoCompleteModalTarget = {
  progressionType?: string;
};

type AutoCompleteModalOpenEvent = CustomEvent<AutoCompleteModalTarget>;

const OPEN_EVENT = "auto-complete-modal:open";

export const openAutoCompleteModal = (target: AutoCompleteModalTarget): void => {
  globalThis.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: target }));
};

export const subscribeAutoCompleteModalOpen = (
  handler: (target: AutoCompleteModalTarget) => void,
): (() => void) => {
  const listener = ((event: Event) => {
    const customEvent = event as AutoCompleteModalOpenEvent;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  }) as EventListener;

  globalThis.addEventListener(OPEN_EVENT, listener);
  return () => globalThis.removeEventListener(OPEN_EVENT, listener);
};
