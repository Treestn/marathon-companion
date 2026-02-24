import React, { useState, useEffect, useRef } from 'react';
import { MapEventScheduleService, MapEvent } from '../pages/mapEvents/MapEventScheduleService';
import { formatTimeInTimezone, getStoredTimezone } from '../pages/mapEvents/TimezoneUtils';
import { getEventImagePath } from '../pages/mapEvents/EventImageUtils';
import { pageLoader } from '../pages/PageLoader';

interface ActiveEventsIndicatorProps {
  onNavigateToEvents?: () => void;
}

export const ActiveEventsIndicator: React.FC<ActiveEventsIndicatorProps> = ({ onNavigateToEvents }) => {
  const [activeEvents, setActiveEvents] = useState<MapEvent[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);

  // Update events every second
  useEffect(() => {
    const updateEvents = () => {
      const active = MapEventScheduleService.getActiveEvents();
      setActiveEvents(active);
      setCurrentTime(new Date());
    };

    updateEvents();
    const interval = setInterval(updateEvents, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle hover to show dropdown
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowDropdown(true);
    setIsAnimating(true);
    // Animation duration is 0.2s (200ms), enable interaction after animation
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      animationTimeoutRef.current = null;
    }, 100);
  };

  const handleMouseLeave = () => {
    // Small delay before hiding to allow moving to dropdown
    timeoutRef.current = window.setTimeout(() => {
      setShowDropdown(false);
    }, 300);
  };

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleDropdownMouseLeave = () => {
    setShowDropdown(false);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (date: Date): string => {
    const timezone = getStoredTimezone();
    return formatTimeInTimezone(date, timezone);
  };

  const formatTimeUntil = (event: MapEvent): string => {
    return MapEventScheduleService.getTimeUntilEvent(event);
  };

  const handleHeaderClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onNavigateToEvents) {
      onNavigateToEvents();
      return;
    }
    try {
      await pageLoader.loadPage('map-events');
    } catch (error) {
      console.error('Failed to navigate to map-events page:', error);
    }
  };

  // Don't show indicator if no active events
  if (activeEvents.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="active-events-indicator"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="active-events-indicator-icon">
        <div className="active-events-indicator-dot"></div>
        <span className="active-events-indicator-count">{activeEvents.length} Active Events</span>
      </div>
      {showDropdown && (
        <>
          {/* Invisible hover bridge to allow mouse movement to dropdown */}
          <div 
            className="active-events-dropdown-bridge"
            onMouseEnter={handleDropdownMouseEnter}
          />
          <div 
            className={`active-events-dropdown ${isAnimating ? 'animating' : ''}`}
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
          >
          <div 
            className="active-events-dropdown-header"
            onClick={handleHeaderClick}
            style={{ cursor: 'pointer' }}
          >
            <span className="active-events-dropdown-title">Active Events</span>
            <span className="active-events-dropdown-count">({activeEvents.length})</span>
          </div>
          <div className="active-events-dropdown-list">
            {activeEvents.map(event => (
              <div key={event.id} className="active-events-dropdown-item">
                <img 
                  src={getEventImagePath(event.name)} 
                  alt={event.name}
                  className="active-events-dropdown-item-image"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="active-events-dropdown-item-content">
                  <div className="active-events-dropdown-item-name">{event.name}</div>
                  <div className="active-events-dropdown-item-map">{event.map}</div>
                  <div className="active-events-dropdown-item-time">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </div>
                  <div className="active-events-dropdown-item-countdown">{formatTimeUntil(event)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

