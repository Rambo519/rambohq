import { DashboardCard } from './DashboardCard'
import { IconCloud } from './Icons'
import { WeatherGlyph } from './WeatherGlyph'

const LOCATION_LABEL = 'Local Forecast'

/**
 * @param {{
 *   status: 'loading' | 'ready' | 'error',
 *   days: Array<{ dateISO: string, dayLabel: string, highF: number, lowF: number, icon: string, summary: string }>,
 *   locationSubtitle: string | null,
 *   sourceDebug: string | null,
 *   errorMessage: string,
 * }} props
 */
export function WeatherPanel({ status, days, locationSubtitle, sourceDebug, errorMessage }) {
  return (
    <DashboardCard
      title="Forecast"
      icon={<IconCloud className="hq-ico" />}
      spanClass="hq-span-7"
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
