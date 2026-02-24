/**
 * Utility functions for event images
 */

/**
 * Convert event name to image path
 * Converts to lowercase and replaces spaces with underscores
 * Uses relative path that works from both desktop and in-game windows
 */
export function getEventImagePath(eventName: string): string {
  const imageName = eventName.toLowerCase().replace(/\s+/g, '_');
  
  // Detect window type using the same logic as trading page
  const pathname = window.location.pathname || '';
  const hasInGameElement = document.getElementById('in_game') !== null;
  const hasInGameClass = document.body?.classList.contains('in_game') || false;
  const isIngame = pathname.includes('in_game') || hasInGameElement || hasInGameClass;
  
  // For ingame, use ../map_events/ path
  // For desktop, use ./map_events/ path
  const basePath = isIngame ? '../map_events' : './map_events';
  return `${basePath}/${imageName}.png`;
}

