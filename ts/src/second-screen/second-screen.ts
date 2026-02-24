
import { ItemsElementUtils } from '../escape-from-tarkov/utils/ItemsElementUtils';

export class DesktopSecondScreen {
  private static _instance: DesktopSecondScreen;

  private constructor() {}

  public static instance() {
    if (!DesktopSecondScreen._instance) {
      DesktopSecondScreen._instance = new DesktopSecondScreen();
    }
    return DesktopSecondScreen._instance;
  }

  public async init() {
    // React bootstraps the UI for the second screen.
  }
}

DesktopSecondScreen.instance().init();
