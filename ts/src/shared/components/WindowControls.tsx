import React, { useEffect, useState } from 'react';
import { WindowsService } from '../../WindowsService';
import { kWindowNames } from '../../consts';

interface WindowControlsProps {
  windowName?: string;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ windowName }) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  useEffect(() => {
    // Check initial window state
    const checkWindowState = async () => {
      const currentWindow = await WindowsService.getCurrentWindow();
      if (currentWindow.success && currentWindow.window.stateEx === 'maximized') {
        setIsMaximized(true);
      }
    };

    checkWindowState();

    // Listen for window state changes
    // Note: We don't remove this listener as it's needed for the component lifecycle
    overwolf.windows.onStateChanged.addListener((state: overwolf.windows.WindowStateChangedEvent) => {
      if (state.window_state_ex === 'maximized') {
        setIsMaximized(true);
      } else if (state.window_state_ex === 'normal') {
        setIsMaximized(false);
      }
    });
  }, []);

  const handleMinimize = async () => {
    overwolf.windows.getCurrentWindow(result => {
      if (result.success && result.window && result.window.id) {
        overwolf.windows.minimize(result.window.id, null);
      }
    });
  };

  const handleMaximize = async () => {
    overwolf.windows.getCurrentWindow(result => {
      if (result.success && result.window && result.window.id) {
        if (result.window.stateEx === 'maximized') {
          overwolf.windows.restore(result.window.id, null);
          setIsMaximized(false);
        } else {
          overwolf.windows.maximize(result.window.id, null);
          setIsMaximized(true);
        }
      }
    });
  };

  const handleClose = async () => {
    const currWindow = await WindowsService.getCurrentWindow();
    if (currWindow.success && currWindow.window.name === kWindowNames.inGame) {
      WindowsService.close(kWindowNames.inGame);
      return;
    }
    
    // For other windows, close the background window
    overwolf.windows.obtainDeclaredWindow(kWindowNames.background, result => {
      if (result.success && result.window?.id) {
        overwolf.windows.close(result.window.id, null);
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Stop propagation to prevent window dragging when clicking controls
    e.stopPropagation();
  };

  return (
    <React.Fragment>
      <button
        id="minimizeButton"
        className="window-control window-control-minimize"
        onClick={handleMinimize}
        onMouseDown={handleMouseDown}
      />
      <button
        id="maximizeButton"
        className="window-control window-control-maximize"
        onClick={handleMaximize}
        onMouseDown={handleMouseDown}
      />
      <button
        id="closeButton"
        className="window-control window-control-close"
        onClick={handleClose}
        onMouseDown={handleMouseDown}
      />
    </React.Fragment>
  );
};

