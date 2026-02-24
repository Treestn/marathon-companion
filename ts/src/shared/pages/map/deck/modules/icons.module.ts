import { IconLayer } from "@deck.gl/layers";
import type { IconAtlas } from "../useIconAtlas";
import type { DeckUIState } from "../types";
import type { IconDatum } from "../builder/icon.builder";

export type IconsModuleInput = {
  id: string;
  data: IconDatum[];
  atlas: IconAtlas;
  placeholder: string;
  ui: DeckUIState;
  pickable?: boolean;
};

export function buildIconsLayer({
  id,
  data,
  atlas: iconAtlas,
  placeholder,
  ui,
  pickable = true,
}: IconsModuleInput) {
  return new IconLayer<IconDatum>({
    id,
    data,
    pickable,
    billboard: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 20],
  
    // IMPORTANT: prevent it from being hidden by map depth
    parameters: { blend: true },
  
    // IMPORTANT: make size definitely visible
    sizeUnits: "pixels",
    sizeScale: 1,
    sizeMinPixels: 16,
    sizeMaxPixels: 96,
  
    iconAtlas: iconAtlas.atlas as any,
    iconMapping: iconAtlas.mapping,

    getIcon: (d) => {
      if (!d?.image) return placeholder;
      if (iconAtlas.mapping[d.image]) return d.image;
      return placeholder;
    },
    // getIcon: (d) => {
    //   const k = d.image;
    //   if (k && iconAtlas.mapping[k]) return k;
    //   if (iconAtlas.mapping[placeholder]) return placeholder;
    //   return Object.keys(iconAtlas.mapping)[0];
    // },
  
    getPosition: (d) => d.position,
  
    // Make it huge for debug
    getSize: (d) => {
      if (d.dimmed) return 20;
      return d.id === ui.hoveredId ? 28 : 24;
    },
    getColor: (d) => (d.dimmed ? [255, 255, 255, 90] : [255, 255, 255, 255]),
    updateTriggers: {
      getSize: [ui.hoveredId],
      getColor: [ui.hoveredId],
    },
    
  });
  
}
