import React, { useMemo } from "react";
import "./rarity-pattern-background.css";

type RarityPatternBackgroundProps = {
  rarity?: string;
  colorRgb?: string;
  className?: string;
  columns?: number;
  rows?: number;
};

type PatternPalette = {
  rgb: string;
  cellAlphaStart: number;
  cellAlphaFloor: number;
  cellAlphaColumnStep: number;
  cellAlphaRowStep: number;
  borderAlphaStart: number;
  borderAlphaFloor: number;
  borderAlphaColumnStep: number;
  borderAlphaRowStep: number;
};

const DEFAULT_COLUMNS = 17;
const DEFAULT_ROWS = 7;

const PATTERN_PALETTES: Record<string, PatternPalette> = {
  default: {
    rgb: "202, 202, 214",
    cellAlphaStart: 0.4,
    cellAlphaFloor: 0.04,
    cellAlphaColumnStep: 0.02,
    cellAlphaRowStep: 0.062,
    borderAlphaStart: 0.02,
    borderAlphaFloor: 0.004,
    borderAlphaColumnStep: 0.001,
    borderAlphaRowStep: 0.003,
  },
  standard: {
    rgb: "108, 107, 106",
    cellAlphaStart: 0.42,
    cellAlphaFloor: 0.045,
    cellAlphaColumnStep: 0.021,
    cellAlphaRowStep: 0.064,
    borderAlphaStart: 0.022,
    borderAlphaFloor: 0.004,
    borderAlphaColumnStep: 0.001,
    borderAlphaRowStep: 0.0032,
  },
  enhanced: {
    rgb: "1, 171, 244",
    cellAlphaStart: 0.46,
    cellAlphaFloor: 0.05,
    cellAlphaColumnStep: 0.022,
    cellAlphaRowStep: 0.067,
    borderAlphaStart: 0.024,
    borderAlphaFloor: 0.005,
    borderAlphaColumnStep: 0.0011,
    borderAlphaRowStep: 0.0035,
  },
  deluxe: {
    rgb: "196, 49, 152",
    cellAlphaStart: 0.47,
    cellAlphaFloor: 0.052,
    cellAlphaColumnStep: 0.023,
    cellAlphaRowStep: 0.068,
    borderAlphaStart: 0.025,
    borderAlphaFloor: 0.005,
    borderAlphaColumnStep: 0.0012,
    borderAlphaRowStep: 0.0035,
  },
  superior: {
    rgb: "255, 138, 0",
    cellAlphaStart: 0.49,
    cellAlphaFloor: 0.054,
    cellAlphaColumnStep: 0.023,
    cellAlphaRowStep: 0.069,
    borderAlphaStart: 0.026,
    borderAlphaFloor: 0.006,
    borderAlphaColumnStep: 0.0012,
    borderAlphaRowStep: 0.0036,
  },
  prestige: {
    rgb: "255, 204, 0",
    cellAlphaStart: 0.5,
    cellAlphaFloor: 0.055,
    cellAlphaColumnStep: 0.024,
    cellAlphaRowStep: 0.07,
    borderAlphaStart: 0.027,
    borderAlphaFloor: 0.006,
    borderAlphaColumnStep: 0.0013,
    borderAlphaRowStep: 0.0036,
  },
  common: {
    rgb: "158, 167, 182",
    cellAlphaStart: 0.42,
    cellAlphaFloor: 0.045,
    cellAlphaColumnStep: 0.021,
    cellAlphaRowStep: 0.064,
    borderAlphaStart: 0.022,
    borderAlphaFloor: 0.004,
    borderAlphaColumnStep: 0.001,
    borderAlphaRowStep: 0.0032,
  },
  uncommon: {
    rgb: "95, 206, 151",
    cellAlphaStart: 0.45,
    cellAlphaFloor: 0.05,
    cellAlphaColumnStep: 0.022,
    cellAlphaRowStep: 0.066,
    borderAlphaStart: 0.024,
    borderAlphaFloor: 0.005,
    borderAlphaColumnStep: 0.0011,
    borderAlphaRowStep: 0.0034,
  },
  rare: {
    rgb: "102, 165, 255",
    cellAlphaStart: 0.46,
    cellAlphaFloor: 0.05,
    cellAlphaColumnStep: 0.022,
    cellAlphaRowStep: 0.067,
    borderAlphaStart: 0.024,
    borderAlphaFloor: 0.005,
    borderAlphaColumnStep: 0.0011,
    borderAlphaRowStep: 0.0035,
  },
  epic: {
    rgb: "173, 124, 255",
    cellAlphaStart: 0.47,
    cellAlphaFloor: 0.052,
    cellAlphaColumnStep: 0.023,
    cellAlphaRowStep: 0.068,
    borderAlphaStart: 0.025,
    borderAlphaFloor: 0.005,
    borderAlphaColumnStep: 0.0012,
    borderAlphaRowStep: 0.0035,
  },
  legendary: {
    rgb: "255, 191, 79",
    cellAlphaStart: 0.5,
    cellAlphaFloor: 0.055,
    cellAlphaColumnStep: 0.024,
    cellAlphaRowStep: 0.07,
    borderAlphaStart: 0.027,
    borderAlphaFloor: 0.006,
    borderAlphaColumnStep: 0.0013,
    borderAlphaRowStep: 0.0036,
  },
};

