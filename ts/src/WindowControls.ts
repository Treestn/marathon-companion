import { kWindowNames } from "./consts"
import { WindowsService } from "./WindowsService"

export class WindowControls {

  static initControls() {
    WindowControls.move()
    WindowControls.propagation()
    // Window controls (minimize, maximize, close) are now handled by React - see src/shared/components/WindowControlButton.tsx
    // Only initialize controls if they're not React-managed (for other windows that don't use React)
    // Check if React controls exist - if not, use the old method
    const reactMinimize = document.getElementById('react-window-control-minimize');
    const reactMaximize = document.getElementById('react-window-control-maximize');
    const reactClose = document.getElementById('react-window-control-close');
    
    // If any React containers exist, React is managing the controls
    if (!reactMinimize && !reactMaximize && !reactClose) {
      WindowControls.maximise()
      WindowControls.minimize()
      WindowControls.close()
    }
  }

  static move() {
    document.querySelector('.app-header').addEventListener('mousedown', () => {
      overwolf.windows.getCurrentWindow(result => {
        if (result.success && result.window && result.window.id) {
          overwolf.windows.dragMove(result.window.id, null);
        }
      });
    });
  }

  static moveWindow(windowName:string) {
    document.querySelector('.app-header').addEventListener('mousedown', () => {
      overwolf.windows.obtainDeclaredWindow(windowName, result => {
        if (result.success && result.window && result.window.id) {
          overwolf.windows.dragMove(result.window.id, null);
        }
      });
    });
  }

  static propagation() {
    const controls = document.querySelectorAll('.window-control');
    controls.forEach(control => {
      control.addEventListener('mousedown', e => {
        e.stopPropagation();
      });
    });
  }

  static maximise() {
    const button = document.querySelector('.window-control-maximize');
    if (button) {
      // Set initial maximized state
      overwolf.windows.getCurrentWindow(result => {
        if (result.success && result.window?.stateEx === 'maximized') {
          button.classList.add('is-maximized');
        }
      });
      // Listen for state changes to toggle the icon
      overwolf.windows.onStateChanged.addListener((event) => {
        overwolf.windows.getCurrentWindow(result => {
          if (result.success && result.window && result.window.id === event.window_id) {
            button.classList.toggle('is-maximized', event.window_state_ex === 'maximized');
          }
        });
      });
      button.addEventListener('click', () => {
        overwolf.windows.getCurrentWindow(result => {
          if (result.success && result.window && result.window.id) {
            if (result.window.stateEx === 'maximized') {
              overwolf.windows.restore(result.window.id, null);
            } else {
              overwolf.windows.maximize(result.window.id, null);
            }
          }
        });
      });
    }
  }

  static minimize() {
    const button = document.querySelector('.window-control-minimize');
    if (button) {
      button.addEventListener('click', () => {
        overwolf.windows.getCurrentWindow(result => {
          if (result.success && result.window && result.window.id) {
            overwolf.windows.minimize(result.window.id, null);
          }
        });
      });
    }
  }

  static closeWindow(windowName:string) {
    const button = document.querySelector('.window-control-close');
    if (button) {
      button.addEventListener('click', () => {
        overwolf.windows.obtainDeclaredWindow(windowName, async result => {
          if (result.success && result.window && result.window.id) {
            overwolf.windows.close(result.window.id, null);
          }
        });
      });
    }
  }

  static close(element?:string) {
    const button = document.querySelector(element ? element : '.window-control-close');
    if (button) {
      button.addEventListener('click', async () => {
        const currWindow = await WindowsService.getCurrentWindow();
        if(currWindow.success && currWindow.window.name === kWindowNames.inGame) {
          WindowsService.close(kWindowNames.inGame);
          return;
        }
        overwolf.windows.obtainDeclaredWindow(kWindowNames.background, result => {
          if (result.success && result.window?.id) {
            overwolf.windows.close(result.window.id, null);
          }
        });
      });
    }
  }
}
  