import { ElementLayer } from "./ElementLayer";

export interface HighLevelGroup {
    id: string;
    name: string;
    active?: boolean;
  
    /**
     * UI-only metadata (legend icons, toggles, etc.)
     * Does not affect geometry.
     */
    icon?: GroupIcon;
  
    /**
     * Layers belonging to this group.
     */
    layers: ElementLayer[];
}

export interface GroupIcon {
    imagePath?: string | null;
    secondaryImage?: string | null;
}