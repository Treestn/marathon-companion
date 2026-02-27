import { TraderList } from "../../escape-from-tarkov/constant/TraderConst";

export interface FactionApiRecord {
  id: number;
  name: string;
  description: string;
  color_surface: string;
  color_on_surface: string;
  agent_name: string;
  agent_description: string;
  created_at: string;
  contracts_count: number;
  upgrades_count: number;
  optimizations_count: number;
  icon_url: string;
}

export interface FactionPerk {
  title: string;
  description: string;
}

export interface FactionModel {
  id: number;
  factionId: string;
  name: string;
  headline: string;
  description: string;
  about: string;
  perks: FactionPerk[];
  colorSurface: string;
  colorOnSurface: string;
  agentName: string;
  agentDescription: string;
  createdAt: string;
  contractsCount: number;
  upgradesCount: number;
  optimizationsCount: number;
  iconUrl: string;
}

type FactionPageDetails = {
  headline: string;
  about: string;
  perks: FactionPerk[];
  colorSurface: string;
  colorOnSurface: string;
};

const FACTION_PAGE_DETAILS_BY_NAME: Record<string, FactionPageDetails> = {
  arachne: {
    headline: "Global Leader in Cybersecurity",
    about:
      "Arachne operates at the intersection of surveillance and protection, weaving digital networks that monitor and secure the most sensitive data flows in the solar system. Runners aligned with Arachne gain access to intelligence networks, threat detection tools, and security-focused contracts that reward precision and information gathering.",
    perks: [
      { title: "Threat Intel", description: "Access to advanced threat detection contracts." },
      { title: "Network Access", description: "Faction-exclusive intel and surveillance tools." },
      { title: "Security Bounties", description: "High-value contracts for eliminating threats." },
      { title: "Exclusive Cosmetics", description: "Arachne-branded weapon skins and gear." },
    ],
    colorSurface: "#e40b0d",
    colorOnSurface: "#1c1a1b",
  },
  cyberacme: {
    headline: "Cutting-Edge Cybernetics & AI",
    about:
      "Cyberacme pushes the boundaries of human augmentation and machine intelligence. Runners working with Cyberacme gain access to experimental tech, augmentation contracts, and rewards that enhance their combat systems.",
    perks: [
      { title: "Tech Upgrades", description: "Access to experimental cybernetic enhancement contracts." },
      { title: "AI Assistance", description: "Faction-exclusive AI-powered tools and intel." },
      { title: "R&D Contracts", description: "Field-test new tech for Cyberacme R&D." },
      { title: "Exclusive Cosmetics", description: "Cyberacme-branded weapon skins and gear." },
    ],
    colorSurface: "#01d838",
    colorOnSurface: "#1c1a1b",
  },
  mida: {
    headline: "Finance & Asset Management",
    about:
      "MIDA's influence extends beyond banking: they fund expeditions, broker deals between factions, and control credit flow across the colony. Runners working for MIDA take on high-stakes contracts with premium payouts and economic advantages.",
    perks: [
      { title: "Premium Payouts", description: "Higher credit rewards from faction contracts." },
      { title: "Investment Returns", description: "Bonus reputation gains from completed missions." },
      { title: "Luxury Rewards", description: "Access to premium cosmetics and rare items." },
      { title: "Exclusive Cosmetics", description: "MIDA-branded weapon skins and gear." },
    ],
    colorSurface: "#be72e4",
    colorOnSurface: "#1c1a1b",
  },
  nucaloric: {
    headline: "Sustainable Energy & Power",
    about:
      "Nucaloric's operations focus on harnessing unique energy resources to power colony infrastructure. Runners aligned with Nucaloric take on energy-related contracts, protect infrastructure, and gain access to power-focused rewards.",
    perks: [
      { title: "Power Grid Access", description: "Contracts protecting critical energy infrastructure." },
      { title: "Energy Rewards", description: "Bonus energy credits from faction missions." },
      { title: "Heavy Firepower", description: "Access to energy weapon contracts and rewards." },
      { title: "Exclusive Cosmetics", description: "Nucaloric-branded weapon skins and gear." },
    ],
    colorSurface: "#ff125d",
    colorOnSurface: "#1c1a1b",
  },
  sekiguchi: {
    headline: "Manufacturing & Engineering",
    about:
      "Sekiguchi factories and engineering labs produce critical components for runners and colony operations. Runners aligned with Sekiguchi focus on material retrieval, prototype testing, and facility defense contracts.",
    perks: [
      { title: "Prototype Access", description: "Field-test experimental weapons and gear." },
      { title: "Engineering Contracts", description: "Material retrieval and facility defense missions." },
      { title: "Mod Expertise", description: "Faction-exclusive weapon mods and upgrades." },
      { title: "Exclusive Cosmetics", description: "Sekiguchi-branded weapon skins and gear." },
    ],
    colorSurface: "#cfb72f",
    colorOnSurface: "#1c1a1b",
  },
  traxus: {
    headline: "Transportation & Logistics",
    about:
      "Traxus controls key cargo routes and logistics infrastructure that keep operations moving. Runners aligned with Traxus handle escort missions, cargo recovery, and supply line defense with rewards focused on efficiency and loot flow.",
    perks: [
      { title: "Supply Contracts", description: "Cargo recovery and supply line defense missions." },
      { title: "Extraction Bonus", description: "Enhanced extraction rewards from Traxus missions." },
      { title: "Route Intel", description: "Faction intel on loot routes and high-value zones." },
      { title: "Exclusive Cosmetics", description: "Traxus-branded weapon skins and gear." },
    ],
    colorSurface: "#ff7300",
    colorOnSurface: "#1c1a1b",
  },
};

