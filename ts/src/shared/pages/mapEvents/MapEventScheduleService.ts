/**
 * Map Event Schedule Service
 * Calculates active and upcoming map events based on UTC time
 */

export interface MapEvent {
  id: string;
  name: string;
  map: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

// Map name conversion from API format to internal format
const MAP_NAME_MAP: Record<string, string> = {
  'Dam': 'Dam Battleground',
  'Spaceport': 'The Spaceport',
  'Blue Gate': 'The Blue Gate',
  'Buried City': 'Buried City',
  'Stella Montis': 'Stella Montis',
};

/**
 * Parse time string "HH:MM" to minutes from midnight (0-1439)
 * Handles "24:00" as 1440 (next day midnight)
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (hours === 24) {
    return 1440; // 24:00 = next day midnight
  }
  return hours * 60 + minutes;
}

/**
 * Calculate duration in minutes from start and end time strings
 */
function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  
  // Handle case where end time is next day (e.g., 23:00 to 00:00)
  if (endMinutes <= startMinutes) {
    return (1440 - startMinutes) + endMinutes;
  }
  
  return endMinutes - startMinutes;
}

/**
 * Convert schedule-based event data to daily recurring schedule
 */
function convertToDailySchedule(rawEventsData: {
  data: Array<{
    name: string;
    map: string;
    days?: number[];
    times: Array<{
      start: string;
      end: string;
    }>;
  }>;
}): Array<{
  name: string;
  map: string;
  days?: number[];
  startTime: string;
  endTime: string;
}> {
  const schedule: Array<{ name: string; map: string; days?: number[]; startTime: string; endTime: string }> = [];
  
  rawEventsData.data.forEach(event => {
    event.times.forEach(timeSlot => {
      // Normalize "00:00" end time to "24:00" for midnight handling
      const endTime = timeSlot.end === "00:00" ? "24:00" : timeSlot.end;
      
      schedule.push({
        name: event.name,
        map: event.map,
        days: event.days, // Preserve days field
        startTime: timeSlot.start,
        endTime: endTime
      });
    });
  });
  
  return schedule;
}

