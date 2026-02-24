export const kGames = {
    arcRaiders: 27168
}

export const kGamesFeature = {
  matchInfo: 'match_info',
  gameInfo: 'game_info'
}

export const kGamesEventKey = {
  map: "map",
  sessionType: "session_type",
  questsList: "quests_list",
  questsListv2: "quests_list_0",
  raid_type: "raid_type",
}

export const kGameInfo = {
  mapSelection: "scene_SelectLocation",
  matchmaking: "scene_MatchMakerAccept",
  loadToRaid: "scene_TimeHasCome",
  trader: "scene_Trader"
}

export const kGamesFeatures = new Map([
  // Arc Raiders
  [
    kGames.arcRaiders,
    [
      kGamesFeature.matchInfo,
      kGamesFeature.gameInfo
    ]
  ]
]);

export const kGameClassIds = Array.from(kGamesFeatures.keys());

export const kWindowNames = {
  background: 'background',
  inGame: 'in_game',
  questsReminder: 'quests_reminder',
  desktop: 'desktop',
  secondScreen: 'second_screen',
  setting: 'setting'
};

export const kHotkeys = {
  toggle: 'showHideToggle',
  switchScreenToggle: 'switchScreenToggle',
  secondScreenToggle: 'secondScreenToggle'
};

export const storageKeys = {
  applicationConfiguration: "applicationConfiguration",
  playerProgression: "playerProgression",
  windowPositions: "windowPositions",
  firstTimeExperienceActive: "firstTimeExperienceActive"
}

export const dbKeys = {
  databaseProgressionStore: "databaseProgressionStore",
  databaseProgressionEntry: "databaseProgressionEntry"
}

export const settingsKeys = {
  mapDefaultPreference: "mapDefaultPreference",
  secondMonitorPreference: "secondMonitorPreference",
  openWindowOnMatchmaking: "openWindowOnMatchmaking",
  openQuestReminderPreference: "openQuestReminderPreference",
  desktopOnly: "desktopOnly",
  externalLinkWarning: "externalLinkWarning",
  doubleClickCompleteQuest: "doubleClickQuestComplete",
  minimizeOnGameClose: "minimizeOnGameClose",
  displayedPopupList: "displayedPopupList",
  playerLevel: "playerLevel"
}

export const sessionKeys = {
  activeMap: "activeMap",
  secondMonitorFlag: "secondMonitorFlag",
  temporaryMapSelection: "temporaryMapSelection",
  temporaryRaidType: "temporaryRaidType",
  previousGameInfoEvent: "previousGameInfoEvent",
  utilityApiState: "utilityApiState",
  wasInGameState: "wasInGameState",
  filterState: "filterState",
}

export const apiState = {
  down: "down",
  up: "healty"
}

export const progressionTypes = {
  pvp: "pvp",
  pve: "pve"
}