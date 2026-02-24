import React, { useEffect, useMemo, useState } from "react";
import { I18nHelper } from "../../../locale/I18nHelper";
import {
  dispatchHotkeyAssigned,
  HotkeyModalTarget,
} from "../../services/HotkeyModalEvents";
import { AppConfigClient } from "../../services/AppConfigClient";
import { BackgroundHelper } from "../../../background/BackgroundHelper";
import "./hotkey-modal.css";

type HotkeyModalProps = {
  isOpen: boolean;
  target: HotkeyModalTarget | null;
  onClose: () => void;
};

const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt"]);

export const HotkeyModal: React.FC<HotkeyModalProps> = ({ isOpen, target, onClose }) => {
  const [hotkeyText, setHotkeyText] = useState("");
  const [keyCode, setKeyCode] = useState<number | null>(null);
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isI18nReady, setIsI18nReady] = useState(false);

  const title = useMemo(() => {
    if (!target) {
      return "Hotkey";
    }
    return target.label ?? "Hotkey";
  }, [target]);

  useEffect(() => {
    if (!isOpen || !target) {
      return;
    }
    I18nHelper.init()
      .then(() => setIsI18nReady(true))
      .catch(() => setIsI18nReady(false));
    setHotkeyText("");
    setKeyCode(null);
    setErrorText("");
    const loadCurrent = async () => {
      if (target.kind === "overwolf") {
        const hotkey = await BackgroundHelper.getHotkey(target.hotkeyName);
        setHotkeyText(hotkey);
        return;
      }
      const existing =
        AppConfigClient.getConfig()?.userSettings?.sidePageQuestHotkey ??
        (await AppConfigClient.waitForConfig())?.userSettings?.sidePageQuestHotkey;
      setHotkeyText(existing ?? "");
    };
    loadCurrent();
  }, [isOpen, target]);

  if (!isOpen || !target) {
    return null;
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setErrorText("");

    const key = event.key;
    let text = "";
    let nextKeyCode: number | null = null;

    if (target.kind === "overwolf") {
      if (event.ctrlKey) {
        text += "Ctrl + ";
      }
      if (event.shiftKey) {
        text += "Shift + ";
      }
      if (event.altKey) {
        text += "Alt + ";
      }
    }

    if (!MODIFIER_KEYS.has(key)) {
      text += key.toUpperCase();
      nextKeyCode = event.keyCode;
    }

    setHotkeyText(text);
    setKeyCode(nextKeyCode);
  };

  const assignHotkey = async () => {
    if (!keyCode) {
      setErrorText("Press a hotkey to assign.");
      return;
    }
    setIsSubmitting(true);
    setErrorText("");

    if (target.kind === "side-quest") {
      AppConfigClient.updateConfig({
        userSettings: {
          sidePageQuestHotkey: hotkeyText,
        },
      });
      dispatchHotkeyAssigned({ kind: "side-quest", value: hotkeyText });
      setIsSubmitting(false);
      onClose();
      return;
    }

    const bridge = (overwolf?.windows?.getMainWindow?.() as any)?.backgroundBridge;
    const result = bridge?.assignHotkey
      ? await bridge.assignHotkey(target.hotkeyName, hotkeyText, keyCode)
      : { success: false, error: "Hotkey assignment failed." };

    if (!result.success) {
      setErrorText(result.error || "Hotkey assignment failed.");
      setIsSubmitting(false);
      return;
    }

    dispatchHotkeyAssigned({
      kind: "overwolf",
      hotkeyName: target.hotkeyName,
      value: hotkeyText,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="hotkey-modal-overlay" role="presentation" onClick={onClose}>
      <div className="hotkey-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="hotkey-modal-header">
          <h3 className="hotkey-modal-title">{title}</h3>
          <button
            type="button"
            className="hotkey-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="hotkey-modal-body">
          <input
            className={`hotkey-modal-input${errorText ? " has-error" : ""}`}
            type="text"
            onKeyDown={handleKeyDown}
            placeholder={
              isI18nReady ? I18nHelper.get("pages.hotkeys.placeholder") : "Press a hotkey"
            }
            value={hotkeyText}
            readOnly
            autoFocus
          />
          {errorText && <div className="hotkey-modal-error">{errorText}</div>}
          <button
            type="button"
            className="hotkey-modal-apply"
            onClick={assignHotkey}
            disabled={isSubmitting}
          >
            {isI18nReady ? I18nHelper.get("pages.hotkeys.apply") : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
};
