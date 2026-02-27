import React, { useState, useEffect } from 'react';
import type { MapGeoDocument } from '../../../model/map/MapGeoDocument';
import type { HighLevelGroup } from '../../../model/map/HighLevelGroup';
import type { ElementLayer } from '../../../model/map/ElementLayer';
import type { FeatureProps } from '../../../model/map/FeatureProps';
import { I18nHelper } from '../../../locale/I18nHelper';
import { MapsList } from '../../../escape-from-tarkov/constant/MapsConst';
import { FilterConst } from '../../../escape-from-tarkov/constant/FilterConst';
import { MapAdapter } from '../../../adapter/MapAdapter';
import { TraderMapper } from '../../../adapter/TraderMapper';
import { QuestDataStore } from '../../services/QuestDataStore';
import { ProgressionStateService } from '../../services/ProgressionStateService';
import { AppConfigClient } from '../../services/AppConfigClient';
import './map.css';

interface MapFilterSidebarProps {
  mapDoc: MapGeoDocument;
  onMapDocChange: (mapDoc: MapGeoDocument) => void;
  currentMapId: string;
  onMapChange: (mapId: string) => void;
  isEditMode: boolean;
  isEditModeAvailable: boolean;
  canEdit: boolean;
  onToggleEditMode: () => void;
}

