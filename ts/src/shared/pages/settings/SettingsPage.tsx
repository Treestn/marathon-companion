import React, { useEffect, useState } from "react";
import { I18nHelper } from "../../../locale/I18nHelper";
import { WindowsService } from "../../../WindowsService";
import { BackgroundHelper } from "../../../background/BackgroundHelper";
import { Background } from "../../../background/background";
import { kHotkeys, kWindowNames, progressionTypes } from "../../../consts";
import { MapUtils } from "../../../escape-from-tarkov/page/map/utils/MapUtils";
import { PopupHelper } from "../../../popup/PopupHelper";
import { openWipeProgressionModal } from "../../services/WipeProgressionModalEvents";
import { openAutoCompleteModal } from "../../services/AutoCompleteModalEvents";
import {
  openImportProgressionModal,
  openSaveProgressionModal,
} from "../../services/ProgressionFileModalEvents";
import {
  openHotkeyModal,
  subscribeHotkeyAssigned,
} from "../../services/HotkeyModalEvents";
import { AppConfigClient } from "../../services/AppConfigClient";
import { AppConfig, UserSettingsConfig } from "../../models/AppConfig";
import "./settings.css";

type SettingsTab = "app" | "progression" | "map";

type SettingsPageProps = {
  onClose?: () => void;
};

