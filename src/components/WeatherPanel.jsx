import { useState, useEffect, useMemo } from 'react'
import { DashboardCard } from './DashboardCard'
import {
  IconCloud,
  IconSun,
  IconRain,
  IconMainlyClear,
  IconPartlyCloudy,
  IconFog,
  IconDrizzle,
  IconSnow,
  IconThunder,
} from './Icons'
import { fetchOpenMeteoForecast } from '../utils/openMeteoForecast'
import { resolveAppLocation } from '../utils/resolveAppLocation'
import { reverseGeocodePlaceLabel } from '../utils/reverseGeocode'
import { getCoordSourceDebugLine, getLocationSubtitle } from '../utils/locationDisplay'

const LOCATION_LABEL = 'Local Forecast'

function WeatherGlyph({ icon }) {
  const c = { className: 'hq-weather__glyph' }
  switch (icon) {
    case 'clear':
      return <IconSun {...c} />
    case 'mainly_clear':
      return <IconMainlyClear {...c} />
    case 'partly':
      return <IconPartlyCloudy {...c} />
    case 'fog':
      return <IconFog {...c} />
    case 'drizzle':
      return <IconDrizzle {...c} />
    case 'rain':
      return <IconRain {...c} />
    case 'snow':
      return <IconSnow {...c} />
    case 'thunder':
      return <IconThunder {...c} />
    case 'cloud':
    default:
      return <IconCloud {...c} />
  }
}

export function WeatherPanel() {
  const [status, setStatus] = useState('loading')
  const [days, setDays] = useState([])
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

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      setErrorMessage('')
      setCoordSource(null)
      setGeocodedPlace(null)
      try {
        const { latitude, longitude, source } = await resolveAppLocation()
        const [{ days: nextDays }, place] = await Promise.all([
          fetchOpenMeteoForecast(latitude, longitude),
          reverseGeocodePlaceLabel(latitude, longitude),
        ])
        if (!cancelled) {
          setDays(nextDays)
          setCoordSource(source)
          setGeocodedPlace(place)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(e instanceof Error ? e.message : 'Forecast unavailable')
          setDays([])
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
    <DashboardCard
      title="Forecast"
      icon={<IconCloud className="hq-ico" />}
      spanClass="hq-span-8"
      className="hq-card--forecast"
    >
      <div className="hq-weather">
        <div className="hq-weather__meta">
          <div className="hq-weather__locwrap">
            <p className="hq-weather__loc">{LOCATION_LABEL}</p>
            {locationSubtitle && <p className="hq-weather__city">{locationSubtitle}</p>}
            {sourceDebug && <p className="hq-weather__source">{sourceDebug}</p>}
          </div>
        </div>

        <div className="hq-weather__days">
          {status === 'loading' && (
            <p className="hq-weather__state" role="status">
              Loading forecast…
            </p>
          )}

          {status === 'error' && (
            <p className="hq-weather__state hq-weather__state--err" role="alert">
              {errorMessage}
            </p>
          )}

          {status === 'ready' && days.length > 0 && (
            <ul className="hq-weather__row">
              {days.map((d) => (
                <li key={d.dateISO} className="hq-weather__day">
                  <span className="hq-weather__dow">{d.dayLabel}</span>
                  <WeatherGlyph icon={d.icon} />
                  <span className="hq-weather__hi">{d.highF}°</span>
                  <span className="hq-weather__lo">{d.lowF}°</span>
                  <span className="hq-weather__sum">{d.summary}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardCard>
  )
}
