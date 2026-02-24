import React, { useMemo } from "react";
import { MainNavigationBar } from "../../shared/components/navigation/MainNavigationBar";
import { MapPage } from "../../shared/pages/MapPage";
import { SubscriptionPage } from "../../shared/pages/subscription/SubscriptionPage";
import { QuestsPage } from "../../shared/pages/quests/QuestsPage";
import { ItemsPage } from "../../shared/pages/items/ItemsPage";
import { SettingsPage } from "../../shared/pages/settings/SettingsPage";
import { AdRunnerContainer } from "../../shared/components/ads/AdRunnerContainer";
import { SubscribedSidePanel } from "../../shared/components/ads/SubscribedSidePanel";
import { NavigationTarget } from "../../shared/services/NavigationEvents";
import { PageConfig } from "../../shared/pages/PageRegistry";

type DesktopMainContentProps = {
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  availablePages: PageConfig[];
  navigationTarget: NavigationTarget | null;
  onNavigationHandled: () => void;
  isBridgeLoading: boolean;
  isSubscribed: boolean;
  isSidePanelOpen: boolean;
};

export const useDesktopMainContent = (activePageId: string) => {
  const mapWrapperStyle = useMemo(
    () => ({
      position: "absolute" as const,
      inset: 0,
      width: "100%",
      height: "100%",
      visibility: activePageId === "interactive-map" ? ("visible" as const) : ("hidden" as const),
      opacity: activePageId === "interactive-map" ? 1 : 0,
      pointerEvents: activePageId === "interactive-map" ? ("auto" as const) : ("none" as const),
    }),
    [activePageId],
  );

  return { mapWrapperStyle };
};

export const DesktopMainContent: React.FC<DesktopMainContentProps> = ({
  activePageId,
  onSelectPage,
  availablePages,
  navigationTarget,
  onNavigationHandled,
  isBridgeLoading,
  isSubscribed,
  isSidePanelOpen,
}) => {
  const { mapWrapperStyle } = useDesktopMainContent(activePageId);

  return (
    <main id="main-window" className="page-main">
      {isBridgeLoading && (
        <div className="screen-loading-overlay">
          <div className="screen-loading-card">
            <div className="screen-loading-text">App Loading ...</div>
            <div className="screen-loading-spinner" />
          </div>
        </div>
      )}
      <section id="main-page-div" className="main-screen-content">
        <MainNavigationBar
          activePageId={activePageId}
          onSelectPage={onSelectPage}
          pages={availablePages}
        />
        <div id="runner-container" className="main-runner-container">
          <div style={mapWrapperStyle}>
            <MapPage allowQuestNavigation />
          </div>
          {activePageId === "quests" && (
            <QuestsPage
              navigationTarget={navigationTarget}
              onNavigationHandled={onNavigationHandled}
            />
          )}
          {activePageId === "items-needed" && (
            <ItemsPage
              navigationTarget={navigationTarget}
              onNavigationHandled={onNavigationHandled}
            />
          )}
          {activePageId === "subscription" && <SubscriptionPage />}
          {activePageId === "settings" && (
            <SettingsPage onClose={() => onSelectPage("interactive-map")} />
          )}
          {!isSubscribed && (
            <div className={`side-panel-overlay${isSidePanelOpen ? " is-open" : ""}`}>
              <SubscribedSidePanel />
            </div>
          )}
        </div>
      </section>

      {!isBridgeLoading && (
        <aside
          className={`screen-ads${isSubscribed ? " is-collapsible" : ""}${
            isSubscribed && !isSidePanelOpen ? " is-collapsed" : ""
          }`}
        >
          {isSubscribed ? (
            <SubscribedSidePanel className="screen-ad-slot" />
          ) : (
            <AdRunnerContainer className="screen-ad-slot" />
          )}
        </aside>
      )}
    </main>
  );
};
