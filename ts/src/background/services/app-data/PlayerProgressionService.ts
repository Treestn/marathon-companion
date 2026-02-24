// eslint-disable-next-line unicorn/prefer-node-protocol
import { EventEmitter } from "events";
import { PlayerProgressionUtils } from "../../../escape-from-tarkov/utils/PlayerProgressionUtils";
import { HideoutUtils } from "../../../escape-from-tarkov/page/hideout/utils/HideoutUtils";
import { HideoutState, StationLevelState } from "../../../model/IPlayerProgression";
import { ItemsUtils } from "../../../escape-from-tarkov/utils/ItemsUtils";
import { QuestsUtils } from "../../../escape-from-tarkov/page/quests/utils/QuestsUtils";
import { ObjectiveTypeConst } from "../../../escape-from-tarkov/constant/EditQuestConst";
import { AppConfigUtils } from "../../../escape-from-tarkov/utils/AppConfigUtils";
import { progressionTypes } from "../../../consts";
import { AppDataLoader } from "./AppDataLoader";

export type ProgressionUpdateOp =
  | { type: "quest-active"; questId: string; isActive: boolean; forceUpdate?: boolean }
  | { type: "quest-completed"; questId: string; isCompleted: boolean }
  | { type: "quest-objective"; questId: string; objectiveId: string; isCompleted: boolean }
  | { type: "quest-wipe"; progressionType: string }
  | { type: "quest-auto-complete"; progressionType?: string }
  | { type: "item-quantity"; itemId: string; quantity?: number; delta?: number }
  | { type: "hideout-reset-station"; stationId: string }
  | { type: "hideout-level-track"; stationId: string; levelId: string; isActive: boolean }
  | { type: "hideout-level-complete"; stationId: string; levelId: string };

type ProgressionServiceEvents = {
  updated: [ProgressionUpdateOp];
};

type RequirementState = "active" | "inactive" | "completed";

export class PlayerProgressionService extends EventEmitter<ProgressionServiceEvents> {
  public async init(): Promise<void> {
    console.log("Initializing player progression service");
    await PlayerProgressionUtils.load();
    await AppDataLoader.loadAll();
    console.log("Player progression service initialized");
  }

  public isQuestActive(questId: string): boolean {
    return PlayerProgressionUtils.isQuestActive(questId);
  }

  public isQuestCompleted(questId: string): boolean {
    return PlayerProgressionUtils.isQuestCompleted(questId);
  }

  public isQuestObjectiveCompleted(questId: string, objectiveId: string): boolean {
    const quest = QuestsUtils.getQuestFromID(questId);
    if (!quest) {
      return false;
    }
    return PlayerProgressionUtils.isQuestObjectiveCompleted(quest, objectiveId);
  }

  public isQuestFailed(questId: string): boolean {
    return PlayerProgressionUtils.isQuestFailed(questId);
  }

  public isQuestTracked(questId: string): boolean {
    return PlayerProgressionUtils.isQuestTracked(questId);
  }

  public isQuestManuallyActivated(questId: string): boolean {
    return PlayerProgressionUtils.isQuestManuallyActivated(questId);
  }

  public getItemCurrentQuantity(itemId: string): number {
    const itemState = PlayerProgressionUtils.getItemState(itemId);
    return itemState ? itemState.currentQuantity : 0;
  }

  public getAllItemQuantities(): Record<string, number> {
    return PlayerProgressionUtils.getAllItemQuantities();
  }

  public increaseItemQuantity(itemId: string, quantity: number): void {
    const itemState = PlayerProgressionUtils.getItemState(itemId);
    if (itemState) {
      if (itemState.currentQuantity < 0) {
        itemState.currentQuantity = 0;
      }
      itemState.currentQuantity += quantity;
      PlayerProgressionUtils.save();
      this.emit("updated", {
        type: "item-quantity",
        itemId,
        quantity: itemState.currentQuantity,
      });
    }
  }

