import { Locales } from "../hideout/HideoutObject";
import { IconInfo } from "../IFilterElements";


export interface FeatureProps {
    /**
     * Stable identifier used for picking, correlation, and persistence.
     */
    id: number;

    /** Optional semantic type for styling / filtering */
    kind?: string;

    /** Icon type identifier for the layer that owns this feature */
    iconTypeId?: string;

    active?: boolean;
    protectedEntity?: boolean;

    questId?: string;
    objectiveId?: string;
    requiredItemIds?: string[];
    floor?: string;

    imageList?: string[];

    description?: string;
    locales?: Locales;

    longDescription?: string;
    longDescriptionLocales?: Locales;

    spawnChance?: string;
    infoList?: IconInfo[];

    /** Optional hex color used when rendering polygon fill (e.g. #4bbf8a) */
    polygonFillColor?: string;
    /** Optional hex color used when rendering polygon outline (e.g. #8cf2c7) */
    polygonOutlineColor?: string;

    /**
     * Optional per-feature style override.
     */
    style?: FeatureStyle;

    /**
     * Correlation metadata.
     * Presence of this field means this feature participates in correlations.
     */
    correlation?: CorrelationMeta;
    /** Optional list of correlation metadata entries (preferred over single `correlation`). */
    correlations?: CorrelationMeta[];
}

export interface FeatureStyle {
    /** RGBA color override */
    color?: [number, number, number, number];

    size?: number;
    icon?: string;
}

export interface CorrelationMeta {
    /**
     * Logical correlation group.
     * All related nodes/edges/areas share this id.
     */
    correlationId: string;
  
    /**
     * Base feature ids that activate this correlation.
     * If the hovered/clicked feature id matches one of these,
     * this feature becomes visible.
     */
    anchors: number[];
  
    /**
     * Defines how this feature behaves in the correlation.
     */
    role: "node" | "edge" | "area";
  
    /**
     * Interaction that reveals this feature.
     * - hover: preview only
     * - click: persistent until cleared
     * - always: always visible
     */
    trigger?: "hover" | "click" | "always";

    /**
     * Optional line styling for node-to-node correlation links.
     * When omitted, map rendering falls back to default line style.
     */
    lineColor?: [number, number, number, number];
    lineWidth?: number;
}