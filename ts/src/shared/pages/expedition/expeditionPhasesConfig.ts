export interface PhaseItemConfig {
  name: string;
  required: number;
  itemId?: string; // Optional itemId, defaults to name.toLowerCase().replace(/\s+/g, '_')
}

export interface PhaseConfig {
  id: number;
  title: string;
  description?: string;
  items?: PhaseItemConfig[];
  isCoinPhase?: boolean;
  coinCategories?: {
    combat: number;
    survival: number;
    provisions: number;
    materials: number;
  };
  coinValue?: number; // For single-value coin phases (e.g., Phase 6)
}

export interface ProjectConfig {
  id: string;
  name: string;
  description: string;
  phases: PhaseConfig[];
}

export const EXPEDITION_PHASES_CONFIG: PhaseConfig[] = [
  {
    id: 1,
    title: 'Phase 1: Foundation',
    items: [
      { name: 'Metal Parts', required: 150, itemId: 'metal_parts' },
      { name: 'Rubber Parts', required: 200, itemId: 'rubber_parts' },
      { name: 'ARC Alloy', required: 80, itemId: 'arc_alloy' },
      { name: 'Steel Spring', required: 15, itemId: 'steel_spring' }
    ]
  },
  {
    id: 2,
    title: 'Phase 2: Core Systems',
    description: 'Connecting wiring, ventilation, and essential power systems',
    items: [
      { name: 'Durable Cloth', required: 35, itemId: 'durable_cloth' },
      { name: 'Wires', required: 30, itemId: 'wires' },
      { name: 'Electrical Components', required: 30, itemId: 'electrical_components' },
      { name: 'Cooling Fan', required: 5, itemId: 'cooling_fan' }
    ]
  },
  {
    id: 3,
    title: 'Phase 3: Framework',
    description: 'Building the walls and roof, installing core systems and defining the interior layout',
    items: [
      { name: 'Light Bulb', required: 5, itemId: 'light_bulb' },
      { name: 'Battery', required: 30, itemId: 'battery' },
      { name: 'Sensors', required: 20, itemId: 'sensors' },
      { name: 'Exodus Modules', required: 1, itemId: 'exodus_modules' }
    ]
  },
  {
    id: 4,
    title: 'Phase 4: Outfitting',
    description: 'Adding storage, workbenches, utilities, and personal touches',
    items: [
      { name: 'Humidifier', required: 5, itemId: 'humidifier' },
      { name: 'Advanced Electrical Components', required: 5, itemId: 'advanced_electrical_components' },
      { name: 'Magnetic Accelerator', required: 3, itemId: 'magnetic_accelerator' },
      { name: 'Leaper Pulse Unit', required: 3, itemId: 'leaper_pulse_unit' }
    ]
  },
  {
    id: 5,
    title: 'Phase 5: Load Stage',
    description: 'Loading the caravan with vital supplies. Combat gear, survival equipment, provisions, and repair materials are needed to fully prepare for the Expedition. You need to submit the coin value of items to each category.',
    isCoinPhase: true,
    coinCategories: {
      combat: 250000,
      survival: 100000,
      provisions: 180000,
      materials: 300000
    }
  },
  {
    id: 6,
    title: 'Phase 6: Final Preparations',
    description: 'Commit to the Expedition to reset your progress. Each 1 million credits earns you 1 extra skill point after the reset.',
    isCoinPhase: true,
    coinValue: 5000000
  }
];

export const FLICKERING_FLAMES_PHASES_CONFIG: PhaseConfig[] = [
  {
    id: 1,
    title: 'Phase 1: Candlelight',
    description: 'The namesake use for the candleberry, Speranzans boil the fruit into a thick wax that burns cleanly and fragrantly.',
    items: [
      { name: 'Empty Wine Bottle', required: 1, itemId: 'empty_wine_bottle' },
      { name: 'Plastic Parts', required: 25, itemId: 'plastic_parts' },
      { name: 'Durable Cloth', required: 5, itemId: 'durable_cloth' },
      { name: 'Candleberries', required: 10, itemId: 'candleberries' }
    ]
  },
  {
    id: 2,
    title: 'Phase 2: Decorations',
    description: 'Many Speranzans have become surprisingly adept at the art of bringing beauty and greenery into the home.',
    items: [
      { name: 'Candle Holder', required: 3, itemId: 'candle_holder' },
      { name: 'Light Bulb', required: 3, itemId: 'light_bulb' },
      { name: 'Industrial Battery', required: 1, itemId: 'industrial_battery' },
      { name: 'Candleberries', required: 50, itemId: 'candleberries' }
    ]
  },
  {
    id: 3,
    title: 'Phase 3: Presents',
    description: 'Crafty Speranzans have turned the candleberries into a wealth of gifts. These include perfumes and soaps, as well as gifts unrelated to the recipient\'s odors.',
    items: [
      { name: 'Snap Blast Grenade', required: 5, itemId: 'snap_blast_grenade' },
      { name: 'Duct Tape', required: 10, itemId: 'duct_tape' },
      { name: 'Film Reel', required: 1, itemId: 'film_reel' },
      { name: 'Candleberries', required: 60, itemId: 'candleberries' }
    ]
  },
  {
    id: 4,
    title: 'Phase 4: Beverages',
    description: 'Candleberries can be crushed into refreshing juices, while the leaves and roots make for a tea that can drive out the toughest of colds.',
    items: [
      { name: 'Coffee Pot', required: 2, itemId: 'coffee_pot' },
      { name: 'Fireball Burner', required: 10, itemId: 'fireball_burner' },
      { name: 'Water Filter', required: 2, itemId: 'water_filter' },
      { name: 'Candleberries', required: 60, itemId: 'candleberries' }
    ]
  },
  {
    id: 5,
    title: 'Phase 5: Meals',
    description: 'Though candleberry leaves are bitter, simmering them in stew and soups adds a touch of earthiness that nostalgic Speranzans have grown to love.',
    items: [
      { name: 'Mushroom', required: 7, itemId: 'mushroom' },
      { name: 'Frying Pan', required: 2, itemId: 'frying_pan' },
      { name: 'Music Album', required: 2, itemId: 'music_album' },
      { name: 'Candleberries', required: 70, itemId: 'candleberries' }
    ]
  }
];

export const PROJECTS_CONFIG: ProjectConfig[] = [
  {
    id: 'expedition',
    name: 'Expedition Project',
    description: 'Embark on a dangerous expedition beyond the Rust Belt. Expeditions are perilous. Your Raider will carry all their possessions into the unknown beyond the Rust Belt. In return, your next Raider gains a unique edge that lasts until the next Expedition departs.',
    phases: EXPEDITION_PHASES_CONFIG
  },
  {
    id: 'flickering_flames',
    name: 'Flickering Flames',
    description: 'A festival of resilient warmth, centered around the hardy candleberry bush. Speranzans have been known to host local celebrations, and being competitive, they seek to outdo each other at every turn. Some have managed to turn the homely candleberry bush into a banquet worthy of even the most discerning gourmands.',
    phases: FLICKERING_FLAMES_PHASES_CONFIG
  }
];

export function getProjectConfig(projectId: string): ProjectConfig | undefined {
  return PROJECTS_CONFIG.find(p => p.id === projectId);
}

export function getPhaseConfig(projectId: string, phaseId: number): PhaseConfig | undefined {
  const project = getProjectConfig(projectId);
  return project?.phases.find(p => p.id === phaseId);
}

