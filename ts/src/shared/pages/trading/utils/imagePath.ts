/**
 * Get the correct image path based on the current window context
 * This handles the difference between desktop and ingame window paths
 */
export const getImagePath = (imageName: string): string => {
  // Try to detect window type from the current location or document structure
  const pathname = window.location.pathname || '';
  const hasInGameElement = document.getElementById('in_game') !== null;
  const hasInGameClass = document.body?.classList.contains('in_game') || false;
  
  // For ingame, use ../img/ path
  // For desktop, use ./img/ path
  const isIngame = pathname.includes('in_game') || hasInGameElement || hasInGameClass;
  
  if (isIngame) {
    return `../img/${imageName}`;
  } else {
    return `./img/${imageName}`;
  }
};

