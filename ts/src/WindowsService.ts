import { kWindowNames } from "./consts";
import { AppConfigUtils } from "./escape-from-tarkov/utils/AppConfigUtils";

export class WindowsService {
    /**
     * Obtain a window object by a name as declared in the manifest.
     * This is required in order to create the window before calling other APIs
     * on that window
     * @param {string} name
     * @returns {Promise<overwolf.windows.WindowResult>}
     */
    static obtainWindow(name):Promise<overwolf.windows.WindowResult> {
      return new Promise((resolve, reject) => {
        overwolf.windows.obtainDeclaredWindow(name, result => {
          if (result.success) {
            resolve(result);
          } else {
            console.warn('WindowsService.obtainWindow(): error:', name, result);
            reject(new Error(result.error));
          }
        });
      });
    }
  
    /**
     * Obtain the current window's object. This is required in order to create
     * the window before calling other APIs on that window
     * @returns {Promise<overwolf.windows.WindowResult>}
     */
    static getCurrentWindow():Promise<overwolf.windows.WindowResult> {
      return new Promise((resolve, reject) => {
        overwolf.windows.getCurrentWindow(result => {
          if (result.success) {
            resolve(result);
          } else {
            console.warn(
              'WindowsService.getCurrentWindow(): error:',
              result
            );
            reject(new Error(result.error));
          }
        });
      });
    }
  
    /**
     * Restore a window by name
     * @param {string} name
     * @returns {Promise<void>}
     */
    static async restore(name):Promise<void> {
      const { window } = await WindowsService.obtainWindow(name);
  
      return new Promise((resolve, reject) => {
        overwolf.windows.restore(window.id, result => {
          if (result.success) {
            resolve();
          } else {
            console.warn('WindowsService.restore(): error:', name, result);
            reject(new Error(result.error));
          }
        });
      });
    }
  
    /**
     * Minimize a window by name
     * @param {string} name
     * @returns {Promise<void>}
     */
    static async minimize(name):Promise<void> {
      const { window } = await WindowsService.obtainWindow(name);
  
      return new Promise((resolve, reject) => {
        overwolf.windows.minimize(window.id, result => {
          if (result.success) {
            resolve();
          } else {
            console.warn('WindowsService.minimize(): error:', name, result);
            reject(new Error(result.error));
          }
        });
      });
    }
  
    /**
     * Maximize a window by name
     * @param {string} name
     * @returns {Promise<void>}
     */
    static async maximize(name):Promise<void> {
      const { window } = await WindowsService.obtainWindow(name);
  
      return new Promise((resolve, reject) => {
        overwolf.windows.maximize(window.id, result => {
          if (result.success) {
            resolve();
          } else {
            console.warn('WindowsService.maximize(): error:', name, result);
            reject(new Error(result.error));
          }
        });
      });
    }
  
    /**
     * Close a window
     * @param {string} name
     * @returns {Promise<void>}
     */
    static async close(name):Promise<void> {
      const state = await WindowsService.getWindowState(name);
  
      if (state === 'closed')
        return;
  
      const { window } = await WindowsService.obtainWindow(name);
  
      await new Promise(resolve => overwolf.windows.close(window.id, resolve));
    }
  
    /**
     * Set position of a window
     * @param {string} name
     * @param {number} left
     * @param {number} top
     * @returns {Promise<overwolf.windows.WindowIdResult>}
     */
    static async changePosition(name, left, top):Promise<overwolf.windows.WindowIdResult> {
      const { window } = await WindowsService.obtainWindow(name);
    //   const windows:overwolf.utils.Display[] = await WindowsService.getMonitorsList()
    //   let window:overwolf.utils.Display;
    //   windows.forEach(w => { if(!w.is_primary) {window = w}})
      return new Promise((resolve, reject) => {
        overwolf.windows.changePosition(window.id, left, top, result => {
          if (result && result.success) {
            resolve(result);
          } else {
            console.warn('WindowsService.changePosition(): error:', name, result);
            reject(new Error(result.error));
          }
        });
      });
    }
  
    /**
     * Get state of the window
     * @param {string} name
     * @returns {Promise<string>}
     */
    static getWindowState(name):Promise<overwolf.windows.enums.WindowStateEx> {
      return new Promise((resolve, reject) => {
        overwolf.windows.getWindowState(name, result => {
          if (result.success) {
            resolve(result.window_state_ex);
          } else {
            console.warn('WindowsService.getWindowState(): error:', name, result);
            reject(new Error(result.error));
          }
        })
      });
    }
  