// Raw event data with schedule format - derived from hourly rotation data
const RAW_EVENT_DATA: {
  data: Array<{
    name: string;
    map: string;
    days?: [number];
    times: Array<{
      start: string;
      end: string;
    }>;
  }>;
} = {
  "data": [
      {
          "name": "Harvester",
          "map": "Dam",
          "times": [
              { "start": "01:00", "end": "02:00" },
              { "start": "07:00", "end": "08:00" },
              { "start": "13:00", "end": "14:00" },
              { "start": "19:00", "end": "20:00" }
          ]
      },
      {
          "name": "Matriarch",
          "map": "Dam",
          "times": [
              { "start": "04:00", "end": "05:00" },
              { "start": "10:00", "end": "11:00" },
              { "start": "16:00", "end": "17:00" },
              { "start": "22:00", "end": "23:00" }
          ]
      },
      {
          "name": "Husk Graveyard",
          "map": "Dam",
          "times": [
              { "start": "09:00", "end": "10:00" }
          ]
      },
      {
          "name": "Uncovered Caches",
          "map": "Dam",
          "times": [
              { "start": "21:00", "end": "22:00" }
          ]
      },
      {
          "name": "Night Raid",
          "map": "Dam",
          "times": [
              { "start": "02:00", "end": "03:00" },
              { "start": "10:00", "end": "11:00" },
              { "start": "18:00", "end": "19:00" }
          ]
      },
      {
          "name": "Electromagnetic Storm",
          "map": "Dam",
          "times": [
              { "start": "06:00", "end": "07:00" },
              { "start": "14:00", "end": "15:00" },
              { "start": "22:00", "end": "23:00" }
          ]
      },
      {
          "name": "Bird City",
          "map": "Buried City",
          "times": [
              { "start": "00:00", "end": "01:00" },
              { "start": "08:00", "end": "09:00" },
              { "start": "16:00", "end": "17:00" },
              { "start": "18:00", "end": "19:00" },
              { "start": "22:00", "end": "23:00" }
          ]
      },
      {
          "name": "Husk Graveyard",
          "map": "Buried City",
          "times": [
              { "start": "04:00", "end": "05:00" },
              { "start": "20:00", "end": "21:00" }
          ]
      },
      {
          "name": "Night Raid",
          "map": "Buried City",
          "times": [
              { "start": "03:00", "end": "04:00" },
              { "start": "07:00", "end": "08:00" },
              { "start": "11:00", "end": "12:00" },
              { "start": "15:00", "end": "16:00" },
              { "start": "19:00", "end": "20:00" },
              { "start": "23:00", "end": "00:00" }
          ]
      },
      {
          "name": "Harvester",
          "map": "Spaceport",
          "times": [
              { "start": "00:00", "end": "01:00" },
              { "start": "06:00", "end": "07:00" },
              { "start": "12:00", "end": "13:00" },
              { "start": "18:00", "end": "19:00" }
          ]
      },
      {
          "name": "Launch Tower Loot",
          "map": "Spaceport",
          "times": [
              { "start": "01:00", "end": "02:00" },
              { "start": "13:00", "end": "14:00" }
          ]
      },
      {
          "name": "Matriarch",
          "map": "Spaceport",
          "times": [
              { "start": "03:00", "end": "04:00" },
              { "start": "09:00", "end": "10:00" },
              { "start": "15:00", "end": "16:00" },
              { "start": "21:00", "end": "22:00" }
          ]
      },
      {
          "name": "Night Raid",
          "map": "Spaceport",
          "times": [
              { "start": "00:00", "end": "01:00" },
              { "start": "16:00", "end": "17:00" }
          ]
      },
      {
          "name": "Hidden Bunker",
          "map": "Spaceport",
          "times": [
              { "start": "04:00", "end": "05:00" },
              { "start": "12:00", "end": "13:00" },
              { "start": "17:00", "end": "18:00" },
              { "start": "20:00", "end": "21:00" }
          ]
      },
      {
          "name": "Electromagnetic Storm",
          "map": "Spaceport",
          "times": [
              { "start": "08:00", "end": "09:00" }
          ]
      },
      {
          "name": "Matriarch",
          "map": "Blue Gate",
          "times": [
              { "start": "02:00", "end": "03:00" },
              { "start": "08:00", "end": "09:00" },
              { "start": "14:00", "end": "15:00" },
              { "start": "20:00", "end": "21:00" }
          ]
      },
      {
          "name": "Harvester",
          "map": "Blue Gate",
          "times": [
              { "start": "05:00", "end": "06:00" },
              { "start": "11:00", "end": "12:00" },
              { "start": "17:00", "end": "18:00" },
              { "start": "23:00", "end": "00:00" }
          ]
      },
      {
          "name": "Husk Graveyard",
          "map": "Blue Gate",
          "times": [
              { "start": "07:00", "end": "08:00" }
          ]
      },
      {
          "name": "Uncovered Caches",
          "map": "Blue Gate",
          "times": [
              { "start": "19:00", "end": "20:00" }
          ]
      },
      {
          "name": "Night Raid",
          "map": "Blue Gate",
          "times": [
              { "start": "01:00", "end": "02:00" },
              { "start": "21:00", "end": "22:00" }
          ]
      },
      {
          "name": "Locked Gate",
          "map": "Blue Gate",
          "times": [
              { "start": "05:00", "end": "06:00" },
              { "start": "13:00", "end": "14:00" },
              { "start": "17:00", "end": "18:00" }
          ]
      },
      {
          "name": "Electromagnetic Storm",
          "map": "Blue Gate",
          "times": [
              { "start": "09:00", "end": "10:00" }
          ]
      },
      {
          "name": "Night Raid",
          "map": "Stella Montis",
          "times": [
              { "start": "02:00", "end": "03:00" },
              { "start": "06:00", "end": "07:00" },
              { "start": "10:00", "end": "11:00" },
              { "start": "14:00", "end": "15:00" },
              { "start": "18:00", "end": "19:00" },
              { "start": "22:00", "end": "23:00" }
          ]
      }
  ]
};

// Convert raw event data to daily recurring schedule
const DAILY_EVENT_SCHEDULE = convertToDailySchedule(RAW_EVENT_DATA);

export class MapEventScheduleService {
  /**
   * Convert JavaScript UTC day (0=Sunday, 6=Saturday) to user format (1=Sunday, 7=Saturday)
   */
  private static convertUTCDayToUserFormat(utcDay: number): number {
    // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
    // User format: 1=Sunday, 2=Monday, ..., 7=Saturday
    return utcDay === 0 ? 1 : utcDay + 1;
  }

