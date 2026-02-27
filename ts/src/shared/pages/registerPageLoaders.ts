/**
 * Register all page loaders
 * This centralizes the page loading logic and makes it easy to add new pages
 */

import { pageLoader } from './PageLoader';
import { NavigationUtils } from '../../escape-from-tarkov/utils/NavigationUtils';
import { SidePageQuestRequest } from '../../escape-from-tarkov/page/side/handlers/request/SidePageQuestRequest';
import { EventConst } from '../../escape-from-tarkov/events/EventConst';
import { DataEventConst } from '../../escape-from-tarkov/events/DataEventConst';
import { MapPageMediator } from '../../escape-from-tarkov/page/map/MapPageMediator';
import { QuestPageMediator } from '../../escape-from-tarkov/page/quests/QuestPageMediator';
import { HideoutPageMediator } from '../../escape-from-tarkov/page/hideout/HideoutPageMediator';
import { ItemsPageMediator } from '../../escape-from-tarkov/page/items/ItemsPageMediator';
import { QuestSidePageMediator } from '../../escape-from-tarkov/page/side/QuestSidePageMediator';
import { TradingPage } from './TradingPage';
import { ExpeditionPage } from './ExpeditionPage';
import { MapEventsPage } from './MapEventsPage';
import { MapPage } from './MapPage';
import { RunnersPage } from './RunnersPage';
import { SubscriptionPage } from './subscription/SubscriptionPage';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AppConfigClient } from '../services/AppConfigClient';
import { QuestsUtils } from '../../escape-from-tarkov/page/quests/utils/QuestsUtils';
import { QuestPageUtils } from '../../escape-from-tarkov/page/quests/utils/QuestPageUtils';

interface PageLoaderMediators {
  mapPageMediator: MapPageMediator;
  questsPageMediator: QuestPageMediator;
  hideoutPageMediator: HideoutPageMediator;
  itemsPageMediator: ItemsPageMediator;
  sidePageMediator: QuestSidePageMediator;
}

const setInteractiveMapVisibility = (visible: boolean) => {
  const win = typeof globalThis !== 'undefined' ? (globalThis as any).window : undefined;
  if (!win || typeof win.dispatchEvent !== 'function') return;
  win.dispatchEvent(
    new CustomEvent('interactive-map-visibility', { detail: { visible } })
  );
};

const hideInteractiveMapContainer = () => {
  setInteractiveMapVisibility(false);
  const win = typeof globalThis !== 'undefined' ? (globalThis as any).window : undefined;
  const interactiveMapContainer = win
    ? (win as any).__interactiveMapContainer as HTMLDivElement | null
    : null;
  if (interactiveMapContainer) {
    interactiveMapContainer.style.display = 'none';
    interactiveMapContainer.style.visibility = 'hidden';
    // Detach from DOM but keep reference
    interactiveMapContainer.remove();
  }
};

const setSubscriptionNavActive = (active: boolean) => {
  const subscriptionButton = document.getElementById('subscriptionButton');
  if (!subscriptionButton) return;
  subscriptionButton.classList.toggle('page-icon-container-active', active);
  const iconContainer = subscriptionButton.querySelector('.page-icon-image-container');
  if (iconContainer instanceof HTMLElement) {
    iconContainer.classList.toggle('page-icon-image-container-active', active);
  }
};

/**
 * Helper to create and update side page quest request
 */
const updateSidePageQuests = (mediators: PageLoaderMediators) => {
  const request = new SidePageQuestRequest(
    null,
    mediators.mapPageMediator,
    mediators.questsPageMediator,
    EventConst.QUEST_UPDATE,
    DataEventConst.QUEST_MAP_FILTER,
    null
  );
  mediators.sidePageMediator.update(request);
};

/**
 * Register page loaders for all pages
 * Call this after mediators are initialized in EftMain.start()
 * @param mediators - The page mediators that will be used to load pages
 */
