import React from 'react';
import { createRoot } from 'react-dom/client';
import { DesktopApp } from '../desktop/DesktopApp';
import { pageLoader } from '../shared/pages/PageLoader';
import { EditModeProvider } from '../shared/context/EditModeContext';
import { SubmissionProvider } from '../shared/context/SubmissionContext';
import { UserStatusProvider } from '../shared/context/UserStatusContext';
import { bridgeManager } from '../shared/bridge/BridgeManager';
import { ItemsElementUtils } from '../escape-from-tarkov/utils/ItemsElementUtils';

// Wait for page loaders to be registered before initializing React
function waitForPageLoaders(maxWait = 5000): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const registeredPages = pageLoader.getRegisteredPages();
      if (registeredPages.length > 0) {
        console.log('[in_game-react] Page loaders ready:', registeredPages);
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > maxWait) {
        console.warn('[in_game-react] Page loaders not ready after', maxWait, 'ms, initializing anyway');
        clearInterval(checkInterval);
        resolve();
      }
    }, 50); // Check every 50ms
  });
}

// Wait for DOM to be ready and page loaders to be registered
async function initializeReact() {
  // Wait for DOM
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }

  // Wait for page loaders to be registered
  // await waitForPageLoaders();
  await bridgeManager.waitForReady();

  // Load Items data after bridges resolve so storage is populated.
  ItemsElementUtils.initFromStorage();

  // Get the React root element (should exist in HTML, but create if needed)
  let rootElement = document.getElementById('react-root');
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'react-root';
    const mainWindow = document.getElementById('main-window') || document.body;
    mainWindow.appendChild(rootElement);
  }

  // Initialize React
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <UserStatusProvider>
        <EditModeProvider>
          <SubmissionProvider>
            <DesktopApp windowType="ingame" />
          </SubmissionProvider>
        </EditModeProvider>
      </UserStatusProvider>
    </React.StrictMode>
  );
}

// Start initialization
initializeReact();

