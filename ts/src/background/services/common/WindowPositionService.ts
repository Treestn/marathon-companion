import { storageKeys } from "../../../consts";
import { StorageHelper } from "../../../escape-from-tarkov/service/helper/StorageHelper";
import { WindowsService } from "../../../WindowsService";

type WindowPosition = {
  left: number;
  top: number;
};

type WindowPositions = Record<string, WindowPosition>;
type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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
      let displays: overwolf.utils.Display[] = [];
      try {
        displays = await WindowsService.getMonitorsList();
      } catch {
        displays = [];
      }

      const normalized = this.normalizePosition(position, window, displays);
      overwolf.windows.changePosition(window.id, normalized.left, normalized.top, () => {});
      if (normalized.left !== position.left || normalized.top !== position.top) {
        this.positions[windowName] = normalized;
        this.persistIfChanged();
      }
      return true;
    } catch {
      return false;
    }
  }

  private normalizePosition(
    position: WindowPosition,
    windowInfo: overwolf.windows.WindowInfo,
    displays: overwolf.utils.Display[],
  ): WindowPosition {
    if (!displays?.length) {
      return position;
    }

    const windowRect: Rect = {
      x: position.left,
      y: position.top,
      width: Math.max(1, Math.floor(windowInfo?.width ?? 1)),
      height: Math.max(1, Math.floor(windowInfo?.height ?? 1)),
    };

    const targetDisplay = this.pickTargetDisplay(windowRect, displays);
    if (!targetDisplay) {
      return position;
    }

    const displayRect: Rect = {
      x: targetDisplay.x,
      y: targetDisplay.y,
      width: targetDisplay.width,
      height: targetDisplay.height,
    };

    return {
      left: this.clampAxis(windowRect.x, windowRect.width, displayRect.x, displayRect.width),
      top: this.clampAxis(windowRect.y, windowRect.height, displayRect.y, displayRect.height),
    };
  }

  private pickTargetDisplay(
    windowRect: Rect,
    displays: overwolf.utils.Display[],
  ): overwolf.utils.Display | null {
    let bestByOverlap: { display: overwolf.utils.Display; overlap: number } | null = null;
    for (const display of displays) {
      const overlap = this.getOverlapArea(windowRect, {
        x: display.x,
        y: display.y,
        width: display.width,
        height: display.height,
      });
      if (!bestByOverlap || overlap > bestByOverlap.overlap) {
        bestByOverlap = { display, overlap };
      }
    }

    if (bestByOverlap && bestByOverlap.overlap > 0) {
      return bestByOverlap.display;
    }

    let closest: { display: overwolf.utils.Display; distance: number } | null = null;
    const centerX = windowRect.x + windowRect.width / 2;
    const centerY = windowRect.y + windowRect.height / 2;
    for (const display of displays) {
      const distance = this.distanceToRectSquared(centerX, centerY, {
        x: display.x,
        y: display.y,
        width: display.width,
        height: display.height,
      });
      if (!closest || distance < closest.distance) {
        closest = { display, distance };
      }
    }

    if (closest) {
      return closest.display;
    }
    return displays.find((display) => display.is_primary) ?? displays[0] ?? null;
  }

  private clampAxis(
    value: number,
    windowSize: number,
    displayStart: number,
    displaySize: number,
  ): number {
    const min = displayStart;
    const max = displayStart + displaySize - windowSize;
    if (max < min) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
  }

  private getOverlapArea(a: Rect, b: Rect): number {
    const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
    const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
    return overlapX * overlapY;
  }

  private distanceToRectSquared(px: number, py: number, rect: Rect): number {
    const dx = this.axisDistance(px, rect.x, rect.x + rect.width);
    const dy = this.axisDistance(py, rect.y, rect.y + rect.height);
    return dx * dx + dy * dy;
  }

  private axisDistance(value: number, min: number, max: number): number {
    if (value < min) {
      return min - value;
    }
    if (value > max) {
      return value - max;
    }
    return 0;
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
