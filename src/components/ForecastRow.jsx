import { useMemo } from 'react'
import { getCoordSourceDebugLine, getLocationSubtitle } from '../utils/locationDisplay'
import { useDashboardLive } from '../hooks/useDashboardLive'
import { TodayWeatherCard } from './TodayWeatherCard'
import { WeatherPanel } from './WeatherPanel'

export function ForecastRow() {
  const { forecast } = useDashboardLive()
  const { status, days, snapshot, errorMessage, coordSource, geocodedPlace } = forecast

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
