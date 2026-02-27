import { progressionTypes } from "../../consts";
import { I18nHelper } from "../../locale/I18nHelper";
import { Maps, MapsList } from "../../escape-from-tarkov/constant/MapsConst";
import { MessageStoredImpl, MessageStoredObject } from "../../model/message/IMessageStored";

export type UserSettingsConfig = {
  locale: string;
  questAutomationFlag: string;
  levelReminderFlag: string;
  levelRequired: string;
  secondMonitorPreference: string;
  enableSecondScreenWindow: string;
  progressionType: string;
  mapDefaultPreference: string;
  openWindowOnMatchmaking: string;
  openQuestReminderPreference: string;
  desktopOnly: string;
  externalLinkWarning: string;
  doubleClickCompleteQuest: string;
  minimizeOnGameClose: string;
  inGameWindowOpacity: number;
  timerOn: string;
  preferredImageUploadPath: string;
  mapZoomSensitivity: number;
  firstTimePlaying: string;
  sidePageQuestHotkey: string;
  isFirstTraderScene: string;
  displayedPopupList: MessageStoredObject;
};

export type MapSettingsConfig = Record<string, unknown>;

export type AppConfig = {
  version: number;
  userSettings: UserSettingsConfig;
  mapSettings: MapSettingsConfig;
};

export type AppConfigPatch = {
  version?: number;
  userSettings?: Partial<UserSettingsConfig>;
  mapSettings?: Partial<MapSettingsConfig>;
};

export const createDefaultAppConfig = (): AppConfig => ({
  version: 1,
  userSettings: {
    locale: I18nHelper.defaultLocale,
    questAutomationFlag: "false",
    levelReminderFlag: "true",
    levelRequired: "true",
    secondMonitorPreference: "",
    enableSecondScreenWindow: "true",
    progressionType: progressionTypes.pvp,
    mapDefaultPreference: MapsList[0].id,
    openWindowOnMatchmaking: "true",
    openQuestReminderPreference: "true",
    desktopOnly: "false",
    externalLinkWarning: "true",
    doubleClickCompleteQuest: "false",
    minimizeOnGameClose: "false",
    inGameWindowOpacity: 1,
    timerOn: "true",
    preferredImageUploadPath: globalThis.overwolf?.io?.paths?.documents ?? "",
    mapZoomSensitivity: 1.4,
    firstTimePlaying: "true",
    sidePageQuestHotkey: "F1",
    isFirstTraderScene: "true",
    displayedPopupList: new MessageStoredImpl(),
  },
  mapSettings: {},
});