  /**
   * Generate events for a specific day based on daily schedule
   */
  private static generateEventsForDay(schedule: typeof DAILY_EVENT_SCHEDULE, dayOffset: number, utcNow: Date): MapEvent[] {
    const events: MapEvent[] = [];
    const targetDate = new Date(Date.UTC(
      utcNow.getUTCFullYear(),
      utcNow.getUTCMonth(),
      utcNow.getUTCDate() + dayOffset,
      0,
      0,
      0,
      0
    ));

    // Get the day of week for the target date (0=Sunday, 6=Saturday)
    const targetUTCDay = targetDate.getUTCDay();
    const targetDayInUserFormat = this.convertUTCDayToUserFormat(targetUTCDay);

    schedule.forEach(scheduledEvent => {
      // Check if event should occur on this day
      // If days is undefined or empty, assume it occurs every day
      if (scheduledEvent.days && scheduledEvent.days.length > 0) {
        if (!scheduledEvent.days.includes(targetDayInUserFormat)) {
          return; // Skip this event for this day
        }
      }

      const internalMapName = MAP_NAME_MAP[scheduledEvent.map] || scheduledEvent.map;
      const [startHours, startMinutes] = scheduledEvent.startTime.split(':').map(Number);
      let [endHours, endMinutes] = scheduledEvent.endTime.split(':').map(Number);
      
      // Handle end time that might be on next day (e.g., 23:00 to 00:00 or 24:00)
      let endDayOffset = dayOffset;
      if (scheduledEvent.endTime === '24:00') {
        endDayOffset = dayOffset + 1;
        endHours = 0;
        endMinutes = 0;
      } else if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
        // End time is next day
        endDayOffset = dayOffset + 1;
      }
      
      const startTime = new Date(Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        startHours,
        startMinutes,
        0,
        0
      ));
      
      const endTime = new Date(Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate() + (endDayOffset - dayOffset),
        endHours,
        endMinutes,
        0,
        0
      ));
      
      const duration = calculateDuration(scheduledEvent.startTime, scheduledEvent.endTime);
      
