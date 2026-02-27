// const hostname = "https://companions-api.treestn-dev.ca";
const submissionHostname = "https://companions-submissions.treestn-dev.ca";
const hostname = "http://localhost:8080";
// const submissionHostname = "http://localhost:8080";

const RESOURCE_GAME = "marathon";
const GAME_NAMESPACE_ID = "2a412452-9b3a-48c4-bc73-4daaf89cfd9a";
const resourceBase = `${hostname}/v1/resources/${RESOURCE_GAME}`;

const endpoints = {
  hostname,
  submissionHostname,
  health: `${hostname}/health`,
  ammo_config: `${hostname}/resources/ammo`,
  items_v2_config: (locale: string, currentVersion: string) =>
    `${resourceBase}/items/${locale}/${currentVersion}`,
  map_filter_config_v2: (mapId: string, currentVersion: string) =>
    `${resourceBase}/map/${mapId}/filters/${currentVersion}`,
  map_floor_config_v2: (mapId: string, currentVersion: string) =>
    `${resourceBase}/map/${mapId}/floors/${currentVersion}`,
  quest_config: (currentVersion: string) => `${resourceBase}/quests/${currentVersion}`,
  hideout_config: (currentVersion: string) => `${resourceBase}/hideout/${currentVersion}`,
  messages_info: `${hostname}/resources/messages`,

  login: `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/auth/login`,

  submission_health: `${submissionHostname}/actuator/health`,
  newSubmission: `${submissionHostname}/v2/arc-raiders/submission/new`,
  upload_image_no_crop: `${submissionHostname}/v2/arc-raiders/submission/upload/image/noCrop`,
  upload_image_crop: `${submissionHostname}/v2/arc-raiders/submission/upload/image/cropped`,


  trades: `${submissionHostname}/v2/${GAME_NAMESPACE_ID}/trades`,
  myActiveTrades: `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades/me/active`,
  myActiveTradesCount: `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades/me/active/count`,
  myTradeHistory: `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades/me/history`,
  pendingRatings: `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades/me/pending-ratings`,
  userProfile: `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/profiles/me`,
  profileExists: `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/profiles/me/exists`,
  createProfile: `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/profiles`,
  createTrade: `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades`,
  deleteTrade: (tradeId: string) =>
    `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades/${tradeId}`,
  acceptTrade: (tradeId: string) =>
    `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades/${tradeId}/accept`,
  cancelTrade: (tradeId: string) =>
    `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades/${tradeId}/cancel`,
  completeTrade: (tradeId: string) =>
    `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades/${tradeId}/completed`,
  rateTrade: (tradeId: string) =>
    `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades/${tradeId}/rate`,
  getTradeCounterparty: (tradeId: string) =>
    `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/trades/${tradeId}/counterparty`,
  getUserProfile: (profileId: string) =>
    `${submissionHostname}/v1/${GAME_NAMESPACE_ID}/profiles/${profileId}`,
} as const;

export default endpoints;