  public decreaseItemQuantity(itemId: string, quantity: number): void {
    const itemState = PlayerProgressionUtils.getItemState(itemId);
    if (itemState) {
      if (itemState.currentQuantity - quantity < 0) {
        itemState.currentQuantity = 0;
      } else {
        itemState.currentQuantity -= quantity;
      }
      PlayerProgressionUtils.save();
      this.emit("updated", {
        type: "item-quantity",
        itemId,
        quantity: itemState.currentQuantity,
      });
    }
  }

  public async saveProgressionToFile(filePath: string): Promise<overwolf.Result> {
    const data = PlayerProgressionUtils.getPlayerProgressionJsonString();
    return new Promise((resolve) => {
      overwolf.io.writeFileContents(
        filePath.endsWith(".json") ? filePath : `${filePath}.json`,
        data,
        overwolf.io.enums.eEncoding.UTF8,
        false,
        (result) => {
          resolve(result);
        },
      );
    });
  }

  public getHideoutStationState(stationId: string): HideoutState | null {
    return PlayerProgressionUtils.getHideoutStationState(stationId);
  }

  public getHideoutStationLevelState(
    stationId: string,
    levelId: string,
  ): StationLevelState | null {
    return PlayerProgressionUtils.getStationLevelState(stationId, levelId);
  }

  public resetHideoutStation(stationId: string): void {
    const state = PlayerProgressionUtils.getHideoutStationState(stationId);
    if (!state) {
      console.warn(
        `[PlayerProgressionService] Hideout state not found for station: ${stationId}`,
      );
      return;
    }
    state.completed = false;
    state.active = true;
    if (state.stationLevelState && state.stationLevelState.length > 0) {
      state.stationLevelState.forEach((levelState) => {
        const stationLevel = HideoutUtils.getStationLevel(stationId, levelState.id);
        if (stationLevel) {
          levelState.active = stationLevel.level === 1;
          if(levelState.completed) {
            levelState.completed = false;
            HideoutUtils.giveItemsBack(stationLevel);
          }
        }
      });
    }
    PlayerProgressionUtils.save();
    this.emit("updated", { type: "hideout-reset-station", stationId });
  }

  public setHideoutStationLevelTracking(
    stationId: string,
    levelId: string,
    isActive: boolean,
  ): void {
    const levelState = PlayerProgressionUtils.getStationLevelState(stationId, levelId);
    if (!levelState) {
      console.warn(
        `[PlayerProgressionService] Hideout level state not found for station: ${stationId}`,
      );
      return;
    }
    levelState.active = isActive;
    PlayerProgressionUtils.save();
  }

  public setHideoutStationLevelCompleted(stationId: string, levelId: string): void {
    const levelState = PlayerProgressionUtils.getStationLevelState(stationId, levelId);
    if (!levelState) {
      console.warn(
        `[PlayerProgressionService] Hideout level state not found for station: ${stationId}`,
      );
      return;
    }
    
    const station = HideoutUtils.getStation(stationId);
    const targetLevel = HideoutUtils.getStationLevel(stationId, levelId);
    if (station && targetLevel) {
      station.levels
        .filter((level) => level.level <= targetLevel.level)
        .forEach((level) => {
          const prevLevelState = PlayerProgressionUtils.getStationLevelState(
            stationId,
            level.id,
          );
          if (prevLevelState && !prevLevelState.completed) {
            HideoutUtils.giveItems(level);
            prevLevelState.completed = true;
            prevLevelState.active = false;
          }
        });
    } else {
      levelState.completed = true;
      levelState.active = false;
    }
    const nextLevel = HideoutUtils.getNextStationLevel(stationId, levelId);
    if (nextLevel) {
      const nextLevelState = PlayerProgressionUtils.getStationLevelState(stationId, nextLevel.id);
      if (nextLevelState) {
        nextLevelState.active = true;
      }
    }
    PlayerProgressionUtils.save();
  }

