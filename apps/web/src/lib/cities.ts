/**
 * US Cities Database with Timezones
 * Can be replaced with Google Places API in the future
 */

export interface City {
  name: string
  state: string
  timezone: string
  displayName: string // "City, State"
}

export const cities: City[] = [
  // Eastern Time
  { name: 'New York', state: 'NY', timezone: 'America/New_York', displayName: 'New York, NY' },
  { name: 'Miami', state: 'FL', timezone: 'America/New_York', displayName: 'Miami, FL' },
  { name: 'Atlanta', state: 'GA', timezone: 'America/New_York', displayName: 'Atlanta, GA' },
  { name: 'Boston', state: 'MA', timezone: 'America/New_York', displayName: 'Boston, MA' },
  { name: 'Philadelphia', state: 'PA', timezone: 'America/New_York', displayName: 'Philadelphia, PA' },
  { name: 'Washington', state: 'DC', timezone: 'America/New_York', displayName: 'Washington, DC' },
  { name: 'Charlotte', state: 'NC', timezone: 'America/New_York', displayName: 'Charlotte, NC' },
  { name: 'Orlando', state: 'FL', timezone: 'America/New_York', displayName: 'Orlando, FL' },
  { name: 'Tampa', state: 'FL', timezone: 'America/New_York', displayName: 'Tampa, FL' },
  { name: 'Pittsburgh', state: 'PA', timezone: 'America/New_York', displayName: 'Pittsburgh, PA' },
  
  // Central Time
  { name: 'Chicago', state: 'IL', timezone: 'America/Chicago', displayName: 'Chicago, IL' },
  { name: 'Houston', state: 'TX', timezone: 'America/Chicago', displayName: 'Houston, TX' },
  { name: 'Dallas', state: 'TX', timezone: 'America/Chicago', displayName: 'Dallas, TX' },
  { name: 'Austin', state: 'TX', timezone: 'America/Chicago', displayName: 'Austin, TX' },
  { name: 'San Antonio', state: 'TX', timezone: 'America/Chicago', displayName: 'San Antonio, TX' },
  { name: 'Minneapolis', state: 'MN', timezone: 'America/Chicago', displayName: 'Minneapolis, MN' },
  { name: 'St. Louis', state: 'MO', timezone: 'America/Chicago', displayName: 'St. Louis, MO' },
  { name: 'Nashville', state: 'TN', timezone: 'America/Chicago', displayName: 'Nashville, TN' },
  { name: 'New Orleans', state: 'LA', timezone: 'America/Chicago', displayName: 'New Orleans, LA' },
  { name: 'Memphis', state: 'TN', timezone: 'America/Chicago', displayName: 'Memphis, TN' },
  
  // Mountain Time
  { name: 'Denver', state: 'CO', timezone: 'America/Denver', displayName: 'Denver, CO' },
  { name: 'Phoenix', state: 'AZ', timezone: 'America/Phoenix', displayName: 'Phoenix, AZ' }, // AZ doesn't observe DST
  { name: 'Salt Lake City', state: 'UT', timezone: 'America/Denver', displayName: 'Salt Lake City, UT' },
  { name: 'Albuquerque', state: 'NM', timezone: 'America/Denver', displayName: 'Albuquerque, NM' },
  { name: 'Boulder', state: 'CO', timezone: 'America/Denver', displayName: 'Boulder, CO' },
  
  // Pacific Time
  { name: 'Los Angeles', state: 'CA', timezone: 'America/Los_Angeles', displayName: 'Los Angeles, CA' },
  { name: 'San Francisco', state: 'CA', timezone: 'America/Los_Angeles', displayName: 'San Francisco, CA' },
  { name: 'Seattle', state: 'WA', timezone: 'America/Los_Angeles', displayName: 'Seattle, WA' },
  { name: 'San Diego', state: 'CA', timezone: 'America/Los_Angeles', displayName: 'San Diego, CA' },
  { name: 'Portland', state: 'OR', timezone: 'America/Los_Angeles', displayName: 'Portland, OR' },
  { name: 'Las Vegas', state: 'NV', timezone: 'America/Los_Angeles', displayName: 'Las Vegas, NV' },
  { name: 'Black Rock City', state: 'NV', timezone: 'America/Los_Angeles', displayName: 'Black Rock City, NV' },
  { name: 'Sacramento', state: 'CA', timezone: 'America/Los_Angeles', displayName: 'Sacramento, CA' },
  { name: 'San Jose', state: 'CA', timezone: 'America/Los_Angeles', displayName: 'San Jose, CA' },
  
  // Alaska Time
  { name: 'Anchorage', state: 'AK', timezone: 'America/Anchorage', displayName: 'Anchorage, AK' },
  
  // Hawaii Time
  { name: 'Honolulu', state: 'HI', timezone: 'Pacific/Honolulu', displayName: 'Honolulu, HI' },
]

/**
 * Search cities by name or state
 */
export function searchCities(query: string): City[] {
  if (!query || query.length < 2) return []
  
  const lowerQuery = query.toLowerCase()
  return cities.filter(city => 
    city.name.toLowerCase().includes(lowerQuery) ||
    city.state.toLowerCase().includes(lowerQuery) ||
    city.displayName.toLowerCase().includes(lowerQuery)
  ).slice(0, 10) // Limit to 10 results
}

/**
 * Find city by exact display name
 */
export function findCityByDisplayName(displayName: string): City | undefined {
  return cities.find(city => city.displayName === displayName)
}

/**
 * Get timezone for a city
 */
export function getTimezoneForCity(cityDisplayName: string): string | null {
  const city = findCityByDisplayName(cityDisplayName)
  return city?.timezone || null
}

/**
 * Format date in event's timezone
 */
export function formatDateInTimezone(date: Date | string, timezone: string, format: Intl.DateTimeFormatOptions = {}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleString('en-US', {
    ...format,
    timeZone: timezone
  })
}

