export interface PageConfig {
  id: string;
  name: string;
  path: string; // e.g., "maps", "quests"
  navigationId: string; // e.g., "maps-navigation"
  icon: string;
  i18nKey: string;
  enabled?: boolean; // For feature flags
}

export const PAGE_REGISTRY: PageConfig[] = [
  // {
  //   id: 'maps',
  //   name: 'Maps',
  //   path: '/maps',
  //   navigationId: 'maps-navigation',
  //   icon: '../img/maps-icon.png',
  //   i18nKey: 'nav.maps',
  //   enabled: true
  // },
  {
    id: 'interactive-map',
    name: 'Maps',
    path: '/maps',
    navigationId: 'map-navigation',
    icon: '../img/maps-icon.png',
    i18nKey: 'nav.maps',
    enabled: true
  },
  {
    id: 'quests',
    name: 'Contracts',
    path: '/quests',
    navigationId: 'quests-navigation',
    icon: '../img/side-nav-quest-icon.png',
    i18nKey: 'nav.quests',
    enabled: true
  },
  {
    id: 'hideout',
    name: 'Raider Den',
    path: '/hideout',
    navigationId: 'hideout-navigation',
    icon: './img/hideout.png',
    i18nKey: 'nav.hideout',
    enabled: false
  },
  {
    id: 'items-needed',
    name: 'Items',
    path: '/items-needed',
    navigationId: 'items-needed-navigation',
    icon: './img/items-needed.png',
    i18nKey: 'pages.questReminder.items.button',
    enabled: true
  },
  {
    id: 'weapons',
    name: 'Weapons',
    path: '/weapons',
    navigationId: 'weapons-navigation',
    icon: './img/side-nav-quest-icon.png',
    i18nKey: 'nav.weapons',
    enabled: true
  },
  {
    id: 'runners',
    name: 'Runners',
    path: '/runners',
    navigationId: 'runners-navigation',
    icon: './img/pvp_icon.png',
    i18nKey: 'nav.runners',
    enabled: true
  },
  {
    id: 'factions',
    name: 'Factions',
    path: '/factions',
    navigationId: 'factions-navigation',
    icon: './img/side-nav-quest-icon.png',
    i18nKey: 'nav.factions',
    enabled: true
  },
  {
    id: 'trading',
    name: 'Trading',
    path: '/trading',
    navigationId: 'trading-navigation',
    icon: './img/trade.png',
    i18nKey: 'nav.trading',
    enabled: false
  },
  {
    id: 'expedition',
    name: 'Project',
    path: '/expedition',
    navigationId: 'expedition-navigation',
    icon: './img/expedition.png',
    i18nKey: 'nav.expedition',
    enabled: false
  },
  {
    id: 'map-events',
    name: 'Events',
    path: '/map-events',
    navigationId: 'map-events-navigation',
    icon: './img/map-events.png',
    i18nKey: 'nav.mapEvents',
    enabled: false
  },
  {
    id: 'settings',
    name: 'Settings',
    path: '/settings',
    navigationId: 'settings-navigation',
    icon: './img/window_settings.png',
    i18nKey: 'nav.settings',
    enabled: true
  },
  // Add new pages here - that's it!
  // Example:
  // {
  //   id: 'new-feature',
  //   name: 'New Feature',
  //   path: '/new-feature',
  //   navigationId: 'new-feature-navigation',
  //   icon: './img/new-feature-icon.png',
  //   i18nKey: 'nav.newFeature',
  //   enabled: true
  // }
];

/**
 * Get a page config by ID
 */
export const getPageConfig = (pageId: string): PageConfig | undefined => {
  return PAGE_REGISTRY.find(page => page.id === pageId);
};

/**
 * Get all enabled pages
 */
export const getEnabledPages = (): PageConfig[] => {
  return PAGE_REGISTRY.filter(page => page.enabled !== false);
};

