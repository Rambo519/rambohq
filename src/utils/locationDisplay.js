import { FALLBACK_LOCATION_LINE } from '../data/weatherFallback'

export const BROWSER_LOCATION_LINE = 'Browser location'

/**
 * @param {string | null} geocodedPlace from reverse geocode for active coordinates
 * @param {'browser' | 'fallback' | null} source
 */
export function getLocationSubtitle(geocodedPlace, source) {
  if (geocodedPlace) return geocodedPlace
  if (source === 'browser') return BROWSER_LOCATION_LINE
  if (source === 'fallback') return FALLBACK_LOCATION_LINE
  return null
}

/**
 * @param {'browser' | 'fallback' | null} source
 */
export function getCoordSourceDebugLine(source) {
  if (!source) return null
  return source === 'browser' ? 'Device location' : 'Fallback coordinates'
}
