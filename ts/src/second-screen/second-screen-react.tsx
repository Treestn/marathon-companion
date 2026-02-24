import React from 'react';
import { createRoot } from 'react-dom/client';
import { SecondScreenApp } from './SecondScreenApp';
import { pageLoader } from '../shared/pages/PageLoader';
import { ItemsElementUtils } from '../escape-from-tarkov/utils/ItemsElementUtils';
import { UserStatusProvider } from '../shared/context/UserStatusContext';

// Wait for page loaders to be registered before initializing React
// If none are registered yet, don't block startup.
function waitForPageLoaders(maxWait = 5000): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    if (pageLoader.getRegisteredPages().length === 0) {
      resolve();
      return;
    }
    const checkInterval = setInterval(() => {
      const registeredPages = pageLoader.getRegisteredPages();
      if (registeredPages.length > 0) {
        console.log('[second-screen-react] Page loaders ready:', registeredPages);
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > maxWait) {
        console.warn('[second-screen-react] Page loaders not ready after', maxWait, 'ms, initializing anyway');
        clearInterval(checkInterval);
        resolve();
      }
    }, 50);
  });
}

// Wait for DOM to be ready and page loaders to be registered
async function initializeReact() {
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }

  // Load cached items data once for the window.
  ItemsElementUtils.initFromStorage();

  await waitForPageLoaders();

  let rootElement = document.getElementById('react-root');
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'react-root';
    const mainWindow = document.getElementById('main-window') || document.body;
    mainWindow.appendChild(rootElement);
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <UserStatusProvider>
      <SecondScreenApp />
      </UserStatusProvider>
    </React.StrictMode>
  );
}

await initializeReact();
