import React from 'react';
import { createRoot } from 'react-dom/client';
import { bridgeManager } from '../shared/bridge/BridgeManager';
import { ItemsElementUtils } from '../escape-from-tarkov/utils/ItemsElementUtils';
import { EditModeProvider } from '../shared/context/EditModeContext';
import { SubmissionProvider } from '../shared/context/SubmissionContext';
import { UserStatusProvider } from '../shared/context/UserStatusContext';
import { DesktopApp } from './DesktopApp';

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
            <DesktopApp windowType="desktop" />
          </SubmissionProvider>
        </EditModeProvider>
      </UserStatusProvider>
    </React.StrictMode>
  );
}

// Start initialization
initializeReact();
