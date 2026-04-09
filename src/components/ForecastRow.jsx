import { useState, useEffect, useMemo } from 'react'
import { fetchOpenMeteoForecast } from '../utils/openMeteoForecast'
import { resolveAppLocation } from '../utils/resolveAppLocation'
import { reverseGeocodePlaceLabel } from '../utils/reverseGeocode'
import { getCoordSourceDebugLine, getLocationSubtitle } from '../utils/locationDisplay'
import { TodayWeatherCard } from './TodayWeatherCard'
import { WeatherPanel } from './WeatherPanel'

export function ForecastRow() {
  const [status, setStatus] = useState('loading')
  const [days, setDays] = useState([])
  const [snapshot, setSnapshot] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [coordSource, setCoordSource] = useState(/** @type {'browser' | 'fallback' | null} */ (null))
  const [geocodedPlace, setGeocodedPlace] = useState(/** @type {string | null} */ (null))

  const locationSubtitle = useMemo(
    () => (status === 'ready' ? getLocationSubtitle(geocodedPlace, coordSource) : null),
    [status, geocodedPlace, coordSource]
  )

  const sourceDebug = useMemo(
    () => (status === 'ready' ? getCoordSourceDebugLine(coordSource) : null),
    [status, coordSource]
  )

  const todayPlaceLine = useMemo(() => {
    if (status !== 'ready') return null
    return geocodedPlace || locationSubtitle || null
  }, [status, geocodedPlace, locationSubtitle])

  const todayHighF = useMemo(() => {
    if (status !== 'ready' || !days.length) return null
    const hi = days[0]?.highF
    return typeof hi === 'number' && Number.isFinite(hi) ? hi : null
  }, [status, days])

  const todayLowF = useMemo(() => {
    if (status !== 'ready' || !days.length) return null
    const lo = days[0]?.lowF
    return typeof lo === 'number' && Number.isFinite(lo) ? lo : null
  }, [status, days])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      setErrorMessage('')
      setCoordSource(null)
      setGeocodedPlace(null)
      try {
        const { latitude, longitude, source } = await resolveAppLocation()
        const [{ days: nextDays, snapshot: snap }, place] = await Promise.all([
          fetchOpenMeteoForecast(latitude, longitude),
          reverseGeocodePlaceLabel(latitude, longitude),
        ])
        if (!cancelled) {
          setDays(nextDays)
          setSnapshot(snap)
          setCoordSource(source)
          setGeocodedPlace(place)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(e instanceof Error ? e.message : 'Forecast unavailable')
          setDays([])
          setSnapshot(null)
          setCoordSource(null)
          setGeocodedPlace(null)
          setStatus('error')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <TodayWeatherCard
        status={status}
        snapshot={snapshot}
        placeLabel={todayPlaceLine}
        todayHighF={todayHighF}
        todayLowF={todayLowF}
        errorMessage={errorMessage}
      />
      <WeatherPanel
        status={status}
        days={days}
        locationSubtitle={locationSubtitle}
        sourceDebug={sourceDebug}
        errorMessage={errorMessage}
      />
    </>
  )
}
