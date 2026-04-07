const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'

function pickClosestHourIndex(timeStrings) {
  const now = Date.now()
  let bestIdx = 0
  let bestDiff = Infinity
  timeStrings.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - now)
    if (diff < bestDiff) {
      bestDiff = diff
      bestIdx = i
    }
  })
  return bestIdx
}

/**
 * Human-readable horizontal visibility (Open-Meteo: meters).
 * @param {number | null} meters
 * @returns {string | null}
 */
export function formatVisibilityMeters(meters) {
  if (meters == null || !Number.isFinite(meters)) return null
  if (meters >= 1609.34) {
    const mi = meters / 1609.34
    return mi >= 10 ? `${Math.round(mi)} mi` : `${mi.toFixed(1)} mi`
  }
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

/**
 * Current-sky snapshot from Open-Meteo hourly (closest hour to now).
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{
 *   cloudCoverPct: number | null,
 *   visibilityLabel: string | null,
 *   relativeHumidityPct: number | null,
 * }>}
 */
export async function fetchOpenMeteoObservatorySnapshot(latitude, longitude) {
  const p = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: 'cloud_cover,visibility,relativehumidity_2m',
    forecast_days: '1',
    timezone: 'auto',
  })
  const url = `${FORECAST_BASE}?${p}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Observatory weather request failed (${res.status})`)
  }
  const json = await res.json()
  const hourly = json?.hourly
  const times = hourly?.time
  if (!Array.isArray(times) || times.length < 1) {
    throw new Error('Invalid observatory weather response')
  }

  const idx = pickClosestHourIndex(times)
  const cloud = hourly.cloud_cover?.[idx]
  const vis = hourly.visibility?.[idx]
  const rh = hourly.relativehumidity_2m?.[idx]

  return {
    cloudCoverPct: cloud != null && Number.isFinite(cloud) ? Math.round(Number(cloud)) : null,
    visibilityLabel: formatVisibilityMeters(vis != null && Number.isFinite(vis) ? Number(vis) : null),
    relativeHumidityPct: rh != null && Number.isFinite(rh) ? Math.round(Number(rh)) : null,
  }
}
