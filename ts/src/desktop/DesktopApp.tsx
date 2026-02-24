import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WindowControls } from '../WindowControls';
import { useUserStatusContext } from '../shared/context/UserStatusContext';
import { mainWindowAdsController } from './desktop-ads-controller';
import { AppConfigClient } from '../shared/services/AppConfigClient';
import { getEnabledPages } from '../shared/pages/PageRegistry';
import { HotkeyModalHost } from '../shared/components/hotkeys/HotkeyModalHost';
import { WipeProgressionModalHost } from '../shared/components/modals/WipeProgressionModalHost';
import { ProgressionFileModalHost } from '../shared/components/modals/ProgressionFileModalHost';
import { AutoCompleteModalHost } from '../shared/components/modals/AutoCompleteModalHost';
import { ExternalLinkModalHost } from '../shared/components/modals/ExternalLinkModalHost';
import { ReviewSubmissionModalHost } from '../shared/components/modals/ReviewSubmissionModalHost';
import { WindowPositionReporter } from '../shared/components/WindowPositionReporter';
import { DesktopHeader } from './components/DesktopHeader';
import { DesktopMainContent } from './components/DesktopMainContent';
import { FirstTimeExperience } from './FirstTimeExperience';
import { OfflineScreen } from '../shared/components/OfflineScreen';
import { useOnlineStatus } from '../shared/hooks/useOnlineStatus';
import {
  NavigationTarget,
  subscribeNavigation,
} from '../shared/services/NavigationEvents';

type DesktopAppProps = {
  windowType?: 'desktop' | 'ingame';
};

type FirstTimeBridge = {
  getFirstTimeExperienceActive?: () => boolean;
  setFirstTimeExperienceActive?: (value: boolean) => void;
  onFirstTimeExperienceUpdated?: (handler: (value: boolean) => void) => () => void;
};

const resolveFirstTimeBridge = (): FirstTimeBridge | undefined => {
  const mainWindow = overwolf?.windows?.getMainWindow?.();
  return (mainWindow as any)?.backgroundBridge as FirstTimeBridge | undefined;
};

