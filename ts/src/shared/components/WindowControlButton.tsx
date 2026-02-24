import React, { useCallback, useEffect, useState } from 'react';
import { WindowsService } from '../../WindowsService';
import { kWindowNames } from '../../consts';

interface WindowControlButtonProps {
  type: 'minimize' | 'maximize' | 'close';
}

export const WindowControlButton: React.FC<WindowControlButtonProps> = ({ type }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  // Keep maximized state in sync for the maximize button
  useEffect(() => {
    if (type !== 'maximize') {
      return;
    }
    // Check initial state
    overwolf.windows.getCurrentWindow((result) => {
      if (result.success && result.window) {
        setIsMaximized(result.window.stateEx === 'maximized');
      }
    });
    // Listen for state changes
    const handler = (event: overwolf.windows.WindowStateChangedEvent) => {
      overwolf.windows.getCurrentWindow((result) => {
        if (result.success && result.window && result.window.id === event.window_id) {
          setIsMaximized(event.window_state_ex === 'maximized');
        }
      });
    };
    overwolf.windows.onStateChanged.addListener(handler);
    return () => {
      overwolf.windows.onStateChanged.removeListener(handler);
    };
  }, [type]);

  const handleMinimize = useCallback(() => {
    overwolf.windows.getCurrentWindow(result => {
      if (result.success && result.window && result.window.id) {
        overwolf.windows.minimize(result.window.id, null);
      }
    });
  }, []);

  const handleMaximize = useCallback(() => {
    overwolf.windows.getCurrentWindow(result => {
      if (result.success && result.window && result.window.id) {
        if (result.window.stateEx === 'maximized') {
          overwolf.windows.restore(result.window.id, null);
        } else {
          overwolf.windows.maximize(result.window.id, null);
        }
      }
    });
  }, []);

  const handleClose = useCallback(async () => {
    const currWindow = await WindowsService.getCurrentWindow();
    if (currWindow.success && currWindow.window.name === kWindowNames.inGame) {
      WindowsService.close(kWindowNames.inGame);
      return;
    }
    if (currWindow.success && currWindow.window.name === kWindowNames.secondScreen) {
      WindowsService.close(kWindowNames.secondScreen);
      return;
    }
    
    // For other windows, close the background window
    overwolf.windows.obtainDeclaredWindow(kWindowNames.background, result => {
      if (result.success && result.window?.id) {
        overwolf.windows.close(result.window.id, null);
      }
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Stop propagation to prevent window dragging when clicking controls
    e.stopPropagation();
  };

  const getHandler = () => {
    switch (type) {
      case 'minimize':
        return handleMinimize;
      case 'maximize':
        return handleMaximize;
      case 'close':
        return handleClose;
    }
  };

  const getId = () => {
    switch (type) {
      case 'minimize':
        return 'minimizeButton';
      case 'maximize':
        return 'maximizeButton';
      case 'close':
        return 'closeButton';
    }
  };

  const getClassName = () => {
    switch (type) {
      case 'minimize':
        return 'window-control window-control-minimize';
      case 'maximize':
        return `window-control window-control-maximize${isMaximized ? ' is-maximized' : ''}`;
      case 'close':
        return 'window-control window-control-close';
    }
  };

  return (
    <button
      id={getId()}
      className={getClassName()}
      onClick={getHandler()}
      onMouseDown={handleMouseDown}
    />
  );
};