const toBool = (value?: string): boolean => value === "true";

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("app");
  const [isDesktopWindow, setIsDesktopWindow] = useState(true);
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  const [monitors, setMonitors] = useState<overwolf.utils.Display[]>([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>("");
  const [opacityValue, setOpacityValue] = useState(100);
  const [opacityLabel, setOpacityLabel] = useState("100%");
  const [sideQuestHotkey, setSideQuestHotkey] = useState("F1");
  const [inGameHotkey, setInGameHotkey] = useState("");
  const [desktopHotkey, setDesktopHotkey] = useState("");

  const [openWindowOnMatchmaking, setOpenWindowOnMatchmaking] = useState(false);
  const [desktopOnly, setDesktopOnly] = useState(false);
  const [minimizeOnGameClose, setMinimizeOnGameClose] = useState(false);
  const [externalLinkWarning, setExternalLinkWarning] = useState(false);

  const [levelRequired, setLevelRequired] = useState(false);
  const [doubleClickCompleteQuest, setDoubleClickCompleteQuest] = useState(false);

  useEffect(() => {
    I18nHelper.init()
      .then(() => setIsI18nReady(true))
      .catch(() => setIsI18nReady(false));
  }, []);

  useEffect(() => {
    WindowsService.getCurrentWindow()
      .then((result) => {
        setIsDesktopWindow(result.window.name === kWindowNames.desktop);
      })
      .catch(() => setIsDesktopWindow(true));
  }, []);

  useEffect(() => {
    let isMounted = true;
    AppConfigClient.waitForConfig().then((config) => {
      if (isMounted && config) {
        setAppConfig(config);
      }
    });
    const unsubscribe = AppConfigClient.subscribe((config) => {
      if (isMounted) {
        setAppConfig(config);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!appConfig?.userSettings) {
      return;
    }
    const userSettings = appConfig.userSettings;
    const nextMonitorId = userSettings.secondMonitorPreference ?? "";
    setSelectedMonitorId(nextMonitorId);
    setSideQuestHotkey(userSettings.sidePageQuestHotkey ?? "F1");
    const opacity = userSettings.inGameWindowOpacity;
    if (opacity !== undefined && opacity !== null) {
      const percent = Math.round(opacity * 100);
      setOpacityValue(percent);
      setOpacityLabel(`${percent}%`);
    }
    setOpenWindowOnMatchmaking(toBool(userSettings.openWindowOnMatchmaking));
    setDesktopOnly(userSettings.desktopOnly === "true");
    setMinimizeOnGameClose(toBool(userSettings.minimizeOnGameClose));
    setExternalLinkWarning(toBool(userSettings.externalLinkWarning));
    setLevelRequired(userSettings.levelRequired === "true");
    setDoubleClickCompleteQuest(toBool(userSettings.doubleClickCompleteQuest));
    MapUtils.setScaler(userSettings.mapZoomSensitivity || MapUtils.getScaler());
  }, [appConfig]);

  useEffect(() => {
    WindowsService.getMonitorsList()
      .then((list) => setMonitors(list))
      .catch(() => setMonitors([]));
  }, []);

  useEffect(() => {
    if (isDesktopWindow) {
      return;
    }
    BackgroundHelper.getHotkey(kHotkeys.toggle).then(setInGameHotkey);
    BackgroundHelper.getHotkey(kHotkeys.switchScreenToggle).then(setDesktopHotkey);
  }, [isDesktopWindow]);

  const t = (key: string, fallback: string) =>
    isI18nReady ? I18nHelper.get(key) : fallback;

  const handleOpacityChange = (value: number) => {
    setOpacityValue(value);
    setOpacityLabel(`${value}%`);
    if (!isDesktopWindow) {
      Background.setOpacity(value / 100);
    }
  };

  const handleOpacityCommit = () => {
    AppConfigClient.updateConfig({
      userSettings: {
        inGameWindowOpacity: opacityValue / 100,
      },
    });
  };

  useEffect(() => {
    return subscribeHotkeyAssigned((detail) => {
      if (detail.kind === "side-quest") {
        setSideQuestHotkey(detail.value);
        return;
      }
      if (detail.kind === "overwolf") {
        if (detail.hotkeyName === kHotkeys.toggle) {
          setInGameHotkey(detail.value);
        }
        if (detail.hotkeyName === kHotkeys.switchScreenToggle) {
          setDesktopHotkey(detail.value);
        }
      }
    });
  }, []);

  const handleHotkeyClick = (mode: "side-quest" | "in-game" | "desktop") => {
    if (mode === "side-quest") {
      openHotkeyModal({
        kind: "side-quest",
        label: t("pages.hotkeys.title", "Hotkey"),
      });
      return;
    }
    openHotkeyModal({
      kind: "overwolf",
      hotkeyName: mode === "in-game" ? kHotkeys.toggle : kHotkeys.switchScreenToggle,
      label: t("pages.hotkeys.title", "Hotkey"),
    });
  };

  const openQuestReset = () => {
    openWipeProgressionModal({
      progressionType: appConfig?.userSettings?.progressionType ?? progressionTypes.pvp,
    });
  };

  const openQuestAutomation = () => {
    openAutoCompleteModal({
      progressionType: appConfig?.userSettings?.progressionType,
    });
  };

  const updateUserSettings = (patch: Partial<UserSettingsConfig>) => {
    AppConfigClient.updateConfig({ userSettings: patch });
  };

  return (
    <div className="settings-container">
      <section className="settings-page">
        <header className="settings-header">
          <div className="settings-title">
            <img
              className="settings-title-logo"
              src="../img/window_settings.png"
              alt=""
            />
            <span className="settings-title-text">Settings</span>
          </div>
        </header>

        <div className="settings-options">
          <button
            type="button"
            className={`settings-page-button${
              activeTab === "app" ? " setting-page-button-active" : ""
            }`}
            onClick={() => setActiveTab("app")}
          >
            {t("pages.settings.app.label", "App")}
          </button>
          <button
            type="button"
            className={`settings-page-button${
              activeTab === "progression" ? " setting-page-button-active" : ""
            }`}
            onClick={() => setActiveTab("progression")}
          >
            {t("pages.settings.progression.label", "Progression")}
          </button>
        </div>

        <div className="settings-content scroll-div settings-page">
          {activeTab === "app" && (
            <div className="settings-section">
              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.app.monitor", "Preferred Monitor")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <select
                    className="centered setting-dropdown"
                    value={selectedMonitorId}
                    onChange={(event) => {
                      setSelectedMonitorId(event.target.value);
                      updateUserSettings({ secondMonitorPreference: event.target.value });
                    }}
                  >
                    {monitors
                      .filter((monitor) => !monitor.is_primary)
                      .map((monitor) => (
                        <option key={monitor.id} value={monitor.id}>
                          {monitor.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.app.onMatchmaking", "Open on Matchmaking")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-checkbox-container">
                    <label
                      className="switch centered checkbox-container"
                      aria-label={t("pages.settings.app.onMatchmaking", "Open on Matchmaking")}
                    >
                      <input
                        type="checkbox"
                        checked={openWindowOnMatchmaking}
                        onChange={(event) => {
                          const next = event.target.checked;
                          setOpenWindowOnMatchmaking(next);
                          updateUserSettings({ openWindowOnMatchmaking: next ? "true" : "false" });
                        }}
                      />
                      <span className="slider round" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.app.desktopOnly", "Desktop Only")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-checkbox-container">
                    <label
                      className="switch centered checkbox-container"
                      aria-label={t("pages.settings.app.desktopOnly", "Desktop Only")}
                    >
                      <input
                        type="checkbox"
                        checked={desktopOnly}
                        onChange={(event) => {
                          const next = event.target.checked;
                          setDesktopOnly(next);
                          updateUserSettings({ desktopOnly: next ? "true" : "false" });
                        }}
                      />
                      <span className="slider round" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.app.appCloseOnGameClose", "Minimize on Game Close")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-checkbox-container">
                    <label
                      className="switch centered checkbox-container"
                      aria-label={t(
                        "pages.settings.app.appCloseOnGameClose",
                        "Minimize on Game Close",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={minimizeOnGameClose}
                        onChange={(event) => {
                          const next = event.target.checked;
                          setMinimizeOnGameClose(next);
                          updateUserSettings({ minimizeOnGameClose: next ? "true" : "false" });
                        }}
                      />
                      <span className="slider round" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.app.externalLinkWarning", "External Link Warning")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-checkbox-container">
                    <label
                      className="switch centered checkbox-container"
                      aria-label={t(
                        "pages.settings.app.externalLinkWarning",
                        "External Link Warning",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={externalLinkWarning}
                        onChange={(event) => {
                          const next = event.target.checked;
                          setExternalLinkWarning(next);
                          updateUserSettings({ externalLinkWarning: next ? "true" : "false" });
                        }}
                      />
                      <span className="slider round" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.app.opacity", "Opacity")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="slidecontainer">
                    <input
                      className="setting-slider"
                      type="range"
                      min={40}
                      max={100}
                      value={opacityValue}
                      onChange={(event) =>
                        handleOpacityChange(Number(event.target.value))
                      }
                      onMouseUp={handleOpacityCommit}
                      onTouchEnd={handleOpacityCommit}
                    />
                    <span className="opacity-slider-text-value">
                      {opacityLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.app.sidePanelHotkey", "Side Panel Hotkey")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-button-container">
                      <button
                        type="button"
                        className="setting-button multiple-button"
                        onClick={() => handleHotkeyClick("side-quest")}
                      >
                      {sideQuestHotkey}
                    </button>
                  </div>
                </div>
              </div>

              {!isDesktopWindow && (
                <div className="setting-component">
                  <div className="setting-title">
                    <div className="component-title-container">
                      <span className="component-title centered">
                        {t("pages.settings.app.inGameHotkey.text", "In-Game Hotkey")}
                      </span>
                    </div>
                  </div>
                  <div className="setting-value">
                    <div className="setting-button-container">
                      <button
                        type="button"
                        className="setting-button multiple-button"
                        onClick={() => handleHotkeyClick("in-game")}
                      >
                        {inGameHotkey || "Set Hotkey"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.app.uploadLogs.text", "Upload Logs")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-button-container">
                    <button
                      type="button"
                      className="setting-button"
                      onClick={() => {
                        overwolf.utils.uploadClientLogs((result) => {
                          if (result.success) {
                            PopupHelper.addPopup(
                              "Logs Upload",
                              "Logs successfully uploaded, make sure to join our discord to explain the issue you were having so we can fix it.",
                              PopupHelper.SUCCESS_BORDER_COLOR,
                            );
                          } else {
                            PopupHelper.addPopup(
                              "Logs Upload",
                              "Logs failed to upload, try again later or reach out to us on Discord for further assistance",
                              PopupHelper.ERROR_BORDER_COLOR,
                            );
                          }
                          PopupHelper.start();
                        });
                      }}
                    >
                      {t("pages.settings.app.uploadLogs.button", "Upload")}
                    </button>
                  </div>
                </div>
              </div> */}
            </div>
          )}

          {activeTab === "progression" && (
            <div className="settings-section">
              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.progression.level", "Level Required")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-checkbox-container">
                    <label
                      className="switch centered checkbox-container"
                      aria-label={t("pages.settings.progression.level", "Level Required")}
                    >
                      <input
                        type="checkbox"
                        checked={levelRequired}
                        onChange={(event) => {
                          const next = event.target.checked;
                          setLevelRequired(next);
                          updateUserSettings({ levelRequired: next ? "true" : "false" });
                          const levelDomEl = document.getElementById("level-navigation");
                          if (levelDomEl) {
                            levelDomEl.style.display = next ? "" : "none";
                          }
                        }}
                      />
                      <span className="slider round" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t(
                        "pages.settings.progression.completedButton",
                        "Double click complete quest",
                      )}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-checkbox-container">
                    <label
                      className="switch centered checkbox-container"
                      aria-label={t(
                        "pages.settings.progression.completedButton",
                        "Double click complete quest",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={doubleClickCompleteQuest}
                        onChange={(event) => {
                          const next = event.target.checked;
                          setDoubleClickCompleteQuest(next);
                          updateUserSettings({ doubleClickCompleteQuest: next ? "true" : "false" });
                        }}
                      />
                      <span className="slider round" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.progression.wipe.text", "Reset Progression")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-button-container">
                    <button
                      type="button"
                      className="setting-button"
                      onClick={openQuestReset}
                    >
                      {t("pages.settings.progression.wipe.button.1", "Reset")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.progression.save.text", "Save Progression")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-button-container">
                    <button
                      type="button"
                      className="setting-button"
                      onClick={openSaveProgressionModal}
                    >
                      {t("pages.settings.progression.save.button", "Save")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t("pages.settings.progression.import.text", "Import Progression")}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-button-container">
                    <button
                      type="button"
                      className="setting-button"
                      onClick={openImportProgressionModal}
                    >
                      {t("pages.settings.progression.import.button", "Import")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="setting-component">
                <div className="setting-title">
                  <div className="component-title-container">
                    <span className="component-title centered">
                      {t(
                        "pages.settings.progression.questCompletedAutomation.text",
                        "Quest Completion Automation",
                      )}
                    </span>
                  </div>
                </div>
                <div className="setting-value">
                  <div className="setting-button-container">
                    <button
                      type="button"
                      className="setting-button"
                      onClick={openQuestAutomation}
                    >
                      {t(
                        "pages.settings.progression.questCompletedAutomation.button",
                        "Enable",
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
