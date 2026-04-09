import { DashboardCard } from './DashboardCard'
import { IconCloud } from './Icons'
import { WeatherGlyph } from './WeatherGlyph'

/** City-style line only (e.g. "Virginia Beach, Virginia" → "Virginia Beach"). */
function formatLocationLine(placeLabel) {
  if (!placeLabel?.trim()) return null
  const comma = placeLabel.indexOf(',')
  return comma === -1 ? placeLabel.trim() : placeLabel.slice(0, comma).trim()
}

/**
 * @param {{
 *   status: 'loading' | 'ready' | 'error',
 *   snapshot: { currentTempF: number, humidityPct: number | null, conditionSummary: string, conditionIcon: string, precipOutlookLine: string } | null,
 *   placeLabel: string | null,
 *   todayHighF: number | null,
 *   todayLowF: number | null,
 *   errorMessage: string,
 * }} props
 */
export function TodayWeatherCard({ status, snapshot, placeLabel, todayHighF, todayLowF, errorMessage }) {
  const locationLine = formatLocationLine(placeLabel)

  return (
    <DashboardCard
      title="Today's weather"
      icon={<IconCloud className="hq-ico" />}
      spanClass="hq-span-5"
      className="hq-card--forecast hq-card--today-wx"
    >
      <div className="hq-todaywx">
        {status === 'loading' && (
          <p className="hq-todaywx__state" role="status">
            Loading…
          </p>
        )}
        {status === 'error' && (
          <p className="hq-todaywx__state hq-todaywx__state--err" role="alert">
            {errorMessage}
          </p>
        )}
        {status === 'ready' && snapshot && (
          <div className="hq-todaywx__grid">
            <div className="hq-todaywx__lead">
              {locationLine && <p className="hq-todaywx__meta">{locationLine}</p>}
              <div className="hq-todaywx__stack">
                <div className="hq-todaywx__nowblock">
                  <span
                    className="hq-todaywx__temp hq-todaywx__temp--hero"
                    aria-label={`Current temperature ${snapshot.currentTempF} degrees`}
                  >
                    {snapshot.currentTempF}°
                  </span>
                  <span className="hq-todaywx__tlabel hq-todaywx__tlabel--now">Now</span>
                </div>
                {(todayHighF != null || todayLowF != null) && (
                  <p className="hq-todaywx__hilow" aria-label="Forecast high and low today">
                    {todayHighF != null && (
                      <span className="hq-todaywx__hilow-bit">
                        High <span className="hq-todaywx__hilow-num">{todayHighF}°</span>
                      </span>
                    )}
                    {todayHighF != null && todayLowF != null && (
                      <span className="hq-todaywx__hilow-sep" aria-hidden="true">
                        ·
                      </span>
                    )}
                    {todayLowF != null && (
                      <span className="hq-todaywx__hilow-bit">
                        Low <span className="hq-todaywx__hilow-num">{todayLowF}°</span>
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <dl className="hq-todaywx__dl">
              <div className="hq-todaywx__row">
                <dt>Humidity</dt>
                <dd>{snapshot.humidityPct != null ? `${snapshot.humidityPct}%` : '—'}</dd>
              </div>
              <div className="hq-todaywx__row">
                <dt>Precip</dt>
                <dd>{snapshot.precipOutlookLine}</dd>
              </div>
              <div className="hq-todaywx__row hq-todaywx__row--cond">
                <dt>Sky</dt>
                <dd>{snapshot.conditionSummary}</dd>
              </div>
            </dl>
            <div className="hq-todaywx__iconcell" aria-hidden="true">
              <WeatherGlyph icon={snapshot.conditionIcon} className="hq-todaywx__glyph" />
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  )
}
