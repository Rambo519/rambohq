import { useMemo } from 'react'
import { DashboardCard } from './DashboardCard'
import { IconSunrise } from './Icons'
import { formatTimeLocal } from '../utils/formatTimeLocal'
import { getCoordSourceDebugLine, getLocationSubtitle } from '../utils/locationDisplay'
import { useDashboardLive } from '../hooks/useDashboardLive'

export function SunTimesPanel() {
  const { forecast, solar } = useDashboardLive()
  const { status: fcStatus, coordSource, geocodedPlace } = forecast
  const { status: solStatus, data: solarData, errorMessage: solError } = solar

  const locationSubtitle = useMemo(() => {
    if (fcStatus === 'loading') return null
    return getLocationSubtitle(geocodedPlace, coordSource)
  }, [fcStatus, geocodedPlace, coordSource])

  const sourceDebug = useMemo(() => {
    if (fcStatus === 'loading') return null
    return getCoordSourceDebugLine(coordSource)
  }, [fcStatus, coordSource])

  const sunriseLabel = solarData ? formatTimeLocal(solarData.sunriseIso) : null
  const sunsetLabel = solarData ? formatTimeLocal(solarData.sunsetIso) : null

  const civilDuskLabel = solarData?.civilDusk ? formatTimeLocal(solarData.civilDusk) : null

  const loading = fcStatus === 'loading' || solStatus === 'loading'
  const solarFailed = solStatus === 'error' && !solarData
  const showSolarReady = solStatus === 'ready' && solarData && sunriseLabel && sunsetLabel

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

        {loading && (
          <p className="hq-sun__state" role="status">
            Loading solar data…
          </p>
        )}

        {!loading && solarFailed && (
          <p className="hq-sun__state hq-sun__state--err" role="alert">
            {solError || 'Solar data unavailable'}
          </p>
        )}

        {!loading && showSolarReady && (
          <>
            <p className="hq-sun__date">{solarData.dateISO}</p>
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
                <dd>{solarData.dayLengthFormatted}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </DashboardCard>
  )
}
