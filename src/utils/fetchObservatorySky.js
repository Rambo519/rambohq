import { resolveAppLocation } from './resolveAppLocation'
import { reverseGeocodePlaceLabel } from './reverseGeocode'
import { getLocationSubtitle } from './locationDisplay'
import { fetchOpenMeteoObservatorySnapshot } from './fetchOpenMeteoObservatory'
import { computeMoonStateFromSunCalc } from './moonSunCalc'

/**
 * Merge Open-Meteo observatory snapshot + SunCalc moon + place line (no I/O).
 *
 * @param {Awaited<ReturnType<typeof fetchOpenMeteoObservatorySnapshot>>} wx
 * @param {ReturnType<typeof computeMoonStateFromSunCalc>} moon
 * @param {string | null} place
 * @param {'browser' | 'fallback'} source
 */
export function assembleObservatorySkyRecord(wx, moon, place, source) {
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

/**
 * Live observatory row: Open-Meteo (clouds, visibility, humidity) + SunCalc (moon).
 * Location matches Forecast / Solar Arc (browser GPS or Virginia Beach fallback).
 *
 * @returns {Promise<ReturnType<typeof assembleObservatorySkyRecord>>}
 */
export async function fetchObservatorySkyData() {
  const { latitude, longitude, source } = await resolveAppLocation()

  const [wx, place] = await Promise.all([
    fetchOpenMeteoObservatorySnapshot(latitude, longitude),
    reverseGeocodePlaceLabel(latitude, longitude),
  ])

  const moon = computeMoonStateFromSunCalc(latitude, longitude, new Date())
  return assembleObservatorySkyRecord(wx, moon, place, source)
}
