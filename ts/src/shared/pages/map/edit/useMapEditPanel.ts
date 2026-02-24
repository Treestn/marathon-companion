import { useState } from "react";

export type MapEditTool = "overview" | "icon" | "polygon";

export const useMapEditPanel = () => {
  const [selectedTool, setSelectedTool] = useState<MapEditTool>("icon");

  return {
    selectedTool,
    setSelectedTool,
  };
};
