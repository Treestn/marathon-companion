/**
 * Map filter utilities for Map Events
 */

export const MAP_OPTIONS = [
  { value: 'all', label: 'All Maps' },
  { value: 'The Blue Gate', label: 'The Blue Gate' },
  { value: 'Dam Battleground', label: 'Dam Battleground' },
  { value: 'The Spaceport', label: 'The Spaceport' },
  { value: 'Buried City', label: 'Buried City' },
  { value: 'Stella Montis', label: 'Stella Montis' },
];

const MAP_FILTER_STORAGE_KEY = 'map-events-map-filter';

/**
 * Get the stored map filter preference or default to 'all'
 */
export function getStoredMapFilter(): string {
  try {
    const stored = localStorage.getItem(MAP_FILTER_STORAGE_KEY);
    if (stored && MAP_OPTIONS.some(map => map.value === stored)) {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to read map filter from localStorage:', e);
  }
  return 'all';
}

/**
 * Store the map filter preference
 */
export function setStoredMapFilter(mapFilter: string): void {
  try {
    localStorage.setItem(MAP_FILTER_STORAGE_KEY, mapFilter);
  } catch (e) {
    console.warn('Failed to save map filter to localStorage:', e);
  }
}

