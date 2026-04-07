import { useState, useEffect } from 'react'
import { DashboardCard } from './DashboardCard'
import { IconTelescope } from './Icons'
import { MoonDisc } from './MoonDisc'
import { fetchObservatorySkyData } from '../utils/fetchObservatorySky'

function metricValue(label) {
  if (label == null || label === '') return '—'
  return label
}

export function SkyConditionsPanel() {
  const [status, setStatus] = useState('loading')
  const [data, setData] = useState(/** @type {Awaited<ReturnType<typeof fetchObservatorySkyData>> | null} */ (null))
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      setErrorMessage('')
      setData(null)
      try {
        const next = await fetchObservatorySkyData()
        if (!cancelled) {
          setData(next)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(e instanceof Error ? e.message : 'Observatory data unavailable')
          setData(null)
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
    <DashboardCard title="Observatory" icon={<IconTelescope className="hq-ico" />} spanClass="hq-span-12" className="hq-card--sky">
      <div className="hq-sky">
        {status === 'loading' && (
          <p className="hq-weather__state" role="status">
            Loading sky data…
          </p>
        )}

        {status === 'error' && (
          <p className="hq-weather__state hq-weather__state--err" role="alert">
            {errorMessage}
          </p>
        )}

        {status === 'ready' && data && (
          <>
            <div className="hq-sky__stars" aria-hidden />
            <div className="hq-sky__main">
              <MoonDisc illumination={data.illumination} />
              <div className="hq-sky__lunar">
                <p className="hq-sky__loc">{data.locationLabel}</p>
                <p className="hq-sky__phase">{data.phaseName}</p>
                <p className="hq-sky__illum">{Math.round(data.illumination * 100)}% illuminated</p>
                <p className="hq-sky__age">Age · {data.ageDays} d</p>
              </div>
              <dl className="hq-sky__metrics">
                <div className="hq-sky__metric">
                  <dt>Moonrise</dt>
                  <dd>{metricValue(data.moonriseLabel)}</dd>
                </div>
                <div className="hq-sky__metric">
                  <dt>Moonset</dt>
                  <dd>{metricValue(data.moonsetLabel)}</dd>
                </div>
                {data.visibilityLabel != null && (
                  <div className="hq-sky__metric">
                    <dt>Visibility</dt>
                    <dd>{data.visibilityLabel}</dd>
                  </div>
                )}
                {data.cloudCoverPct != null && (
                  <div className="hq-sky__metric">
                    <dt>Cloud cover</dt>
                    <dd>{data.cloudCoverPct}%</dd>
                  </div>
                )}
                {data.relativeHumidityPct != null && (
                  <div className="hq-sky__metric">
                    <dt>Humidity</dt>
                    <dd>{data.relativeHumidityPct}%</dd>
                  </div>
                )}
              </dl>
            </div>
          </>
        )}
      </div>
    </DashboardCard>
  )
}
