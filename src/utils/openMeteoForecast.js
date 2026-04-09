import { interpretWeatherCode } from './weatherCodeMap'

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'

export function buildForecastUrl(latitude, longitude) {
  const p = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
    forecast_days: '5',
    timezone: 'auto',
    temperature_unit: 'fahrenheit',
  })
  return `${FORECAST_BASE}?${p}`
}

function formatPrecipOutlook(probMax, sumMm, currentPrecipMm) {
  const parts = []
  if (currentPrecipMm != null && Number(currentPrecipMm) >= 0.05) {
    parts.push('Precip now')
  }
  if (probMax != null && Number.isFinite(Number(probMax))) {
    parts.push(`${Math.round(Number(probMax))}% today`)
  }
  if (sumMm != null && Number(sumMm) >= 0.01) {
    const inches = Number(sumMm) * 0.0393701
    parts.push(`${inches < 0.1 ? inches.toFixed(2) : inches.toFixed(1)} in`)
  }
  if (!parts.length) return 'Dry outlook'
  return parts.join(' · ')
}

/**
 * @typedef {Object} ForecastDay
 * @property {string} dateISO
 * @property {string} dayLabel
 * @property {number} highF
 * @property {number} lowF
 * @property {string} icon
 * @property {string} summary
 */

/**
 * @typedef {Object} CurrentSnapshot
 * @property {number} currentTempF
 * @property {number | null} humidityPct
 * @property {string} conditionSummary
 * @property {string} conditionIcon
 * @property {string} precipOutlookLine
 */

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ days: ForecastDay[], snapshot: CurrentSnapshot }>}
 */
export async function fetchOpenMeteoForecast(lat, lon) {
  const url = buildForecastUrl(lat, lon)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Forecast request failed (${res.status})`)
  }
  const json = await res.json()
  const daily = json?.daily
  const cur = json?.current
  if (!daily?.time?.length || !cur || cur.temperature_2m == null) {
    throw new Error('Invalid forecast response')
  }

  const times = daily.time
  const codes = daily.weather_code ?? []
  const maxT = daily.temperature_2m_max ?? []
  const minT = daily.temperature_2m_min ?? []
  const precipProb = daily.precipitation_probability_max ?? []
  const precipSum = daily.precipitation_sum ?? []

  const days = times.slice(0, 5).map((dateISO, i) => {
    const { label, icon } = interpretWeatherCode(codes[i] ?? 0)
    const hi = Math.round(Number(maxT[i]))
    const lo = Math.round(Number(minT[i]))
    const d = new Date(`${dateISO}T12:00:00`)
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' })

    return {
      dateISO,
      dayLabel,
      highF: hi,
      lowF: lo,
      icon,
      summary: label,
    }
  })

  const { label, icon } = interpretWeatherCode(cur.weather_code ?? 0)
  const hum = cur.relative_humidity_2m
  /** @type {CurrentSnapshot} */
  const snapshot = {
    currentTempF: Math.round(Number(cur.temperature_2m)),
    humidityPct: hum != null && Number.isFinite(Number(hum)) ? Math.round(Number(hum)) : null,
    conditionSummary: label,
    conditionIcon: icon,
    precipOutlookLine: formatPrecipOutlook(precipProb[0], precipSum[0], cur.precipitation),
  }

  return { days, snapshot }
}
