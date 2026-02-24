import React, { useState, useEffect, useMemo } from 'react';
import { MapEventScheduleService, MapEvent } from './mapEvents/MapEventScheduleService';
import { 
  getStoredTimezone, 
  setStoredTimezone, 
  TIMEZONE_OPTIONS, 
  formatTimeInTimezone,
  getTimezoneAbbreviation 
} from './mapEvents/TimezoneUtils';
import {
  getStoredMapFilter,
  setStoredMapFilter,
  MAP_OPTIONS
} from './mapEvents/MapFilterUtils';
import { getEventImagePath } from './mapEvents/EventImageUtils';
import './mapEvents/mapEvents.css';

export const MapEventsPage: React.FC = () => {
  const [activeEvents, setActiveEvents] = useState<MapEvent[]>([]);
  const [nextEvents, setNextEvents] = useState<MapEvent[]>([]);
  const [allEvents, setAllEvents] = useState<MapEvent[]>([]);
  const [groupedEvents, setGroupedEvents] = useState<Record<string, MapEvent[]>>({});
  const [beyond24HoursEvents, setBeyond24HoursEvents] = useState<MapEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimezone, setSelectedTimezone] = useState<string>(getStoredTimezone());
  const [selectedMapFilter, setSelectedMapFilter] = useState<string>(getStoredMapFilter());

  // Update events and time every second
  useEffect(() => {
    const updateEvents = () => {
      const active = MapEventScheduleService.getActiveEvents();
      const next = MapEventScheduleService.getNextUpcomingEvents();
      const all = MapEventScheduleService.getEventsForNext24Hours();
      const grouped = MapEventScheduleService.getEventsGroupedByName(all);
      const beyond24Hours = MapEventScheduleService.getEventsBeyond24Hours();

      setActiveEvents(active);
      setNextEvents(next);
      setAllEvents(all);
      setGroupedEvents(grouped);
      setBeyond24HoursEvents(beyond24Hours);
      setCurrentTime(new Date());
    };

    updateEvents();
    const interval = setInterval(updateEvents, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeUntil = (event: MapEvent): string => {
    return MapEventScheduleService.getTimeUntilEvent(event);
  };

  const formatTime = (date: Date): string => {
    return formatTimeInTimezone(date, selectedTimezone);
  };

  const handleTimezoneChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = event.target.value;
    setSelectedTimezone(newTimezone);
    setStoredTimezone(newTimezone);
  };

  const handleMapFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newMapFilter = event.target.value;
    setSelectedMapFilter(newMapFilter);
    setStoredMapFilter(newMapFilter);
  };

  // Filter events based on selected map
  const filteredActiveEvents = useMemo(() => {
    if (selectedMapFilter === 'all') return activeEvents;
    return activeEvents.filter(event => event.map === selectedMapFilter);
  }, [activeEvents, selectedMapFilter]);

  const filteredNextEvents = useMemo(() => {
    if (selectedMapFilter === 'all') return nextEvents;
    return nextEvents.filter(event => event.map === selectedMapFilter);
  }, [nextEvents, selectedMapFilter]);

  const filteredGroupedEvents = useMemo(() => {
    if (selectedMapFilter === 'all') return groupedEvents;
    
    const filtered: Record<string, MapEvent[]> = {};
    Object.entries(groupedEvents).forEach(([eventName, events]) => {
      const filteredEvents = events.filter(event => event.map === selectedMapFilter);
      if (filteredEvents.length > 0) {
        filtered[eventName] = filteredEvents;
      }
    });
    return filtered;
  }, [groupedEvents, selectedMapFilter]);

  const filteredBeyond24HoursEvents = useMemo(() => {
    if (selectedMapFilter === 'all') return beyond24HoursEvents;
    return beyond24HoursEvents.filter(event => event.map === selectedMapFilter);
  }, [beyond24HoursEvents, selectedMapFilter]);

  const groupedBeyond24HoursEvents = useMemo(() => {
    return MapEventScheduleService.getEventsGroupedByName(filteredBeyond24HoursEvents);
  }, [filteredBeyond24HoursEvents]);

  return (
    <div className="map-events-page-container runner">
      <div className="map-events-page-content-wrapper scroll-div">
        <div className="map-events-header">
          <div className="map-events-header-top">
            <h1 className="map-events-title">Map Events</h1>
            <div className="map-events-filters">
              <div className="map-events-timezone-selector">
                <label htmlFor="timezone-select" className="map-events-timezone-label">Timezone:</label>
                <select
                  id="timezone-select"
                  className="map-events-timezone-select"
                  value={selectedTimezone}
                  onChange={handleTimezoneChange}
                >
                  {TIMEZONE_OPTIONS.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="map-events-map-filter">
                <label htmlFor="map-filter-select" className="map-events-map-filter-label">Map:</label>
                <select
                  id="map-filter-select"
                  className="map-events-map-filter-select"
                  value={selectedMapFilter}
                  onChange={handleMapFilterChange}
                >
                  {MAP_OPTIONS.map(map => (
                    <option key={map.value} value={map.value}>
                      {map.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="map-events-description">
            <h2>How Event Notifications Work</h2>
            <p>
              Map events occur at specific times throughout the day. Events are calculated in UTC but displayed in your selected timezone.
              Active events are currently happening, and upcoming events show when they will start.
            </p>
          </div>
        </div>

        {/* Active Now Section */}
        <div className="map-events-section">
          <h2 className="map-events-section-title">Active Now</h2>
          {filteredActiveEvents.length > 0 ? (
            <div className="map-events-list">
              {filteredActiveEvents.map((event, index) => (
                <div key={`active-${event.id}-${index}`} className="map-event-item map-event-item-active">
                  <img 
                    src={getEventImagePath(event.name)} 
                    alt={event.name}
                    className="map-event-image"
                    onError={(e) => {
                      // Hide image if it fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="map-event-name">{event.name}</div>
                  <div className="map-event-map">{event.map}</div>
                  <div className="map-event-time">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </div>
                  <div className="map-event-countdown">{formatTimeUntil(event)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="map-events-empty">No events active at this hour</div>
          )}
        </div>

        {/* Upcoming Next Section */}
        <div className="map-events-section">
          <h2 className="map-events-section-title">
            Upcoming Next - {filteredNextEvents.length > 0 ? formatTime(filteredNextEvents[0].startTime) : 'No upcoming events'}
          </h2>
          {filteredNextEvents.length > 0 ? (
            <div className="map-events-list">
              {filteredNextEvents.map((event, index) => (
                <div key={`upcoming-${event.id}-${index}`} className="map-event-item map-event-item-upcoming">
                  <img 
                    src={getEventImagePath(event.name)} 
                    alt={event.name}
                    className="map-event-image"
                    onError={(e) => {
                      // Hide image if it fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="map-event-name">{event.name}</div>
                  <div className="map-event-map">{event.map}</div>
                  <div className="map-event-time">{formatTime(event.startTime)}</div>
                  <div className="map-event-countdown">{formatTimeUntil(event)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="map-events-empty">No events next hour</div>
          )}
        </div>

        {/* Event Schedule (Next 24h) Section */}
        <div className="map-events-section">
          <h2 className="map-events-section-title">Event Schedule (Next 24h)</h2>
          {Object.keys(filteredGroupedEvents).length > 0 ? (
            <div className="map-events-schedule">
              {Object.entries(filteredGroupedEvents).map(([eventName, events]) => (
                <div key={eventName} className="map-event-group">
                  <h3 className="map-event-group-title">
                    <img 
                      src={getEventImagePath(eventName)} 
                      alt={eventName}
                      className="map-event-group-title-image"
                      onError={(e) => {
                        // Hide image if it fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {eventName}
                  </h3>
                  <div className="map-events-list">
                    {events.map((event, index) => {
                      const isActive = filteredActiveEvents.some(e => e.id === event.id);
                      const isUpcoming = filteredNextEvents.some(e => e.id === event.id);
                      return (
                        <div
                          key={`schedule-${eventName}-${event.id}-${index}`}
                          className={`map-event-item ${isActive ? 'map-event-item-active' : ''} ${isUpcoming ? 'map-event-item-upcoming' : ''}`}
                        >
                          <div className="map-event-map">{event.map}</div>
                          <div className="map-event-time">{formatTime(event.startTime)}</div>
                          <div className="map-event-countdown">{formatTimeUntil(event)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="map-events-empty">No events scheduled</div>
          )}
        </div>

        {/* Events Beyond 24 Hours Section */}
        <div className="map-events-section">
          <h2 className="map-events-section-title">Future Events (Beyond 24h)</h2>
          {Object.keys(groupedBeyond24HoursEvents).length > 0 ? (
            <div className="map-events-schedule">
              {Object.entries(groupedBeyond24HoursEvents).map(([eventName, events]) => (
                <div key={eventName} className="map-event-group">
                  <h3 className="map-event-group-title">
                    <img 
                      src={getEventImagePath(eventName)} 
                      alt={eventName}
                      className="map-event-group-title-image"
                      onError={(e) => {
                        // Hide image if it fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {eventName}
                  </h3>
                  <div className="map-events-list">
                    {events.map((event, index) => (
                      <div
                        key={`future-${eventName}-${event.id}-${index}`}
                        className="map-event-item"
                      >
                        <div className="map-event-map">{event.map}</div>
                        <div className="map-event-time">{formatTime(event.startTime)}</div>
                        <div className="map-event-countdown">{formatTimeUntil(event)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="map-events-empty">No future events scheduled</div>
          )}
        </div>
      </div>
    </div>
  );
};

