import React, { useEffect, useState } from 'react';
import { getEnabledPages } from '../pages/PageRegistry';
import { pageLoader } from '../pages/PageLoader';
import { NavigationUtils } from '../../escape-from-tarkov/utils/NavigationUtils';
import { I18nHelper } from '../../locale/I18nHelper';

interface NavigationBarProps {
  windowType?: 'desktop' | 'ingame';
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ windowType = 'desktop' }) => {
  const [pages, setPages] = useState(getEnabledPages());
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [i18nReady, setI18nReady] = useState<boolean>(false);

  // Keep using the base icon and style it by state in CSS.
  const getIconPath = (page: { id: string; icon: string }): string => {
    let iconPath = page.icon;

    // Fix icon path based on window type
    if (windowType === 'ingame' && !iconPath.startsWith('../')) {
      iconPath = '../' + iconPath.replace('./', '');
    } else if (windowType === 'desktop' && iconPath.startsWith('../')) {
      iconPath = iconPath.replace('../', './');
    }
    
    return iconPath;
  };

  useEffect(() => {
    console.log('[NavigationBar] Component mounted');
    console.log('[NavigationBar] Registered page loaders:', pageLoader.getRegisteredPages());
    
    // Set initial active page to "interactive-map" (default)
    setActivePageId('interactive-map');

    const loadInitialPage = async () => {
      try {
        if (!pageLoader.hasLoader('interactive-map')) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (pageLoader.hasLoader('interactive-map')) {
          await pageLoader.loadPage('interactive-map');
          setActivePageId('interactive-map');
        }
      } catch (error) {
        console.error('[NavigationBar] Failed to load initial interactive map page:', error);
      }
    };
    loadInitialPage();
    
    // Subscribe to navigation events so we can update active state when pages change
    // This handles navigation from internal buttons (not through navbar)
    const unsubscribe = pageLoader.onNavigation((pageId: string) => {
      console.log('[NavigationBar] Navigation event received for page:', pageId);
      setActivePageId(pageId);
    });
    
    // Initialize I18nHelper if needed
    const initI18n = async () => {
      try {
        await I18nHelper.init();
        setI18nReady(true);
      } catch (error) {
        console.error('Failed to initialize I18nHelper:', error);
        setI18nReady(true); // Set to true anyway to allow rendering
      }
    };
    
    initI18n();
    // Load pages (in case registry is updated dynamically)
    setPages(getEnabledPages());
    
    return () => {
      unsubscribe(); // Clean up navigation listener
    };
  }, []);


  const handleNavigate = async (pageConfig: { id: string; navigationId: string }) => {
    try {
      // Don't reload if the page is already active
      if (activePageId === pageConfig.id) {
        console.log(`[NavigationBar] Page ${pageConfig.id} is already active, skipping reload`);
        return;
      }

      console.log(`[NavigationBar] Navigating to page: ${pageConfig.id}`, pageConfig);
      const registeredPages = pageLoader.getRegisteredPages();
      console.log(`[NavigationBar] Page loader registered pages:`, registeredPages);
      const hasLoader = pageLoader.hasLoader(pageConfig.id);
      console.log(`[NavigationBar] Has loader for ${pageConfig.id}:`, hasLoader);
      
      // Always use the page loader - it should be registered by the time user clicks
      // If not registered, wait a bit and try again (timing issue)
      if (hasLoader) {
        console.log(`[NavigationBar] Using pageLoader for ${pageConfig.id}`);
        await pageLoader.loadPage(pageConfig.id);
        setActivePageId(pageConfig.id);
        console.log(`[NavigationBar] Successfully loaded page: ${pageConfig.id}`);
      } else {
        // Wait a bit for page loaders to be registered (handles timing issues)
        console.warn(`[NavigationBar] Page loader not found for ${pageConfig.id}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (pageLoader.hasLoader(pageConfig.id)) {
          console.log(`[NavigationBar] Page loader now available for ${pageConfig.id}`);
          await pageLoader.loadPage(pageConfig.id);
          setActivePageId(pageConfig.id);
          console.log(`[NavigationBar] Successfully loaded page: ${pageConfig.id}`);
        } else {
          // This should not happen if page loaders are properly registered
          console.error(`[NavigationBar] Page loader still not found for ${pageConfig.id} after wait`);
          console.error(`[NavigationBar] Available pages:`, pageLoader.getRegisteredPages());
          throw new Error(`Page loader not registered for: ${pageConfig.id}`);
        }
      }
      

    } catch (error) {
      console.error(`[NavigationBar] Failed to navigate to ${pageConfig.id}:`, error);
      console.error('Error details:', error);
      // Don't rethrow - just log the error
    }
  };

  const getPageLabel = (i18nKey: string): string => {
    if (!i18nReady) {
      return i18nKey; // Return key if i18n not ready yet
    }
    try {
      const label = I18nHelper.get(i18nKey);
      return label || i18nKey; // Fallback to key if translation not found
    } catch (error) {
      console.warn(`Failed to get translation for ${i18nKey}:`, error);
      return i18nKey;
    }
  };

  return (
    <>
      {pages.map(page => {
        const isActive = activePageId === page.id;
        const iconPath = getIconPath(page);
        
        return (
          <button
            key={page.id}
            id={page.navigationId}
            type="button"
            className={`page-icon-container ${isActive ? 'page-icon-container-active' : ''}`}
            onClick={(e) => {
              console.log(`Click detected on ${page.id}`, e);
              e.preventDefault();
              e.stopPropagation();
              handleNavigate(page);
            }}
            onMouseDown={(e) => {
              // Also handle mousedown as fallback
              console.log(`MouseDown detected on ${page.id}`, e);
            }}
            aria-pressed={isActive}
          >
            <div
              className={`page-icon-image-container ${isActive ? 'page-icon-image-container-active' : ''}`}
            >
              <img
                className="page-icon-image"
                src={iconPath}
                alt={page.name}
              />
            </div>
            <div className="icon-text-container">
              <b className="icon-text">{getPageLabel(page.i18nKey)}</b>
            </div>
          </button>
        );
      })}
    </>
  );
};