export const registerPageLoaders = (mediators: PageLoaderMediators) => {
  console.log('[registerPageLoaders] Function called with mediators:', mediators);
  
  // Validate that all required mediators are provided
  if (!mediators.mapPageMediator) {
    console.error('[registerPageLoaders] mapPageMediator is undefined');
    return; // Don't register if mediators are missing
  }
  if (!mediators.questsPageMediator) {
    console.error('[registerPageLoaders] questsPageMediator is undefined');
    return;
  }
  if (!mediators.hideoutPageMediator) {
    console.error('[registerPageLoaders] hideoutPageMediator is undefined');
    return;
  }
  if (!mediators.itemsPageMediator) {
    console.error('[registerPageLoaders] itemsPageMediator is undefined');
    return;
  }
  if (!mediators.sidePageMediator) {
    console.error('[registerPageLoaders] sidePageMediator is undefined');
    return;
  }
  
  console.log('[registerPageLoaders] All mediators validated, registering page loaders...');
  
  // Register Maps page (React-based)
  let mapsPageRoot: Root | null = null;

  pageLoader.register('maps', async (params?: { mapId?: string }) => {
    if (!mediators.mapPageMediator) {
      throw new Error('mapPageMediator is not initialized');
    }
    NavigationUtils.removeiFrames();
    NavigationUtils.saveActivePage();
    
    // Hide interactive-map container if it exists (preserve it instead of removing)
    hideInteractiveMapContainer();

    if (params?.mapId) {
      AppConfigClient.updateConfig({
        userSettings: { mapDefaultPreference: params.mapId },
      });
        AppConfigClient.updateConfig({
          userSettings: { mapDefaultPreference: params.mapId },
        });
    }

    // Clean up existing React root if it exists
    if (mapsPageRoot) {
      mapsPageRoot.unmount();
      mapsPageRoot = null;
    }

    // Remove any existing map runner container
    const existingContainer = document.getElementById('maps-runner');
    if (existingContainer) {
      existingContainer.remove();
    }

    const runner = document.getElementById('runner-container');
    if (runner) {
      // Remove other main-runner-container elements (but preserve interactive-map)
      const existingRunners = document.getElementsByClassName('main-runner-container');
      Array.from(existingRunners).forEach(runnerEl => {
        if (runnerEl.id !== 'interactive-map-runner') {
          runnerEl.remove();
        }
      });

      const mapDiv = document.createElement('div');
      mapDiv.id = 'maps-runner';
      mapDiv.className = 'map-container main-runner-container';
      mapDiv.style.width = '100%';
      mapDiv.style.height = '100%';

      const sidePageContainer = document.getElementsByClassName('side-page-container')[0];
      if (sidePageContainer) {
        runner.insertBefore(mapDiv, sidePageContainer);
      } else {
        runner.appendChild(mapDiv);
      }

      mapsPageRoot = createRoot(mapDiv);
      mapsPageRoot.render(
        React.createElement(React.StrictMode, null,
          React.createElement(MapPage)
        )
      );
    }

    updateSidePageQuests(mediators);
  });

  // Register Quests page
  pageLoader.register('quests', async (params?: { questId?: string }) => {
    if (!mediators.questsPageMediator) {
      throw new Error('questsPageMediator is not initialized');
    }
    NavigationUtils.removeiFrames();
    NavigationUtils.saveActivePage();
    
    // Hide interactive-map container if it exists (preserve it instead of removing)
    hideInteractiveMapContainer();
    
    // Active state is now handled by React NavigationBar component
    await mediators.questsPageMediator.load();
    updateSidePageQuests(mediators);
    
    // If questId is provided, display that specific quest
    if (params?.questId) {

      const quest = QuestsUtils.getQuestFromID(params.questId);
      if (quest) {
        // Wait a bit for the page to fully load before displaying the quest
        setTimeout(() => {
          QuestPageUtils.displayQuestOnly(quest);
        }, 100);
      }
    }
  });

  // Register Hideout page
  pageLoader.register('hideout', async () => {
    if (!mediators.hideoutPageMediator) {
      throw new Error('hideoutPageMediator is not initialized');
    }
    NavigationUtils.removeiFrames();
    NavigationUtils.saveActivePage();
    
    // Hide interactive-map container if it exists (preserve it instead of removing)
    hideInteractiveMapContainer();
    
    // Active state is now handled by React NavigationBar component
    await mediators.hideoutPageMediator.load();
    updateSidePageQuests(mediators);
  });

  // Register Items Needed page
  pageLoader.register('items-needed', async () => {
    if (!mediators.itemsPageMediator) {
      throw new Error('itemsPageMediator is not initialized');
    }
    NavigationUtils.removeiFrames();
    NavigationUtils.saveActivePage();
    
    // Hide interactive-map container if it exists (preserve it instead of removing)
    hideInteractiveMapContainer();
    
    // Active state is now handled by React NavigationBar component
    await mediators.itemsPageMediator.load();
    updateSidePageQuests(mediators);
  });

  // Register Trading page (React-based)
  // Store the React root to allow proper cleanup
  let tradingPageRoot: Root | null = null;
  
  pageLoader.register('trading', async () => {
    NavigationUtils.removeiFrames();
    NavigationUtils.saveActivePage();
    
    // Hide interactive-map container if it exists (preserve it instead of removing)
    hideInteractiveMapContainer();
    
    // Clean up existing React root if it exists
    if (tradingPageRoot) {
      tradingPageRoot.unmount();
      tradingPageRoot = null;
    }
    
    // Remove any existing trading page container
    const existingContainer = document.getElementById('trading-runner');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create container for Trading page
    const runner = document.getElementById('runner-container');
    if (runner) {
      // Remove other main-runner-container elements (but preserve interactive-map)
      const existingRunners = document.getElementsByClassName('main-runner-container');
      Array.from(existingRunners).forEach(runnerEl => {
        if (runnerEl.id !== 'interactive-map-runner') {
          runnerEl.remove();
        }
      });
      
      // Create new container for Trading page
      const tradingDiv = document.createElement('div');
      tradingDiv.id = 'trading-runner';
      tradingDiv.className = 'trading-container main-runner-container';
      tradingDiv.style.width = '100%';
      tradingDiv.style.height = '100%';
      
      // Insert before side-page-container
      const sidePageContainer = document.getElementsByClassName('side-page-container')[0];
      if (sidePageContainer) {
        runner.insertBefore(tradingDiv, sidePageContainer);
      } else {
        runner.appendChild(tradingDiv);
      }
      
      // Render React component
      tradingPageRoot = createRoot(tradingDiv);
      tradingPageRoot.render(
        React.createElement(React.StrictMode, null,
          React.createElement(TradingPage)
        )
      );
    }
    
    updateSidePageQuests(mediators);
  });

  // Register Expedition page (React-based)
  // Store the React root to allow proper cleanup
  let expeditionPageRoot: Root | null = null;
  
  pageLoader.register('expedition', async () => {
    NavigationUtils.removeiFrames();
    NavigationUtils.saveActivePage();
    
    // Hide interactive-map container if it exists (preserve it instead of removing)
    hideInteractiveMapContainer();
    
    // Clean up existing React root if it exists
    if (expeditionPageRoot) {
      expeditionPageRoot.unmount();
      expeditionPageRoot = null;
    }
    
    // Remove any existing expedition page container
    const existingContainer = document.getElementById('expedition-runner');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create container for Expedition page
    const runner = document.getElementById('runner-container');
    if (runner) {
      // Remove other main-runner-container elements (but preserve interactive-map)
      const existingRunners = document.getElementsByClassName('main-runner-container');
      Array.from(existingRunners).forEach(runnerEl => {
        if (runnerEl.id !== 'interactive-map-runner') {
          runnerEl.remove();
        }
      });
      
      // Create new container for Expedition page
      const expeditionDiv = document.createElement('div');
      expeditionDiv.id = 'expedition-runner';
      expeditionDiv.className = 'expedition-container main-runner-container';
      expeditionDiv.style.width = '100%';
      expeditionDiv.style.height = '100%';
      
      // Insert before side-page-container
      const sidePageContainer = document.getElementsByClassName('side-page-container')[0];
      if (sidePageContainer) {
        runner.insertBefore(expeditionDiv, sidePageContainer);
      } else {
        runner.appendChild(expeditionDiv);
      }
      
      // Render React component
      expeditionPageRoot = createRoot(expeditionDiv);
      expeditionPageRoot.render(
        React.createElement(React.StrictMode, null,
          React.createElement(ExpeditionPage)
        )
      );
    }
    
    updateSidePageQuests(mediators);
  });

  // Register Map Events page (React-based)
  // Store the React root to allow proper cleanup
  let mapEventsPageRoot: Root | null = null;
  
  pageLoader.register('map-events', async () => {
    NavigationUtils.removeiFrames();
    NavigationUtils.saveActivePage();
    
    // Hide interactive-map container if it exists (preserve it instead of removing)
    hideInteractiveMapContainer();
    
    // Clean up existing React root if it exists
    if (mapEventsPageRoot) {
      mapEventsPageRoot.unmount();
      mapEventsPageRoot = null;
    }
    
    // Remove any existing map events page container
    const existingContainer = document.getElementById('map-events-runner');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create container for Map Events page
    const runner = document.getElementById('runner-container');
    if (runner) {
      // Remove other main-runner-container elements (but preserve interactive-map)
      const existingRunners = document.getElementsByClassName('main-runner-container');
      Array.from(existingRunners).forEach(runnerEl => {
        if (runnerEl.id !== 'interactive-map-runner') {
          runnerEl.remove();
        }
      });
      
      // Create new container for Map Events page
      const mapEventsDiv = document.createElement('div');
      mapEventsDiv.id = 'map-events-runner';
      mapEventsDiv.className = 'map-events-container main-runner-container';
      mapEventsDiv.style.width = '100%';
      mapEventsDiv.style.height = '100%';
      
      // Insert before side-page-container
      const sidePageContainer = document.getElementsByClassName('side-page-container')[0];
      if (sidePageContainer) {
        runner.insertBefore(mapEventsDiv, sidePageContainer);
      } else {
        runner.appendChild(mapEventsDiv);
      }
      
      // Render React component
      mapEventsPageRoot = createRoot(mapEventsDiv);
      mapEventsPageRoot.render(
        React.createElement(React.StrictMode, null,
          React.createElement(MapEventsPage)
        )
      );
    }
    
    updateSidePageQuests(mediators);
  });

  // Register Runners page (React-based)
  let runnersPageRoot: Root | null = null;

  pageLoader.register('runners', async () => {
    NavigationUtils.removeiFrames();
    NavigationUtils.saveActivePage();

    hideInteractiveMapContainer();

    if (runnersPageRoot) {
      runnersPageRoot.unmount();
      runnersPageRoot = null;
    }

    const existingContainer = document.getElementById('runners-runner');
    if (existingContainer) {
      existingContainer.remove();
    }

    const runner = document.getElementById('runner-container');
    if (runner) {
      const existingRunners = document.getElementsByClassName('main-runner-container');
      Array.from(existingRunners).forEach(runnerEl => {
        if (runnerEl.id !== 'interactive-map-runner') {
          runnerEl.remove();
        }
      });

      const runnersDiv = document.createElement('div');
      runnersDiv.id = 'runners-runner';
      runnersDiv.className = 'runners-container main-runner-container';
      runnersDiv.style.width = '100%';
      runnersDiv.style.height = '100%';

      const sidePageContainer = document.getElementsByClassName('side-page-container')[0];
      if (sidePageContainer) {
        runner.insertBefore(runnersDiv, sidePageContainer);
      } else {
        runner.appendChild(runnersDiv);
      }

      runnersPageRoot = createRoot(runnersDiv);
      runnersPageRoot.render(
        React.createElement(React.StrictMode, null,
          React.createElement(RunnersPage)
        )
      );
    }

    updateSidePageQuests(mediators);
  });

  // Register Subscription page (React-based)
  let subscriptionPageRoot: Root | null = null;

  pageLoader.register('subscription', async () => {
    NavigationUtils.removeiFrames();
    NavigationUtils.saveActivePage();

    hideInteractiveMapContainer();

    if (subscriptionPageRoot) {
      subscriptionPageRoot.unmount();
      subscriptionPageRoot = null;
    }

    const legacyContainer = document.getElementById('subscription-window-container');
    if (legacyContainer) {
      legacyContainer.remove();
    }

    const existingContainer = document.getElementById('subscription-runner');
    if (existingContainer) {
      existingContainer.remove();
    }

    const runner = document.getElementById('runner-container');
    if (runner) {
      const existingRunners = document.getElementsByClassName('main-runner-container');
      Array.from(existingRunners).forEach(runnerEl => {
        if (runnerEl.id !== 'interactive-map-runner') {
          runnerEl.remove();
        }
      });

      const subscriptionDiv = document.createElement('div');
      subscriptionDiv.id = 'subscription-runner';
      subscriptionDiv.className = 'subscription-container main-runner-container';
      subscriptionDiv.style.width = '100%';
      subscriptionDiv.style.height = '100%';

      const sidePageContainer = document.getElementsByClassName('side-page-container')[0];
      if (sidePageContainer) {
        runner.insertBefore(subscriptionDiv, sidePageContainer);
      } else {
        runner.appendChild(subscriptionDiv);
      }

      subscriptionPageRoot = createRoot(subscriptionDiv);
      subscriptionPageRoot.render(
        React.createElement(React.StrictMode, null,
          React.createElement(SubscriptionPage)
        )
      );
    }

    updateSidePageQuests(mediators);
  });

  const win = typeof globalThis !== 'undefined' ? (globalThis as any).window : undefined;
  if (win && !win.__subscriptionNavListenerAttached) {
    win.__subscriptionNavListenerAttached = true;
    pageLoader.onNavigation((pageId: string) => {
      setSubscriptionNavActive(pageId === 'subscription');
    });
  }

  // Register Interactive Map page (React-based)
  // Store the React root to allow proper cleanup
  let interactiveMapPageRoot: Root | null = null;
  let interactiveMapContainer: HTMLDivElement | null = null;
  
  // Store container reference globally so other pages can preserve it
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).window.__interactiveMapContainer = null;
  }
  
  pageLoader.register(
    'interactive-map',
    async (params?: { mapId?: string; setDefaultPreference?: boolean }) => {
    NavigationUtils.removeiFrames();
    NavigationUtils.saveActivePage();
    
    const shouldSetDefault = params?.setDefaultPreference !== false;
    if (params?.mapId) {
      if (shouldSetDefault) {
        AppConfigClient.updateConfig({
          userSettings: { mapDefaultPreference: params.mapId },
        });
      }
      if (typeof globalThis.dispatchEvent === "function") {
        globalThis.dispatchEvent(
          new CustomEvent("map-change-request", { detail: { mapId: params.mapId } })
        );
      }
    }

    // Check if container already exists (hidden or visible)
    let existingContainer = document.getElementById('interactive-map-runner') as HTMLDivElement | null;
    
    // Also check if it's stored globally (might be detached from DOM)
    if (!existingContainer && typeof globalThis !== 'undefined' && (globalThis as any).window.__interactiveMapContainer) {
      existingContainer = (globalThis as any).window.__interactiveMapContainer;
    }
    
    if (existingContainer && interactiveMapPageRoot) {
      setInteractiveMapVisibility(true);
      // Container and root already exist - show it and ensure it's in the right place
      const runner = document.getElementById('runner-container');
      if (runner) {
        // Remove other main-runner-container elements (but preserve interactive-map)
        const existingRunners = document.getElementsByClassName('main-runner-container');
        Array.from(existingRunners).forEach(runnerEl => {
          if (runnerEl.id !== 'interactive-map-runner') {
            runnerEl.remove();
          }
        });
        
        // Ensure container is attached to DOM and in the right place
        const sidePageContainer = document.getElementsByClassName('side-page-container')[0];
        if (existingContainer.parentElement !== runner) {
          // Container is detached - reattach it
          if (sidePageContainer) {
            runner.insertBefore(existingContainer, sidePageContainer);
          } else {
            runner.appendChild(existingContainer);
          }
        } else if (sidePageContainer && existingContainer.nextSibling !== sidePageContainer) {
          // Container is in wrong position - move it
          runner.insertBefore(existingContainer, sidePageContainer);
        }
        
        // Make container visible
        existingContainer.style.display = 'block';
        existingContainer.style.visibility = 'visible';
      }
      
      // Store reference globally
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).window.__interactiveMapContainer = existingContainer;
      }
      interactiveMapContainer = existingContainer;
      
      // Container already exists with React root - no need to recreate
      updateSidePageQuests(mediators);
      return;
    }
    
    // Container doesn't exist or root is missing - create new one
    // Clean up existing React root if it exists (shouldn't happen, but just in case)
    if (interactiveMapPageRoot) {
      interactiveMapPageRoot.unmount();
      interactiveMapPageRoot = null;
    }
    
    // Remove any existing interactive map page container (if it exists without a root)
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create container for Interactive Map page
    const runner = document.getElementById('runner-container');
    if (runner) {
      // Remove other main-runner-container elements
      const existingRunners = document.getElementsByClassName('main-runner-container');
      Array.from(existingRunners).forEach(runnerEl => runnerEl.remove());
      
      // Create new container for Interactive Map page
      const interactiveMapDiv = document.createElement('div');
      interactiveMapDiv.id = 'interactive-map-runner';
      interactiveMapDiv.className = 'interactive-map-container main-runner-container';
      
      // Insert before side-page-container
      const sidePageContainer = document.getElementsByClassName('side-page-container')[0];
      if (sidePageContainer) {
        runner.insertBefore(interactiveMapDiv, sidePageContainer);
      } else {
        runner.appendChild(interactiveMapDiv);
      }
      
      // Store reference globally
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).window.__interactiveMapContainer = interactiveMapDiv;
      }
      interactiveMapContainer = interactiveMapDiv;
      
      // Render React component
      interactiveMapPageRoot = createRoot(interactiveMapDiv);
      interactiveMapPageRoot.render(
        React.createElement(React.StrictMode, null,
          React.createElement(MapPage)
        )
      );
      setInteractiveMapVisibility(true);
    }
    
    updateSidePageQuests(mediators);
  });

  console.log('[registerPageLoaders] Page loaders registered successfully:', pageLoader.getRegisteredPages());

  // To add a new page, simply:
  // 1. Add page config to PageRegistry.ts
  // 2. Add the mediator to PageLoaderMediators interface
  // 3. Register loader here:
  // pageLoader.register('new-page-id', async () => {
  //   NavigationUtils.removeiFrames();
  //   NavigationUtils.saveActivePage();
  //   NavigationUtils.setActiveButton('new-page-navigation');
  //   await mediators.yourPageMediator.load();
  //   updateSidePageQuests(mediators);
  //   // ... any other initialization logic
  // });
};

