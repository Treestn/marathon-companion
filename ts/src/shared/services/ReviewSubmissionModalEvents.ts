// ---------------------------------------------------------------------------
// Simple pub/sub for opening the Review & Submit modal
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners: Listener[] = [];

export const emitOpenReviewModal = () => {
  for (const fn of listeners) fn();
};

export const subscribeReviewModalOpen = (fn: Listener): (() => void) => {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
};
