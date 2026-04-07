import { FALLBACK_LATITUDE, FALLBACK_LONGITUDE } from '../data/weatherFallback'

/**
 * Single source of truth for Forecast, Solar Arc, Observatory, and other location-based cards.
 * @typedef {'browser' | 'fallback'} AppLocationSource
 * @returns {Promise<{ latitude: number, longitude: number, source: AppLocationSource }>}
 */
export function resolveAppLocation() {
  const fallback = {
    latitude: FALLBACK_LATITUDE,
    longitude: FALLBACK_LONGITUDE,
    source: 'fallback',
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(fallback)
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          source: 'browser',
        }),
      () => resolve(fallback),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
    )
  })
}
