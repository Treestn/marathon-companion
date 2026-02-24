import React, { useEffect, useState } from 'react';
import { BackgroundHelper } from '../../background/BackgroundHelper';
import { I18nHelper } from '../../locale/I18nHelper';
import { kHotkeys } from '../../consts';
import { NavigationUtils } from '../../escape-from-tarkov/utils/NavigationUtils';
import {
  openHotkeyModal,
  subscribeHotkeyAssigned,
} from '../services/HotkeyModalEvents';

interface HotkeyDisplayProps {
  hotkeyType: 'toggle' | 'switchScreenToggle';
  id: string;
}

export const HotkeyDisplay: React.FC<HotkeyDisplayProps> = ({ hotkeyType, id }) => {
  const [hotkeyText, setHotkeyText] = useState<string>('');
  const [labelText, setLabelText] = useState<string>('');

  useEffect(() => {
    const initializeHotkey = async () => {
      // Initialize I18nHelper if not already initialized
      await I18nHelper.init();

      // Get the hotkey text
      const hotkeyName = hotkeyType === 'toggle' ? kHotkeys.toggle : kHotkeys.switchScreenToggle;
      const keyText = await BackgroundHelper.getHotkey(hotkeyName);
      setHotkeyText(keyText);

      // Get the label text
      const labelKey = hotkeyType === 'toggle' 
        ? 'header.hotkey.showHide' 
        : 'header.hotkey.switch';
      const label = I18nHelper.get(labelKey) + ': ';
      setLabelText(label);
    };

    initializeHotkey();
  }, [hotkeyType]);

  useEffect(() => {
    return subscribeHotkeyAssigned((detail) => {
      if (detail.kind !== 'overwolf') {
        return;
      }
      const hotkeyName =
        hotkeyType === 'toggle' ? kHotkeys.toggle : kHotkeys.switchScreenToggle;
      if (detail.hotkeyName === hotkeyName) {
        setHotkeyText(detail.value);
      }
    });
  }, [hotkeyType]);

  const handleClick = () => {
    const hotkeyName = hotkeyType === 'toggle' ? kHotkeys.toggle : kHotkeys.switchScreenToggle;
    
    NavigationUtils.removeiFrames();
    openHotkeyModal({
      kind: 'overwolf',
      hotkeyName,
      label: I18nHelper.get('pages.hotkeys.title'),
    });
  };

  if (!hotkeyText || !labelText) {
    return null;
  }

  return (
    <h1 className="hotkey-text" onClick={handleClick} style={{ cursor: 'pointer' }}>
      {labelText}
      <kbd id={id} className="hotkey-bind-text">{hotkeyText}</kbd>
    </h1>
  );
};

