/**
 * Centralized page loading system
 * Register your page loaders here to reduce boilerplate in NavigationUtils
 */

export type PageLoaderFunction = (params?: any) => Promise<void>;

// Navigation event system
type NavigationEventListener = (pageId: string) => void;

class PageLoaderRegistry {
  // Use a shared Map stored globally to avoid webpack code splitting issues
  private getLoadersMap(): Map<string, PageLoaderFunction> {
    if (typeof window !== 'undefined') {
      if (!(window as any).__pageLoaderMap) {
        (window as any).__pageLoaderMap = new Map<string, PageLoaderFunction>();
      }
      return (window as any).__pageLoaderMap;
    }
    // Fallback for non-window environments
    if (!this._loaders) {
      this._loaders = new Map<string, PageLoaderFunction>();
    }
    return this._loaders;
  }
  
  private _loaders?: Map<string, PageLoaderFunction>;
  
  private get loaders(): Map<string, PageLoaderFunction> {
    return this.getLoadersMap();
  }

  // Navigation event listeners
  private getNavigationListeners(): NavigationEventListener[] {
    if (typeof window !== 'undefined') {
      if (!(window as any).__pageLoaderListeners) {
        (window as any).__pageLoaderListeners = [];
      }
      return (window as any).__pageLoaderListeners;
    }
    if (!this._navigationListeners) {
      this._navigationListeners = [];
    }
    return this._navigationListeners;
  }
  
  private _navigationListeners?: NavigationEventListener[];
  
  /**
   * Subscribe to navigation events
   */
  onNavigation(callback: NavigationEventListener): () => void {
    const listeners = this.getNavigationListeners();
    listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Emit navigation event
   */
  private emitNavigation(pageId: string): void {
    const listeners = this.getNavigationListeners();
    listeners.forEach(listener => {
      try {
        listener(pageId);
      } catch (error) {
        console.error('[PageLoader] Error in navigation listener:', error);
      }
    });
  }

  /**
   * Register a page loader function
   */
  register(pageId: string, loader: PageLoaderFunction): void {
    this.loaders.set(pageId, loader);
  }

  /**
   * Load a page by ID
   */
  async loadPage(pageId: string, params?: any): Promise<void> {
    const loader = this.loaders.get(pageId);
    if (loader) {
      await loader(params);
      // Emit navigation event after page is loaded
      this.emitNavigation(pageId);
    } else {
      console.error(`Page loader not found for: ${pageId}`);
      throw new Error(`Page loader not registered for: ${pageId}`);
    }
  }

  /**
   * Check if a page loader is registered
   */
  hasLoader(pageId: string): boolean {
    return this.loaders.has(pageId);
  }

  /**
   * Get all registered page IDs
   */
  getRegisteredPages(): string[] {
    return Array.from(this.loaders.keys());
  }
}

// Get or create singleton instance - use global to ensure same instance across webpack chunks
let pageLoaderInstance: PageLoaderRegistry;

if (typeof window !== 'undefined' && (window as any).__pageLoader) {
  // Use existing global instance
  console.log('[PageLoader] Using existing global instance');
  pageLoaderInstance = (window as any).__pageLoader;
} else {
  // Create new instance
  pageLoaderInstance = new PageLoaderRegistry();
  // Make it available globally
  if (typeof window !== 'undefined') {
    (window as any).__pageLoader = pageLoaderInstance;
    console.log('[PageLoader] Created new global instance');
  }
}

export const pageLoader = pageLoaderInstance;

