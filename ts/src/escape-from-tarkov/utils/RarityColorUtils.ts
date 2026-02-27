export enum RarityLabel {
    Prestige = "Prestige",
    Superior = "Superior",
    Deluxe = "Deluxe",
    Enhanced = "Enhanced",
    Standard = "Standard",
}

export const RARITY_COLOR_BY_LABEL: Record<RarityLabel, string> = {
    [RarityLabel.Prestige]: "#FFCC00",
    [RarityLabel.Superior]: "#FF8A00",
    [RarityLabel.Deluxe]: "#C43198",
    [RarityLabel.Enhanced]: "#01ABF4",
    [RarityLabel.Standard]: "#6C6B6A",
};

const RARITY_ALIASES: Record<string, RarityLabel> = {
    prestige: RarityLabel.Prestige,
    superior: RarityLabel.Superior,
    deluxe: RarityLabel.Deluxe,
    enhanced: RarityLabel.Enhanced,
    standard: RarityLabel.Standard,
    legendary: RarityLabel.Prestige,
    epic: RarityLabel.Superior,
    rare: RarityLabel.Deluxe,
    uncommon: RarityLabel.Enhanced,
    common: RarityLabel.Standard,
};

export function rarityToLabel(rarity?: string | null): string {
    if (!rarity) {
        return "Unknown";
    }
    const normalized = rarity.trim().toLowerCase();
    return RARITY_ALIASES[normalized] ?? "Unknown";
}

export function rarityToColor(rarity: string): string {
    const label = rarityToLabel(rarity);
    if (label === "Unknown") {
        return "black";
    }
    return RARITY_COLOR_BY_LABEL[label];
}