/**
 * Manages icon data and IconLayer for the map
 * Allows direct updates to icon active states without rebuilding the entire structure
 */
import { FilterElementsData, ListElementEntity } from '../../../../model/IFilterElements';
import { MapFloorElementsData } from '../../../../model/floor/IMapFloorElements';
import { CoordinateUtils } from './coordinateUtils';

export interface IconData {
  id: number;
  entityId: number;
  entity: ListElementEntity;
  position: [number, number];
  pixelX: number;
  pixelY: number;
  name?: string;
  image?: string | null;
  imageElement?: HTMLImageElement | null;
  width?: number;
  height?: number;
  active: boolean; // Always explicitly set (true or false, never undefined)
  elementName?: string;
  hleName?: string;
}

export class IconLayerManager {
  private allIcons: IconData[] = []; // Flat array of ALL icons (active and inactive)
  private readonly iconDataMap: Map<number, IconData> = new Map(); // Map by icon ID for fast lookup
  private iconAtlas: HTMLCanvasElement | null = null;
  private iconMapping: { [key: string]: { x: number; y: number; width: number; height: number; mask: boolean } } = {};
  private coordinateUtils: CoordinateUtils | null = null;
  private readonly defaultPlaceholderImage: string;
  
  // Stable data references - only change when structure actually changes
  private cachedAllIcons: IconData[] | null = null;
  private cachedPolygonData: Array<{ id: string; coordinates: [number, number][][] }> | null = null;
  private cachedAtlasKey: string = '';
  private atlasVersion: number = 0;

  constructor(defaultPlaceholderImage: string) {
    this.defaultPlaceholderImage = defaultPlaceholderImage;
  }

  /**
   * Initialize icon data structure - only called when map structure changes
   * Creates flat array of all icons with their initial active states
   */
  initialize(
    filters: FilterElementsData,
    floors: MapFloorElementsData | null,
    iconImages: Map<string, HTMLImageElement>,
    coordinateUtils: CoordinateUtils,
    createIconAtlas: (images: Map<string, HTMLImageElement>) => {
      atlas: HTMLCanvasElement;
      mapping: { [key: string]: { x: number; y: number; width: number; height: number; mask: boolean } };
    } | null
  ): void {
    this.coordinateUtils = coordinateUtils;
    this.allIcons = [];
    this.iconDataMap.clear();

    const offsetX = filters.offsetX || 0;
    const offsetY = filters.offsetY || 0;

    // Build flat array of all icons
    filters.highLevelElements.forEach(highLevelElement => {
      if (highLevelElement.elements) {
        highLevelElement.elements.forEach(element => {
          if (element.listElements) {
            element.listElements.forEach(listElement => {
              // Handle single position (x, y)
              if (listElement.x !== undefined && listElement.y !== undefined) {
                const adjustedX = listElement.x + offsetX;
                const adjustedY = listElement.y + offsetY;

                const iconData = this.createIconData(
                  listElement,
                  adjustedX,
                  adjustedY,
                  element,
                  highLevelElement,
                  iconImages,
                  listElement.id
                );

                this.allIcons.push(iconData);
                this.iconDataMap.set(iconData.id, iconData);
              }

              // Handle multiple positions (position array)
              if (listElement.position && Array.isArray(listElement.position) && listElement.position.length > 0) {
                listElement.position.forEach(pos => {
                  const adjustedX = pos.x + offsetX;
                  const adjustedY = pos.y + offsetY;

                  const iconData = this.createIconData(
                    listElement,
                    adjustedX,
                    adjustedY,
                    element,
                    highLevelElement,
                    iconImages,
                    listElement.id * 1000 + pos.id
                  );

                  this.allIcons.push(iconData);
                  this.iconDataMap.set(iconData.id, iconData);
                });
              }
            });
          }
        });
      }
    });

    console.log(`📊 IconLayerManager: Created ${this.allIcons.length} icons from ${iconImages.size} images`);

    // Invalidate cached data when structure changes
    this.cachedAllIcons = null;
    this.cachedPolygonData = null;

    // Create icon atlas only if image set changed
    const atlasKey = this.computeAtlasKey(iconImages);
    if (atlasKey !== this.cachedAtlasKey) {
      const atlasData = createIconAtlas(iconImages);
      if (atlasData) {
        this.iconAtlas = atlasData.atlas;
        this.iconMapping = atlasData.mapping;
        this.cachedAtlasKey = atlasKey;
        this.atlasVersion++;
        console.log(`✅ IconLayerManager: Atlas created with ${Object.keys(this.iconMapping).length} mappings (version ${this.atlasVersion})`);
      } else {
        console.warn('⚠️ IconLayerManager: Failed to create icon atlas');
      }
    } else {
      console.log(`✅ IconLayerManager: Reusing existing atlas (version ${this.atlasVersion})`);
    }
  }

  /**
   * Compute stable key for atlas based on image set
   */
  private computeAtlasKey(iconImages: Map<string, HTMLImageElement>): string {
    const sortedPaths = Array.from(iconImages.keys()).sort();
    return sortedPaths.join('|');
  }

