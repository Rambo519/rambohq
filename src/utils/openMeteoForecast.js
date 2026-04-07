import { interpretWeatherCode } from './weatherCodeMap'

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'

export function buildForecastUrl(latitude, longitude) {
  const p = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: '5',
    timezone: 'auto',
    temperature_unit: 'fahrenheit',
  })
  return `${FORECAST_BASE}?${p}`
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
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ days: ForecastDay[] }>}
 */
export async function fetchOpenMeteoForecast(lat, lon) {
  const url = buildForecastUrl(lat, lon)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Forecast request failed (${res.status})`)
  }
  const json = await res.json()
  const daily = json?.daily
  if (!daily?.time?.length) {
    throw new Error('Invalid forecast response')
  }

  const times = daily.time
  const codes = daily.weather_code ?? []
  const maxT = daily.temperature_2m_max ?? []
  const minT = daily.temperature_2m_min ?? []

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

  return { days }
}
