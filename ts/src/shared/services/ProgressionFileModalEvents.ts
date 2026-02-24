export type ProgressionFileModalTarget =
  | { mode: "save" }
  | { mode: "import" };

type ProgressionFileModalOpenEvent = CustomEvent<ProgressionFileModalTarget>;

const OPEN_EVENT = "progression-file-modal:open";

export const openSaveProgressionModal = (): void => {
  globalThis.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { mode: "save" } }));
};

export const openImportProgressionModal = (): void => {
  globalThis.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { mode: "import" } }));
};

export const subscribeProgressionFileModalOpen = (
  handler: (target: ProgressionFileModalTarget) => void,
): (() => void) => {
  const listener = ((event: Event) => {
    const customEvent = event as ProgressionFileModalOpenEvent;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  }) as EventListener;

  globalThis.addEventListener(OPEN_EVENT, listener);
  return () => globalThis.removeEventListener(OPEN_EVENT, listener);
};
