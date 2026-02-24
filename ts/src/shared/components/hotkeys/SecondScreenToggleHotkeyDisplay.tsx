import React, { useEffect, useState } from 'react';
import { BackgroundHelper } from '../../../background/BackgroundHelper';
import { kHotkeys } from '../../../consts';
import {
  openHotkeyModal,
  subscribeHotkeyAssigned,
} from '../../services/HotkeyModalEvents';

export const SecondScreenToggleHotkeyDisplay: React.FC = () => {
  const [hotkeyText, setHotkeyText] = useState<string>('');
  const [isGameRunning, setIsGameRunning] = useState(false);

  useEffect(() => {
    const loadHotkey = async () => {
      const keyText = await BackgroundHelper.getHotkey(kHotkeys.secondScreenToggle);
      setHotkeyText(keyText);
    };
    loadHotkey();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadState = async () => {
      const running = await BackgroundHelper.getIsGameRunning();
      if (isMounted) {
        setIsGameRunning(running);
      }
    };
    loadState();
    const interval = globalThis.setInterval(loadState, 2000);
    return () => {
      isMounted = false;
      globalThis.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    return subscribeHotkeyAssigned((detail) => {
      if (detail.kind === 'overwolf' && detail.hotkeyName === kHotkeys.secondScreenToggle) {
        setHotkeyText(detail.value);
      }
    });
  }, []);

  const handleClick = () => {
    openHotkeyModal({
      kind: 'overwolf',
      hotkeyName: kHotkeys.secondScreenToggle,
      label: 'Second Screen Hotkey',
    });
  };

  if (!hotkeyText || !isGameRunning) {
    return null;
  }

  return (
    <button type="button" className="screen-hotkey-control" onClick={handleClick}>
      <span className="screen-hotkey-label">Second Screen</span>
      <kbd className="screen-hotkey-key">{hotkeyText}</kbd>
    </button>
  );
};