export const MapFilterSidebar: React.FC<MapFilterSidebarProps> = ({
  mapDoc,
  onMapDocChange,
  currentMapId,
  onMapChange,
  isEditMode,
  isEditModeAvailable,
  canEdit,
  onToggleEditMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedHighLevelElements, setExpandedHighLevelElements] = useState<Set<number>>(new Set());
  const [defaultMapId, setDefaultMapId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  let editButtonTitle = 'Submit changes';
  if (!canEdit) {
    editButtonTitle = 'Connect to Overwolf to enable edit mode';
  } else if (isEditMode) {
    editButtonTitle = 'Exit edit mode';
  }
  const editButtonLabel = isEditMode ? 'Editing Changes' : 'Submit Changes';

  // Get current default map preference
  // Ensure there's always a default map
  useEffect(() => {
    const updateDefaultMapId = () => {
      const currentDefault =
        AppConfigClient.getConfig()?.userSettings?.mapDefaultPreference ?? "";
      const mapIdFromPreference = MapAdapter.getIdFromMap(currentDefault);
      const resolvedDefault = mapIdFromPreference || currentDefault;
      
      // If no default is set, set the first map as default
      if (!resolvedDefault && MapsList.length > 0) {
        const firstMapId = MapsList[0].id;
        AppConfigClient.updateConfig({
          userSettings: { mapDefaultPreference: firstMapId },
        });
        setDefaultMapId(firstMapId);
      } else {
        setDefaultMapId(resolvedDefault || null);
      }
    };
    
    updateDefaultMapId();
  }, []); // Only run once on mount, not when currentMapId changes

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSetDefaultMap = (mapId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown from closing
    // Only set if it's not already the default (can't remove default, must always have one)
    if (defaultMapId !== mapId) {
      AppConfigClient.updateConfig({
        userSettings: { mapDefaultPreference: mapId },
      });
      setDefaultMapId(mapId);
    }
  };

  // Helper functions - defined first
  const getElementName = (element: HighLevelGroup | ElementLayer | FeatureProps): string => {
    if ("locales" in element && element.locales) {
      const localeName =
        element.locales[I18nHelper.currentLocale()] || element.locales[I18nHelper.defaultLocale];
      if (localeName) return localeName;
    }
    if ("name" in element && element.name) return element.name;
    return "Unknown";
  };

  const isGroupActive = (group: HighLevelGroup): boolean => group.active !== false;

  const isLayerActive = (layer: ElementLayer): boolean => layer.active !== false;

  const getFeaturePrimaryPoint = (
    feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>
  ): { x: number; y: number } | null => {
    const coords = (() => {
      if (feature.geometry.type === "Point") {
        return feature.geometry.coordinates as [number, number];
      }
      if (feature.geometry.type === "MultiPoint") {
        const points = feature.geometry.coordinates as [number, number][];
        return points.length > 0 ? points[0] : null;
      }
      return null;
    })();
    if (!coords) return null;
    if (mapDoc.coordinateSystem.type === "image-normalized") {
      return {
        x: coords[0] * mapDoc.raster.width,
        y: coords[1] * mapDoc.raster.height,
      };
    }
    return { x: coords[0], y: coords[1] };
  };

  const getQuestDisplay = (feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>) => {
    if (!feature.properties?.questId) return null;
    const quest = QuestDataStore.getQuestById(feature.properties.questId);
    if (!quest) return null;
    if (!ProgressionStateService.isQuestActive(quest.id)) return null;
    if (
      ProgressionStateService.isQuestObjectiveCompletedByIconId(
        quest.id,
        String(feature.properties.id),
      )
    ) {
      return null;
    }

    const questName =
      quest.locales?.[I18nHelper.currentLocale()] ??
      quest.locales?.[I18nHelper.defaultLocale] ??
      quest.name ??
      'Quest';

    let description = '';
    for (const obj of quest.objectives ?? []) {
      if (!obj.questImages || obj.questImages.length === 0) continue;
      const match = obj.questImages.find(
        (img: any) => String(img.id) === String(feature.properties?.id)
      );
      if (match) {
        description = match.description || '';
        break;
      }
    }

    const traderImage = quest.trader?.id
      ? TraderMapper.getImageFromTraderId(quest.trader.id)
      : null;

    return {
      questName,
      description,
      traderImage,
    };
  };

  const toggleHighLevelElement = (groupIndex: number) => {
    const updatedDoc = structuredClone(mapDoc);
    const group = updatedDoc.groups[groupIndex];
    const newActiveState = group.active === false ? true : false;
    group.active = newActiveState;
    group.layers?.forEach((layer) => {
      layer.active = newActiveState;
      layer.data?.features?.forEach((feature) => {
        if (feature.properties) {
          feature.properties.active = newActiveState;
        }
      });
    });
    onMapDocChange(updatedDoc);
  };

  const toggleElement = (groupIndex: number, layerIndex: number) => {
    const updatedDoc = structuredClone(mapDoc);
    const layer = updatedDoc.groups[groupIndex].layers[layerIndex];
    const newActiveState = layer.active === false ? true : false;
    layer.active = newActiveState;
    layer.data?.features?.forEach((feature) => {
      if (feature.properties) {
        feature.properties.active = newActiveState;
      }
    });
    const group = updatedDoc.groups[groupIndex];
    const hasActiveChild = group.layers.some((child) => child.active !== false);
    group.active = hasActiveChild;
    onMapDocChange(updatedDoc);
  };

  const setAllFiltersActive = (active: boolean) => {
    const updatedDoc = structuredClone(mapDoc);
    updatedDoc.groups.forEach((group) => {
      group.active = active;
      group.layers?.forEach((layer) => {
        layer.active = active;
        layer.data?.features?.forEach((feature) => {
          if (feature.properties) {
            feature.properties.active = active;
          }
        });
      });
    });
    onMapDocChange(updatedDoc);
  };


  const toggleHighLevelElementExpanded = (hleIndex: number) => {
    setExpandedHighLevelElements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hleIndex)) {
        newSet.delete(hleIndex);
      } else {
        newSet.add(hleIndex);
      }
      return newSet;
    });
  };

  const isHighLevelElementExpanded = (hleIndex: number): boolean => {
    return expandedHighLevelElements.has(hleIndex);
  };

  const handleEditFooterClick = () => {
    // Keep the map focused when entering submit/edit flow.
    setIsOpen(false);
    setIsDropdownOpen(false);
    onToggleEditMode();
  };

  return (
    <>
      {/* Toggle Button */}
      <div
        className={`map-filter-toggle-button ${isOpen ? 'map-filter-toggle-button-open' : 'map-filter-toggle-button-closed'}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close filters' : 'Open filters'}
      >
        <span className={`map-filter-toggle-label ${isOpen ? 'map-filter-toggle-label-hidden' : 'map-filter-toggle-label-visible'}`}>
          Filters
        </span>
        <span className="map-filter-toggle-icon">
          {isOpen ? '◄' : '►'}
        </span>
      </div>

      {/* Sidebar */}
      <div
        className={`map-filter-sidebar ${isOpen ? 'map-filter-sidebar-open' : 'map-filter-sidebar-closed'}`}
      >
        <div className="map-filter-scroll scroll-div">
          <div className="map-filter-content">
          {/* Map Selector Dropdown */}
          <div className="map-filter-section">
            <div ref={dropdownRef} className="map-filter-dropdown">
              {/* Custom Dropdown Button */}
              <div
                className={`map-filter-dropdown-button ${isDropdownOpen ? 'is-open' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{MapAdapter.getLocalizedMap(currentMapId)}</span>
                <span
                  className={`map-filter-dropdown-selected-star ${defaultMapId === currentMapId ? 'map-filter-dropdown-selected-star-default' : ''}`}
                  onClick={(e) => {
                    if (defaultMapId !== currentMapId) {
                      handleSetDefaultMap(currentMapId, e);
                    } else {
                      e.stopPropagation();
                    }
                  }}
                  title={defaultMapId === currentMapId ? 'Default map' : 'Set as default map'}
                >
                  {defaultMapId === currentMapId ? '★' : '☆'}
                </span>
                <span className={`map-filter-dropdown-arrow ${isDropdownOpen ? 'map-filter-dropdown-arrow-open' : 'map-filter-dropdown-arrow-closed'}`}>
                  ▼
                </span>
              </div>

              {/* Dropdown Options */}
              <div
                className={`map-filter-dropdown-menu ${isDropdownOpen ? 'map-filter-dropdown-menu-open' : 'map-filter-dropdown-menu-closed'}`}
                aria-hidden={!isDropdownOpen}
              >
                {MapsList.map((map) => {
                  const isMapDefault = defaultMapId === map.id;
                  const isSelected = currentMapId === map.id;
                  return (
                    <div
                      key={map.id}
                      className={`map-filter-dropdown-item ${isSelected ? 'map-filter-dropdown-item-selected' : ''}`}
                      onClick={() => {
                        onMapChange(map.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span className="map-filter-dropdown-item-text">
                        {MapAdapter.getLocalizedMap(map.id)}
                      </span>
                      <span
                        className={`map-filter-dropdown-item-star ${isMapDefault ? 'map-filter-dropdown-item-star-default' : ''}`}
                        onClick={(e) => {
                          if (!isMapDefault) {
                            handleSetDefaultMap(map.id, e);
                          } else {
                            e.stopPropagation();
                          }
                        }}
                        title={isMapDefault ? 'Default map' : 'Set as default map'}
                      >
                        {isMapDefault ? '★' : '☆'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="map-filter-bulk-actions">
            <button
              type="button"
              className="map-filter-bulk-button"
              onClick={() => setAllFiltersActive(false)}
            >
              Hide All
            </button>
            <button
              type="button"
              className="map-filter-bulk-button"
              onClick={() => setAllFiltersActive(true)}
            >
              Show All
            </button>
          </div>
          <div className="map-filter-section-separator" />

            {mapDoc.groups.map((group, groupIndex) => {
            const isActive = isGroupActive(group);
            const elementCount = group.layers?.length ?? 0;
            const isQuestGroup = group.name === FilterConst.QUESTS.name;
            const hasDropdown = elementCount > 1 || isQuestGroup;
            const isExpanded = hasDropdown ? isHighLevelElementExpanded(groupIndex) : true;
            const singleLayer = elementCount === 1 ? group.layers?.[0] : null;
            const singleLayerTotal = singleLayer?.data?.features?.length ?? 0;
            const singleLayerActive =
              singleLayer?.data?.features?.filter((f) => f.properties?.active !== false).length ?? 0;
            const questElements =
              isQuestGroup && singleLayer ? singleLayer.data?.features ?? [] : [];
            const questGroupActive = isQuestGroup ? isActive : true;
            const questElementsForRender = questGroupActive
              ? questElements.filter((questElement) => questElement.properties?.active !== false)
              : questElements;

            return (
              <div
                key={group.id}
                className={`map-filter-hle-container ${isActive ? 'map-filter-hle-container-active' : 'map-filter-hle-container-inactive'}`}
              >
                {/* High Level Element Header */}
                <div
                  className={`map-filter-hle-header ${isActive ? 'map-filter-hle-header-active' : 'map-filter-hle-header-inactive'}`}
                  onClick={() => {
                    if (hasDropdown) {
                      toggleHighLevelElementExpanded(groupIndex);
                    }
                  }}
                >
                  <div className="map-filter-hle-header-content">
                    {/* High Level Element Image */}
                    {group.icon?.imagePath && (
                      <img
                        src={group.icon.imagePath}
                        alt={getElementName(group)}
                        className={`map-filter-hle-image ${isActive ? 'map-filter-hle-image-active' : 'map-filter-hle-image-inactive'}`}
                      />
                    )}
                    {/* Text - only this toggles active state */}
                    <span 
                      className={`map-filter-hle-text ${isActive ? 'map-filter-hle-text-active' : 'map-filter-hle-text-inactive'}`}
                    >
                      {getElementName(group)}
                    </span>
                    {/* Eye toggle */}
                    <span
                      className={`map-filter-hle-eye ${isActive ? 'map-filter-hle-eye-active' : 'map-filter-hle-eye-disabled'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHighLevelElement(groupIndex);
                      }}
                      title={isActive ? 'Disable filter group' : 'Enable filter group'}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 5c-5 0-9 4-10 7 1 3 5 7 10 7s9-4 10-7c-1-3-5-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    {!hasDropdown && (
                      <span className="map-filter-element-count">
                        {isQuestGroup ? singleLayerActive : singleLayerTotal}
                      </span>
                    )}
                    {/* Expand/Collapse Indicator */}
                    {hasDropdown && (
                      <div
                        className="map-filter-hle-expand-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHighLevelElementExpanded(groupIndex);
                        }}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </div>
                    )}
                  </div>
                  {/* <span className="map-filter-hle-count">
                    {activeCount}/{totalCount}
                  </span> */}
                </div>

                {/* Elements */}
                {hasDropdown ? (
                  <div
                    className={`map-filter-elements ${isExpanded ? 'map-filter-elements-open' : 'map-filter-elements-closed'}`}
                    aria-hidden={!isExpanded}
                  >
                    {isQuestGroup && elementCount === 1 ? (
                      <div className="map-filter-quest-list">
                        {questElementsForRender.map((questElement, questIndex) => {
                            const questDisplay = getQuestDisplay(questElement);
                            if (!questDisplay) return null;
                            const primaryPoint = getFeaturePrimaryPoint(questElement);
                            const hasCoords = !!primaryPoint;
                            const floorId = questElement.properties?.floor ?? null;
                            const isQuestElementActive = questElement.properties?.active !== false;
                            const showFocusButton = questGroupActive && isQuestElementActive;

                            return (
                              <div
                                key={questElement.properties?.id ?? `${group.id}-quest-${questIndex}`}
                                className={`map-filter-quest-item ${isQuestElementActive ? '' : 'map-filter-quest-item-inactive'}`}
                              >
                                {questDisplay.traderImage && (
                                  <img
                                    src={questDisplay.traderImage}
                                    alt={questDisplay.questName}
                                    className="map-filter-quest-trader-image"
                                  />
                                )}
                                <div className="map-filter-quest-info">
                                  <div className="map-filter-quest-name">{questDisplay.questName}</div>
                                  <div className="map-filter-quest-description">
                                    {questDisplay.description}
                                  </div>
                                </div>
                                {showFocusButton && (
                                  <button
                                    type="button"
                                    className="map-filter-quest-focus"
                                    disabled={!hasCoords}
                                    // data-tooltip="Find on map"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!hasCoords) return;
                                      if (typeof globalThis.dispatchEvent !== "function") return;
                                      globalThis.dispatchEvent(
                                        new CustomEvent("map-focus-icon", {
                                          detail: {
                                            pixelX: primaryPoint?.x,
                                            pixelY: primaryPoint?.y,
                                            floorId,
                                          },
                                        })
                                      );
                                    }}
                                    title="Focus icon on map"
                                  >
                                    <img
                                      src="../../img/icons/target.png"
                                      alt="Focus on map"
                                      className="map-filter-quest-focus-icon"
                                    />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      group.layers &&
                      group.layers.map((layer, layerIndex) => {
                      const elementTotalCount = layer.data?.features ? layer.data.features.length : 0;
                      if (!elementTotalCount) {
                        return null;
                      }
                      const elementActiveCount = layer.data?.features 
                        ? layer.data.features.filter((feature) => feature.properties?.active !== false).length 
                        : 0;
                      const elementIsActive = isLayerActive(layer);

                      return (
                        <div key={layer.id} className="map-filter-element-item">
                          {/* Element Header */}
                          <div
                            className={`map-filter-element-header`}
                            onClick={(e) => {
                              // Prevent event from bubbling up to parent
                              e.stopPropagation();
                              toggleElement(groupIndex, layerIndex);
                            }}
                          >
                            <div className="map-filter-element-content">
                              {/* Element Image */}
                              {layer.style?.iconImagePath && (
                                <img
                                  src={layer.style.iconImagePath}
                                  alt={getElementName(layer)}
                                  className={`map-filter-element-image ${elementIsActive ? 'map-filter-element-image-active' : 'map-filter-element-image-inactive'}`}
                                />
                              )}
                              {/* Text - only this toggles active state */}
                              <span 
                                className={`map-filter-element-text ${elementIsActive ? 'map-filter-element-text-active' : 'map-filter-element-text-inactive'}`}
                              >
                                {getElementName(layer)}
                              </span>
                            </div>
                            <span className="map-filter-element-count">
                              {elementActiveCount || elementTotalCount}
                            </span>
                          </div>
                        </div>
                      );
                    })
                    )}
                  </div>
                ) : null}
              </div>
            );
            })}
          </div>
        </div>
        {isEditModeAvailable && canEdit && (
          <button
          type="button"
          className={`map-filter-footer ${isEditMode ? 'map-filter-footer-active' : ''}`}
          onClick={handleEditFooterClick}
            title={editButtonTitle}
        >
            {editButtonLabel}
          </button>
        )}
      </div>
    </>
  );
};

