export type NavigationTarget =
  | { pageId: "interactive-map" }
  | { pageId: "quests"; questId: string }
  | { pageId: "hideout"; stationId?: string; levelId?: string }
  | { pageId: "trading" }
  | {
      pageId: "items-needed";
      itemId?: string;
      filters?: {
        trackingOnly?: boolean;
        missingOnly?: boolean;
        includeQuests?: boolean;
        includeHideout?: boolean;
      };
    };

type NavigationEvent = CustomEvent<NavigationTarget>;

const EVENT_NAME = "desktop:navigate";

export const dispatchDesktopNavigation = (target: NavigationTarget): void => {
  globalThis.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: target }));
};

export const subscribeNavigation = (
  handler: (target: NavigationTarget) => void,
): (() => void) => {
  const listener = ((event: Event) => {
    const customEvent = event as NavigationEvent;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  }) as EventListener;

  globalThis.addEventListener(EVENT_NAME, listener);
  return () => globalThis.removeEventListener(EVENT_NAME, listener);
};
