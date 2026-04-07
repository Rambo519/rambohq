import { resolveAppLocation } from './resolveAppLocation'
import { reverseGeocodePlaceLabel } from './reverseGeocode'
import { getLocationSubtitle } from './locationDisplay'
import { fetchOpenMeteoObservatorySnapshot } from './fetchOpenMeteoObservatory'
import { computeMoonStateFromSunCalc } from './moonSunCalc'

/**
 * Live observatory row: Open-Meteo (clouds, visibility, humidity) + SunCalc (moon).
 * Location matches Forecast / Solar Arc (browser GPS or Virginia Beach fallback).
 *
 * @returns {Promise<{
 *   locationLabel: string,
 *   phaseName: string,
 *   illumination: number,
 *   ageDays: number,
 *   moonriseLabel: string | null,
 *   moonsetLabel: string | null,
 *   cloudCoverPct: number | null,
 *   visibilityLabel: string | null,
 *   relativeHumidityPct: number | null,
 * }>}
 */
export async function fetchObservatorySkyData() {
  const { latitude, longitude, source } = await resolveAppLocation()

  const [wx, place] = await Promise.all([
    fetchOpenMeteoObservatorySnapshot(latitude, longitude),
    reverseGeocodePlaceLabel(latitude, longitude),
  ])

  const moon = computeMoonStateFromSunCalc(latitude, longitude, new Date())
  const locationLabel = getLocationSubtitle(place, source) ?? '—'

  return {
    locationLabel,
    phaseName: moon.phaseName,
    illumination: moon.illumination,
    ageDays: moon.ageDays,
    moonriseLabel: moon.moonriseLabel,
    moonsetLabel: moon.moonsetLabel,
    cloudCoverPct: wx.cloudCoverPct,
    visibilityLabel: wx.visibilityLabel,
    relativeHumidityPct: wx.relativeHumidityPct,
  }
}
