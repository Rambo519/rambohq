import SunCalc from 'suncalc'
import { formatDayLengthFromSeconds, formatTimeLocal } from './formatTimeLocal'

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'

function validDate(d) {
  return d instanceof Date && !Number.isNaN(d.getTime())
}

/**
 * Optional intervals from SunCalc for the same calendar day + coordinates.
 * Hidden when invalid (polar edge cases, etc.).
 */
function getSunCalcExtras(latitude, longitude, dateForDay) {
  const times = SunCalc.getTimes(dateForDay, latitude, longitude)

  let goldenHourMorning = null
  if (validDate(times.sunrise) && validDate(times.goldenHourEnd)) {
    goldenHourMorning = { start: times.sunrise, end: times.goldenHourEnd }
  }

  let goldenHourEvening = null
  if (validDate(times.goldenHour) && validDate(times.sunset)) {
    goldenHourEvening = { start: times.goldenHour, end: times.sunset }
  }

  let civilDusk = null
  if (validDate(times.dusk)) {
    civilDusk = times.dusk
  }

  return { goldenHourMorning, goldenHourEvening, civilDusk }
}

/**
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{
 *   dateISO: string,
 *   sunriseIso: string,
 *   sunsetIso: string,
 *   dayLengthFormatted: string,
 *   goldenHourMorning: { start: Date, end: Date } | null,
 *   goldenHourEvening: { start: Date, end: Date } | null,
 *   civilDusk: Date | null,
 * }>}
 */
export async function fetchSolarArcData(latitude, longitude) {
  const p = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'sunrise,sunset,daylight_duration',
    forecast_days: '1',
    timezone: 'auto',
  })
  const url = `${FORECAST_BASE}?${p}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Solar data request failed (${res.status})`)
  }
  const json = await res.json()
  const daily = json?.daily
  const dateISO = daily?.time?.[0]
  const sunriseIso = daily?.sunrise?.[0]
  const sunsetIso = daily?.sunset?.[0]
  const daylightSeconds = daily?.daylight_duration?.[0]

  if (!dateISO || !sunriseIso || !sunsetIso || daylightSeconds == null) {
    throw new Error('Invalid solar response')
  }

  const dayLengthFormatted = formatDayLengthFromSeconds(daylightSeconds)
  if (!dayLengthFormatted) {
    throw new Error('Invalid day length')
  }
  if (!formatTimeLocal(sunriseIso) || !formatTimeLocal(sunsetIso)) {
    throw new Error('Invalid solar times')
  }

  const dateForDay = new Date(`${dateISO}T12:00:00`)
  const { goldenHourMorning, goldenHourEvening, civilDusk } = getSunCalcExtras(
    latitude,
    longitude,
    dateForDay
  )

  return {
    dateISO,
    sunriseIso,
    sunsetIso,
    dayLengthFormatted,
    goldenHourMorning,
    goldenHourEvening,
    civilDusk,
  }
}
