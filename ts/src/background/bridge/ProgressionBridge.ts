import { BridgeModule } from "./BackgroundBridgeRegistry";
import {
  PlayerProgressionService,
  ProgressionUpdateOp,
} from "../services/app-data/PlayerProgressionService";

export class ProgressionBridge implements BridgeModule {
  public constructor(
    private readonly progressionService: PlayerProgressionService,
  ) {}

  public getApi() {
    return {
      updateProgression: (op: ProgressionUpdateOp) =>
        this.progressionService.applyUpdate(op),
      onProgressionUpdated: (handler: (op: ProgressionUpdateOp) => void) => {
        this.progressionService.on("updated", handler);
        return () => {
          this.progressionService.off("updated", handler);
        };
      },
      isQuestActive: (questId: string) =>
        this.progressionService.isQuestActive(questId),
      isQuestCompleted: (questId: string) =>
        this.progressionService.isQuestCompleted(questId),
      isQuestObjectiveCompleted: (questId: string, objectiveId: string) =>
        this.progressionService.isQuestObjectiveCompleted(questId, objectiveId),
      isQuestFailed: (questId: string) =>
        this.progressionService.isQuestFailed(questId),
      isQuestTracked: (questId: string) =>
        this.progressionService.isQuestTracked(questId),
      isQuestManuallyActivated: (questId: string) =>
        this.progressionService.isQuestManuallyActivated(questId),
      getItemCurrentQuantity: (itemId: string) =>
        this.progressionService.getItemCurrentQuantity(itemId),
      getAllItemQuantities: () =>
        this.progressionService.getAllItemQuantities(),
      increaseItemQuantity: (itemId: string, quantity: number) =>
        this.progressionService.increaseItemQuantity(itemId, quantity),
      decreaseItemQuantity: (itemId: string, quantity: number) =>
        this.progressionService.decreaseItemQuantity(itemId, quantity),
      saveProgressionToFile: (filePath: string) =>
        this.progressionService.saveProgressionToFile(filePath),
      getHideoutStationState: (stationId: string) =>
        this.progressionService.getHideoutStationState(stationId),
      getHideoutStationLevelState: (stationId: string, levelId: string) =>
        this.progressionService.getHideoutStationLevelState(stationId, levelId),
      resetHideoutStation: (stationId: string) =>
        this.progressionService.resetHideoutStation(stationId),
      getItemRequiredCounts: (options: { includeQuests: boolean; includeHideout: boolean }) =>
        this.progressionService.getItemRequiredCounts(options),
      getTrackedItemRequiredCounts: (options: { includeQuests: boolean; includeHideout: boolean }) =>
        this.progressionService.getTrackedItemRequiredCounts(options),
      getTrackedItemIds: (options: { includeQuests: boolean; includeHideout: boolean }) =>
        this.progressionService.getTrackedItemIds(options),
      getItemRequirementDetails: (
        itemId: string,
        options: { includeQuests: boolean; includeHideout: boolean },
      ) => this.progressionService.getItemRequirementDetails(itemId, options),
    };
  }
}
