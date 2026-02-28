import React, { useEffect, useState } from 'react';
import { VersionDisplay } from '../shared/components/VersionDisplay';
import { WindowControlButton } from '../shared/components/WindowControlButton';
import { SecondScreenNavigationBar } from './SecondScreenNavigationBar';
import { WindowControls } from '../WindowControls';
import { MapPage } from '../shared/pages/MapPage';
import { ActiveQuestsPage } from '../shared/pages/quests/ActiveQuestsPage';
import { AdRunnerContainer } from '../shared/components/ads/AdRunnerContainer';
import { secondScreenAdsController } from './second-screen-ads-controller';
import { useUserStatusContext } from '../shared/context/UserStatusContext';
import { SecondScreenToggleHotkeyDisplay } from '../shared/components/hotkeys/SecondScreenToggleHotkeyDisplay';
import { OverwolfHotkeyDisplay } from '../shared/components/hotkeys/OverwolfHotkeyDisplay';
import { kHotkeys } from '../consts';
import { HotkeyModalHost } from '../shared/components/hotkeys/HotkeyModalHost';
import { WindowPositionReporter } from '../shared/components/WindowPositionReporter';
import { OfflineScreen } from '../shared/components/OfflineScreen';
import { useOnlineStatus } from '../shared/hooks/useOnlineStatus';

export const SecondScreenApp: React.FC = () => {
  const [activePageId, setActivePageId] = useState<string>('maps');
  const { status, isLoading: isBridgeLoading } = useUserStatusContext();
  const { isOnline, retryConnection } = useOnlineStatus();
  const subscriptionState = status?.subscription?.state;
  const isSubscribed =
    subscriptionState === 'ACTIVE' ||
    subscriptionState === 'PENDING_CANCELLATION';

  useEffect(() => {
    // Enable drag and prevent header drag when clicking buttons.
    WindowControls.move();
    WindowControls.propagation();
  }, []);

  useEffect(() => {
    if (typeof globalThis.dispatchEvent !== "function") {
      return;
    }
    globalThis.dispatchEvent(
      new CustomEvent("interactive-map-visibility", {
        detail: { visible: activePageId === "maps" },
      }),
    );
  }, [activePageId]);

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const detail = (event as CustomEvent).detail as { pageId?: string } | undefined;
      if (!detail?.pageId) {
        return;
      }
      if (detail.pageId === 'maps') {
        setActivePageId('maps');
      } else if (detail.pageId === 'quests') {
        setActivePageId('quests');
      }
    };
    globalThis.addEventListener('second-screen:navigate', handleNavigate);
    return () => globalThis.removeEventListener('second-screen:navigate', handleNavigate);
  }, []);

  useEffect(() => {
    if (isBridgeLoading) {
      return;
    }
    if (isSubscribed) {
      secondScreenAdsController.destroy();
      return;
    }
    secondScreenAdsController.start();
  }, [isBridgeLoading, isSubscribed]);

  return (
    <div className="second-screen-root">
      <WindowPositionReporter />
      <HotkeyModalHost />
      <header className="app-header screen-header">
        <div className="screen-header-left">
          <img
            className="screen-logo"
            src="../../icons/logo-256x256.png"
            alt="Marathon Companion"
          />
          <h1 className="screen-title">Marathon Companion</h1>
          <VersionDisplay />
        </div>
        <div className="screen-controls">
          <SecondScreenToggleHotkeyDisplay />
          <OverwolfHotkeyDisplay label="In-Game" hotkeyName={kHotkeys.toggle} />
          {/* <div className="second-screen-ad-controls">
            <AdsControlButtons
              onStart={() => secondScreenAdsController.start()}
              onStop={() => secondScreenAdsController.stop()}
              onDestroy={() => secondScreenAdsController.destroy()}
            />
          </div> */}
          <div id="react-window-control-minimize">
            <WindowControlButton type="minimize" />
          </div>
          <div id="react-window-control-maximize">
            <WindowControlButton type="maximize" />
          </div>
          <div id="react-window-control-close">
            <WindowControlButton type="close" />
          </div>
        </div>
      </header>

      <main className="second-screen-main">
        {isOnline === false ? (
          <OfflineScreen onRetry={retryConnection} />
        ) : (
          <>
            {isBridgeLoading && (
              <div className="screen-loading-overlay">
                <div className="screen-loading-card">
                  <div className="screen-loading-text">App Loading ...</div>
                  <div className="screen-loading-spinner" />
                </div>
              </div>
            )}
            <section className="second-screen-content">
              <div className="second-screen-nav">
                <SecondScreenNavigationBar
                  activePageId={activePageId}
                  onNavigate={setActivePageId}
                />
              </div>
              <div id="runner-container" className="second-screen-pages">
                <div
                  className="second-screen-page"
                  style={{
                    display: activePageId === 'maps' ? 'block' : 'none',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <MapPage allowQuestNavigation={false} />
                </div>
                <div
                  className="second-screen-page"
                  style={{
                    display: activePageId === 'quests' ? 'block' : 'none',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <ActiveQuestsPage />
                </div>
              </div>
            </section>

            {!isBridgeLoading && !isSubscribed && (
              <aside className="screen-ads">
                <AdRunnerContainer className="screen-ad-slot" />
              </aside>
            )}
          </>
        )}
      </main>
    </div>
  );
};
