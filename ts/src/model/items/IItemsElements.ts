export interface ItemsModel {
  game: string;
  version: string;
  locale: string;
  items: MarathonItem;
}

export interface MarathonItem {
  items: Item[];
  weapons: WeaponItem[];
  cores: CoreItem[];
  implants: ImplantItem[];
  mods: ModItem[];
  runners: Runner[];
}

export type Item = WeaponItem | ImplantItem | CoreItem | ModItem;

export interface WeaponItem {
  id: string;
  name: string;
  description: string;
  rarity: string;
  category: string;
  fireMode: string;
  ammoId: string;
  modTypes: string[];
  attributes: string[];
  stats: WeaponStat;
  value: number;
  url: string;
}

export interface WeaponStat {
  ttk?: TtkStat;
  [key: string]: unknown;
}

export interface TtkStat {
  none: number | null;
  green: number | null;
  blue: number | null;
  purple: number | null;
}

export interface ImplantItem {
  id: string;
  name: string;
  description: string;
  slotType: string;
  rarity: string;
  url: string;
  value: number;
  stats: ItemStats[];
}

export interface CoreItem {
  id: string;
  name: string;
  runnerType: string[];
  rarity: string;
  description: string;
  url: string;
  value: number | null;
  active: boolean | null;
  passive: boolean | null;
  triggerCondition: string | null;
  enhancesAbility: string[];
  attributes: CoreAttributes | null;
  foundLocations: string[];
  effects: CoreEffect[];
  tags: string[];
}

export interface CoreEffect {
  key: string;
  value: string;
}

export interface CoreAttributes {
  abilityCooldown: number | null;
  abilityDuration: number | null;
  abilityRange: number | null;
  damageModifier: number | null;
  effectMagnitude: number | null;
  hasCleanse: boolean | null;
  affectsCrew: boolean | null;
  reducesCooldown: boolean | null;
  cooldownReduction: number | null;
  impactsMovement: boolean | null;
  affectsDamage: boolean | null;
  affectsSurvivability: boolean | null;
  affectsLoot: boolean | null;
}

export interface ItemStats {
  type: string;
  value: number;
}

export interface ModItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  description: string;
  url: string;
  value: number;
  damageType: string;
  effects: ModEffect[];
}

export interface ModEffect {
  effect: string;
  modifier: number;
}

export interface Runner {
  id: string;
  name: string;
  role: string;
  description: string;
  heroUrl: string;
  portraitUrl: string;
  rarity: string;
  difficulty: string;
  tags: string[];
  abilities: RunnerAbility[];
  stats: RunnerStats;
}

export interface RunnerAbility {
  type: string;
  name: string;
  description: string;
  cooldown: number;
  url: string;
}

export interface RunnerStats {
  heatCapacity: number;
  agility: number;
  lootingSpeed: number;
  meleeDamage: number;
  primeRecovery: number;
  tactivalRecovery: number;
  selfRepairSpeed: number;
  finisherSiphon: number;
  reviveSpeed: number;
  hardware: number;
  firewall: number;
  fallResistance: number;
  pingDuration: number;
}