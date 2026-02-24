import React, { useEffect, useRef, useState } from "react";
import { kWindowNames } from "../../consts";

export const WindowResizeHandles: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const edges = useRef([
    { edge: "right", className: "window-resize-handle-right" },
    { edge: "bottom", className: "window-resize-handle-bottom" },
    { edge: "bottom-right", className: "window-resize-handle-bottom-right" },
  ]).current;
  const resizeState = useRef<{
    id: string;
    edge: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingBounds = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const lastApplied = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const handleMouseDown = (edge: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    overwolf.windows.getCurrentWindow((result) => {
      if (result.success && result.window?.id) {
        resizeState.current = {
          id: result.window.id,
          edge,
            startX: event.screenX,
            startY: event.screenY,
          startLeft: result.window.left,
          startTop: result.window.top,
          startWidth: result.window.width,
          startHeight: result.window.height,
        };
      }
    });
  };

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 25;
    const intervalMs = 200;
    let timeoutId: number | undefined;

    const updateState = () => {
      overwolf?.windows?.getCurrentWindow?.((result) => {
        if (result.success && result.window?.name) {
          setEnabled(result.window.name === kWindowNames.inGame);
          return;
        }
        attempts += 1;
        if (attempts < maxAttempts) {
          timeoutId = globalThis.setTimeout(updateState, intervalMs);
        }
      });
    };

    updateState();
    return () => {
      if (timeoutId) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, []);

  const applyWindowBounds = (id: string, left: number, top: number, width: number, height: number) => {
    const next = {
      left: Math.floor(left),
      top: Math.floor(top),
      width: Math.floor(width),
      height: Math.floor(height),
    };
    const prev = lastApplied.current;
    if (
      prev &&
      prev.left === next.left &&
      prev.top === next.top &&
      prev.width === next.width &&
      prev.height === next.height
    ) {
      return;
    }
    lastApplied.current = next;
    if (prev?.width !== next.width || prev?.height !== next.height) {
      overwolf.windows.changeSize(id, next.width, next.height, () => {
        // no-op
      });
    }
  };

  if (!enabled || edges.length === 0) {
    return null;
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!resizeState.current) {
      return;
    }
    const state = resizeState.current;
    const deltaX = event.screenX - state.startX;
    const deltaY = event.screenY - state.startY;
    let nextWidth = state.startWidth;
    let nextHeight = state.startHeight;

    if (state.edge.includes("right")) {
      nextWidth = state.startWidth + deltaX;
    }
    if (state.edge.includes("left")) {
      nextWidth = state.startWidth - deltaX;
    }
    if (state.edge.includes("bottom")) {
      nextHeight = state.startHeight + deltaY;
    }
    if (state.edge.includes("top")) {
      nextHeight = state.startHeight - deltaY;
    }

    const minWidth = 800;
    const minHeight = 600;
    if (nextWidth < minWidth) {
      nextWidth = minWidth;
    }
    if (nextHeight < minHeight) {
      nextHeight = minHeight;
    }

    pendingBounds.current = {
      left: state.startLeft,
      top: state.startTop,
      width: nextWidth,
      height: nextHeight,
    };
    if (rafRef.current) {
      return;
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!pendingBounds.current) {
        return;
      }
      const pending = pendingBounds.current;
      pendingBounds.current = null;
      applyWindowBounds(state.id, pending.left, pending.top, pending.width, pending.height);
    });
  };

  const handleMouseUp = () => {
    resizeState.current = null;
    pendingBounds.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    globalThis.removeEventListener("mousemove", handleMouseMove);
    globalThis.removeEventListener("mouseup", handleMouseUp);
  };

  const bindMouseMove = (event: React.MouseEvent<HTMLButtonElement>, edge: string) => {
    handleMouseDown(edge, event);
    globalThis.addEventListener("mousemove", handleMouseMove);
    globalThis.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      {edges.map((item) => (
        <button
          key={item.className}
          type="button"
          className={`window-resize-handle ${item.className}`}
          onMouseDown={(event) => bindMouseMove(event, item.edge)}
        />
      ))}
    </>
  );
};