const getNormalizedRarity = (rarity?: string): string => {
  const normalized = (rarity ?? "").trim().toLowerCase();
  if (normalized.includes("prestige")) {
    return "prestige";
  }
  if (normalized.includes("superior")) {
    return "superior";
  }
  if (normalized.includes("deluxe")) {
    return "deluxe";
  }
  if (normalized.includes("enhanced")) {
    return "enhanced";
  }
  if (normalized.includes("standard")) {
    return "standard";
  }
  if (normalized.includes("legendary")) {
    return "legendary";
  }
  if (normalized.includes("epic")) {
    return "epic";
  }
  if (normalized.includes("rare")) {
    return "rare";
  }
  if (normalized.includes("uncommon")) {
    return "uncommon";
  }
  if (normalized.includes("common")) {
    return "common";
  }
  return "default";
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const RarityPatternBackground: React.FC<RarityPatternBackgroundProps> = ({
  rarity,
  colorRgb,
  className,
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
}) => {
  const palette = useMemo(() => {
    const rarityPalette =
      PATTERN_PALETTES[getNormalizedRarity(rarity)] ?? PATTERN_PALETTES.default;
    if (!colorRgb?.trim()) {
      return rarityPalette;
    }
    return {
      ...rarityPalette,
      rgb: colorRgb.trim(),
    };
  }, [rarity, colorRgb]);
  const patternCells = useMemo(() => {
    const items: JSX.Element[] = [];
    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
        const cellAlpha = clamp(
          palette.cellAlphaStart -
            columnIndex * palette.cellAlphaColumnStep -
            rowIndex * palette.cellAlphaRowStep,
          palette.cellAlphaFloor,
          1,
        );
        const borderAlpha = clamp(
          palette.borderAlphaStart -
            columnIndex * palette.borderAlphaColumnStep -
            rowIndex * palette.borderAlphaRowStep,
          palette.borderAlphaFloor,
          1,
        );
        const borderColor = `rgba(255, 255, 255, ${borderAlpha.toFixed(3)})`;
        items.push(
          <div
            key={`${rowIndex}-${columnIndex}`}
            className="rarity-pattern-background-cell"
            style={{
              backgroundColor: `rgba(${palette.rgb}, ${cellAlpha.toFixed(3)})`,
              borderTop: rowIndex === 0 ? `0.3px solid ${borderColor}` : "none",
              borderLeft: columnIndex === 0 ? `0.3px solid ${borderColor}` : "none",
              borderRight: `0.3px solid ${borderColor}`,
              borderBottom: `0.3px solid ${borderColor}`,
            }}
          />
        );
      }
    }
    return items;
  }, [columns, rows, palette]);

  return (
    <div
      className={`rarity-pattern-background ${className ?? ""}`.trim()}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
      aria-hidden="true"
    >
      {patternCells}
    </div>
  );
};

