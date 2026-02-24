export type ProgressionUpdateOp =
  | { type: "quest-active"; questId: string; isActive: boolean }
  | { type: "quest-completed"; questId: string; isCompleted: boolean }
  | { type: "quest-objective"; questId: string; objectiveId: string; isCompleted: boolean }
  | { type: "item-quantity"; itemId: string; quantity?: number; delta?: number }
  | { type: "hideout-reset-station"; stationId: string }
  | { type: "hideout-level-track"; stationId: string; levelId: string; isActive: boolean }
  | { type: "hideout-level-complete"; stationId: string; levelId: string };

type ProgressionHandler = (op: ProgressionUpdateOp) => void;

export class ProgressionUpdatesService {
  private static readonly handlers = new Set<ProgressionHandler>();
  private static isListening = false;
  private static unsubscribeBridge?: () => void;
  private static retryTimeout?: number;
  private static attempts = 0;
  private static readonly maxAttempts = 50;
  private static readonly retryDelayMs = 100;

  static subscribe(handler: ProgressionHandler): () => void {
    this.handlers.add(handler);
    this.ensureListening();
    return () => {
      this.handlers.delete(handler);
      if (this.handlers.size === 0) {
        this.unsubscribeBridge?.();
        this.unsubscribeBridge = undefined;
        this.isListening = false;
        if (this.retryTimeout) {
          globalThis.clearTimeout(this.retryTimeout);
          this.retryTimeout = undefined;
        }
        this.attempts = 0;
      }
    };
  }

  private static ensureListening() {
    if (this.isListening) {
      return;
    }
    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    if (!bridge?.onProgressionUpdated) {
      if (this.attempts < this.maxAttempts) {
        this.attempts += 1;
        this.retryTimeout = globalThis.setTimeout(
          () => this.ensureListening(),
          this.retryDelayMs,
        );
      }
      return;
    }

    this.unsubscribeBridge = bridge.onProgressionUpdated((op: ProgressionUpdateOp) => {
      this.handlers.forEach((handler) => handler(op));
    });
    this.isListening = true;
  }
}