  public getItemRequiredCounts(options: {
    includeQuests: boolean;
    includeHideout: boolean;
  }): Record<string, number> {
    const counts = new Map<string, number>();
    if (options.includeQuests) {
      ItemsUtils.getQuestRequiredAmount().forEach((count, itemId) => {
        counts.set(itemId, (counts.get(itemId) ?? 0) + count);
      });
    }
    if (options.includeHideout) {
      ItemsUtils.getHideoutRequiredAmount().forEach((count, itemId) => {
        counts.set(itemId, (counts.get(itemId) ?? 0) + count);
      });
    }
    return Object.fromEntries(counts.entries());
  }

  public getTrackedItemRequiredCounts(options: {
    includeQuests: boolean;
    includeHideout: boolean;
  }): Record<string, number> {
    const counts = new Map<string, number>();
    if (options.includeQuests) {
      QuestsUtils.getActiveQuests().forEach((quest) => {
        quest.objectives?.forEach((objective) => {
          if (
            (objective.type === ObjectiveTypeConst.GIVE_ITEM.type ||
              objective.type === ObjectiveTypeConst.FIND_ITEM.type) &&
            objective.item?.id
          ) {
            const objectiveState = PlayerProgressionUtils.getObjectiveState(
              quest.id,
              objective.id,
            );
            if (objectiveState && !objectiveState.completed) {
              const itemId = objective.item.id;
              const amount = counts.get(itemId) ?? 0;
              counts.set(itemId, amount + objective.count);
            }
          }
        });
      });
    }
    if (options.includeHideout) {
      const progressionType = AppConfigUtils.getAppConfig().userSettings.getProgressionType();
      HideoutUtils.getActiveStationsLevel().forEach((levels, station) => {
        levels.forEach((level) => {
          const levelState = PlayerProgressionUtils.getStationLevelState(
            station.id,
            level.id,
          );
          if (levelState?.completed) {
            return;
          }
          const requirements =
            progressionType === progressionTypes.pve
              ? level.itemPveRequirements
              : level.itemRequirements;
          requirements?.forEach((requirement) => {
            const itemId = requirement.item.id;
            const amount = counts.get(itemId) ?? 0;
            counts.set(itemId, amount + requirement.quantity);
          });
        });
      });
    }
    return Object.fromEntries(counts.entries());
  }

  public getTrackedItemIds(options: {
    includeQuests: boolean;
    includeHideout: boolean;
  }): string[] {
    const tracked = new Set<string>();
    if (options.includeQuests) {
      ItemsUtils.getAllQuestItemsActive(false, false).forEach((_, itemId) => {
        tracked.add(itemId);
      });
    }
    if (options.includeHideout) {
      ItemsUtils.getAllHideoutItemsActive(false).forEach((_, itemId) => {
        tracked.add(itemId);
      });
    }
    return Array.from(tracked);
  }

