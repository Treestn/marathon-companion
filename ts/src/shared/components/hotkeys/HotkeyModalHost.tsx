import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { HotkeyModal } from "./HotkeyModal";
import {
  HotkeyModalTarget,
  subscribeHotkeyModalOpen,
} from "../../services/HotkeyModalEvents";

export const HotkeyModalHost: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<HotkeyModalTarget | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    return subscribeHotkeyModalOpen((nextTarget) => {
      setTarget(nextTarget);
      setIsOpen(true);
    });
  }, []);

  useEffect(() => {
    const findContainer = () => {
      const targetContainer = document.getElementById("runner-container");
      if (targetContainer) {
        setContainer(targetContainer);
        return true;
      }
      return false;
    };

    if (findContainer()) {
      return;
    }

    const interval = globalThis.setInterval(() => {
      if (findContainer()) {
        globalThis.clearInterval(interval);
      }
    }, 100);

    return () => globalThis.clearInterval(interval);
  }, []);

  const modal = useMemo(
    () => (
      <HotkeyModal
        isOpen={isOpen}
        target={target}
        onClose={() => {
          setIsOpen(false);
          setTarget(null);
        }}
      />
    ),
    [isOpen, target],
  );

  if (!container) {
    return null;
  }

  return createPortal(modal, container);
};
