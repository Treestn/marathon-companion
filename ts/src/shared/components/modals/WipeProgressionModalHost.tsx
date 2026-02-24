import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { WipeProgressionModal } from "./WipeProgressionModal";
import {
  subscribeWipeProgressionModalOpen,
  WipeProgressionTarget,
} from "../../services/WipeProgressionModalEvents";

export const WipeProgressionModalHost: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<WipeProgressionTarget | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    return subscribeWipeProgressionModalOpen((nextTarget) => {
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
      <WipeProgressionModal
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