  public getItemRequirementDetails(
    itemId: string,
    options: { includeQuests: boolean; includeHideout: boolean },
  ): Array<{
    kind: "quest" | "hideout";
    id: string;
    name: string;
    amount: number;
    state: RequirementState;
    traderId?: string;
    stationId?: string;
    level?: number;
  }> {
    const details: Array<{
      kind: "quest" | "hideout";
      id: string;
      name: string;
      amount: number;
      state: RequirementState;
      traderId?: string;
      stationId?: string;
      level?: number;
    }> = [];

    if (options.includeQuests) {
      QuestsUtils.getData().tasks.forEach((quest) => {
        let amount = 0;
        quest.objectives?.forEach((objective) => {
          if (
            (objective.type === ObjectiveTypeConst.GIVE_ITEM.type ||
              objective.type === ObjectiveTypeConst.FIND_ITEM.type) &&
            objective.item?.id === itemId
          ) {
            const objectiveState = PlayerProgressionUtils.getObjectiveState(
              quest.id,
              objective.id,
            );
            if (!objectiveState || objectiveState.completed) {
              return;
            }
            amount += objective.count;
          }
        });
        if (amount > 0) {
          const isCompleted = PlayerProgressionUtils.isQuestCompleted(quest.id);
          const isActive =
            PlayerProgressionUtils.isQuestActive(quest.id) ||
            PlayerProgressionUtils.isQuestManuallyActivated(quest.id);
          let questState: RequirementState = "inactive";
          if (isCompleted) {
            questState = "completed";
          } else if (isActive) {
            questState = "active";
          }
          details.push({
            kind: "quest",
            id: quest.id,
            name: quest.name ?? "Quest",
            amount,
            state: questState,
            traderId: quest.trader?.id,
          });
        }
      });
    }

    if (options.includeHideout) {
      const progressionType = AppConfigUtils.getAppConfig().userSettings.getProgressionType();
      HideoutUtils.getData().hideoutStations.forEach((station) => {
        station.levels?.forEach((level) => {
          const requirements =
            progressionType === progressionTypes.pve
              ? level.itemPveRequirements
              : level.itemRequirements;
          if (!requirements?.length) {
            return;
          }
          const requirement = requirements.find((entry) => entry.item?.id === itemId);
          if (!requirement) {
            return;
          }
          const levelState = PlayerProgressionUtils.getStationLevelState(
            station.id,
            level.id,
          );
          let state: RequirementState = "inactive";
          if (levelState?.completed) {
            state = "completed";
          } else if (levelState?.active) {
            state = "active";
          }
          details.push({
            kind: "hideout",
            id: level.id,
            name: station.name ?? "Station",
            amount: requirement.quantity,
            state,
            stationId: station.id,
            level: level.level,
          });
        });
      });
    }

    return details;
  }

  public async applyUpdate(operation: ProgressionUpdateOp): Promise<void> {
    switch (operation.type) {
      case "quest-active":
        QuestsUtils.setActiveQuest(
          operation.questId,
          operation.isActive,
          operation.forceUpdate,
        );
        break;
      case "quest-completed":
        QuestsUtils.setCompletedQuestState(operation.questId, operation.isCompleted);
        break;
      case "quest-wipe":
        PlayerProgressionUtils.wipeQuests(operation.progressionType);
        break;
      case "quest-auto-complete":
        PlayerProgressionUtils.completeQuestsAutomatically();
        break;
      case "quest-objective": {
        const quest = QuestsUtils.getQuestFromID(operation.questId);
        if (!quest) {
          console.warn(
            `[PlayerProgressionService] Quest not found for objective update: ${operation.questId}`,
          );
          break;
        }
        QuestsUtils.setQuestObjectiveCompleted(
          quest.id,
          operation.objectiveId,
          operation.isCompleted,
        );
        break;
      }
      case "item-quantity": {
        const itemState = PlayerProgressionUtils.getItemState(operation.itemId);
        if (!itemState) {
          console.warn(
            `[PlayerProgressionService] Item not found for quantity update: ${operation.itemId}`,
          );
          break;
        }
        if (typeof operation.quantity === "number") {
          itemState.currentQuantity = Math.max(0, operation.quantity);
        } else if (typeof operation.delta === "number") {
          itemState.currentQuantity = Math.max(
            0,
            itemState.currentQuantity + operation.delta,
          );
        }
        PlayerProgressionUtils.save();
        break;
      }
      case "hideout-reset-station": {
        this.resetHideoutStation(operation.stationId);
        break;
      }
      case "hideout-level-track": {
        this.setHideoutStationLevelTracking(
          operation.stationId,
          operation.levelId,
          operation.isActive,
        );
        break;
      }
      case "hideout-level-complete": {
        this.setHideoutStationLevelCompleted(operation.stationId, operation.levelId);
        break;
      }
      default:
        console.warn(
          "[PlayerProgressionService] Unsupported update:",
          operation,
        );
        return;
    }

    this.emit("updated", operation);
  }
}
