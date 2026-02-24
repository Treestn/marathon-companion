import { storageKeys } from "../../../consts";
import { StorageHelper } from "../../../escape-from-tarkov/service/helper/StorageHelper";
import { WindowsService } from "../../../WindowsService";

type WindowPosition = {
  left: number;
  top: number;
};

type WindowPositions = Record<string, WindowPosition>;

export class WindowPositionService {
  private positions: WindowPositions = {};
  private lastPersisted = "";

  public init(): void {
    this.positions = this.loadPositions();
    this.lastPersisted = JSON.stringify(this.positions);
  }

  public setWindowPosition(windowName: string, left: number, top: number): void {
    if (!windowName) {
      return;
    }
    const prev = this.positions[windowName];
    if (prev?.left === left && prev?.top === top) {
      return;
    }
    this.positions[windowName] = { left, top };
    this.persistIfChanged();
  }

  public async applyWindowPosition(windowName: string): Promise<boolean> {
    const position = this.positions[windowName];
    if (!position) {
      return false;
    }
    try {
      const { window } = await WindowsService.obtainWindow(windowName);
      if (!window?.id) {
        return false;
      }
      overwolf.windows.changePosition(window.id, position.left, position.top, () => {});
      return true;
    } catch {
      return false;
    }
  }

  private async captureWindowPosition(_windowName: string): Promise<void> {
    // Removed: positions are reported by windows directly.
  }

  private loadPositions(): WindowPositions {
    const raw = StorageHelper.getStoredData(storageKeys.windowPositions);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as WindowPositions;
    } catch {
      return {};
    }
  }

  private persistIfChanged(): void {
    const serialized = JSON.stringify(this.positions);
    if (serialized === this.lastPersisted) {
      return;
    }
    this.lastPersisted = serialized;
    StorageHelper.save(storageKeys.windowPositions, this.positions);
  }
}
