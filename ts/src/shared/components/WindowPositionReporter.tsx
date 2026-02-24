import React, { useEffect, useRef } from "react";
import { WindowsService } from "../../WindowsService";
import { WindowPositionClient } from "../services/WindowPositionClient";

const POLL_INTERVAL_MS = 1000;

export const WindowPositionReporter: React.FC = () => {
  const lastPosition = useRef<{ left: number; top: number } | null>(null);
  const windowNameRef = useRef<string | null>(null);

  useEffect(() => {
    let intervalId: number | null = null;
    let isMounted = true;

    const pollPosition = async () => {
      try {
        const result = await WindowsService.getCurrentWindow();
        if (!isMounted || !result.success || !result.window) {
          return;
        }
        if (!windowNameRef.current) {
          windowNameRef.current = result.window.name;
        }
        if (result.window.stateEx !== "normal") {
          return;
        }
        const next = { left: result.window.left, top: result.window.top };
        const prev = lastPosition.current;
        if (prev && prev.left === next.left && prev.top === next.top) {
          return;
        }
        lastPosition.current = next;
        WindowPositionClient.setWindowPosition(
          result.window.name,
          next.left,
          next.top,
        );
      } catch {
        // ignore polling errors
      }
    };

    intervalId = globalThis.setInterval(pollPosition, POLL_INTERVAL_MS);
    pollPosition();

    return () => {
      isMounted = false;
      if (intervalId) {
        globalThis.clearInterval(intervalId);
      }
    };
  }, []);

  return null;
};