      events.push({
        id: `${scheduledEvent.name}-${internalMapName}-${startTime.getTime()}`,
        name: scheduledEvent.name,
        map: internalMapName,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
      });
    });

    return events;
  }

  /**
   * Get all events for the next 24 hours
   */
  static getEventsForNext24Hours(): MapEvent[] {
    const now = new Date();
    const utcNow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      0,
      0
    ));

    const endTime = new Date(utcNow.getTime() + 24 * 60 * 60 * 1000);
    const utcNowTime = utcNow.getTime();
    const endTimeTime = endTime.getTime();

    // Generate events for today, tomorrow, and day after tomorrow to capture events that span midnight
    const allEvents: MapEvent[] = [];
    for (let dayOffset = -1; dayOffset <= 2; dayOffset++) {
      const dayEvents = this.generateEventsForDay(DAILY_EVENT_SCHEDULE, dayOffset, utcNow);
      allEvents.push(...dayEvents);
    }

    // Filter to only include events within the 24-hour window
    const events: MapEvent[] = allEvents.filter(event => {
      const startTime = event.startTime.getTime();
      const endTime = event.endTime.getTime();
      
      // Include events that:
      // 1. Are currently active (started before or at now, ends after now)
      // 2. Start in the future within the next 24 hours
      const isActiveEvent = startTime <= utcNowTime && endTime > utcNowTime;
      const isFutureEvent = startTime > utcNowTime && startTime <= endTimeTime;
      
      return isActiveEvent || isFutureEvent;
    });

    // Sort by start time
    events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return events;
  }

  /**
   * Get currently active events
   */
  static getActiveEvents(): MapEvent[] {
    const now = new Date();
    const utcNow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      0,
      0
    ));

    const utcNowTime = utcNow.getTime();
    const allEvents = this.getEventsForNext24Hours();
    const activeEvents = allEvents.filter(event => {
      const startTime = event.startTime.getTime();
      const endTime = event.endTime.getTime();
      return startTime <= utcNowTime && endTime > utcNowTime;
    });

    // Deduplicate by name+map, keeping the one with the earliest start time
    const eventMap = new Map<string, MapEvent>();
    activeEvents.forEach(event => {
      const key = `${event.name}-${event.map}`;
      const existing = eventMap.get(key);
      if (!existing || event.startTime.getTime() < existing.startTime.getTime()) {
        eventMap.set(key, event);
      }
    });

    return Array.from(eventMap.values());
  }

  /**
   * Get all events starting soon (next upcoming events)
   * Returns events that will start within the next hour from now
   */
  static getNextUpcomingEvents(): MapEvent[] {
    const now = new Date();
    const utcNow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      0
    ));

    const allEvents = this.getEventsForNext24Hours();
    
    // Get all future events (not currently active) that start within the next hour
    const oneHourFromNow = new Date(utcNow.getTime() + 60 * 60 * 1000);
    const upcoming = allEvents.filter(event => {
      return event.startTime > utcNow && event.startTime <= oneHourFromNow;
    });

    if (upcoming.length === 0) {
      return [];
    }

    // Deduplicate by name+map, keeping the one with the earliest start time
    const eventMap = new Map<string, MapEvent>();
    upcoming.forEach(event => {
      const key = `${event.name}-${event.map}`;
      const existing = eventMap.get(key);
      if (!existing || event.startTime < existing.startTime) {
        eventMap.set(key, event);
      }
    });

    const deduplicated = Array.from(eventMap.values());

    // Sort by start time
    deduplicated.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    return deduplicated;
  }

  /**
   * Get the next upcoming event (for backward compatibility)
   */
  static getNextUpcomingEvent(): MapEvent | null {
    const events = this.getNextUpcomingEvents();
    return events.length > 0 ? events[0] : null;
  }

  /**
   * Get events that are beyond the next 24 hours
   * For each event type not in the next 24h, finds when it first appears and shows up to 24h from that point
   */
  static getEventsBeyond24Hours(): MapEvent[] {
    const now = new Date();
    const utcNow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      0,
      0
    ));

    const next24HoursEvents = this.getEventsForNext24Hours();
    const next24HoursEnd = new Date(utcNow.getTime() + 24 * 60 * 60 * 1000);
    const next24HoursEndTime = next24HoursEnd.getTime();
    const utcNowTime = utcNow.getTime();

    // Create a set of event types (name+map) that appear in the next 24 hours
    const eventsInNext24Hours = new Set<string>();
    next24HoursEvents.forEach(event => {
      eventsInNext24Hours.add(`${event.name}-${event.map}`);
    });

    // Find all unique event types from the schedule
    const allEventTypes = new Map<string, typeof DAILY_EVENT_SCHEDULE[0]>();
    DAILY_EVENT_SCHEDULE.forEach(scheduledEvent => {
      const internalMapName = MAP_NAME_MAP[scheduledEvent.map] || scheduledEvent.map;
      const key = `${scheduledEvent.name}-${internalMapName}`;
      if (!allEventTypes.has(key)) {
        allEventTypes.set(key, scheduledEvent);
      }
    });

    // Find events that don't appear in the next 24 hours
    const eventsBeyond24Hours: MapEvent[] = [];
    const maxDaysToCheck = 14; // Check up to 2 weeks ahead

    for (const [eventKey, scheduledEvent] of allEventTypes.entries()) {
      if (eventsInNext24Hours.has(eventKey)) {
        continue; // Skip events that already appear in next 24h
      }

      // Find when this event first appears beyond 24 hours
      let firstAppearance: MapEvent | null = null;
      
      for (let dayOffset = 2; dayOffset <= maxDaysToCheck; dayOffset++) {
        const targetDate = new Date(Date.UTC(
          utcNow.getUTCFullYear(),
          utcNow.getUTCMonth(),
          utcNow.getUTCDate() + dayOffset,
          0,
          0,
          0,
          0
        ));

        // Check if event should occur on this day
        const targetUTCDay = targetDate.getUTCDay();
        const targetDayInUserFormat = targetUTCDay === 0 ? 1 : targetUTCDay + 1;
        
        if (scheduledEvent.days && scheduledEvent.days.length > 0) {
          if (!scheduledEvent.days.includes(targetDayInUserFormat)) {
            continue; // Skip this day if event doesn't occur
          }
        }

        // Generate events for this day
        const internalMapName = MAP_NAME_MAP[scheduledEvent.map] || scheduledEvent.map;
        const [startHours, startMinutes] = scheduledEvent.startTime.split(':').map(Number);
        let [endHours, endMinutes] = scheduledEvent.endTime.split(':').map(Number);
        
        let endDayOffset = dayOffset;
        if (scheduledEvent.endTime === '24:00') {
          endDayOffset = dayOffset + 1;
          endHours = 0;
          endMinutes = 0;
        } else if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
          endDayOffset = dayOffset + 1;
        }
        
        const startTime = new Date(Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate(),
          startHours,
          startMinutes,
          0,
          0
        ));
        
        const endTime = new Date(Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate() + (endDayOffset - dayOffset),
          endHours,
          endMinutes,
          0,
          0
        ));

        // Check if this event starts beyond 24 hours
        if (startTime.getTime() > next24HoursEndTime) {
          firstAppearance = {
            id: `${scheduledEvent.name}-${internalMapName}-${startTime.getTime()}`,
            name: scheduledEvent.name,
            map: internalMapName,
            startTime: startTime,
            endTime: endTime,
            duration: calculateDuration(scheduledEvent.startTime, scheduledEvent.endTime),
          };
          break; // Found first appearance
        }
      }

      // If we found a first appearance, generate 24 hours of events from that point
      if (firstAppearance) {
        const firstStartTime = firstAppearance.startTime.getTime();
        const windowEndTime = firstStartTime + 24 * 60 * 60 * 1000;
        const firstDate = new Date(firstStartTime);
        const firstDayOffset = Math.floor((firstDate.getTime() - utcNow.getTime()) / (24 * 60 * 60 * 1000));

        // Generate events for up to 24 hours from first appearance
        for (let dayOffset = firstDayOffset; dayOffset <= firstDayOffset + 1; dayOffset++) {
          const targetDate = new Date(Date.UTC(
            utcNow.getUTCFullYear(),
            utcNow.getUTCMonth(),
            utcNow.getUTCDate() + dayOffset,
            0,
            0,
            0,
            0
          ));

          const targetUTCDay = targetDate.getUTCDay();
          const targetDayInUserFormat = targetUTCDay === 0 ? 1 : targetUTCDay + 1;
          
          if (scheduledEvent.days && scheduledEvent.days.length > 0) {
            if (!scheduledEvent.days.includes(targetDayInUserFormat)) {
              continue;
            }
          }

          const internalMapName = MAP_NAME_MAP[scheduledEvent.map] || scheduledEvent.map;
          const [startHours, startMinutes] = scheduledEvent.startTime.split(':').map(Number);
          let [endHours, endMinutes] = scheduledEvent.endTime.split(':').map(Number);
          
          let endDayOffset = dayOffset;
          if (scheduledEvent.endTime === '24:00') {
            endDayOffset = dayOffset + 1;
            endHours = 0;
            endMinutes = 0;
          } else if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
            endDayOffset = dayOffset + 1;
          }
          
          const startTime = new Date(Date.UTC(
            targetDate.getUTCFullYear(),
            targetDate.getUTCMonth(),
            targetDate.getUTCDate(),
            startHours,
            startMinutes,
            0,
            0
          ));
          
          const endTime = new Date(Date.UTC(
            targetDate.getUTCFullYear(),
            targetDate.getUTCMonth(),
            targetDate.getUTCDate() + (endDayOffset - dayOffset),
            endHours,
            endMinutes,
            0,
            0
          ));

          // Only include events within the 24-hour window from first appearance
          if (startTime.getTime() >= firstStartTime && startTime.getTime() < windowEndTime) {
            eventsBeyond24Hours.push({
              id: `${scheduledEvent.name}-${internalMapName}-${startTime.getTime()}`,
              name: scheduledEvent.name,
              map: internalMapName,
              startTime: startTime,
              endTime: endTime,
              duration: calculateDuration(scheduledEvent.startTime, scheduledEvent.endTime),
            });
          }
        }
      }
    }

    // Sort by start time
    eventsBeyond24Hours.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return eventsBeyond24Hours;
  }

  /**
   * Get events grouped by event name
   */
  static getEventsGroupedByName(events: MapEvent[]): Record<string, MapEvent[]> {
    const grouped: Record<string, MapEvent[]> = {};
    
    events.forEach(event => {
      if (!grouped[event.name]) {
        grouped[event.name] = [];
      }
      grouped[event.name].push(event);
    });

    // Sort events within each group by start time
    Object.keys(grouped).forEach(eventName => {
      grouped[eventName].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    });

    return grouped;
  }

  /**
   * Format time remaining until event starts
   */
  static getTimeUntilEvent(event: MapEvent): string {
    const now = new Date();
    const utcNow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      0
    ));

    const diff = event.startTime.getTime() - utcNow.getTime();
    
    if (diff < 0) {
      // Event has started, show time until end
      const endDiff = event.endTime.getTime() - utcNow.getTime();
      if (endDiff <= 0) {
        return 'Ended';
      }
      const hours = Math.floor(endDiff / (1000 * 60 * 60));
      const minutes = Math.floor((endDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((endDiff % (1000 * 60)) / 1000);
      return `Ends in ${hours}h ${minutes}m ${seconds}s`;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `Starts in ${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Format UTC time for display
   */
  static formatUTCTime(date: Date): string {
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period} UTC`;
  }
}

