import React, { useState } from "react";

export const useViewerContainer = (map: any) => {
  const [viewerContainer, setViewerContainer] = useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    if (!container) return;

    const computedPosition = getComputedStyle(container).position;
    if (computedPosition === "static") {
      container.style.position = "relative";
    }
    setViewerContainer(container);
  }, [map]);

  return viewerContainer;
};
