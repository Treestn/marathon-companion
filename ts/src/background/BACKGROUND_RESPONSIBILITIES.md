# Background Responsibilities

## What Background Owns
- Window orchestration: open/close/restore windows based on game state and user settings.
- Game lifecycle listeners: game launch/terminate and game event handling.
- User progression state: compute and broadcast progression changes.
- Subscription status: fetch and resolve subscription state and expose to windows.
- Backend login: authenticate once and distribute bearer token to windows.

## What Background Should Not Own
- UI rendering or DOM manipulation for non-background windows.
- Per-window page logic and view-specific state.
- Direct network calls from windows (except window-only assets).

## Current Inventory in `background.ts`
- Window control: `openRelevantWindow`, `openWindow`, `closeWindow`, `switchMonitorEvent`.
- Game events: `onGameLaunched`, `onGameInfoUpdated`, `isSupportedGameRunning`.
- Subscription: `initTebexStore`, `getSubscriptionStatus`, `refreshSubscriptionStatus`.
- Hotkeys and window behaviors: `registerInGameHotkey`, `setSwitchScreenToggleHotkeyBehavior`.
- Ads handling: `updateAd`, `createAdListener`, `destroyAd`.

## Bridge Contract (Main Window API)
- `window.backgroundBridge` is the single API surface for other windows.
- Bridge registration uses modular bridge classes in `ts/src/background/bridge/`.
- Current methods:
  - `getSubscriptionStatus`
  - `refreshSubscriptionStatus`
  - `onSubscriptionStatusChanged`
  - `getAuthToken` (returns null until backend login is implemented)
  - `onAuthTokenChanged` (no-op until backend login is implemented)
- Backwards compatibility: `window.subscriptionStatusBridge` remains available.

## Ownership of Shared State
- Subscription status: background fetches once, windows read via bridge.
- Auth token: background manages, windows receive via bridge.
- Game state and progression: background owns and publishes changes.
