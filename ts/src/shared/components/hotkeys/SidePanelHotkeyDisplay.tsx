import React, { useEffect, useState } from 'react';
import { AppConfigClient } from '../../services/AppConfigClient';
import {
  openHotkeyModal,
  subscribeHotkeyAssigned,
} from '../../services/HotkeyModalEvents';

export const SidePanelHotkeyDisplay: React.FC = () => {
  const [hotkeyText, setHotkeyText] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    AppConfigClient.waitForConfig().then((config) => {
      const hotkey = config?.userSettings?.sidePageQuestHotkey ?? '';
      if (isMounted && hotkey) {
        setHotkeyText(hotkey);
      }
    });
    const unsubscribeConfig = AppConfigClient.subscribe((config) => {
      const hotkey = config.userSettings?.sidePageQuestHotkey ?? '';
      if (hotkey) {
        setHotkeyText(hotkey);
      }
    });
    const unsubscribeHotkey = subscribeHotkeyAssigned((detail) => {
      if (detail.kind === 'side-quest') {
        setHotkeyText(detail.value);
      }
    });
    return () => {
      isMounted = false;
      unsubscribeConfig();
      unsubscribeHotkey();
    };
  }, []);

  const handleClick = () => {
    openHotkeyModal({
      kind: 'side-quest',
      label: 'Side Panel Hotkey',
    });
  };

  if (!hotkeyText) {
    return null;
  }

  return (
    <button
      type="button"
      className="screen-hotkey-control"
      onClick={handleClick}
    >
      <span className="screen-hotkey-label">Side Panel</span>
      <kbd className="screen-hotkey-key">{hotkeyText}</kbd>
    </button>
  );
};
