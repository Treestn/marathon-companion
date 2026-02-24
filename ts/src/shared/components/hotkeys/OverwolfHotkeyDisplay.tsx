import React, { useEffect, useState } from "react";
import { BackgroundHelper } from "../../../background/BackgroundHelper";
import {
  openHotkeyModal,
  subscribeHotkeyAssigned,
} from "../../services/HotkeyModalEvents";

type OverwolfHotkeyDisplayProps = {
  label: string;
  hotkeyName: string;
};

export const OverwolfHotkeyDisplay: React.FC<OverwolfHotkeyDisplayProps> = ({
  label,
  hotkeyName,
}) => {
  const [hotkeyText, setHotkeyText] = useState<string>("");

  useEffect(() => {
    const loadHotkey = async () => {
      const keyText = await BackgroundHelper.getHotkey(hotkeyName);
      setHotkeyText(keyText);
    };
    loadHotkey();
  }, [hotkeyName]);

  useEffect(() => {
    return subscribeHotkeyAssigned((detail) => {
      if (detail.kind === "overwolf" && detail.hotkeyName === hotkeyName) {
        setHotkeyText(detail.value);
      }
    });
  }, [hotkeyName]);

  const handleClick = () => {
    openHotkeyModal({
      kind: "overwolf",
      hotkeyName,
      label,
    });
  };

  if (!hotkeyText) {
    return null;
  }

  return (
    <button type="button" className="screen-hotkey-control" onClick={handleClick}>
      <span className="screen-hotkey-label">{label}</span>
      <kbd className="screen-hotkey-key">{hotkeyText}</kbd>
    </button>
  );
};
