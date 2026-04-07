import SunCalc from 'suncalc'
import { formatTimeLocal } from './formatTimeLocal'

/** Synodic month length (days), for approximate moon age from phase. */
const SYNODIC_DAYS = 29.53058867

const EIGHT_PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
]

/**
 * @param {number} phase SunCalc illumination.phase (0–1 cycle)
 */
export function moonPhaseNameFromPhase(phase) {
  const p = ((Number(phase) % 1) + 1) % 1
  const idx = Math.min(EIGHT_PHASES.length - 1, Math.floor(p * 8))
  return EIGHT_PHASES[idx]
}

/**
 * Approximate age in days since new moon.
 * @param {number} phase
 */
export function moonAgeDaysFromPhase(phase) {
  const p = ((Number(phase) % 1) + 1) % 1
  return Math.round(p * SYNODIC_DAYS * 10) / 10
}

/**
 * Local calendar day at observer (noon anchor avoids DST edge cases around midnight).
 * SunCalc.getMoonTimes normalizes to local midnight of this date internally.
 */
function localCalendarNoon(when) {
  return new Date(when.getFullYear(), when.getMonth(), when.getDate(), 12, 0, 0)
}

/**
 * Moon illumination, phase label, age, rise/set for local calendar day at observer.
 *
 * SunCalc.getMoonTimes only reports horizon crossings that fall inside that local 0:00–24:00
 * window. If the moon is already above the horizon at local midnight, there may be a **set**
 * that day but **no rise** (rise was the previous calendar day)—not a bug.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {Date} [when]
 */
export function computeMoonStateFromSunCalc(latitude, longitude, when = new Date()) {
  const ill = SunCalc.getMoonIllumination(when)
  const dayRef = localCalendarNoon(when)
  const times = SunCalc.getMoonTimes(dayRef, latitude, longitude)

  const riseOk = times.rise instanceof Date && !Number.isNaN(times.rise.getTime())
  const setOk = times.set instanceof Date && !Number.isNaN(times.set.getTime())

  let moonriseLabel
  let moonsetLabel

  if (times.alwaysUp) {
    moonriseLabel = 'Up all day'
    moonsetLabel = 'Up all day'
  } else if (times.alwaysDown) {
    moonriseLabel = 'Down all day'
    moonsetLabel = 'Down all day'
  } else if (riseOk && setOk) {
    moonriseLabel = formatTimeLocal(times.rise)
    moonsetLabel = formatTimeLocal(times.set)
  } else if (riseOk && !setOk) {
    moonriseLabel = formatTimeLocal(times.rise)
    moonsetLabel = 'No set today'
  } else if (!riseOk && setOk) {
    moonriseLabel = 'No rise today'
    moonsetLabel = formatTimeLocal(times.set)
  } else {
    moonriseLabel = '—'
    moonsetLabel = '—'
  }

  if (import.meta.env.DEV && moonriseLabel === 'No rise today' && setOk) {
    const prevNoon = new Date(dayRef)
    prevNoon.setDate(prevNoon.getDate() - 1)
    const prev = SunCalc.getMoonTimes(prevNoon, latitude, longitude)
    if (prev.rise instanceof Date && !Number.isNaN(prev.rise.getTime())) {
      console.info(
        '[Observatory] No moonrise on this local date; SunCalc reports a moonrise on the previous local date at',
        prev.rise.toString()
      )
    }
  }

  return {
    illumination: ill.fraction,
    phaseName: moonPhaseNameFromPhase(ill.phase),
    ageDays: moonAgeDaysFromPhase(ill.phase),
    moonriseLabel,
    moonsetLabel,
  }
}