    /**
     * Get state of the window
     * @param {string} name
     * @param {boolean} shouldBeTopmost
     * @returns {Promise<overwolf.windows.WindowIdResult>}
     */
    static async setTopmost(name, shouldBeTopmost):Promise<overwolf.windows.WindowIdResult> {
      const window = await WindowsService.obtainWindow(name);

      return new Promise((resolve, reject) => {
        overwolf.windows.setTopmost(window.window.id, shouldBeTopmost, result => {
          if (result.success) {
            resolve(result);
          } else {
            console.warn('WindowsService.setTopmost(): error:', name, result);
            reject(new Error(result.error));
          }
        })
      });
    }
  
    /**
     * Get state of the window
     * @param {string} name
     * @param {boolean} grabFocus
     * @returns {Promise<overwolf.windows.WindowIdResult>}
     */
    static async bringToFront(name, grabFocus = false):Promise<overwolf.windows.WindowIdResult> {
      const window = await WindowsService.obtainWindow(name);
  
      return new Promise((resolve, reject) => {
        overwolf.windows.bringToFront(window.window.id, grabFocus, result => {
          if (result.success) {
            resolve(result);
          } else {
            console.warn('WindowsService.bringToFront(): error:', name, result);
            reject(new Error(result.error));
          }
        })
      });
    }

    static async hide(name):Promise<overwolf.windows.WindowIdResult> {
      const window = await WindowsService.obtainWindow(name);
  
      return new Promise((resolve, reject) => {
        overwolf.windows.hide(window.window.id, result => {
          if (result.success) {
            resolve(result);
          } else {
            console.warn('WindowsService.hide(): error:', name, result);
            reject(new Error(result.error));
          }
        })
      });
    }
  
    /**
     * Get states of app's windows
     * @returns {Promise<any>}
     */
     static getWindowsStates():Promise<any> {
      return new Promise((resolve, reject) => {
        overwolf.windows.getWindowsStates(state => {
          if (state.success) {
            resolve(state.resultV2);
          } else {
            reject(state);
          }
        })
      });
    }
  
    /**
     * Get a list of monitors
     * @returns {Promise<overwolf.utils.Display[]>}
     */
    static getMonitorsList():Promise<overwolf.utils.Display[]> {
      return new Promise((resolve, reject) => {
        overwolf.utils.getMonitorsList(result => {
          if (result && result.success && result.displays) {
            resolve(result.displays);
          } else {
            console.warn('WindowsService.getMonitorsList(): error:', result);
            reject(new Error(result.error));
          }
        });
      });
    }
  
    /**
     * Determine if a window stat is open (normal or maximized)
     * @returns {Boolean}
     */
    static windowStateIsOpen(state) {
      switch (state) {
        case 'normal':
        case 'maximized':
          return true;
        default:
          return false;
      }
    }

    static async getDisplay(displayId:string):Promise<overwolf.utils.Display> {
        return new Promise((resolve) => {
            WindowsService.getMonitorsList().then(displays => {
                const display = displays.find(display => display.id === displayId)
                if(display) {
                    resolve(display);
                } else {
                    resolve(null);
                }
            })
        })
    }

    static async getSecondMonitor():Promise<string> {
        const secondMonitorPreference = AppConfigUtils.getAppConfig().userSettings.getSecondMonitorPreference();
        if(secondMonitorPreference) {
            const display = await WindowsService.getDisplay(secondMonitorPreference);
            if(display) {
                return new Promise((resolve) => {
                    resolve(display.id)
                });
            }
        }
        return new Promise((resolve, reject) => {
            overwolf.utils.getMonitorsList(result => {
              if (result && result.success && result.displays) {
                if(result.displays.length === 1) {
                    resolve(null)
                }
                result.displays.forEach(window => {
                    if(!window.is_primary) {
                        resolve(window.id);
                    }
                })
              } else {
                console.warn('WindowsService.getMonitorsList(): error:', result);
                reject(new Error(result.error));
              }
            })
        });
    }

    static async setToSecondMonitor(windowName:string) {
        const display = await WindowsService.getDisplay(await WindowsService.getSecondMonitor())
        const position = await WindowsService.getMonitorCenter(display, windowName)
        WindowsService.changePosition(windowName, position.x, position.y)
    }

    private static async getMonitorCenter(display:overwolf.utils.Display, windowName:string):Promise<Position> {
        const window = await WindowsService.obtainWindow(windowName);
        
        return new Promise((resolve, reject) => {
            if(window && window.success) {
                let x;
                let y;
                // if(display.x > display.y) {
                //     x = display.x + window.window.width/2 
                //     y = display.y + window.window.height/2
                // } else {
                    x = display.x + ((display.width/2) - (window.window.width/2)) 
                    y = display.y + ((display.height/2) - (window.window.height/2))
                // }
                resolve(new Position(Math.floor(x), Math.floor(y)))
            }
            reject(new Error("Window not found"))
        })
    } 
  }
  

  export class Position {

    x:number;
    y:number;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
  }