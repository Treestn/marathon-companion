/**
 * Timezone utilities for Map Events
 * All calculations remain in UTC, only display is converted
 */

export interface TimezoneOption {
  value: string;
  label: string;
  offset: number; // Offset in minutes from UTC
}

// Common timezones
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 0 },
  { value: 'EST', label: 'EST (Eastern Standard Time)', offset: -300 },
  { value: 'CST', label: 'CST (Central Standard Time)', offset: -360 },
  { value: 'MST', label: 'MST (Mountain Standard Time)', offset: -420 },
  { value: 'PST', label: 'PST (Pacific Standard Time)', offset: -480 },
  { value: 'EDT', label: 'EDT (Eastern Daylight Time)', offset: -240 },
  { value: 'CDT', label: 'CDT (Central Daylight Time)', offset: -300 },
  { value: 'MDT', label: 'MDT (Mountain Daylight Time)', offset: -360 },
  { value: 'PDT', label: 'PDT (Pacific Daylight Time)', offset: -420 },
  { value: 'GMT', label: 'GMT (Greenwich Mean Time)', offset: 0 },
  { value: 'CET', label: 'CET (Central European Time)', offset: 60 },
  { value: 'CEST', label: 'CEST (Central European Summer Time)', offset: 120 },
  { value: 'EET', label: 'EET (Eastern European Time)', offset: 120 },
  { value: 'EEST', label: 'EEST (Eastern European Summer Time)', offset: 180 },
  { value: 'JST', label: 'JST (Japan Standard Time)', offset: 540 },
  { value: 'KST', label: 'KST (Korea Standard Time)', offset: 540 },
  { value: 'CST_CN', label: 'CST (China Standard Time)', offset: 480 },
  { value: 'IST', label: 'IST (India Standard Time)', offset: 330 },
  { value: 'AEST', label: 'AEST (Australian Eastern Standard Time)', offset: 600 },
  { value: 'AEDT', label: 'AEDT (Australian Eastern Daylight Time)', offset: 660 },
];

const TIMEZONE_STORAGE_KEY = 'map-events-timezone';

/**
 * Get the stored timezone preference or default to UTC
 */
export function getStoredTimezone(): string {
  try {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (stored && TIMEZONE_OPTIONS.some(tz => tz.value === stored)) {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to read timezone from localStorage:', e);
  }
  return 'UTC';
}

/**
 * Store the timezone preference
 */
export function setStoredTimezone(timezone: string): void {
  try {
    localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
  } catch (e) {
    console.warn('Failed to save timezone to localStorage:', e);
  }
}

/**
 * Get timezone option by value
 */
export function getTimezoneOption(value: string): TimezoneOption {
  return TIMEZONE_OPTIONS.find(tz => tz.value === value) || TIMEZONE_OPTIONS[0];
}

/**
 * Convert UTC date to timezone and format for display
 * @param utcDate - Date in UTC
 * @param timezone - Timezone value (e.g., 'EST', 'PST')
 * @returns Formatted time string without timezone label (timezone is shown in selector)
 */
export function formatTimeInTimezone(utcDate: Date, timezone: string): string {
  const tzOption = getTimezoneOption(timezone);
  
  // Create a new date adjusted by the timezone offset
  const offsetMs = tzOption.offset * 60 * 1000;
  const localDate = new Date(utcDate.getTime() + offsetMs);
  
  const hours = localDate.getUTCHours();
  const minutes = localDate.getUTCMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Get timezone abbreviation for display
 */
export function getTimezoneAbbreviation(timezone: string): string {
  const tzOption = getTimezoneOption(timezone);
  return tzOption.label.split(' ')[0];
}

