import { FilterElementsData, Elements, ListElementEntity } from '../../../../model/IFilterElements';
import { FilterUtils } from '../../../../escape-from-tarkov/page/map/utils/FilterUtils';
import { MapAdapter } from '../../../../adapter/MapAdapter';

/**
 * Resolves filters by merging fetched data with stored data and resolving filter box states
 * This matches the behavior of the old map page's ResolveIconsHandler and ResolveFilterBoxStateHandler
 */
export class FilterResolver {
  /**
   * Resolves filters: merges with stored data, resolves filter box states, and saves to local storage
   * @param fetchedFilters - Filters fetched from the server
   * @param mapId - The map ID
   * @returns Resolved filters ready to use
   */
  static resolve(fetchedFilters: FilterElementsData, mapId: string): FilterElementsData {
    // Get stored filters from local storage
    const storedFilters = FilterUtils.getStoredData(mapId) as FilterElementsData | null;

    let resolvedFilters: FilterElementsData;

    if (fetchedFilters && storedFilters) {
      // Updating: merge fetched data with stored data
      resolvedFilters = this.mergeFilters(fetchedFilters, storedFilters);
    } else if (fetchedFilters && !storedFilters) {
      // First time or just deleted the stored data
      resolvedFilters = fetchedFilters;
    } else if (!fetchedFilters && storedFilters) {
      // Version did not change, use stored data
      resolvedFilters = storedFilters;
    } else {
      // Server is down and nothing is stored - return fetched data as-is
      resolvedFilters = fetchedFilters;
    }

    // Resolve filter box states (element active states propagate to listElements)
    this.resolveFilterBoxStates(resolvedFilters);

    // Save resolved filters
    FilterUtils.save(resolvedFilters);

    return resolvedFilters;
  }

  /**
   * Resolves filter box states and saves filters to local storage
   * Use this when filters are updated (e.g., from the sidebar) and don't need merging
   * NOTE: We do NOT resolve filter box states here because that would override individual entity states
   * when users manually toggle entities. Filter box state resolution should only happen on initial load.
   * @param filters - Filters to save
   * @param mapId - The map ID
   * @returns Filters (unchanged, just saved)
   */
  static resolveAndSave(filters: FilterElementsData, mapId: string): FilterElementsData {
    // Save filters without resolving (preserve individual entity states)
    FilterUtils.save(filters);

    return filters;
  }

  /**
   * Merges fetched filters with stored filters, preserving active states from stored data
   */
  private static mergeFilters(fetchedData: FilterElementsData, storedData: FilterElementsData): FilterElementsData {
    // Safety check: ensure storedData has highLevelElements
    if (!storedData || !storedData.highLevelElements || !Array.isArray(storedData.highLevelElements)) {
      return fetchedData;
    }

    if (!fetchedData.highLevelElements || !Array.isArray(fetchedData.highLevelElements)) {
      return fetchedData;
    }

    fetchedData.highLevelElements.forEach(newElement => {
      const element = storedData.highLevelElements.find(e => e && e.name === newElement.name);
      if (element !== undefined) {
        newElement.active = element.active;
        if (newElement.elements && element.elements) {
          this.mergeElements(newElement.elements, element.elements);
        }
      }
    });

    return fetchedData;
  }

  /**
   * Merges elements, preserving active states from stored data
   */
  private static mergeElements(newElementList: Elements[], storedElementList: Elements[]): void {
    // Safety check
    if (!newElementList || !Array.isArray(newElementList) || !storedElementList || !Array.isArray(storedElementList)) {
      return;
    }

    newElementList.forEach(newElement => {
      if (!newElement) return;
      const storedElement = storedElementList.find(oldElement => oldElement && oldElement.name === newElement.name);
      if (storedElement !== undefined) {
        newElement.active = storedElement.active;
        if (newElement.listElements && storedElement.listElements) {
          this.mergeListElements(newElement.listElements, storedElement.listElements);
        }
      }
    });
  }

  /**
   * Merges list elements, preserving active states from stored data
   * Also adds stored elements that don't exist in fetched data (unless they're protected)
   */
  private static mergeListElements(newElementList: ListElementEntity[], storedElementList: ListElementEntity[]): void {
    // Safety check
    if (!newElementList || !Array.isArray(newElementList) || !storedElementList || !Array.isArray(storedElementList)) {
      return;
    }

    newElementList.forEach(newElement => {
      if (!newElement) return;
      const storedElement = storedElementList.find(oldElement => oldElement && oldElement.id === newElement.id);
      if (storedElement !== undefined) {
        newElement.active = storedElement.active;
        // Note: protectedEntity logic is commented out in the original, so we skip it
      }
    });

    // Add stored elements that don't exist in fetched data (unless they're protected)
    storedElementList.forEach(storedElement => {
      if (!storedElement) return;
      const element = newElementList.find(e => e && e.id === storedElement.id);
      if (!element && !storedElement.protectedEntity) {
        newElementList.push(storedElement);
      }
    });
  }

  /**
   * Resolves filter box states:
   * - If an element is active, all its listElements become active
   * - If an element is inactive, all its listElements become inactive
   * - If all elements in a highLevelElement are inactive, the highLevelElement becomes inactive
   */
  private static resolveFilterBoxStates(filters: FilterElementsData): void {
    // Safety check
    if (!filters || !filters.highLevelElements || !Array.isArray(filters.highLevelElements)) {
      return;
    }

    filters.highLevelElements.forEach(hle => {
      if (!hle || !hle.elements || !Array.isArray(hle.elements)) {
        return;
      }

      hle.elements.forEach(element => {
        if (element) {
          this.resolveElement(element);
        }
      });

      // Check if all elements in highLevelElement are inactive
      let allElementsInactive = true;
      for (const element of hle.elements) {
        if (element && element.active) {
          allElementsInactive = false;
          break;
        }
      }

      if (allElementsInactive) {
        hle.active = false;
      } else {
        hle.active = true;
      }
    });
  }

  /**
   * Resolves an element's state: propagates active state to all listElements
   */
  private static resolveElement(element: Elements): void {
    if (!element) return;

    if (element.active) {
      this.changeAllEntityState(element, true);
    } else {
      this.changeAllEntityState(element, false);
    }
  }

  /**
   * Changes the active state of all entities in an element
   */
  private static changeAllEntityState(element: Elements, state: boolean): void {
    if (!element || !element.listElements || !Array.isArray(element.listElements)) {
      return;
    }

    element.listElements.forEach(entity => {
      if (entity) {
        entity.active = state;
      }
    });
  }
}

