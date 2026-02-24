import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { VersionDisplay } from './components/VersionDisplay';
import { HotkeyDisplay } from './components/HotkeyDisplay';
import { WindowControlButton } from './components/WindowControlButton';
import { NavigationBar } from './components/NavigationBar';
import { ActiveEventsIndicator } from './components/ActiveEventsIndicator';
import { HotkeyModalHost } from './components/hotkeys/HotkeyModalHost';

interface AppProps {
  windowType: 'desktop' | 'ingame';
}

export const App: React.FC<AppProps> = ({ windowType }) => {
  const [versionContainer, setVersionContainer] = useState<HTMLElement | null>(null);
  const [hotkeyToggleContainer, setHotkeyToggleContainer] = useState<HTMLElement | null>(null);
  const [hotkeySwitchContainer, setHotkeySwitchContainer] = useState<HTMLElement | null>(null);
  const [minimizeContainer, setMinimizeContainer] = useState<HTMLElement | null>(null);
  const [maximizeContainer, setMaximizeContainer] = useState<HTMLElement | null>(null);
  const [closeContainer, setCloseContainer] = useState<HTMLElement | null>(null);
  const [navigationContainer, setNavigationContainer] = useState<HTMLElement | null>(null);
  const [activeEventsContainer, setActiveEventsContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Wait for DOM to be ready, then find the containers
    const findContainers = () => {
      const versionCont = document.getElementById('arc-raiders-companion-version');
      if (versionCont) {
        setVersionContainer(versionCont);
      }

      // Only add hotkey containers for in-game window
      if (windowType === 'ingame') {
        const toggleCont = document.getElementById('react-hotkey-toggle');
        if (toggleCont) {
          setHotkeyToggleContainer(toggleCont);
        }
        const switchCont = document.getElementById('react-hotkey-switch');
        if (switchCont) {
          setHotkeySwitchContainer(switchCont);
        }
      }

      // Find individual window control containers
      const minimizeCont = document.getElementById('react-window-control-minimize');
      if (minimizeCont) {
        setMinimizeContainer(minimizeCont);
      }
      const maximizeCont = document.getElementById('react-window-control-maximize');
      if (maximizeCont) {
        setMaximizeContainer(maximizeCont);
      }
      const closeCont = document.getElementById('react-window-control-close');
      if (closeCont) {
        setCloseContainer(closeCont);
      }

      // Find navigation bar container (React renders into nav-bar-container)
      const navCont = document.getElementById('react-navigation-bar');
      if (navCont) {
        setNavigationContainer(navCont);
      }

      // Find active events indicator container
      const activeEventsCont = document.getElementById('react-active-events-indicator');
      if (activeEventsCont) {
        setActiveEventsContainer(activeEventsCont);
      }

      return versionCont !== null;
    };

    // Try immediately
    if (!findContainers()) {
      // If not found, try again after a short delay
      const timeout = setTimeout(findContainers, 100);
      return () => clearTimeout(timeout);
    }
  }, [windowType]); // Include windowType in dependencies

  return (
    <div id="react-app-root">
      {/* React app content will be rendered here */}
      <HotkeyModalHost />
      {versionContainer && createPortal(<VersionDisplay />, versionContainer)}
      {hotkeyToggleContainer && windowType === 'ingame' && 
        createPortal(<HotkeyDisplay hotkeyType="toggle" id="hotkey" />, hotkeyToggleContainer)}
      {hotkeySwitchContainer && windowType === 'ingame' && 
        createPortal(<HotkeyDisplay hotkeyType="switchScreenToggle" id="screenHotkey" />, hotkeySwitchContainer)}
      {minimizeContainer && 
        createPortal(<WindowControlButton type="minimize" />, minimizeContainer)}
      {maximizeContainer && 
        createPortal(<WindowControlButton type="maximize" />, maximizeContainer)}
      {closeContainer && 
        createPortal(<WindowControlButton type="close" />, closeContainer)}
      {navigationContainer && 
        createPortal(<NavigationBar windowType={windowType} />, navigationContainer)}
      {activeEventsContainer && 
        createPortal(<ActiveEventsIndicator />, activeEventsContainer)}
    </div>
  );
};