const useFirstTimeExperience = () => {
  const [isFirstTimeActive, setIsFirstTimeActive] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const loggedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    let retryTimeout: number | undefined;
    let unsubscribe: (() => void) | undefined;
    const maxAttempts = 50;
    const retryDelayMs = 100;

    const load = () => {
      const bridge = resolveFirstTimeBridge();
      if (!bridge?.getFirstTimeExperienceActive) {
        if (attempts < maxAttempts) {
          attempts += 1;
          retryTimeout = globalThis.setTimeout(load, retryDelayMs);
          return;
        }
        if (isMounted) {
          setIsFirstTimeActive(false);
          setIsReady(true);
        }
        return;
      }

      if (!isMounted) {
        return;
      }

      const next = bridge.getFirstTimeExperienceActive();
      setIsFirstTimeActive(next);
      if (!loggedRef.current) {
        loggedRef.current = true;
        console.log("[DesktopApp] firstTimeExperienceActive:", next);
      }
      unsubscribe = bridge.onFirstTimeExperienceUpdated?.((value) => {
        setIsFirstTimeActive(value);
      });
      setIsReady(true);
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

  const completeFirstTime = useCallback(() => {
    const bridge = resolveFirstTimeBridge();
    bridge?.setFirstTimeExperienceActive?.(false);
  }, []);

  return { isFirstTimeActive, isReady, completeFirstTime };
};

const DesktopLoadingScreen: React.FC = () => (
  <div className="screen-loading-overlay">
    <div className="screen-loading-card">
      <div className="screen-loading-text">App Loading ...</div>
      <div className="screen-loading-spinner" />
    </div>
  </div>
);

export const DesktopApp: React.FC<DesktopAppProps> = ({ windowType = 'desktop' }) => {
  const { status, isLoading: isBridgeLoading } = useUserStatusContext();
  const { isFirstTimeActive, isReady, completeFirstTime } = useFirstTimeExperience();
  const { isOnline, retryConnection } = useOnlineStatus();
  const subscriptionState = status?.subscription?.state;
  const isSubscribed =
    subscriptionState === 'ACTIVE' ||
    subscriptionState === 'PENDING_CANCELLATION';
  const [activePageId, setActivePageId] = useState('interactive-map');
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget | null>(
    null,
  );
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [sidePanelHotkey, setSidePanelHotkey] = useState('F1');
  const availablePages = useMemo(() => getEnabledPages(), []);
  const allowedPageIds = useMemo(
    () => new Set([...availablePages.map((page) => page.id), 'subscription']),
    [availablePages],
  );
  const canSelectPage = useCallback(
    (pageId: string) => allowedPageIds.has(pageId),
    [allowedPageIds],
  );

  const handleSelectPage = useCallback((pageId: string) => {
    if (!canSelectPage(pageId) || pageId === activePageId) {
      return;
    }
    globalThis.requestAnimationFrame(() => {
      startTransition(() => setActivePageId(pageId));
    });
  }, [activePageId, canSelectPage]);
  const sidePanelHotkeyUpper = useMemo(
    () => sidePanelHotkey.toUpperCase(),
    [sidePanelHotkey],
  );
  const toggleSidePanel = useCallback(() => {
    setIsSidePanelOpen((prev) => !prev);
  }, []);
  const scheduleToggleSidePanel = useCallback(() => {
    globalThis.requestAnimationFrame(() => {
      startTransition(toggleSidePanel);
    });
  }, [toggleSidePanel]);

  useEffect(() => {
    WindowControls.move();
    WindowControls.propagation();
  }, []);

  useEffect(() => {
    return subscribeNavigation((target) => {
      if (!canSelectPage(target.pageId)) {
        setActivePageId('interactive-map');
        setNavigationTarget(null);
        return;
      }
      setActivePageId(target.pageId);
      setNavigationTarget(target);
    });
  }, [canSelectPage]);

  useEffect(() => {
    let isMounted = true;
    AppConfigClient.waitForConfig().then((config) => {
      if (isMounted && config?.userSettings?.sidePageQuestHotkey) {
        setSidePanelHotkey(config.userSettings.sidePageQuestHotkey);
      }
    });
    const unsubscribe = AppConfigClient.subscribe((config) => {
      if (config?.userSettings?.sidePageQuestHotkey) {
        setSidePanelHotkey(config.userSettings.sidePageQuestHotkey);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSubscribed) {
      setIsSidePanelOpen(true);
    } else {
      setIsSidePanelOpen(false);
    }
  }, [isSubscribed]);

  useEffect(() => {
    if (isBridgeLoading) {
      return;
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (!sidePanelHotkeyUpper) {
        return;
      }
      if (event.key.toUpperCase() === sidePanelHotkeyUpper) {
        scheduleToggleSidePanel();
      }
    };
    globalThis.addEventListener('keyup', handleKeyUp);
    return () => {
      globalThis.removeEventListener('keyup', handleKeyUp);
    };
  }, [isBridgeLoading, sidePanelHotkeyUpper, scheduleToggleSidePanel]);

  useEffect(() => {
    if (isBridgeLoading) {
      return;
    }
    if (isSubscribed) {
      mainWindowAdsController.destroy();
      return;
    }
    mainWindowAdsController.start();
  }, [isBridgeLoading, isSubscribed]);

  const isPageReady = isReady && !isBridgeLoading;
  const shouldShowFirstTime = isReady && isFirstTimeActive;
  const renderContent = () => {
    // Show offline screen when we know we're offline (isOnline === false)
    if (isOnline === false) {
      return <OfflineScreen onRetry={retryConnection} />;
    }

    if (isPageReady) {
      if (shouldShowFirstTime) {
        return <FirstTimeExperience onComplete={completeFirstTime} />;
      }
      return (
        <DesktopMainContent
          activePageId={activePageId}
          onSelectPage={handleSelectPage}
          availablePages={availablePages}
          navigationTarget={navigationTarget}
          onNavigationHandled={() => setNavigationTarget(null)}
          isBridgeLoading={isBridgeLoading}
          isSubscribed={isSubscribed}
          isSidePanelOpen={isSidePanelOpen}
        />
      );
    }

    return <DesktopLoadingScreen />;
  };

  return (
    <div className="main-root">
      <WindowPositionReporter />
      <HotkeyModalHost />
      <WipeProgressionModalHost />
      <ProgressionFileModalHost />
      <AutoCompleteModalHost />
      <ExternalLinkModalHost />
      <ReviewSubmissionModalHost />
      <DesktopHeader
        windowType={windowType}
        isFirstTimeActive={isFirstTimeActive}
      />
      {renderContent()}
    </div>
  );
};
