// eslint-disable-next-line unicorn/prefer-node-protocol
import { EventEmitter } from "events";
import { storageKeys } from "../../../consts";
import { StorageHelper } from "../../../escape-from-tarkov/service/helper/StorageHelper";

type FirstTimeExperienceEvents = {
  updated: [boolean];
};

export class FirstTimeExperienceService extends EventEmitter<FirstTimeExperienceEvents> {
  private isActive = true;

  public init(): void {
    const stored = StorageHelper.getStoredData(storageKeys.firstTimeExperienceActive);
    if (JSON.parse(stored) === "false") {
      this.isActive = false;
    }
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public setIsActive(value: boolean): void {
    if (this.isActive === value) {
      return;
    }
    this.isActive = value;
    StorageHelper.save(storageKeys.firstTimeExperienceActive, value ? "true" : "false");
    this.emit("updated", this.isActive);
  }
}
