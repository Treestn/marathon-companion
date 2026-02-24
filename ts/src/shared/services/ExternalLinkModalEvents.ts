export type ExternalLinkTarget = {
  url: string;
  label?: string;
};

type ExternalLinkHandler = (target: ExternalLinkTarget) => void;

const handlers = new Set<ExternalLinkHandler>();

export const openExternalLinkModal = (target: ExternalLinkTarget): void => {
  handlers.forEach((handler) => handler(target));
};

export const subscribeExternalLinkModalOpen = (
  handler: ExternalLinkHandler,
): (() => void) => {
  handlers.add(handler);
  return () => handlers.delete(handler);
};
