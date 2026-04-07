import { useState, useEffect, useMemo } from 'react'
import { DashboardCard } from './DashboardCard'
import { IconSunrise } from './Icons'
import { resolveAppLocation } from '../utils/resolveAppLocation'
import { reverseGeocodePlaceLabel } from '../utils/reverseGeocode'
import { fetchSolarArcData } from '../utils/fetchSolarArc'
import { formatTimeLocal } from '../utils/formatTimeLocal'
import { getCoordSourceDebugLine, getLocationSubtitle } from '../utils/locationDisplay'

export function SunTimesPanel() {
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [coordSource, setCoordSource] = useState(/** @type {'browser' | 'fallback' | null} */ (null))
  const [geocodedPlace, setGeocodedPlace] = useState(/** @type {string | null} */ (null))
  const [solar, setSolar] = useState(/** @type {Awaited<ReturnType<typeof fetchSolarArcData>> | null} */ (null))

  const locationSubtitle = useMemo(
    () => (status === 'ready' ? getLocationSubtitle(geocodedPlace, coordSource) : null),
    [status, geocodedPlace, coordSource]
  )

  const sourceDebug = useMemo(
    () => (status === 'ready' ? getCoordSourceDebugLine(coordSource) : null),
    [status, coordSource]
  )

  const sunriseLabel = solar ? formatTimeLocal(solar.sunriseIso) : null
  const sunsetLabel = solar ? formatTimeLocal(solar.sunsetIso) : null

  const civilDuskLabel = solar?.civilDusk ? formatTimeLocal(solar.civilDusk) : null

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      setErrorMessage('')
      setCoordSource(null)
      setGeocodedPlace(null)
      setSolar(null)
      try {
        const { latitude, longitude, source } = await resolveAppLocation()
        const [arc, place] = await Promise.all([
          fetchSolarArcData(latitude, longitude),
          reverseGeocodePlaceLabel(latitude, longitude),
        ])
        if (!cancelled) {
          setSolar(arc)
          setCoordSource(source)
          setGeocodedPlace(place)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(e instanceof Error ? e.message : 'Solar data unavailable')
          setSolar(null)
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
      title="Solar arc"
      icon={<IconSunrise className="hq-ico" />}
      spanClass="hq-span-4"
      className="hq-card--sun"
    >
      <div className="hq-sun">
        <div className="hq-sun__locwrap">
          {locationSubtitle && <p className="hq-sun__loc">{locationSubtitle}</p>}
          {sourceDebug && <p className="hq-sun__source">{sourceDebug}</p>}
        </div>

        {status === 'loading' && (
          <p className="hq-sun__state" role="status">
            Loading solar data…
          </p>
        )}

        {status === 'error' && (
          <p className="hq-sun__state hq-sun__state--err" role="alert">
            {errorMessage}
          </p>
        )}

        {status === 'ready' && solar && sunriseLabel && sunsetLabel && (
          <>
            <p className="hq-sun__date">{solar.dateISO}</p>
            <div className="hq-sun__hero">
              <div className="hq-sun__pillar">
                <span className="hq-sun__label">Sunrise</span>
                <span className="hq-sun__time">{sunriseLabel}</span>
              </div>
              <div className="hq-sun__arc" aria-hidden />
              <div className="hq-sun__pillar">
                <span className="hq-sun__label">Sunset</span>
                <span className="hq-sun__time">{sunsetLabel}</span>
              </div>
            </div>
            <dl className="hq-sun__grid">
              {civilDuskLabel && (
                <div className="hq-sun__cell">
                  <dt>Civil dusk</dt>
                  <dd>{civilDuskLabel}</dd>
                </div>
              )}
              <div className="hq-sun__cell">
                <dt>Day length</dt>
                <dd>{solar.dayLengthFormatted}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </DashboardCard>
  )
}
