import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SidePanelTrades } from './SidePanelTrades';
import { UserStatusProvider } from '../../context/UserStatusContext';
import { TradingProvider } from '../../context/TradingContext';

let sidePanelTradesRoot: Root | null = null;

export const initSidePanelTrades = () => {
  const container = document.getElementById('side-page-trades-root');
  
  if (!container) {
    console.warn('Side panel trades container not found');
    return;
  }

  // Clean up existing root if it exists
  if (sidePanelTradesRoot) {
    sidePanelTradesRoot.unmount();
    sidePanelTradesRoot = null;
  }

  // Create new React root and render
  sidePanelTradesRoot = createRoot(container);
  sidePanelTradesRoot.render(
    <UserStatusProvider>
      <TradingProvider>
        <SidePanelTrades />
      </TradingProvider>
    </UserStatusProvider>,
  );
};

export const cleanupSidePanelTrades = () => {
  if (sidePanelTradesRoot) {
    sidePanelTradesRoot.unmount();
    sidePanelTradesRoot = null;
  }
};