const getFactionIdFromName = (name: string): string => {
  const normalized = name.trim().toLowerCase();
  const trader = TraderList.find((entry) => entry.normalizedName === normalized);
  if (!trader) {
    throw new Error(`[FactionsModel] Could not resolve factionId for faction name "${name}"`);
  }
  return trader.id;
};

export const mapFactionApiRecord = (record: FactionApiRecord): FactionModel => {
  const key = record.name.trim().toLowerCase();
  const details = FACTION_PAGE_DETAILS_BY_NAME[key];
  if (!details) {
    throw new Error(`[FactionsModel] Could not resolve page details for faction "${record.name}"`);
  }
  return {
    id: record.id,
    factionId: getFactionIdFromName(record.name),
    name: record.name,
    headline: details.headline,
    description: record.description,
    about: details.about,
    perks: details.perks,
    colorSurface: details.colorSurface,
    colorOnSurface: details.colorOnSurface,
    agentName: record.agent_name,
    agentDescription: record.agent_description,
    createdAt: record.created_at,
    contractsCount: record.contracts_count,
    upgradesCount: record.upgrades_count,
    optimizationsCount: record.optimizations_count,
    iconUrl: record.icon_url,
  };
};

export const mapFactionApiRecords = (records: FactionApiRecord[]): FactionModel[] =>
  records.map(mapFactionApiRecord);

export const FACTIONS_API_DATA: FactionApiRecord[] = [
  {
    id: 5,
    name: "Arachne",
    description:
      "Arachne is a global leader in cybersecurity and information security solutions. They are known for their advanced threat detection and prevention technologies.",
    color_surface: "#e40b0d",
    color_on_surface: "#1c1a1b",
    agent_name: "Arachne Agent",
    agent_description: "Security specialist from Arachne division.",
    created_at: "2026-01-24 09:05:08",
    contracts_count: 0,
    upgrades_count: 0,
    optimizations_count: 0,
    icon_url: "https://companions-assets.treestn-dev.ca/marathon/factions/images/arachne.png"
  },
  {
    id: 1,
    name: "Cyberacme",
    description:
      "Cyberacme is a leading technology company specializing in advanced cybernetics and artificial intelligence. They are known for their cutting-edge products and innovative solutions.",
    color_surface: "#01d838",
    color_on_surface: "#1c1a1b",
    agent_name: "Cyberacme Agent",
    agent_description: "Advanced AI representative of Cyberacme corporation.",
    created_at: "2026-01-24 09:05:08",
    contracts_count: 0,
    upgrades_count: 0,
    optimizations_count: 0,
    icon_url: "https://companions-assets.treestn-dev.ca/marathon/factions/images/cyberacme.png"
  },
  {
    id: 4,
    name: "Mida",
    description:
      "Mida is a leading financial services company specializing in investment banking and asset management. They are known for their expertise in financial markets and innovative investment strategies.",
    color_surface: "#be72e4",
    color_on_surface: "#1c1a1b",
    agent_name: "MIDA Agent",
    agent_description: "Financial advisor representing MIDA Multi-Tool.",
    created_at: "2026-01-24 09:05:08",
    contracts_count: 0,
    upgrades_count: 0,
    optimizations_count: 0,
    icon_url: "https://companions-assets.treestn-dev.ca/marathon/factions/images/mida.png"
  },
  {
    id: 2,
    name: "Nucaloric",
    description:
      "Nucaloric is a global leader in energy production and distribution, focusing on sustainable and renewable energy sources. They are committed to reducing carbon emissions and promoting environmental sustainability.",
    color_surface: "#ff125d",
    color_on_surface: "#1c1a1b",
    agent_name: "Nucaloric Agent",
    agent_description: "Energy sector specialist representing Nucaloric interests.",
    created_at: "2026-01-24 09:05:08",
    contracts_count: 1,
    upgrades_count: 0,
    optimizations_count: 0,
    icon_url: "https://companions-assets.treestn-dev.ca/marathon/factions/images/nucaloric.png"
  },
  {
    id: 6,
    name: "Sekiguchi",
    description:
      "Sekiguchi is a multinational corporation specializing in manufacturing and engineering. They are known for their advanced production technologies and innovative engineering solutions.",
    color_surface: "#cfb72f",
    color_on_surface: "#1c1a1b",
    agent_name: "SekGen Agent",
    agent_description: "Engineering representative of Sekiguchi Genetics.",
    created_at: "2026-01-24 09:05:08",
    contracts_count: 1,
    upgrades_count: 0,
    optimizations_count: 0,
    icon_url: "https://companions-assets.treestn-dev.ca/marathon/factions/images/sekiguchi.png"
  },
  {
    id: 3,
    name: "Traxus",
    description:
      "Traxus is a multinational corporation specializing in transportation and logistics. They are known for their advanced supply chain solutions and innovative transportation technologies.",
    color_surface: "#ff7300",
    color_on_surface: "#1c1a1b",
    agent_name: "Traxus Agent",
    agent_description: "Logistics coordinator for Traxus operations.",
    created_at: "2026-01-24 09:05:08",
    contracts_count: 1,
    upgrades_count: 0,
    optimizations_count: 0,
    icon_url: "https://companions-assets.treestn-dev.ca/marathon/factions/images/traxus.png"
  },
];

export const FACTIONS_DATA: FactionModel[] = mapFactionApiRecords(FACTIONS_API_DATA);
