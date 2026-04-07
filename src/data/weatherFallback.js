/**
 * Used when geolocation is unavailable, denied, or times out.
 * Forecast + location label use these coordinates when not on browser GPS.
 */
export const FALLBACK_LATITUDE = 36.8529
export const FALLBACK_LONGITUDE = -75.978

/** Shown under “Local Forecast” when reverse geocode fails on fallback coords */
export const FALLBACK_LOCATION_LINE = 'Virginia Beach, VA (fallback)'
