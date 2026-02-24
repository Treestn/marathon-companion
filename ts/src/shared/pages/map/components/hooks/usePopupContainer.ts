import React, { useState } from "react";

export const usePopupContainer = (map: any) => {
  const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    if (!container) return;

    let popupDiv: HTMLDivElement = container.querySelector(".deckgl-popup-container");
    if (!popupDiv) {
      popupDiv = document.createElement("div");
      popupDiv.className = "deckgl-popup-container";
      container.appendChild(popupDiv);
    }
    setPopupContainer(popupDiv);

    return () => {
      popupDiv?.remove();
    };
  }, [map]);

  return popupContainer;
};