  /**
   * Create icon data for a single icon
   */
  private createIconData(
    listElement: ListElementEntity,
    adjustedX: number,
    adjustedY: number,
    element: any,
    highLevelElement: any,
    iconImages: Map<string, HTMLImageElement>,
    iconId: number
  ): IconData {
    // Determine which image to use
    let imagePath: string | null = null;
    let imageElement: HTMLImageElement | null = null;

    if (listElement.image) {
      imagePath = listElement.image;
      imageElement = iconImages.get(listElement.image) || null;
    } else if (listElement.imageList && listElement.imageList.length > 0) {
      imagePath = listElement.imageList[0];
      imageElement = iconImages.get(listElement.imageList[0]) || null;
    } else if (element.imagePath) {
      imagePath = element.imagePath;
      imageElement = iconImages.get(element.imagePath) || null;
    } else if (highLevelElement.imagePath) {
      imagePath = highLevelElement.imagePath;
      imageElement = iconImages.get(highLevelElement.imagePath) || null;
    } else {
      imagePath = this.defaultPlaceholderImage;
      imageElement = iconImages.get(this.defaultPlaceholderImage) || null;
    }

    return {
      id: iconId,
      entityId: listElement.id,
      entity: listElement,
      position: this.coordinateUtils.pixelToLngLat(adjustedX, adjustedY),
      pixelX: adjustedX,
      pixelY: adjustedY,
      name: element.name,
      image: imagePath,
      imageElement: imageElement,
      width: element.width || 30,
      height: element.height || 30,
      active: listElement.active !== false, // Convert undefined to true
      elementName: element.name,
      hleName: highLevelElement.name
    };
  }

  /**
   * Update active states for icons based on filters
   * This is fast - just updates the active property in the existing icon data array
   * Returns true if any active state changed
   */
  updateActiveStates(filters: FilterElementsData): boolean {
    // Build a map of entity ID -> active state (considering parent states)
    const activeStateMap = new Map<number, boolean>();
    
    filters.highLevelElements.forEach(hle => {
      const hleActive = hle.active !== false;
      
      if (hle.elements) {
        hle.elements.forEach(element => {
          const elementActive = hleActive && element.active !== false;
          
          if (element.listElements) {
            element.listElements.forEach(listElement => {
              // Icon is active only if HLE, element, and listElement are all active
              const iconActive = elementActive && listElement.active !== false;
              activeStateMap.set(listElement.id, iconActive);
            });
          }
        });
      }
    });

    // Update active states in icon data array
    let hasChanges = false;
    this.allIcons.forEach(icon => {
      const newActiveState = activeStateMap.get(icon.entityId) ?? false;
      if (icon.active !== newActiveState) {
        icon.active = newActiveState;
        hasChanges = true;
      }
    });

    // Invalidate cache if changes occurred
    if (hasChanges) {
      this.cachedAllIcons = null;
    }

    return hasChanges;
  }

  /**
   * Get all icons (for deck.gl to filter by active state)
   * Returns stable array reference until structure changes
   */
  getAllIcons(): IconData[] {
    if (this.cachedAllIcons === null) {
      this.cachedAllIcons = this.allIcons.filter(icon => {
        // Filter out invalid icons
        return icon && icon.image && icon.position && icon.position.length === 2;
      });
    }
    return this.cachedAllIcons;
  }

  /**
   * Get active icons only (stable array reference until active states change)
   */
  private cachedActiveIcons: IconData[] | null = null;

  getActiveIcons(): IconData[] {
    // Invalidate cache if structure changed
    if (this.cachedAllIcons === null) {
      this.cachedActiveIcons = null;
    }

    if (this.cachedActiveIcons === null) {
      this.cachedActiveIcons = this.getAllIcons().filter(icon => icon.active);
    }
    return this.cachedActiveIcons;
  }

  /**
   * Invalidate cached icons (call when active states change)
   */
  invalidateIconCache(): void {
    this.cachedAllIcons = null;
    this.cachedActiveIcons = null;
  }


  /**
   * Get icon by ID
   */
  getIcon(id: number): IconData | undefined {
    return this.iconDataMap.get(id);
  }

  /**
   * Get icon atlas and mapping (for layer creation)
   */
  getAtlas(): { atlas: HTMLCanvasElement; mapping: { [key: string]: { x: number; y: number; width: number; height: number; mask: boolean } }; version: number } | null {
    if (!this.iconAtlas) return null;
    return {
      atlas: this.iconAtlas,
      mapping: this.iconMapping,
      version: this.atlasVersion
    };
  }

  /**
   * Get path data (relationships between icons)
   */
  getPathData(): Array<{
    id: string;
    path: [number, number][];
    color: [number, number, number, number];
  }> {
    // TODO: Implement path data extraction if needed
    return [];
  }

  /**
   * Get polygon data from floors
   * Returns stable array reference until structure changes
   */
  getPolygonData(filters: FilterElementsData, floors: MapFloorElementsData | null): Array<{
    id: string;
    coordinates: [number, number][][];
  }> {
    if (this.cachedPolygonData !== null) {
      return this.cachedPolygonData;
    }

    const polygonData: Array<{
      id: string;
      coordinates: [number, number][][];
    }> = [];

    if (floors?.elements && this.coordinateUtils) {
      floors.elements.forEach(building => {
        const halfWidth = building.width / 2;
        const halfHeight = building.height / 2;
        const offsetX = filters.offsetX || 0;
        const offsetY = filters.offsetY || 0;

        const cos = Math.cos((building.rotation * Math.PI) / 180);
        const sin = Math.sin((building.rotation * Math.PI) / 180);

        const corners = [
          [-halfWidth, -halfHeight],
          [halfWidth, -halfHeight],
          [halfWidth, halfHeight],
          [-halfWidth, halfHeight]
        ].map(([dx, dy]) => {
          const rotatedX = dx * cos - dy * sin;
          const rotatedY = dx * sin + dy * cos;
          const adjustedX = building.x + offsetX + rotatedX;
          const adjustedY = building.y + offsetY + rotatedY;
          return this.coordinateUtils.pixelToLngLat(adjustedX, adjustedY);
        });

        corners.push(corners[0]);

        polygonData.push({
          id: `building-${building.UUID}`,
          coordinates: [corners]
        });
      });
    }

    this.cachedPolygonData = polygonData;
    return polygonData;
  }
}

