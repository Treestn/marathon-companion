import React, { useEffect, useMemo, useState } from 'react';
import { MapEvent, MapEventScheduleService } from '../shared/pages/mapEvents/MapEventScheduleService';
import {
  formatTimeInTimezone,
  getStoredTimezone,
  getTimezoneAbbreviation,
  setStoredTimezone,
  TIMEZONE_OPTIONS,
} from '../shared/pages/mapEvents/TimezoneUtils';
import {
  getStoredMapFilter,
  MAP_OPTIONS,
  setStoredMapFilter,
} from '../shared/pages/mapEvents/MapFilterUtils';
import { getEventImagePath } from '../shared/pages/mapEvents/EventImageUtils';
import './second-screen-map-events.css';

export const SecondScreenMapEventsPage: React.FC = () => {
  const [activeEvents, setActiveEvents] = useState<MapEvent[]>([]);
  const [nextEvents, setNextEvents] = useState<MapEvent[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(getStoredTimezone());
  const [selectedMapFilter, setSelectedMapFilter] = useState<string>(getStoredMapFilter());

  useEffect(() => {
    const updateEvents = () => {
      setActiveEvents(MapEventScheduleService.getActiveEvents());
      setNextEvents(MapEventScheduleService.getNextUpcomingEvents());
    };

    updateEvents();
    const interval = setInterval(updateEvents, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const filteredActiveEvents = useMemo(() => {
    if (selectedMapFilter === 'all') return activeEvents;
    return activeEvents.filter((event) => event.map === selectedMapFilter);
  }, [activeEvents, selectedMapFilter]);

  const filteredNextEvents = useMemo(() => {
    if (selectedMapFilter === 'all') return nextEvents;
    return nextEvents.filter((event) => event.map === selectedMapFilter);
  }, [nextEvents, selectedMapFilter]);

  return (
    <div className="second-screen-map-events">
      <div className="second-screen-map-events-scroll scroll-div">
        <header className="second-screen-map-events-header">
          <div className="second-screen-map-events-title-row">
            <div className="second-screen-map-events-filters">
              <label className="second-screen-map-events-label" htmlFor="ss-timezone-select">
                Timezone
              </label>
              <select
                id="ss-timezone-select"
                className="second-screen-map-events-select"
                value={selectedTimezone}
                onChange={handleTimezoneChange}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <label className="second-screen-map-events-label" htmlFor="ss-map-select">
                Map
              </label>
              <select
                id="ss-map-select"
                className="second-screen-map-events-select"
                value={selectedMapFilter}
                onChange={handleMapFilterChange}
              >
                {MAP_OPTIONS.map((map) => (
                  <option key={map.value} value={map.value}>
                    {map.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <section className="second-screen-map-events-section">
          <h2 className="second-screen-map-events-section-title">Active Now</h2>
          {filteredActiveEvents.length > 0 ? (
            <div className="second-screen-map-events-list">
              {filteredActiveEvents.map((event, index) => (
                <div key={`active-${event.id}-${index}`} className="second-screen-map-event-card is-active">
                  <img
                    src={getEventImagePath(event.name)}
                    alt={event.name}
                    className="second-screen-map-event-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="second-screen-map-event-info">
                    <div className="second-screen-map-event-name">{event.name}</div>
                    <div className="second-screen-map-event-meta">{event.map}</div>
                    <div className="second-screen-map-event-meta">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </div>
                  </div>
                  <div className="second-screen-map-event-countdown">
                    {MapEventScheduleService.getTimeUntilEvent(event)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="second-screen-map-events-empty">No events active at this hour</div>
          )}
        </section>

        <section className="second-screen-map-events-section">
          <h2 className="second-screen-map-events-section-title">
            Upcoming Next
            {filteredNextEvents.length > 0
              ? ` - ${formatTime(filteredNextEvents[0].startTime)}`
              : ''}
          </h2>
          {filteredNextEvents.length > 0 ? (
            <div className="second-screen-map-events-list">
              {filteredNextEvents.map((event, index) => (
                <div key={`upcoming-${event.id}-${index}`} className="second-screen-map-event-card is-upcoming">
                  <img
                    src={getEventImagePath(event.name)}
                    alt={event.name}
                    className="second-screen-map-event-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="second-screen-map-event-info">
                    <div className="second-screen-map-event-name">{event.name}</div>
                    <div className="second-screen-map-event-meta">{event.map}</div>
                    <div className="second-screen-map-event-meta">
                      {formatTime(event.startTime)}
                    </div>
                  </div>
                  <div className="second-screen-map-event-countdown">
                    {MapEventScheduleService.getTimeUntilEvent(event)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="second-screen-map-events-empty">No events next hour</div>
          )}
        </section>
      </div>
    </div>
  );
};
