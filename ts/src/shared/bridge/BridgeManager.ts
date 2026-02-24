type BridgeWaiter = {
  name: string;
  wait: () => Promise<void>;
};

const resolveBackgroundBridge = () => {
  try {
    const mainWindow = overwolf?.windows?.getMainWindow?.();
    return (mainWindow as any)?.backgroundBridge as {
      waitForUserStatus?: () => Promise<void>;
      waitForAppConfig?: () => Promise<void>;
      waitForQuestData?: () => Promise<void>;
      waitForHideoutData?: () => Promise<void>;
      waitForItemsData?: () => Promise<void>;
    } | undefined;
  } catch {
    return undefined;
  }
};

class BridgeManager {
  private waiters: BridgeWaiter[] = [];

  public register(waiter: BridgeWaiter): void {
    this.waiters = this.waiters.filter((existing) => existing.name !== waiter.name);
    this.waiters.push(waiter);
  }

  public async waitForReady(): Promise<void> {
    await Promise.all(this.waiters.map((waiter) => waiter.wait()));
  }
}

export const bridgeManager = new BridgeManager();

bridgeManager.register({
  name: 'user-status',
  wait: async () => {
    const bridge = resolveBackgroundBridge();
    if (bridge?.waitForUserStatus) {
      await bridge.waitForUserStatus();
    }
  },
});

bridgeManager.register({
  name: 'app-config',
  wait: async () => {
    const bridge = resolveBackgroundBridge();
    if (bridge?.waitForAppConfig) {
      await bridge.waitForAppConfig();
    }
  },
});

bridgeManager.register({
  name: 'quest-data',
  wait: async () => {
    const bridge = resolveBackgroundBridge();
    if (bridge?.waitForQuestData) {
      await bridge.waitForQuestData();
    }
  },
});

bridgeManager.register({
  name: 'hideout-data',
  wait: async () => {
    const bridge = resolveBackgroundBridge();
    if (bridge?.waitForHideoutData) {
      await bridge.waitForHideoutData();
    }
  },
});

bridgeManager.register({
  name: 'items-data',
  wait: async () => {
    const bridge = resolveBackgroundBridge();
    if (bridge?.waitForItemsData) {
      await bridge.waitForItemsData();
    }
  },
});
