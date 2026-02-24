// eslint-disable-next-line unicorn/prefer-node-protocol
import { EventEmitter } from "events";
import { storageKeys, settingsKeys } from "../../../consts";
import { StorageHelper } from "../../../escape-from-tarkov/service/helper/StorageHelper";
import {
  createDefaultAppConfig,
  AppConfig,
  AppConfigPatch,
  UserSettingsConfig,
} from "../../../shared/models/AppConfig";
import { MessageStoredImpl, MessageStoredObject } from "../../../model/message/IMessageStored";

type StringUserSettingKey = {
  [Key in keyof UserSettingsConfig]-?: UserSettingsConfig[Key] extends string ? Key : never;
}[keyof UserSettingsConfig];

type AppConfigEvents = {
  updated: [AppConfig];
};

const toMessageStoredObject = (value: unknown): MessageStoredObject => {
  if (value && typeof value === "object" && Array.isArray((value as MessageStoredObject).messagesDisplayed)) {
    return value as MessageStoredObject;
  }
  return new MessageStoredImpl();
};

const parseJson = (value: string | null): unknown => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export class AppConfigService extends EventEmitter<AppConfigEvents> {
  private config: AppConfig = createDefaultAppConfig();

  private readonly handleStorageEvent = (event: StorageEvent) => {
    if (!event.key) {
      return;
    }
    const legacyKeys = new Set(Object.values(settingsKeys));
    if (event.key !== storageKeys.applicationConfiguration && !legacyKeys.has(event.key)) {
      return;
    }
    const nextConfig = this.loadConfig();
    this.config = nextConfig;
    this.emit("updated", this.config);
  };

  public async init(): Promise<void> {
    this.config = this.loadConfig();
    this.persist();
    globalThis.addEventListener?.("storage", this.handleStorageEvent);
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public updateConfig(patch: AppConfigPatch): AppConfig {
    this.config = this.mergeConfig(this.config, patch);
    this.persist();
    this.emit("updated", this.config);
    return this.config;
  }

  private loadConfig(): AppConfig {
    const defaults = createDefaultAppConfig();
    const stored = StorageHelper.getStoredData(storageKeys.applicationConfiguration);
    const parsed = parseJson(stored) as Partial<AppConfig> | null;
    const merged = this.mergeConfig(defaults, parsed ?? {});
    const legacyOverrides = this.readLegacyOverrides();
    return this.mergeConfig(merged, { userSettings: legacyOverrides });
  }

  private readLegacyOverrides(): Partial<UserSettingsConfig> {
    const overrides: Partial<UserSettingsConfig> = {};

    const maybeSet = (key: StringUserSettingKey, value: string | null) => {
      if (value !== null && value !== undefined && value !== "") {
        overrides[key] = value;
      }
    };

    maybeSet("secondMonitorPreference", localStorage.getItem(settingsKeys.secondMonitorPreference));
    maybeSet("mapDefaultPreference", localStorage.getItem(settingsKeys.mapDefaultPreference));
    maybeSet("openWindowOnMatchmaking", localStorage.getItem(settingsKeys.openWindowOnMatchmaking));
    maybeSet("openQuestReminderPreference", localStorage.getItem(settingsKeys.openQuestReminderPreference));
    maybeSet("desktopOnly", localStorage.getItem(settingsKeys.desktopOnly));
    maybeSet("externalLinkWarning", localStorage.getItem(settingsKeys.externalLinkWarning));
    maybeSet("doubleClickCompleteQuest", localStorage.getItem(settingsKeys.doubleClickCompleteQuest));
    maybeSet("minimizeOnGameClose", localStorage.getItem(settingsKeys.minimizeOnGameClose));

    const displayedPopupList = parseJson(localStorage.getItem(settingsKeys.displayedPopupList));
    if (displayedPopupList) {
      overrides.displayedPopupList = toMessageStoredObject(displayedPopupList);
    }

    return overrides;
  }

  private mergeConfig(base: AppConfig, patch?: AppConfigPatch): AppConfig {
    if (!patch) {
      return base;
    }
    const mergedUserSettings: UserSettingsConfig = patch.userSettings
      ? { ...base.userSettings, ...patch.userSettings }
      : base.userSettings;

    if (patch.userSettings?.displayedPopupList) {
      mergedUserSettings.displayedPopupList = toMessageStoredObject(
        patch.userSettings.displayedPopupList,
      );
    }

    return {
      version: patch.version ?? base.version,
      userSettings: mergedUserSettings,
      mapSettings: patch.mapSettings
        ? { ...base.mapSettings, ...patch.mapSettings }
        : base.mapSettings,
    };
  }

  private persist(): void {
    StorageHelper.save(storageKeys.applicationConfiguration, this.config);
  }
}
